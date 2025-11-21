# Kelmah Platform - Implementation Guide (Phases 3-5)
## Performance, UI/UX, and Error Handling

**Created:** January 2025  
**Status:** Ready for Implementation  
**Estimated Timeline:** Weeks 3-5

---

# Phase 3: Performance Optimization (Week 3)

## Task 3.1: Implement React Query for Data Fetching

### 🎯 Objective
Migrate data fetching from Redux thunks to React Query for better caching, background refetching, and request deduplication.

### 📋 Current Issues
- Redux thunks don't cache data
- No automatic background refetching
- Manual loading/error state management
- No request deduplication
- Stale data issues

### ✅ Implementation Steps

#### Step 1: Create Query Hooks for Jobs Module
**File:** `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/apiClient';

// Query keys
export const jobKeys = {
  all: ['jobs'],
  lists: () => [...jobKeys.all, 'list'],
  list: (filters) => [...jobKeys.lists(), filters],
  details: () => [...jobKeys.all, 'detail'],
  detail: (id) => [...jobKeys.details(), id],
  saved: () => [...jobKeys.all, 'saved'],
  myJobs: () => [...jobKeys.all, 'myJobs'],
};

// Fetch all jobs with filters
export const useJobsQuery = (filters = {}) => {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: async () => {
      const response = await api.get('/api/jobs', { params: filters });
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch single job by ID
export const useJobQuery = (jobId) => {
  return useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: async () => {
      const response = await api.get(`/api/jobs/${jobId}`);
      return response.data;
    },
    enabled: !!jobId, // Only run if jobId exists
    staleTime: 60 * 1000, // 1 minute
  });
};

// Fetch my jobs (for workers/hirers)
export const useMyJobsQuery = (role) => {
  return useQuery({
    queryKey: [...jobKeys.myJobs(), role],
    queryFn: async () => {
      const response = await api.get('/api/jobs/my-jobs', { params: { role } });
      return response.data;
    },
    staleTime: 30 * 1000,
  });
};

// Create job mutation
export const useCreateJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData) => {
      const response = await api.post('/api/jobs', jobData);
      return response.data;
    },
    onSuccess: (newJob) => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() });
      
      // Optionally add the new job to the cache
      queryClient.setQueryData(jobKeys.detail(newJob.id), newJob);
    },
  });
};

// Apply to job mutation
export const useApplyToJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, applicationData }) => {
      const response = await api.post(`/api/jobs/${jobId}/apply`, applicationData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate job details to show updated application status
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.jobId) });
    },
  });
};

// Save job mutation
export const useSaveJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId) => {
      const response = await api.post(`/api/jobs/${jobId}/save`);
      return response.data;
    },
    onMutate: async (jobId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: jobKeys.detail(jobId) });
      
      const previousJob = queryClient.getQueryData(jobKeys.detail(jobId));
      
      queryClient.setQueryData(jobKeys.detail(jobId), (old) => ({
        ...old,
        isSaved: true,
      }));

      return { previousJob };
    },
    onError: (err, jobId, context) => {
      // Rollback on error
      queryClient.setQueryData(jobKeys.detail(jobId), context.previousJob);
    },
    onSettled: (_, __, jobId) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.saved() });
    },
  });
};
```

#### Step 2: Update Components to Use Query Hooks
**File:** `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`

**BEFORE (using Redux):**
```javascript
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs } from '../services/jobSlice';

const JobsPage = () => {
  const dispatch = useDispatch();
  const { jobs, loading, error } = useSelector((state) => state.jobs);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return <JobList jobs={jobs} />;
};
```

**AFTER (using React Query):**
```javascript
import { useJobsQuery } from '../hooks/useJobsQuery';

const JobsPage = () => {
  const { data: jobs, isLoading, error } = useJobsQuery();

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return <JobList jobs={jobs} />;
};
```

#### Step 3: Update Job Creation Form
**File:** `kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx`

