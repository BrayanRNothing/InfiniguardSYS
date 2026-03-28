FROM node:20-alpine

WORKDIR /app

# Install backend dependencies first to improve layer caching
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "index.js"]
