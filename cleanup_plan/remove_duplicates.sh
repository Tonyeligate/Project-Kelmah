#!/bin/bash
# Script to remove duplicate and unnecessary files

# Navigate to project root
cd ..

# Store the current directory
PROJECT_ROOT=$(pwd)

# 1. Delete duplicate files in frontend
echo "Removing duplicate files in frontend..."

# Check and remove duplicate App files (keep App.jsx)
if [ -f "$PROJECT_ROOT/kelmah-frontend/src/App.js" ] && [ -f "$PROJECT_ROOT/kelmah-frontend/src/App.jsx" ]; then
  rm "$PROJECT_ROOT/kelmah-frontend/src/App.js"
  echo "Deleted duplicate App.js (keeping App.jsx)"
fi

# Check and remove duplicate index files (keep main.jsx)
if [ -f "$PROJECT_ROOT/kelmah-frontend/src/index.js" ] && [ -f "$PROJECT_ROOT/kelmah-frontend/src/main.jsx" ]; then
  rm "$PROJECT_ROOT/kelmah-frontend/src/index.js"
  echo "Deleted duplicate index.js (keeping main.jsx)"
fi

# Check and remove empty messagingService.js stub file
if [ -f "$PROJECT_ROOT/kelmah-frontend/src/messagingService.js" ]; then
  # Check if file is empty or nearly empty
  if [ $(stat -c%s "$PROJECT_ROOT/kelmah-frontend/src/messagingService.js") -lt 10 ]; then
    rm "$PROJECT_ROOT/kelmah-frontend/src/messagingService.js"
    echo "Deleted empty stub file: messagingService.js"
  fi
fi

# 2. Remove duplicate auth service in API
if [ -f "$PROJECT_ROOT/kelmah-frontend/src/api/authService.js" ] && [ -f "$PROJECT_ROOT/kelmah-frontend/src/services/authService.js" ]; then
  # Make a backup first
  mkdir -p "$PROJECT_ROOT/cleanup_plan/backups/api"
  cp "$PROJECT_ROOT/kelmah-frontend/src/api/authService.js" "$PROJECT_ROOT/cleanup_plan/backups/api/authService.js"
  echo "Backed up api/authService.js to cleanup_plan/backups/api/"
  
  # Now remove the duplicate
  rm "$PROJECT_ROOT/kelmah-frontend/src/api/authService.js"
  echo "Deleted duplicate authService.js in api/ (keeping the one in services/)"
fi

# Check for duplicate component directories with similar functionality
echo "Checking for component directories with similar functionality..."

