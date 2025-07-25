# Use Node.js LTS as the base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy only this service's package files and install deps
COPY services/user-service/package*.json ./
RUN npm install --only=production

# Copy service files explicitly (flattening directory)
COPY services/user-service/server.js ./
COPY services/user-service/routes ./routes
COPY services/user-service/controllers ./controllers
COPY services/user-service/models ./models
COPY services/user-service/config ./config
COPY services/user-service/utils ./utils
COPY services/user-service/middlewares ./middlewares

#=== DEBUG START ===
RUN echo "=== /app/routes BEFORE START ===" && ls -R /app/routes
RUN cat /app/routes/user.routes.js
#=== DEBUG END ===

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