**BEFORE:**
```javascript
import { useDispatch } from 'react-redux';
import { createJob } from '../../services/jobSlice';

const JobCreationForm = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await dispatch(createJob(data)).unwrap();
      // Success handling
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };
};
```

**AFTER:**
```javascript
import { useCreateJobMutation } from '../../hooks/useJobsQuery';
import { useSnackbar } from 'notistack';

const JobCreationForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const createJobMutation = useCreateJobMutation();

  const handleSubmit = async (data) => {
    try {
      await createJobMutation.mutateAsync(data);
      enqueueSnackbar('Job created successfully!', { variant: 'success' });
      onClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to create job', { variant: 'error' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button 
        type="submit" 
        disabled={createJobMutation.isLoading}
      >
        {createJobMutation.isLoading ? 'Creating...' : 'Create Job'}
      </Button>
    </form>
  );
};
```

#### Step 4: Keep Redux for UI State Only
**File:** `kelmah-frontend/src/modules/jobs/services/jobSlice.js`

**BEFORE (handles both data and UI state):**
```javascript
const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    currentJob: null,
    loading: false,
    error: null,
    filters: {},
    selectedJobId: null,
    isModalOpen: false,
  },
  // ... reducers and extra reducers for data fetching
});
```

**AFTER (UI state only):**
```javascript
const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    filters: {},
    selectedJobId: null,
    isModalOpen: false,
    viewMode: 'grid', // grid or list
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setSelectedJobId: (state, action) => {
      state.selectedJobId = action.payload;
    },
    toggleModal: (state) => {
      state.isModalOpen = !state.isModalOpen;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
  },
});
```

### 🧪 Testing Checklist
- [ ] Job listings load correctly
- [ ] Job details load correctly
- [ ] Creating a job works and updates the list
- [ ] Applying to a job works
- [ ] Data is cached (check React Query DevTools)
- [ ] Background refetching works
- [ ] No duplicate requests (check Network tab)

### 📝 Prompt for AI Assistant
```
I need to migrate data fetching from Redux thunks to React Query in the jobs module.

Please help me:
1. Create query hooks file at kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js with:
   - useJobsQuery(filters) for fetching job listings
   - useJobQuery(jobId) for fetching single job
   - useMyJobsQuery(role) for fetching user's jobs
   - useCreateJobMutation() for creating jobs
   - useApplyToJobMutation() for applying to jobs
   - useSaveJobMutation() with optimistic updates

2. Update these components to use the new hooks:
   - kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx
   - kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx
   - kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx
   - kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx

3. Update jobSlice.js to only handle UI state (filters, selectedJobId, isModalOpen, viewMode)
   - Remove data fetching thunks (fetchJobs, createJob, etc.)
   - Keep only UI-related reducers

4. Configure React Query cache times:
   - Job listings: 30 seconds stale time
   - Job details: 1 minute stale time
   - My jobs: 30 seconds stale time

5. Implement optimistic updates for save job mutation

6. Add proper error handling with toast notifications using notistack

Files to update:
- Create: kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js
- Update: kelmah-frontend/src/modules/jobs/services/jobSlice.js
- Update: All components currently using Redux for job data

Benefits:
- Automatic caching and background refetching
- Request deduplication
- Optimistic updates
- Better loading/error states
- Reduced Redux boilerplate
```

---

## Task 3.2: Optimize Bundle Size

### 🎯 Objective
Reduce bundle size by implementing tree-shaking, code splitting, and removing unused dependencies.

### 📋 Current Issues
- Large bundle size affecting load times
- Material-UI icons imported incorrectly
- Unused dependencies in package.json
- No bundle analysis

### ✅ Implementation Steps

#### Step 1: Analyze Current Bundle
```bash
cd kelmah-frontend
npm run build
npx vite-bundle-visualizer
```

This will open a visualization showing which packages are taking up space.

#### Step 2: Fix Material-UI Icon Imports
**BEFORE (imports entire icon library):**
```javascript
import { Work as WorkIcon, Payment as PaymentIcon } from '@mui/icons-material';
```

