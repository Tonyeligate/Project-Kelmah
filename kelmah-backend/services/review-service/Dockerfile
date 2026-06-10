# Use Node.js LTS as the base image
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

# Ensure wget is available for ECS health checks
RUN apk add --no-cache wget

COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production

EXPOSE 5006

CMD ["node", "server.js"]