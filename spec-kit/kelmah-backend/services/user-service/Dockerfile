# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only this service's package files and install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy specific directories that are needed
COPY routes ./routes
COPY controllers ./controllers
COPY models ./models
COPY config ./config
COPY utils ./utils
COPY server.js ./server.js

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production

# Expose port for API access
EXPOSE 3002

# Command to run the application
CMD ["node", "server.js"] 