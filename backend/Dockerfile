# 1. Use lightweight Node image
FROM node:18-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first (for caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm ci --only=production

# 5. Copy source code
COPY src ./src

# 6. Create images directory for generated images
RUN mkdir -p images

# 7. Expose port
EXPOSE 3000

# 8. Start the API server
CMD ["node", "src/server.js"]
