export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': USER_AGENT
};

export const ANILIST_URL = 'https://graphql.anilist.co';
export const HIANIME_URL = 'https://aniwatchtv.to';
export const ANIZIP_URL = 'https://api.ani.zip/mappings';

export const ANILIST_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title {
      english
      romaji
      native
    }
    synonyms
    episodes
    format
    duration
    status
    description
    coverImage {
      large
      medium
    }
    bannerImage
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
  }
}
`;

// Anime formats from Anilist
export const ANIME_FORMATS = {
  TV: 'TV',
  TV_SHORT: 'TV_SHORT',
  MOVIE: 'MOVIE',
  SPECIAL: 'SPECIAL',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'MUSIC'
};