# 3. Merge chat and messaging directories if both exist
if [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/chat" ] && [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/messaging" ]; then
  # Create backup
  mkdir -p "$PROJECT_ROOT/cleanup_plan/backups/components"
  cp -r "$PROJECT_ROOT/kelmah-frontend/src/components/chat" "$PROJECT_ROOT/cleanup_plan/backups/components/"
  echo "Backed up components/chat/ to cleanup_plan/backups/components/"
  
  # Copy files from chat to messaging if they don't already exist
  for file in "$PROJECT_ROOT/kelmah-frontend/src/components/chat"/*; do
    filename=$(basename "$file")
    if [ ! -f "$PROJECT_ROOT/kelmah-frontend/src/components/messaging/$filename" ]; then
      cp "$file" "$PROJECT_ROOT/kelmah-frontend/src/components/messaging/"
      echo "Copied $filename from chat/ to messaging/"
    fi
  done
  
  # Now remove the chat directory
  rm -rf "$PROJECT_ROOT/kelmah-frontend/src/components/chat"
  echo "Merged chat/ into messaging/ and removed chat/ directory"
fi

# 4. Merge messages and messaging directories if both exist
if [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/messages" ] && [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/messaging" ]; then
  # Create backup
  mkdir -p "$PROJECT_ROOT/cleanup_plan/backups/components"
  cp -r "$PROJECT_ROOT/kelmah-frontend/src/components/messages" "$PROJECT_ROOT/cleanup_plan/backups/components/"
  echo "Backed up components/messages/ to cleanup_plan/backups/components/"
  
  # Copy files from messages to messaging if they don't already exist
  for file in "$PROJECT_ROOT/kelmah-frontend/src/components/messages"/*; do
    filename=$(basename "$file")
    if [ ! -f "$PROJECT_ROOT/kelmah-frontend/src/components/messaging/$filename" ]; then
      cp "$file" "$PROJECT_ROOT/kelmah-frontend/src/components/messaging/"
      echo "Copied $filename from messages/ to messaging/"
    fi
  done
  
  # Now remove the messages directory
  rm -rf "$PROJECT_ROOT/kelmah-frontend/src/components/messages"
  echo "Merged messages/ into messaging/ and removed messages/ directory"
fi

# 5. Merge payment and payments directories if both exist
if [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/payment" ] && [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/payments" ]; then
  # Create backup
  mkdir -p "$PROJECT_ROOT/cleanup_plan/backups/components"
  cp -r "$PROJECT_ROOT/kelmah-frontend/src/components/payment" "$PROJECT_ROOT/cleanup_plan/backups/components/"
  echo "Backed up components/payment/ to cleanup_plan/backups/components/"
  
  # Copy files from payment to payments if they don't already exist
  for file in "$PROJECT_ROOT/kelmah-frontend/src/components/payment"/*; do
    filename=$(basename "$file")
    if [ ! -f "$PROJECT_ROOT/kelmah-frontend/src/components/payments/$filename" ]; then
      cp "$file" "$PROJECT_ROOT/kelmah-frontend/src/components/payments/"
      echo "Copied $filename from payment/ to payments/"
    fi
  done
  
  # Now remove the payment directory
  rm -rf "$PROJECT_ROOT/kelmah-frontend/src/components/payment"
  echo "Merged payment/ into payments/ and removed payment/ directory"
fi

# 6. Merge job and jobs directories if both exist
if [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/job" ] && [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/jobs" ]; then
  # Create backup
  mkdir -p "$PROJECT_ROOT/cleanup_plan/backups/components"
  cp -r "$PROJECT_ROOT/kelmah-frontend/src/components/job" "$PROJECT_ROOT/cleanup_plan/backups/components/"
  echo "Backed up components/job/ to cleanup_plan/backups/components/"
  
  # Copy files from job to jobs if they don't already exist
  for file in "$PROJECT_ROOT/kelmah-frontend/src/components/job"/*; do
    filename=$(basename "$file")
    if [ ! -f "$PROJECT_ROOT/kelmah-frontend/src/components/jobs/$filename" ]; then
      cp "$file" "$PROJECT_ROOT/kelmah-frontend/src/components/jobs/"
      echo "Copied $filename from job/ to jobs/"
    fi
  done
  
  # Now remove the job directory
  rm -rf "$PROJECT_ROOT/kelmah-frontend/src/components/job"
  echo "Merged job/ into jobs/ and removed job/ directory"
fi

# 7. Merge workers and worker directories if both exist
if [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/workers" ] && [ -d "$PROJECT_ROOT/kelmah-frontend/src/components/worker" ]; then
  # Create backup
  mkdir -p "$PROJECT_ROOT/cleanup_plan/backups/components"
  cp -r "$PROJECT_ROOT/kelmah-frontend/src/components/workers" "$PROJECT_ROOT/cleanup_plan/backups/components/"
  echo "Backed up components/workers/ to cleanup_plan/backups/components/"
  
  # Copy files from workers to worker if they don't already exist
  for file in "$PROJECT_ROOT/kelmah-frontend/src/components/workers"/*; do
    filename=$(basename "$file")
    if [ ! -f "$PROJECT_ROOT/kelmah-frontend/src/components/worker/$filename" ]; then
      cp "$file" "$PROJECT_ROOT/kelmah-frontend/src/components/worker/"
      echo "Copied $filename from workers/ to worker/"
    fi
  done
  
  # Now remove the workers directory
  rm -rf "$PROJECT_ROOT/kelmah-frontend/src/components/workers"
  echo "Merged workers/ into worker/ and removed workers/ directory"
fi

echo "Duplicate file cleanup completed!"
echo "Backups are stored in cleanup_plan/backups/ directory" 