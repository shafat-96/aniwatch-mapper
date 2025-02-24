import { load } from 'cheerio';
import * as stringSimilarity from 'string-similarity-js';
import { client } from './client.js';
import { ANILIST_URL, ANILIST_QUERY, HIANIME_URL, ANIZIP_URL } from './constants.js';

// Common word replacements in anime titles - moved outside to avoid recreation
const TITLE_REPLACEMENTS = {
  'season': ['s', 'sz'],
  's': ['season', 'sz'],
  'sz': ['season', 's'],
  'two': ['2', 'ii'],
  'three': ['3', 'iii'],
  'four': ['4', 'iv'],
  'part': ['pt', 'p'],
  'episode': ['ep'],
  'chapters': ['ch'],
  'chapter': ['ch'],
  'first': ['1', 'i'],
  'second': ['2', 'ii'],
  'third': ['3', 'iii'],
  'fourth': ['4', 'iv']
};

// Cache for word variations to avoid recalculating
const wordVariationsCache = new Map();

// Helper function to normalize text for comparison
const normalizeText = (text) => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Get word variations with caching
const getWordVariations = (word) => {
  const cacheKey = word.toLowerCase();
  if (wordVariationsCache.has(cacheKey)) {
    return wordVariationsCache.get(cacheKey);
  }

  const variations = new Set([word]);
  const normalized = normalizeText(word);
  variations.add(normalized);

  const withoutNumbers = word.replace(/\d+/g, '').trim();
  if (withoutNumbers !== word) variations.add(withoutNumbers);

  for (const [key, values] of Object.entries(TITLE_REPLACEMENTS)) {
    if (normalized === key) {
      values.forEach(v => variations.add(v));
    } else if (values.includes(normalized)) {
      variations.add(key);
      values.forEach(v => variations.add(v));
    }
  }

  const result = [...variations];
  wordVariationsCache.set(cacheKey, result);
  return result;
};

// Fetch anime info from Anilist
async function getAnimeInfo(anilistId) {
  try {
    const response = await client.post(ANILIST_URL, {
      query: ANILIST_QUERY,
      variables: { id: anilistId }
    });

    const animeData = response.data.data.Media;
    if (!animeData) return null;

    // Get all possible titles and synonyms at once
    const allTitles = new Set([
      ...(animeData.synonyms || []),
      animeData.title.english,
      animeData.title.romaji
    ].filter(Boolean) // Remove nulls/undefined
     .filter(t => !(/[\u4E00-\u9FFF]/.test(t)))); // Remove Chinese titles

    return {
      id: animeData.id,
      title: animeData.title,
      episodes: animeData.episodes,
      synonyms: [...allTitles]
    };
  } catch (error) {
    console.error('Error fetching anime info:', error);
    return null;
  }
}

// Calculate similarity score between two titles
const calculateTitleScore = (searchTitle, hianimeTitle) => {
  const normalizedSearch = normalizeText(searchTitle);
  const normalizedTitle = normalizeText(hianimeTitle);

  // Quick exact match check
  if (normalizedSearch === normalizedTitle) {
    return 1;
  }

  const searchWords = normalizedSearch.split(' ');
  const titleWords = normalizedTitle.split(' ');

  // Pre-calculate word variations for both titles
  const searchVariations = searchWords.map(w => getWordVariations(w));
  const titleVariations = titleWords.map(w => getWordVariations(w));

  let matches = 0;
  let partialMatches = 0;

  for (let i = 0; i < searchVariations.length; i++) {
    let bestWordMatch = 0;

    for (let j = 0; j < titleVariations.length; j++) {
      for (const searchVar of searchVariations[i]) {
        for (const titleVar of titleVariations[j]) {
          if (searchVar === titleVar) {
            bestWordMatch = 1;
            break;
          }

          if (searchVar.includes(titleVar) || titleVar.includes(searchVar)) {
            const matchLength = Math.min(searchVar.length, titleVar.length);
            const maxLength = Math.max(searchVar.length, titleVar.length);
            bestWordMatch = Math.max(bestWordMatch, matchLength / maxLength);
          }
        }
        if (bestWordMatch === 1) break;
      }
      if (bestWordMatch === 1) break;
    }

    if (bestWordMatch === 1) {
      matches++;
    } else if (bestWordMatch > 0) {
      partialMatches += bestWordMatch;
    }
  }

  const wordMatchScore = (matches + (partialMatches * 0.5)) / searchWords.length;
  const similarity = stringSimilarity.stringSimilarity(normalizedSearch, normalizedTitle);

  return (wordMatchScore * 0.7) + (similarity * 0.3);
};

