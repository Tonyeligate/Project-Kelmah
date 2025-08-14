# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the code
COPY . .

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Environment variables should be set at runtime, not build time
# ENV NODE_ENV=production  # Commented out - set this in deployment platform

# Expose port for API access
# Gateway default port is 3000 unless overridden by API_GATEWAY_PORT/PORT
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]