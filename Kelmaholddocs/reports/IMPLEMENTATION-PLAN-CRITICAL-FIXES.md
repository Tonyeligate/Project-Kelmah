# Implementation Plan: Critical Fixes for Kelmah Project

## Overview
This document outlines the specific implementation steps for two critical fixes:
1. Fix API Gateway Architecture
2. Complete Frontend Migration

## Fix 1: API Gateway Architecture Refactoring

### Current Issues:
- API Gateway has User model and database operations
- Business logic mixed with routing logic
- Hardcoded MongoDB connection string
- Authentication logic should be in auth-service

### Implementation Steps:

#### Step 1: Create Auth Service Endpoints
First, ensure auth-service has all necessary endpoints:
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/auth/verify

#### Step 2: Remove Database Operations from API Gateway
- Remove User model definition
- Remove MongoDB connection code
- Remove all direct database queries

#### Step 3: Create Service Router Configuration
Create a service registry configuration that maps routes to services.

#### Step 4: Implement Pure Routing Logic
Convert all business logic endpoints to proxy calls to appropriate services.

#### Step 5: Update Authentication Middleware
Create a lightweight auth middleware that validates tokens by calling auth-service.

## Fix 2: Complete Frontend Migration

### Current Issues:
- Duplicate directory structure (old vs new)
- Mixed import paths
- Potential broken imports after deletion

### Implementation Steps:

#### Step 1: Analyze Current Usage
- Search for imports from old directories
- Identify components still using old structure
- Map old paths to new module paths

#### Step 2: Update Import Paths
- Update all imports to use new module structure
- Fix any aliasing issues
- Ensure consistent import patterns

#### Step 3: Verify Module Structure
- Ensure all components are in correct module directories
- Check for any missing exports
- Validate module boundaries

#### Step 4: Delete Old Directories
- Remove /src/api
- Remove /src/components
- Remove /src/pages
- Remove /src/services

#### Step 5: Test and Validate
- Run build process
- Fix any compilation errors
- Test all major user flows

## Execution Order:
1. Fix API Gateway first (backend stability)
2. Then complete Frontend Migration (UI consistency)

## Success Criteria:
- API Gateway contains no business logic
- All services properly routed
- Frontend builds without errors
- No duplicate directories
- All imports resolved correctly