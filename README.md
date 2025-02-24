# Hianime Episode Mapper

Simple API to map Anilist IDs to Hianime episode IDs with additional metadata from ani.zip.

## Features

- Maps Anilist IDs to Hianime episode IDs
- Provides episode metadata (titles, images, overviews)
- CORS enabled for frontend usage
- Multi-platform deployment support:
  - Vercel
  - Netlify
  - Cloudflare Workers
- Global CDN distribution
- Low latency responses

## API Endpoints

### GET /api
Returns API information and available routes.

### GET /api/episodes/:anilistId
Returns episode information for the given Anilist ID.

Response includes:
- Episode IDs
- Episode titles
- Episode numbers
- Episode images
- Episode overviews
- Air dates
- Runtime information

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:

For Express (default):
```bash
npm run dev:express
```

For Vercel:
```bash
npm run dev:vercel
```

For Netlify:
```bash
npm run dev:netlify
```

For Cloudflare Workers:
```bash
npm run dev:cloudflare
```

Development servers will run on:
- Express: http://localhost:3000
- Vercel: http://localhost:3000
- Netlify: http://localhost:8888
- Cloudflare: http://localhost:8787

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
npm run deploy:vercel
```

### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Initialize site (first time only):
```bash
netlify init
```

4. Deploy:
```bash
npm run deploy:netlify
```

### Deploy to Cloudflare Workers

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy:
```bash
npm run deploy:cloudflare
```

## Project Structure

```
├── src/
│   ├── server.js        # Express server (default)
│   ├── worker.js        # Cloudflare Worker
│   └── utils/           # Shared utility functions
├── netlify/
│   └── functions/       # Netlify Functions
├── public/             # Static files
├── vercel.json         # Vercel configuration
├── netlify.toml        # Netlify configuration
├── wrangler.toml       # Cloudflare configuration
└── package.json
```

## Configuration Files

- `vercel.json`: Vercel deployment configuration
- `netlify.toml`: Netlify build settings and redirects
- `wrangler.toml`: Cloudflare Workers configuration

## Environment Variables

No environment variables are required for basic functionality.

## Error Handling

The API includes proper error handling for:
- Invalid Anilist IDs
- Not found anime
- Server errors

## Platform-Specific Features

### Vercel
- Automatic HTTPS
- Serverless Functions
- Edge Network deployment
- GitHub integration

### Netlify
- Automatic HTTPS
- Serverless Functions
- CDN deployment
- Continuous deployment
- Branch deploys

### Cloudflare Workers
- Global CDN distribution
- Low latency responses
- DDoS protection
- Automatic SSL/TLS
- Edge computing capabilities

## License

MIT
