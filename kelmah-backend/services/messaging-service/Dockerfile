# Use Node.js LTS as the base image
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production

EXPOSE 3003

CMD ["node", "server.js"] 