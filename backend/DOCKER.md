# Backend Docker Setup

## Build and run with Docker

```bash
# Build the image
docker build -t livya-backend .

# Run with environment variable
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key_here livya-backend

# Or mount .env file
docker run -p 3000:3000 --env-file .env livya-backend

# Or mount images directory
docker run -p 3000:3000 --env-file .env -v $(pwd)/images:/app/images livya-backend
```

## Or use docker-compose

```bash
# Make sure you have .env file with OPENAI_API_KEY
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key
