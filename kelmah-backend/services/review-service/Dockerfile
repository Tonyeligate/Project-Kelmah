# Use Node.js LTS as the base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the code
COPY . .

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV NODE_ENV=production

# Expose port for API access
EXPOSE 3006

# Command to run the application
CMD ["node", "server.js"] 