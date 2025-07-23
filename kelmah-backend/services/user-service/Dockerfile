# Use Node.js LTS as the base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy only this service's package files and install deps
COPY services/user-service/package*.json ./
RUN npm install --only=production

# Copy service source code
COPY services/user-service ./

# Copy shared configuration and utility modules
COPY src/config ./src/config
COPY src/utils  ./src/utils

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