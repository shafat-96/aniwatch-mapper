import express from 'express';
import { getEpisodesForAnime } from './utils/mapper.js';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.json({
    about: 'Simple API to map Anilist IDs to Hianime episode IDs',
    status: 200,
    routes: ['/episodes/:anilistId']
  });
});

app.get('/episodes/:anilistId', async (req, res) => {
  try {
    const anilistId = parseInt(req.params.anilistId);
    
    if (isNaN(anilistId)) {
      return res.status(400).json({ error: 'Invalid Anilist ID' });
    }
    
    const episodes = await getEpisodesForAnime(anilistId);
    
    if (!episodes) {
      return res.status(404).json({ error: 'Anime not found or no episodes available' });
    }
    
    res.json(episodes);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// For Vercel
export default app;
