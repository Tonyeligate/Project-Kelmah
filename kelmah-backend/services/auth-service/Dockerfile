
# Use Node.js LTS as the base image
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Copy application source code explicitly (bypass .dockerignore)
COPY config ./config
COPY controllers ./controllers
COPY routes ./routes
COPY models ./models
COPY utils ./utils
COPY middlewares ./middlewares
COPY services ./services
COPY seeders ./seeders
COPY migrations ./migrations
# Copy root files
COPY config.js server.js ./

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production

EXPOSE 5001

CMD ["node", "server.js"]