**AFTER (tree-shakeable imports):**
```javascript
import WorkIcon from '@mui/icons-material/Work';
import PaymentIcon from '@mui/icons-material/Payment';
```

Create a script to fix all icon imports:
**File:** `kelmah-frontend/scripts/fix-mui-icons.js`

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .jsx and .js files
const files = glob.sync('src/**/*.{js,jsx}', { cwd: __dirname });

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find MUI icon imports
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@mui\/icons-material['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(i => i.trim());
    
    // Generate individual imports
    const newImports = imports.map(imp => {
      const [name, alias] = imp.split(' as ').map(s => s.trim());
      const iconName = name;
      const importName = alias || name;
      return `import ${importName} from '@mui/icons-material/${iconName}';`;
    }).join('\n');
    
    // Replace old import with new imports
    content = content.replace(match[0], newImports);
  }
  
  fs.writeFileSync(file, content);
});

console.log('Fixed MUI icon imports in', files.length, 'files');
```

Run the script:
```bash
node scripts/fix-mui-icons.js
```

#### Step 3: Remove Unused Dependencies
```bash
cd kelmah-frontend
npx depcheck

# Review the output and remove unused dependencies
npm uninstall <unused-package-1> <unused-package-2>
```

#### Step 4: Implement Dynamic Imports for Heavy Components
**File:** `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`

```javascript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const JobChart = lazy(() => import('../components/JobChart'));
const JobMap = lazy(() => import('../components/JobMap'));

