# Use Node.js LTS as the base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy only this service's package files and install deps
COPY package*.json ./
RUN npm install --only=production

# Copy this service’s code
COPY . .

# DEBUG: list current directory to verify routes are present
RUN echo "DEBUG: Contents of /app:" && ls -R /app

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