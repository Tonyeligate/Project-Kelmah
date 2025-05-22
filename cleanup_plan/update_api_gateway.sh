#!/bin/bash
# Script to update API Gateway to incorporate the Review Service

# Navigate to project root
cd ..

# Store the current directory
PROJECT_ROOT=$(pwd)

# Locate the API Gateway configuration
API_GATEWAY_DIR="$PROJECT_ROOT/kelmah-backend/api-gateway"
ROUTES_FILE="$API_GATEWAY_DIR/routes/index.js"
CONFIG_FILE="$API_GATEWAY_DIR/config/index.js"
ENV_FILE="$API_GATEWAY_DIR/.env"

echo "Updating API Gateway to incorporate Review Service..."

# 1. First, check if the files exist
if [ ! -f "$ROUTES_FILE" ]; then
  echo "Error: Routes file not found at $ROUTES_FILE"
  exit 1
fi

# 2. Backup the original files
mkdir -p "$PROJECT_ROOT/cleanup_plan/backups/api-gateway"
cp "$ROUTES_FILE" "$PROJECT_ROOT/cleanup_plan/backups/api-gateway/routes_index.js.bak"
echo "Backed up routes file to cleanup_plan/backups/api-gateway/"

if [ -f "$CONFIG_FILE" ]; then
  cp "$CONFIG_FILE" "$PROJECT_ROOT/cleanup_plan/backups/api-gateway/config_index.js.bak"
  echo "Backed up config file to cleanup_plan/backups/api-gateway/"
fi

if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$PROJECT_ROOT/cleanup_plan/backups/api-gateway/env.bak"
  echo "Backed up .env file to cleanup_plan/backups/api-gateway/"
fi

# 3. Update the routes file to include Review Service routes
# Check if review service route already exists
if grep -q "REVIEW_SERVICE_URL" "$ROUTES_FILE"; then
  echo "Review Service routes already exist in API Gateway. Skipping route configuration."
else
  # Add Review Service route to index.js
  # We'll use sed to insert the new route before the last module.exports line
  
  # Create a temporary file with the new content
  TMP_ROUTES_FILE=$(mktemp)
  
  # Use awk to insert content before the last line containing "module.exports"
  awk '
  /module\.exports/ && !seen {
    print "// Review Service routes";
    print "const reviewServiceProxy = createProxyMiddleware({";
    print "  target: process.env.REVIEW_SERVICE_URL || \"http://localhost:5006\",";
    print "  changeOrigin: true,";
    print "  pathRewrite: {";
    print "    \"^/api/reviews\": \"/api/reviews\"";
    print "  }";
    print "});";
    print "";
    print "// Register Review Service routes";
    print "router.use(\"/api/reviews\", reviewServiceProxy);";
    print "";
    seen = 1;
  }
  { print }
  ' "$ROUTES_FILE" > "$TMP_ROUTES_FILE"
  
  # Replace the original file with the modified content
  mv "$TMP_ROUTES_FILE" "$ROUTES_FILE"
  
  echo "Added Review Service routes to API Gateway"
fi

# 4. Update environment configuration if needed
if [ -f "$ENV_FILE" ]; then
  if ! grep -q "REVIEW_SERVICE_URL" "$ENV_FILE"; then
    # Add Review Service URL to .env file
    echo "
# Review Service
REVIEW_SERVICE_URL=http://localhost:5006" >> "$ENV_FILE"
    echo "Added Review Service URL to .env file"
  else
    echo "Review Service URL already exists in .env file. Skipping."
  fi
fi

# 5. Update config file if it exists
if [ -f "$CONFIG_FILE" ]; then
  if ! grep -q "REVIEW_SERVICE_URL" "$CONFIG_FILE"; then
    # Add Review Service URL to config file
    TMP_CONFIG_FILE=$(mktemp)
    
    # Use awk to insert content before the last line
    awk '
    /module\.exports/ && !seen {
      print "  REVIEW_SERVICE_URL: process.env.REVIEW_SERVICE_URL || \"http://localhost:5006\",";
      seen = 1;
    }
    { print }
    ' "$CONFIG_FILE" > "$TMP_CONFIG_FILE"
    
    # Replace the original file with the modified content
    mv "$TMP_CONFIG_FILE" "$CONFIG_FILE"
    
    echo "Added Review Service URL to config file"
  else
    echo "Review Service URL already exists in config file. Skipping."
  fi
