#!/bin/bash
# Main script to run all cleanup steps in order

# Make all scripts executable
chmod +x rename_service_files.sh
chmod +x remove_duplicates.sh
chmod +x create_review_service.sh
chmod +x update_api_gateway.sh

# Store the current directory
SCRIPT_DIR=$(pwd)

echo "======================================================================================"
echo "                          KELMAH CODEBASE CLEANUP"
echo "======================================================================================"
echo "This script will run all cleanup steps in the following order:"
echo "1. Create backup directory"
echo "2. Remove duplicate files and merge redundant directories"
echo "3. Rename service files to follow PascalCase naming convention"
echo "4. Create Review Service microservice structure"
echo "5. Update API Gateway to incorporate Review Service"
echo "======================================================================================"
echo ""

read -p "Do you want to proceed with the cleanup? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "Cleanup cancelled."
  exit 0
fi

# Create backup directory
mkdir -p ./backups
echo "Created backup directory at ./backups"

echo ""
echo "======================================================================================"
echo "Step 1: Removing duplicate files and merging redundant directories..."
echo "======================================================================================"
./remove_duplicates.sh
echo ""

echo "======================================================================================"
echo "Step 2: Renaming service files to follow PascalCase naming convention..."
echo "======================================================================================"
./rename_service_files.sh
echo ""

echo "======================================================================================"
echo "Step 3: Creating Review Service microservice structure..."
echo "======================================================================================"
./create_review_service.sh
echo ""

echo "======================================================================================"
echo "Step 4: Updating API Gateway to incorporate Review Service..."
echo "======================================================================================"
./update_api_gateway.sh
echo ""

echo "======================================================================================"
echo "                           CLEANUP COMPLETED SUCCESSFULLY"
echo "======================================================================================"
echo "All cleanup steps have been executed. Please review the changes and run any necessary"
echo "tests to ensure everything works correctly."
echo ""
echo "Backups of original files can be found in the following locations:"
echo "- ./backups/ directory"
echo "- ./backups/api/ directory (for API-related files)"
echo "- ./backups/components/ directory (for component directories)"
echo "- ./backups/api-gateway/ directory (for API Gateway configuration)"
echo "======================================================================================" 