// Search anime on Hianime and get the most similar match
async function searchAnime(title, animeInfo) {
  try {
    console.log('Starting search with:', { title, animeInfo });
    let bestMatch = { score: 0, id: null };

    // Try each title in order of priority
    const titlesToTry = [
      animeInfo.title.english,
      animeInfo.title.romaji,
      ...animeInfo.synonyms
    ].filter(Boolean)
     .filter((t, i, arr) => arr.indexOf(t) === i);

    for (const searchTitle of titlesToTry) {
      const searchUrl = `${HIANIME_URL}/search?keyword=${encodeURIComponent(searchTitle)}`;
      console.log(`\nTrying: "${searchTitle}"`);

      const response = await client.get(searchUrl);
      const $ = load(response.data);

      $('.film_list-wrap > .flw-item .film-detail .film-name a').each((_, el) => {
        const hianimeTitle = $(el).text().trim();
        const hianimeId = $(el).attr('href')?.split('/').pop()?.split('?')[0];

        if (hianimeId) {
          const score = calculateTitleScore(searchTitle, hianimeTitle);
          if (score > bestMatch.score) {
            bestMatch = { score, id: hianimeId };
            console.log('Found better match:', { title: hianimeTitle, id: hianimeId, score });
          }
        }
      });

      if (bestMatch.score > 0.8) {
        return bestMatch.id;
      }
    }

    return bestMatch.score > 0.4 ? bestMatch.id : null;
  } catch (error) {
    console.error('Error searching Hianime:', error);
    return null;
  }
}

// Get episode IDs for an anime
async function getEpisodeIds(animeId, anilistId) {
  try {
    const episodeUrl = `${HIANIME_URL}/ajax/v2/episode/list/${animeId.split('-').pop()}`;
    console.log('Fetching episodes:', episodeUrl);
    
    // Fetch additional metadata from ani.zip
    const anizipUrl = `${ANIZIP_URL}?anilist_id=${anilistId}`;
    const [episodeResponse, anizipResponse] = await Promise.all([
      client.get(episodeUrl, {
        headers: {
          'Referer': `${HIANIME_URL}/watch/${animeId}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      }),
      client.get(anizipUrl)
    ]);

    if (!episodeResponse.data.html) {
      return { totalEpisodes: 0, episodes: [] };
    }

    const $ = load(episodeResponse.data.html);
    const episodes = [];
    const anizipData = anizipResponse.data;
    
    $('#detail-ss-list div.ss-list a').each((i, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      if (!href) return;

      const fullPath = href.split('/').pop();
      const episodeNumber = i + 1;
      const anizipEpisode = anizipData?.episodes?.[episodeNumber];
      
      if (fullPath) {
        episodes.push({
          episodeId: `${animeId}?ep=${fullPath.split('?ep=')[1]}`,
          title: anizipEpisode?.title?.en || $el.attr('title') || '',
          number: episodeNumber,
          image: anizipEpisode?.image || null,
          overview: anizipEpisode?.overview || null,
          airDate: anizipEpisode?.airDate || null,
          runtime: anizipEpisode?.runtime || null
        });
      }
    });

    console.log('Final episode count:', episodes.length);
    return { 
      totalEpisodes: episodes.length, 
      episodes,
      titles: anizipData?.titles || null,
      images: anizipData?.images || null,
      mappings: anizipData?.mappings || null
    };
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return { totalEpisodes: 0, episodes: [] };
  }
}

// Main function to get episodes for an Anilist ID
export async function getEpisodesForAnime(anilistId) {
  try {
    const animeInfo = await getAnimeInfo(anilistId);
    if (!animeInfo) {
      throw new Error('Could not fetch anime info from Anilist');
    }

    const title = animeInfo.title.english || animeInfo.title.romaji;
    if (!title) {
      throw new Error('No English or romaji title found');
    }

    const hianimeId = await searchAnime(title, animeInfo);
    if (!hianimeId) {
      throw new Error('Could not find anime on Hianime');
    }

    const episodes = await getEpisodeIds(hianimeId, anilistId);
    if (!episodes || episodes.totalEpisodes === 0) {
      throw new Error('Could not fetch episodes');
    }

    return { anilistId, hianimeId, title, ...episodes };
  } catch (error) {
    console.error('Error in getEpisodesForAnime:', error);
    throw error;
  }
}
