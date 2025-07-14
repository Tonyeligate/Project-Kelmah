
# Use Node.js LTS as the base image
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production
# debug: list contents before copying source
RUN echo "Contents of /app before copying sources:" && ls -R /app
COPY . .
# debug: list contents after copying source
RUN echo "Contents of /app after copying sources:" && ls -R /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production

EXPOSE 5001

CMD ["node", "server.js"]