const JobsPage = () => {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <JobList />
      
      {showChart && (
        <Suspense fallback={<Skeleton height={400} />}>
          <JobChart />
        </Suspense>
      )}
    </div>
  );
};
```

#### Step 5: Configure Vite for Better Code Splitting
**File:** `kelmah-frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'mui-icons': ['@mui/icons-material'],
          'redux': ['@reduxjs/toolkit', 'react-redux'],
          'query': ['@tanstack/react-query'],
          
          // Feature chunks
          'jobs': [
            './src/modules/jobs/pages/JobsPage',
            './src/modules/jobs/pages/JobDetailsPage',
          ],
          'worker': [
            './src/modules/worker/pages/WorkerDashboardPage',
          ],
          'hirer': [
            './src/modules/hirer/pages/HirerDashboardPage',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### 🧪 Testing Checklist
- [ ] Bundle size reduced by at least 30%
- [ ] App still loads correctly
- [ ] All icons display correctly
- [ ] Code splitting works (check Network tab)
- [ ] No console errors

### 📝 Prompt for AI Assistant
```
I need to optimize the bundle size of my React app.

Please help me:
1. Analyze the current bundle using vite-bundle-visualizer and identify the largest packages

2. Fix Material-UI icon imports across the entire codebase:
   - Find all imports from '@mui/icons-material'
   - Convert from: import { WorkIcon, PaymentIcon } from '@mui/icons-material'
   - Convert to: import WorkIcon from '@mui/icons-material/Work'; import PaymentIcon from '@mui/icons-material/Payment';
   - Create a script to automate this conversion

3. Run depcheck to find unused dependencies:
   - npm install -g depcheck
   - depcheck kelmah-frontend
   - Remove unused packages from package.json

4. Implement dynamic imports for heavy components:
   - Charts (recharts)
   - Maps (react-leaflet)
   - Rich text editors
   - PDF viewers

5. Configure Vite for better code splitting in vite.config.js:
   - Split vendor chunks (react, mui, redux, etc.)
   - Split feature chunks (jobs, worker, hirer modules)
   - Set appropriate chunk size limits

6. Measure and report:
   - Bundle size before optimization
   - Bundle size after optimization
   - Percentage reduction
   - Largest remaining chunks

Target: Reduce main bundle to under 500KB gzipped
```

---

## Task 3.3: Add Request Caching

### 🎯 Objective
Implement intelligent caching strategies to reduce unnecessary API calls.

### 📋 Current Issues
- Same data fetched multiple times
- No cache invalidation strategy
- Stale data displayed to users
- High server load from repeated requests

### ✅ Implementation Steps

#### Step 1: Configure React Query Cache Times by Data Type
**File:** `kelmah-frontend/src/config/queryClient.js`

```javascript
import { QueryClient } from '@tanstack/react-query';

// Cache time configurations by data volatility
export const CACHE_TIMES = {
  // Very stable data - cache for 1 hour
  STATIC: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Moderately stable - cache for 5 minutes
  MODERATE: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Frequently changing - cache for 30 seconds
  VOLATILE: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Real-time data - cache for 10 seconds
  REALTIME: {
    staleTime: 10 * 1000, // 10 seconds
    cacheTime: 60 * 1000, // 1 minute
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...CACHE_TIMES.MODERATE, // Default to moderate caching
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});
```

#### Step 2: Apply Appropriate Cache Times to Queries
**File:** `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`

```javascript
import { CACHE_TIMES } from '../../../config/queryClient';

// Job listings - moderately volatile
export const useJobsQuery = (filters = {}) => {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: async () => {
      const response = await api.get('/api/jobs', { params: filters });
      return response.data;
    },
    ...CACHE_TIMES.VOLATILE, // Jobs change frequently
  });
};

// User profile - stable
export const useProfileQuery = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/api/users/profile');
      return response.data;
    },
    ...CACHE_TIMES.STATIC, // Profile doesn't change often
  });
};

// Notifications - real-time
export const useNotificationsQuery = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/api/notifications');
      return response.data;
    },
    ...CACHE_TIMES.REALTIME, // Notifications need to be fresh
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
};
```

#### Step 3: Implement Optimistic Updates
**File:** `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`

```javascript
export const useApplyToJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, applicationData }) => {
      const response = await api.post(`/api/jobs/${jobId}/apply`, applicationData);
      return response.data;
    },
    onMutate: async ({ jobId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: jobKeys.detail(jobId) });

      // Snapshot previous value
      const previousJob = queryClient.getQueryData(jobKeys.detail(jobId));

      // Optimistically update
      queryClient.setQueryData(jobKeys.detail(jobId), (old) => ({
        ...old,
        hasApplied: true,
        applicationCount: (old.applicationCount || 0) + 1,
      }));

      return { previousJob };
    },
    onError: (err, { jobId }, context) => {
      // Rollback on error
      queryClient.setQueryData(jobKeys.detail(jobId), context.previousJob);
    },
    onSettled: (_, __, { jobId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
    },
  });
};
```

#### Step 4: Implement Cache Invalidation Strategy
**File:** `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`

```javascript
export const useCreateJobMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData) => {
      const response = await api.post('/api/jobs', jobData);
      return response.data;
    },
    onSuccess: (newJob) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() }); // All job lists
      queryClient.invalidateQueries({ queryKey: jobKeys.myJobs() }); // My jobs
      
      // Add new job to cache
      queryClient.setQueryData(jobKeys.detail(newJob.id), newJob);
      
      // Optimistically add to lists
      queryClient.setQueriesData(
        { queryKey: jobKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            jobs: [newJob, ...(old.jobs || [])],
            total: (old.total || 0) + 1,
          };
        }
      );
    },
  });
};
```

#### Step 5: Persist Selected Queries to localStorage
**File:** `kelmah-frontend/src/config/queryClient.js`

```javascript
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

// Create persister
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'KELMAH_QUERY_CACHE',
});

// Persist only specific queries
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist user profile and settings
      const persistKeys = ['profile', 'settings'];
      return persistKeys.some(key => query.queryKey.includes(key));
    },
  },
});
```

### 🧪 Testing Checklist
- [ ] Data is cached correctly
- [ ] Cache invalidation works after mutations
- [ ] Optimistic updates work
- [ ] Background refetching works
- [ ] Persisted queries load from localStorage
- [ ] Reduced API calls (check Network tab)

### 📝 Prompt for AI Assistant
```
I need to implement intelligent caching strategies using React Query.

Please help me:
1. Configure cache times in kelmah-frontend/src/config/queryClient.js based on data volatility:
   - STATIC: 1 hour stale time (user profile, settings)
   - MODERATE: 5 minutes stale time (job listings)
   - VOLATILE: 30 seconds stale time (applications, bids)
   - REALTIME: 10 seconds stale time (notifications, messages)

2. Update all query hooks to use appropriate cache times:
   - Profile queries → STATIC
   - Job listing queries → VOLATILE
   - Notification queries → REALTIME with 30s polling
   - Message queries → REALTIME

3. Implement optimistic updates for these mutations:
   - Apply to job (update hasApplied, applicationCount)
   - Save job (update isSaved)
   - Like/unlike (update likeCount)

4. Implement cache invalidation strategy:
   - Creating a job invalidates: job lists, my jobs
   - Applying to job invalidates: job details, my applications
   - Updating profile invalidates: profile, user data

5. Persist selected queries to localStorage:
   - User profile
   - User settings
   - Saved searches
   - Max age: 24 hours

6. Add background refetching for critical data:
   - Notifications: every 30 seconds
   - Messages: every 30 seconds
   - Only when window is focused

Files to update:
- kelmah-frontend/src/config/queryClient.js
- kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js
- kelmah-frontend/src/modules/auth/hooks/useAuthQuery.js
- kelmah-frontend/src/modules/notifications/hooks/useNotificationsQuery.js

Expected outcome: 70% reduction in API calls, faster perceived performance
```

---

# Phase 4: UI/UX Improvements (Week 4)

## Task 4.1: Design System Implementation

### 🎯 Objective
Create a consistent design system with reusable components and standardized styling.

### 📋 Current Issues
- Inconsistent colors across components
- Hardcoded spacing values
- No typography scale
- Inline styles everywhere
- Difficult to maintain consistent look

### ✅ Implementation Steps

#### Step 1: Audit Current Styles
Run this script to find all unique colors:
**File:** `kelmah-frontend/scripts/audit-colors.js`

```javascript
const fs = require('fs');
const glob = require('glob');

const colorRegex = /#[0-9A-Fa-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)/g;
const files = glob.sync('src/**/*.{js,jsx,css}');

const colors = new Set();

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(colorRegex);
  if (matches) {
    matches.forEach(color => colors.add(color));
  }
});

console.log('Unique colors found:', colors.size);
console.log(Array.from(colors).sort());
```

#### Step 2: Define Design Tokens
**File:** `kelmah-frontend/src/theme/tokens.js`

```javascript
export const designTokens = {
  // Color palette
  colors: {
    // Primary - Gold
    primary: {
      50: '#FFFBF0',
      100: '#FFF4D1',
      200: '#FFE9A3',
      300: '#FFD966',
      400: '#D4AF37', // Main gold
      500: '#B8941F',
      600: '#9A7A1A',
      700: '#7D6115',
      800: '#5F4910',
      900: '#42320B',
    },
    
    // Secondary - Black
    secondary: {
      50: '#F5F5F5',
      100: '#E0E0E0',
      200: '#BDBDBD',
      300: '#9E9E9E',
      400: '#757575',
      500: '#616161',
      600: '#424242',
      700: '#303030',
      800: '#212121',
      900: '#1A1A1A', // Main black
    },
    
    // Semantic colors
    success: {
      light: '#81C784',
      main: '#4CAF50',
      dark: '#388E3C',
    },
    error: {
      light: '#E57373',
      main: '#F44336',
      dark: '#D32F2F',
    },
    warning: {
      light: '#FFB74D',
      main: '#FF9800',
      dark: '#F57C00',
    },
    info: {
      light: '#64B5F6',
      main: '#2196F3',
      dark: '#1976D2',
    },
    
    // Neutrals
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
      secondary: '"Playfair Display", "Georgia", serif',
      mono: '"Roboto Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
};
```

#### Step 3: Update Material-UI Theme
**File:** `kelmah-frontend/src/theme/ThemeProvider.jsx`

```javascript
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { designTokens } from './tokens';

const theme = createTheme({
  palette: {
    primary: {
      main: designTokens.colors.primary[400],
      light: designTokens.colors.primary[200],
      dark: designTokens.colors.primary[600],
    },
    secondary: {
      main: designTokens.colors.secondary[900],
      light: designTokens.colors.secondary[700],
      dark: designTokens.colors.secondary[900],
    },
    success: designTokens.colors.success,
    error: designTokens.colors.error,
    warning: designTokens.colors.warning,
    info: designTokens.colors.info,
    grey: designTokens.colors.grey,
  },
  
  typography: {
    fontFamily: designTokens.typography.fontFamily.primary,
    h1: {
      fontSize: designTokens.typography.fontSize['5xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    h2: {
      fontSize: designTokens.typography.fontSize['4xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    h3: {
      fontSize: designTokens.typography.fontSize['3xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    h4: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    h5: {
      fontSize: designTokens.typography.fontSize.xl,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    h6: {
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    body1: {
      fontSize: designTokens.typography.fontSize.base,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    body2: {
      fontSize: designTokens.typography.fontSize.sm,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
  },
  
  spacing: (factor) => {
    const spacingValues = Object.values(designTokens.spacing);
    return spacingValues[factor] || `${factor * 8}px`;
  },
  
  shape: {
    borderRadius: parseInt(designTokens.borderRadius.md),
  },
  
  shadows: Object.values(designTokens.shadows),
});

export const KelmahThemeProvider = ({ children }) => {
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};
```

#### Step 4: Create Reusable Component Variants
**File:** `kelmah-frontend/src/components/ui/Button.jsx`

```javascript
import { Button as MuiButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const Button = styled(MuiButton)(({ theme, variant }) => ({
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightMedium,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 3),
  
  ...(variant === 'primary' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.black,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  
  ...(variant === 'secondary' && {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  }),
  
  ...(variant === 'outline' && {
    border: `2px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.black,
    },
  }),
  
  ...(variant === 'ghost' && {
    backgroundColor: 'transparent',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  }),
}));
```

### 📝 Prompt for AI Assistant
```
I need to create a consistent design system for my React app.

