# Use Node.js LTS as the base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy only this service's package files and install deps
COPY kelmah-backend/services/user-service/package*.json ./
RUN npm install --only=production
  # Copy service source code
  # Explicitly copy service files from monorepo root
  COPY kelmah-backend/services/user-service/server.js ./
  COPY kelmah-backend/services/user-service/routes ./routes
  COPY kelmah-backend/services/user-service/controllers ./controllers
  COPY kelmah-backend/services/user-service/models ./models
  COPY kelmah-backend/services/user-service/config ./config
  COPY kelmah-backend/services/user-service/utils ./utils
  COPY kelmah-backend/services/user-service/middlewares ./middlewares
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