fi

# 6. Update backend index.js to include Review Service
BACKEND_INDEX_FILE="$PROJECT_ROOT/kelmah-backend/index.js"

if [ -f "$BACKEND_INDEX_FILE" ]; then
  if ! grep -q "Review Service" "$BACKEND_INDEX_FILE"; then
    # Backup the original file
    cp "$BACKEND_INDEX_FILE" "$PROJECT_ROOT/cleanup_plan/backups/backend_index.js.bak"
    
    # Add Review Service to services array
    TMP_INDEX_FILE=$(mktemp)
    
    # Use awk to insert content after the services array
    awk '
    /const services = \[/ {
      print $0;
      inside_array = 1;
    }
    /\];/ && inside_array {
      print "  {";
      print "    name: \"Review Service\",";
      print "    path: path.join(__dirname, \"services\", \"review-service\"),";
      print "    script: \"server.js\",";
      print "    color: colors.magenta";
      print "  },";
      print $0;
      inside_array = 0;
      next;
    }
    { print }
    ' "$BACKEND_INDEX_FILE" > "$TMP_INDEX_FILE"
    
    # Replace the original file with the modified content
    mv "$TMP_INDEX_FILE" "$BACKEND_INDEX_FILE"
    
    echo "Added Review Service to backend index.js"
  else
    echo "Review Service already exists in backend index.js. Skipping."
  fi
fi

# 7. Create frontend ReviewService.js if it doesn't exist
FRONTEND_SERVICES_DIR="$PROJECT_ROOT/kelmah-frontend/src/services"
REVIEW_SERVICE_FILE="$FRONTEND_SERVICES_DIR/ReviewService.js"

if [ ! -f "$REVIEW_SERVICE_FILE" ]; then
  mkdir -p "$FRONTEND_SERVICES_DIR"
  
  cat > "$REVIEW_SERVICE_FILE" << 'EOF'
import api from './api';

class ReviewService {
  // Get reviews for a specific user
  async getUserReviews(userId, page = 1, limit = 10, reviewType = null) {
    try {
      let url = `/reviews/user/${userId}?page=${page}&limit=${limit}`;
      if (reviewType) {
        url += `&reviewType=${reviewType}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  // Get reviews for a specific job
  async getJobReviews(jobId) {
    try {
      const response = await api.get(`/reviews/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  // Get review statistics for a user
  async getUserReviewStats(userId) {
    try {
      const response = await api.get(`/reviews/stats/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user review stats:', error);
      throw error;
    }
  }

  // Create a new review
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}

export default new ReviewService();
EOF

  echo "Created frontend ReviewService.js file"
  
  # Update services index.js if it exists
  SERVICES_INDEX_FILE="$FRONTEND_SERVICES_DIR/index.js"
  
  if [ -f "$SERVICES_INDEX_FILE" ]; then
    if ! grep -q "ReviewService" "$SERVICES_INDEX_FILE"; then
      # Backup the original file
      cp "$SERVICES_INDEX_FILE" "$PROJECT_ROOT/cleanup_plan/backups/services_index.js.bak"
      
      # Add ReviewService to index exports
      TMP_SERVICES_INDEX_FILE=$(mktemp)
      
      # Use awk to insert content
      awk '
      /import/ {
        if (!imported_review) {
          print "import ReviewService from \"./ReviewService\";";
          imported_review = 1;
        }
      }
      /export {/ {
        print $0;
        print "  ReviewService,";
        inside_export = 1;
        next;
      }
      /}/ && inside_export {
        print $0;
        inside_export = 0;
        next;
      }
      { print }
      ' "$SERVICES_INDEX_FILE" > "$TMP_SERVICES_INDEX_FILE"
      
      # Replace the original file with the modified content
      mv "$TMP_SERVICES_INDEX_FILE" "$SERVICES_INDEX_FILE"
      
      echo "Added ReviewService to services/index.js exports"
    else
      echo "ReviewService already exists in services/index.js. Skipping."
    fi
  fi
else
  echo "Frontend ReviewService.js already exists. Skipping creation."
fi

echo "API Gateway update completed successfully!" 