Please help me:
1. Audit all color values used across components:
   - Run the color audit script
   - Consolidate similar colors
   - Map to theme palette

2. Create design tokens file at kelmah-frontend/src/theme/tokens.js with:
   - Color palette (primary gold, secondary black, semantic colors)
   - Typography scale (font sizes, weights, line heights)
   - Spacing scale (0-24)
   - Border radius values
   - Shadow definitions

3. Update Material-UI theme in kelmah-frontend/src/theme/ThemeProvider.jsx:
   - Use design tokens for all values
   - Define typography variants (h1-h6, body1-body2)
   - Configure spacing function
   - Configure shadows

4. Create reusable component variants:
   - Button: primary, secondary, outline, ghost
   - Card: elevated, outlined, filled
   - Badge: success, error, warning, info

5. Update all components to use theme values:
   - Replace hardcoded colors with theme.palette
   - Replace hardcoded spacing with theme.spacing()
   - Replace hardcoded typography with theme.typography
   - Remove all inline styles

6. Create a style guide page showing all design tokens and components

Files to create/update:
- Create: kelmah-frontend/src/theme/tokens.js
- Update: kelmah-frontend/src/theme/ThemeProvider.jsx
- Create: kelmah-frontend/src/components/ui/Button.jsx
- Create: kelmah-frontend/src/components/ui/Card.jsx
- Create: kelmah-frontend/src/pages/StyleGuidePage.jsx

Expected outcome: Consistent visual design, easier maintenance, faster development
```

---

*This completes Phase 3 and Phase 4. Phase 5 (Error Handling & Monitoring) will be in a separate section to keep file sizes manageable.*