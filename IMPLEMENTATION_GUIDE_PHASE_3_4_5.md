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

## Task 4.2: Improve Loading States

### 🎯 Objective
Implement consistent, user-friendly loading states across all data-fetching scenarios.

### 📋 Current Issues
- Inconsistent loading indicators (spinners, skeletons, text)
- No loading state for background refetching
- Entire page goes blank during loading
- Poor perceived performance
- No progress indication for long operations

### ✅ Implementation Steps

#### Step 1: Create Reusable Loading Components
**File:** `kelmah-frontend/src/components/ui/LoadingStates.jsx`

```javascript
import { Skeleton, CircularProgress, LinearProgress, Box, Typography } from '@mui/material';

// Skeleton for job cards
export const JobCardSkeleton = () => (
  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
    <Skeleton variant="rectangular" height={120} sx={{ mb: 2 }} />
    <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="circular" width={32} height={32} />
    </Box>
  </Box>
);

// Skeleton for list items
export const ListItemSkeleton = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>
    ))}
  </>
);

// Full page loading
export const PageLoader = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 2,
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Inline loading (for buttons)
export const InlineLoader = ({ size = 20 }) => (
  <CircularProgress size={size} sx={{ color: 'inherit' }} />
);

// Progress bar for file uploads
export const UploadProgress = ({ progress, fileName }) => (
  <Box sx={{ width: '100%', p: 2 }}>
    <Typography variant="body2" gutterBottom>
      Uploading {fileName}...
    </Typography>
    <LinearProgress variant="determinate" value={progress} />
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
      {progress}%
    </Typography>
  </Box>
);

// Background refetch indicator
export const RefetchIndicator = () => (
  <LinearProgress
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      height: 2,
    }}
  />
);
```

#### Step 2: Update React Query to Show Background Refetch
**File:** `kelmah-frontend/src/App.jsx`

```javascript
import { useIsFetching } from '@tanstack/react-query';
import { RefetchIndicator } from './components/ui/LoadingStates';

const App = () => {
  const isFetching = useIsFetching();

  return (
    <>
      {isFetching > 0 && <RefetchIndicator />}
      {/* Rest of app */}
    </>
  );
};
```

#### Step 3: Update Job Listings with Skeleton Loaders
**File:** `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`

**BEFORE:**
```javascript
const JobsPage = () => {
  const { data: jobs, isLoading, error } = useJobsQuery();

  if (isLoading) return <CircularProgress />;
  if (error) return <div>Error loading jobs</div>;

  return <JobList jobs={jobs} />;
};
```

**AFTER:**
```javascript
import { JobCardSkeleton } from '../../../components/ui/LoadingStates';

const JobsPage = () => {
  const { data: jobs, isLoading, isFetching, error } = useJobsQuery();

  return (
    <Box>
      {/* Show skeleton on initial load */}
      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <JobCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <>
          {/* Show subtle indicator during background refetch */}
          {isFetching && !isLoading && <RefetchIndicator />}
          <JobList jobs={jobs} />
        </>
      )}
    </Box>
  );
};
```

#### Step 4: Add Loading State to Mutations
**File:** `kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx`

```javascript
import { InlineLoader } from '../../../../components/ui/LoadingStates';

const JobCreationForm = () => {
  const { mutateAsync, isPending } = useCreateJobMutation();

  const handleSubmit = async (data) => {
    try {
      await mutateAsync(data);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <InlineLoader size={20} />
            <span style={{ marginLeft: 8 }}>Creating Job...</span>
          </>
        ) : (
          'Create Job'
        )}
      </Button>
    </form>
  );
};
```

#### Step 5: Add Upload Progress for File Uploads
**File:** `kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx`

```javascript
import { useState } from 'react';
import { UploadProgress } from '../../../../components/ui/LoadingStates';

const JobApplication = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);

  const handleFileUpload = async (file) => {
    setUploadingFile(file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/uploads', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  return (
    <Box>
      {uploadingFile && (
        <UploadProgress progress={uploadProgress} fileName={uploadingFile} />
      )}
      {/* Rest of form */}
    </Box>
  );
};
```

### 🧪 Testing Checklist
- [ ] Skeleton loaders display during initial data fetch
- [ ] Background refetch indicator shows at top of page
- [ ] Button loading states prevent double-clicks
- [ ] Upload progress shows accurate percentage
- [ ] Loading states don't cause layout shifts
- [ ] Accessible to screen readers

### 📝 Prompt for AI Assistant
```
I need to improve loading states across my React app.

Please help me:
1. Create reusable loading components in kelmah-frontend/src/components/ui/LoadingStates.jsx:
   - JobCardSkeleton (for job listings)
   - ListItemSkeleton (for generic lists)
   - PageLoader (full page loading)
   - InlineLoader (for buttons)
   - UploadProgress (file upload progress bar)
   - RefetchIndicator (top bar for background refetch)

2. Update App.jsx to show RefetchIndicator during background refetching:
   - Use useIsFetching() hook from React Query
   - Show linear progress bar at top when isFetching > 0

3. Update all data-fetching pages to use skeleton loaders:
   - JobsPage.jsx: Use JobCardSkeleton during initial load
   - WorkerSearchPage.jsx: Use ListItemSkeleton
   - MessagingPage.jsx: Use ListItemSkeleton for conversations
   - DashboardPage.jsx: Use appropriate skeletons for widgets

4. Add loading states to all mutation buttons:
   - Job creation form: "Creating Job..." with spinner
   - Job application form: "Submitting Application..." with spinner
   - Profile update: "Saving..." with spinner
   - Disable buttons during pending state

5. Add upload progress for file uploads:
   - Track upload progress with onUploadProgress
   - Show linear progress bar with percentage
   - Display filename being uploaded

6. Ensure loading states are accessible:
   - Add aria-busy="true" during loading
   - Add aria-live regions for status updates
   - Ensure keyboard navigation works

Files to create/update:
- Create: kelmah-frontend/src/components/ui/LoadingStates.jsx
- Update: kelmah-frontend/src/App.jsx
- Update: kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx
- Update: kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx
- Update: kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx
- Update: All other data-fetching pages

Expected outcome: Consistent loading states, better perceived performance, no layout shifts
```

---

## Task 4.3: Accessibility Improvements

### 🎯 Objective
Ensure the platform is fully accessible to users with disabilities, meeting WCAG 2.1 AA standards.

### 📋 Current Issues
- Missing alt text on images
- Poor keyboard navigation
- Insufficient color contrast
- No ARIA labels on interactive elements
- Forms lack proper labels
- No focus indicators

### ✅ Implementation Steps

#### Step 1: Install Accessibility Tools
```bash
cd kelmah-frontend
npm install --save-dev @axe-core/react eslint-plugin-jsx-a11y
```

#### Step 2: Configure ESLint for Accessibility
**File:** `kelmah-frontend/.eslintrc.js`

```javascript
module.exports = {
  extends: [
    'react-app',
    'plugin:jsx-a11y/recommended', // Add accessibility linting
  ],
  plugins: ['jsx-a11y'],
  rules: {
    // Enforce accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/no-redundant-roles': 'error',
  },
};
```

#### Step 3: Add Axe DevTools in Development
**File:** `kelmah-frontend/src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Step 4: Fix Common Accessibility Issues

**Add Alt Text to Images:**
```javascript
// BEFORE
<img src={user.avatar} />

// AFTER
<img src={user.avatar} alt={`${user.name}'s profile picture`} />
```

**Add ARIA Labels to Interactive Elements:**
```javascript
// BEFORE
<IconButton onClick={handleDelete}>
  <DeleteIcon />
</IconButton>

// AFTER
<IconButton onClick={handleDelete} aria-label="Delete job posting">
  <DeleteIcon />
</IconButton>
```

**Ensure Proper Form Labels:**
```javascript
// BEFORE
<input type="text" placeholder="Job title" />

// AFTER
<TextField
  id="job-title"
  label="Job Title"
  placeholder="e.g., Senior Carpenter"
  required
  inputProps={{
    'aria-label': 'Job title',
    'aria-required': 'true',
  }}
/>
```

**Add Skip to Content Link:**
**File:** `kelmah-frontend/src/App.jsx`

```javascript
const App = () => {
  return (
    <>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999,
        }}
        onFocus={(e) => {
          e.target.style.left = '0';
          e.target.style.top = '0';
        }}
        onBlur={(e) => {
          e.target.style.left = '-9999px';
        }}
      >
        Skip to main content
      </a>
      <Layout>
        <main id="main-content" tabIndex={-1}>
          {/* Page content */}
        </main>
      </Layout>
    </>
  );
};
```

#### Step 5: Improve Keyboard Navigation
**File:** `kelmah-frontend/src/modules/jobs/components/JobCard.jsx`

```javascript
const JobCard = ({ job }) => {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/jobs/${job.id}`);
    }
  };

  return (
    <Card
      tabIndex={0}
      role="article"
      aria-label={`Job posting: ${job.title}`}
      onKeyPress={handleKeyPress}
      sx={{
        cursor: 'pointer',
        '&:focus': {
          outline: '2px solid #D4AF37',
          outlineOffset: '2px',
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" component="h3">
          {job.title}
        </Typography>
        {/* Rest of card */}
      </CardContent>
    </Card>
  );
};
```

#### Step 6: Fix Color Contrast Issues
**File:** `kelmah-frontend/src/theme/ThemeProvider.jsx`

```javascript
// Ensure all text has sufficient contrast
const theme = createTheme({
  palette: {
    text: {
      primary: '#1A1A1A', // Contrast ratio: 16.1:1 (AAA)
      secondary: '#424242', // Contrast ratio: 9.7:1 (AA)
      disabled: '#757575', // Contrast ratio: 4.6:1 (AA)
    },
    background: {
      default: '#FFFFFF',
      paper: '#FAFAFA',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // Ensure focus indicator is visible
          '&:focus-visible': {
            outline: '2px solid #D4AF37',
            outlineOffset: '2px',
          },
        },
      },
    },
  },
});
```

#### Step 7: Add ARIA Live Regions for Notifications
**File:** `kelmah-frontend/src/modules/notifications/components/NotificationProvider.jsx`

```javascript
const NotificationProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-9999px' }}
      >
        {/* Screen reader announcements */}
      </div>
      {children}
    </>
  );
};
```

#### Step 8: Create Accessibility Audit Script
**File:** `kelmah-frontend/scripts/accessibility-audit.js`

```javascript
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const pages = [
    'http://localhost:3000',
    'http://localhost:3000/jobs',
    'http://localhost:3000/login',
    'http://localhost:3000/register',
    'http://localhost:3000/dashboard',
  ];

  for (const url of pages) {
    await page.goto(url);
    const results = await new AxePuppeteer(page).analyze();
    
    console.log(`\n=== Accessibility Report for ${url} ===`);
    console.log(`Violations: ${results.violations.length}`);
    
    results.violations.forEach((violation) => {
      console.log(`\n${violation.id}: ${violation.description}`);
      console.log(`Impact: ${violation.impact}`);
      console.log(`Affected elements: ${violation.nodes.length}`);
    });
  }

  await browser.close();
})();
```

### 🧪 Testing Checklist
- [ ] All images have alt text
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works throughout app
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA standards
- [ ] Forms have proper labels and error messages
- [ ] Skip to content link works
- [ ] Screen reader announcements are clear
- [ ] No accessibility violations in axe DevTools

### 📝 Prompt for AI Assistant
```
I need to improve accessibility across my React app to meet WCAG 2.1 AA standards.

Please help me:
1. Install accessibility tools:
   - @axe-core/react for runtime accessibility checking
   - eslint-plugin-jsx-a11y for linting
   - @axe-core/puppeteer for automated testing

2. Configure ESLint with jsx-a11y rules in .eslintrc.js

3. Fix common accessibility issues:
   - Add alt text to all images
   - Add ARIA labels to all IconButtons and interactive elements
   - Ensure all form inputs have associated labels
   - Fix color contrast issues (ensure 4.5:1 ratio for normal text)
   - Add focus indicators to all focusable elements

4. Improve keyboard navigation:
   - Add tabIndex where needed
   - Handle Enter/Space key events on custom interactive elements
   - Ensure logical tab order
   - Add skip to content link

5. Add ARIA live regions:
   - Notifications should announce to screen readers
   - Form validation errors should be announced
   - Loading states should be announced

6. Create accessibility audit script:
   - Use @axe-core/puppeteer to test all pages
   - Generate report of violations
   - Run as part of CI/CD pipeline

7. Update these components for accessibility:
   - kelmah-frontend/src/modules/jobs/components/JobCard.jsx
   - kelmah-frontend/src/modules/auth/components/LoginForm.jsx
   - kelmah-frontend/src/modules/layout/components/Layout.jsx
   - All interactive components

Files to create/update:
- Update: kelmah-frontend/.eslintrc.js
- Update: kelmah-frontend/src/main.jsx
- Update: kelmah-frontend/src/App.jsx
- Create: kelmah-frontend/scripts/accessibility-audit.js
- Update: All components with accessibility issues

Expected outcome: WCAG 2.1 AA compliance, better experience for users with disabilities
```

---

# Phase 5: Error Handling & Monitoring (Week 5)

## Task 5.1: Centralized Error Handling

### 🎯 Objective
Implement a centralized error handling system with proper error boundaries, logging, and user feedback.

### 📋 Current Issues
- Errors crash the entire app
- No error logging or monitoring
- Generic error messages
- No error recovery mechanism
- Errors not tracked or analyzed

### ✅ Implementation Steps

#### Step 1: Create Error Boundary Component
**File:** `kelmah-frontend/src/components/errors/ErrorBoundary.jsx`

```javascript
import { Component } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to error tracking service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService = (error, errorInfo) => {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Send to backend error logging endpoint
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch((err) => console.error('Failed to log error:', err));
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/'; // Redirect to home
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              textAlign: 'center',
              gap: 3,
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
            <Typography variant="h4" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
              We're sorry for the inconvenience. Our team has been notified and is working on a fix.
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  textAlign: 'left',
                  maxWidth: 800,
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" component="pre">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" onClick={this.handleReset}>
                Go to Homepage
              </Button>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </Box>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### Step 2: Create API Error Handler
**File:** `kelmah-frontend/src/services/errorHandler.js`

```javascript
import { enqueueSnackbar } from 'notistack';

// Error types
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Classify error
export const classifyError = (error) => {
  if (!error.response) {
    return ErrorTypes.NETWORK;
  }

  const { status } = error.response;

  if (status === 401 || status === 403) {
    return ErrorTypes.AUTH;
  }

  if (status === 404) {
    return ErrorTypes.NOT_FOUND;
  }

  if (status >= 400 && status < 500) {
    return ErrorTypes.VALIDATION;
  }

  if (status >= 500) {
    return ErrorTypes.SERVER;
  }

  return ErrorTypes.UNKNOWN;
};

// Get user-friendly error message
export const getErrorMessage = (error) => {
  const errorType = classifyError(error);

  const messages = {
    [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection.',
    [ErrorTypes.AUTH]: 'You need to log in to perform this action.',
    [ErrorTypes.VALIDATION]: error.response?.data?.message || 'Please check your input and try again.',
    [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorTypes.SERVER]: 'Our servers are experiencing issues. Please try again later.',
    [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.',
  };

  return messages[errorType];
};

// Handle API errors globally
export const handleApiError = (error, options = {}) => {
  const {
    showNotification = true,
    logToConsole = true,
    logToService = true,
  } = options;

  // Log to console in development
  if (logToConsole && process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  // Log to error tracking service in production
  if (logToService && process.env.NODE_ENV === 'production') {
    logErrorToService(error);
  }

  // Show user notification
  if (showNotification) {
    const message = getErrorMessage(error);
    const errorType = classifyError(error);

    const severity = errorType === ErrorTypes.VALIDATION ? 'warning' : 'error';

    enqueueSnackbar(message, {
      variant: severity,
      autoHideDuration: 5000,
    });
  }

  return error;
};

// Log error to backend service
const logErrorToService = (error) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    type: classifyError(error),
    response: error.response?.data,
    status: error.response?.status,
    url: error.config?.url,
    method: error.config?.method,
    timestamp: new Date().toISOString(),
  };

  // Send to backend (fire and forget)
  fetch('/api/errors/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData),
  }).catch(() => {
    // Silently fail if logging fails
  });
};

// Retry logic for failed requests
export const retryRequest = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    // Don't retry auth errors or validation errors
    const errorType = classifyError(error);
    if ([ErrorTypes.AUTH, ErrorTypes.VALIDATION, ErrorTypes.NOT_FOUND].includes(errorType)) {
      throw error;
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry with exponential backoff
    return retryRequest(fn, retries - 1, delay * 2);
  }
};

export default {
  classifyError,
  getErrorMessage,
  handleApiError,
  retryRequest,
  ErrorTypes,
};
```

#### Step 3: Update Axios Interceptor to Use Error Handler
**File:** `kelmah-frontend/src/services/apiClient.js`

```javascript
import axios from 'axios';
import { handleApiError } from './errorHandler';
import { secureStorage } from '../utils/secureStorage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle error globally
    handleApiError(error);

    // Special handling for 401 errors (logout)
    if (error.response?.status === 401) {
      secureStorage.removeItem('token');
      secureStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Step 4: Wrap App with Error Boundary
**File:** `kelmah-frontend/src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import ErrorBoundary from './components/errors/ErrorBoundary';
import App from './App';
import { store } from './store';
import { queryClient } from './config/queryClient';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <App />
          </SnackbarProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

#### Step 5: Add Route-Level Error Boundaries
**File:** `kelmah-frontend/src/routes/config.jsx`

```javascript
import ErrorBoundary from '../components/errors/ErrorBoundary';

const routes = [
  {
    path: '/jobs',
    element: (
      <ErrorBoundary>
        <JobsPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ErrorBoundary>
        <DashboardPage />
      </ErrorBoundary>
    ),
  },
  // Wrap each major route
];
```

#### Step 6: Create Backend Error Logging Endpoint
**File:** `kelmah-backend/api-gateway/routes/errorRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/frontend-errors.log', level: 'error' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

// Log frontend errors
router.post('/log', (req, res) => {
  const errorData = {
    ...req.body,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  logger.error('Frontend Error:', errorData);

  // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)

  res.status(200).json({ success: true });
});

module.exports = router;
```

### 🧪 Testing Checklist
- [ ] Error boundary catches component errors
- [ ] App doesn't crash on errors
- [ ] User-friendly error messages displayed
- [ ] Errors logged to backend
- [ ] Network errors show appropriate message
- [ ] Auth errors redirect to login
- [ ] Retry logic works for network failures
- [ ] Error state can be reset

### 📝 Prompt for AI Assistant
```
I need to implement centralized error handling in my React app.

Please help me:
1. Create ErrorBoundary component at kelmah-frontend/src/components/errors/ErrorBoundary.jsx:
   - Catch component errors
   - Show user-friendly error message
   - Log errors to backend
   - Provide reset/reload options
   - Show error details in development mode

2. Create error handler utility at kelmah-frontend/src/services/errorHandler.js:
   - Classify errors (network, auth, validation, server, etc.)
   - Generate user-friendly messages
   - Log to error tracking service
   - Implement retry logic with exponential backoff

3. Update axios interceptor in apiClient.js:
   - Use error handler for all API errors
   - Handle 401 errors (redirect to login)
   - Show toast notifications for errors

4. Wrap app with error boundary in main.jsx:
   - Wrap entire app with ErrorBoundary
   - Configure SnackbarProvider for error notifications

5. Add route-level error boundaries:
   - Wrap each major route with ErrorBoundary
   - Prevent one route's error from crashing entire app

6. Create backend error logging endpoint:
   - POST /api/errors/log
   - Store errors in logs/frontend-errors.log
   - Include user agent, IP, timestamp

7. Test error scenarios:
   - Throw error in component
   - Simulate network error
   - Simulate 401 error
   - Simulate 500 error
   - Verify error handling works correctly

Files to create/update:
- Create: kelmah-frontend/src/components/errors/ErrorBoundary.jsx
- Create: kelmah-frontend/src/services/errorHandler.js
- Update: kelmah-frontend/src/services/apiClient.js
- Update: kelmah-frontend/src/main.jsx
- Update: kelmah-frontend/src/routes/config.jsx
- Create: kelmah-backend/api-gateway/routes/errorRoutes.js

Expected outcome: Robust error handling, better user experience, error tracking
```

---

## Task 5.2: Add Comprehensive Error & Empty States

### 🎯 Objective
Implement user-friendly error and empty states for all data-fetching scenarios.

### 📋 Current Issues
- Generic error messages
- No guidance when data is empty
- No retry mechanism
- Errors look like system crashes
- No illustration or helpful messaging

### ✅ Implementation Steps

#### Step 1: Create Reusable Error State Components
**File:** `kelmah-frontend/src/components/ui/ErrorStates.jsx`

```javascript
import { Box, Typography, Button, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import LockIcon from '@mui/icons-material/Lock';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import InboxIcon from '@mui/icons-material/Inbox';

// Generic error state
export const ErrorState = ({ error, onRetry, title, message }) => {
  const defaultTitle = title || 'Something went wrong';
  const defaultMessage =
    message ||
    error?.message ||
    'An error occurred while loading this content. Please try again.';

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
        <Typography variant="h5" gutterBottom>
          {defaultTitle}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
          {defaultMessage}
        </Typography>
        {onRetry && (
          <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
            Try Again
          </Button>
        )}
      </Box>
    </Container>
  );
};

// Network error state
export const NetworkErrorState = ({ onRetry }) => (
  <Container maxWidth="sm">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <WifiOffIcon sx={{ fontSize: 80, color: 'warning.main' }} />
      <Typography variant="h5" gutterBottom>
        No Internet Connection
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        Please check your internet connection and try again.
      </Typography>
      {onRetry && (
        <Button variant="contained" onClick={onRetry} sx={{ mt: 2 }}>
          Retry Connection
        </Button>
      )}
    </Box>
  </Container>
);

// Authentication error state
export const AuthErrorState = () => (
  <Container maxWidth="sm">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <LockIcon sx={{ fontSize: 80, color: 'error.main' }} />
      <Typography variant="h5" gutterBottom>
        Authentication Required
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        You need to log in to view this content.
      </Typography>
      <Button variant="contained" href="/login" sx={{ mt: 2 }}>
        Go to Login
      </Button>
    </Box>
  </Container>
);

// Not found state
export const NotFoundState = ({ resourceType = 'content', onGoBack }) => (
  <Container maxWidth="sm">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
      <Typography variant="h5" gutterBottom>
        {resourceType} Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        The {resourceType.toLowerCase()} you're looking for doesn't exist or has been removed.
      </Typography>
      <Button
        variant="contained"
        onClick={onGoBack || (() => window.history.back())}
        sx={{ mt: 2 }}
      >
        Go Back
      </Button>
    </Box>
  </Container>
);

// Empty state
export const EmptyState = ({ icon: Icon = InboxIcon, title, message, action }) => (
  <Container maxWidth="sm">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <Icon sx={{ fontSize: 80, color: 'text.secondary' }} />
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        {message}
      </Typography>
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  </Container>
);
```

#### Step 2: Use Error States in Components
**File:** `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`

```javascript
import { ErrorState, EmptyState } from '../../../components/ui/ErrorStates';
import WorkIcon from '@mui/icons-material/Work';

const JobsPage = () => {
  const { data: jobs, isLoading, error, refetch } = useJobsQuery();

  if (isLoading) return <JobCardSkeleton />;

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={WorkIcon}
        title="No Jobs Available"
        message="There are no jobs matching your criteria right now. Check back later or adjust your filters."
        action={
          <Button variant="contained" href="/jobs/create">
            Post a Job
          </Button>
        }
      />
    );
  }

  return <JobList jobs={jobs} />;
};
```

#### Step 3: Add Error States to React Query Hooks
**File:** `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`

```javascript
import { useQuery } from '@tanstack/react-query';
import { handleApiError, classifyError, ErrorTypes } from '../../../services/errorHandler';

export const useJobsQuery = (filters = {}) => {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: async () => {
      try {
        const response = await api.get('/api/jobs', { params: filters });
        return response.data;
      } catch (error) {
        // Classify error for better handling
        const errorType = classifyError(error);

        // Customize error message based on type
        if (errorType === ErrorTypes.NETWORK) {
          error.userMessage = 'Unable to load jobs. Please check your internet connection.';
        } else if (errorType === ErrorTypes.SERVER) {
          error.userMessage = 'Our servers are experiencing issues. Please try again later.';
        } else {
          error.userMessage = 'Unable to load jobs. Please try again.';
        }

        throw error;
      }
    },
    retry: (failureCount, error) => {
      const errorType = classifyError(error);
      // Only retry network and server errors
      return (
        failureCount < 3 &&
        [ErrorTypes.NETWORK, ErrorTypes.SERVER].includes(errorType)
      );
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

#### Step 4: Add Empty States for Common Scenarios
**File:** `kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx`

```javascript
import { EmptyState } from '../../../components/ui/ErrorStates';
import AssignmentIcon from '@mui/icons-material/Assignment';

const MyApplicationsPage = () => {
  const { data: applications, isLoading, error } = useMyApplicationsQuery();

  if (error) return <ErrorState error={error} />;

  if (!applications || applications.length === 0) {
    return (
      <EmptyState
        icon={AssignmentIcon}
        title="No Applications Yet"
        message="You haven't applied to any jobs yet. Browse available jobs and start applying to opportunities that match your skills."
        action={
          <Button variant="contained" href="/jobs">
            Browse Jobs
          </Button>
        }
      />
    );
  }

  return <ApplicationList applications={applications} />;
};
```

#### Step 5: Add Error Recovery Mechanisms
**File:** `kelmah-frontend/src/components/ui/ErrorRecovery.jsx`

```javascript
import { useState } from 'react';
import { Box, Button, Typography, Collapse, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export const ErrorRecovery = ({ error, onRetry, children }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return children;

  return (
    <Box sx={{ p: 3 }}>
      <Alert
        severity="error"
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Details'}
            </Button>
            {onRetry && (
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
          </>
        }
      >
        <Typography variant="body2">
          {error.userMessage || 'An error occurred. Please try again.'}
        </Typography>
      </Alert>

      <Collapse in={showDetails}>
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          <Typography variant="caption" component="pre">
            {error.message}
            {'\n'}
            {error.stack}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};
```

### 🧪 Testing Checklist
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] Retry button works
- [ ] Navigation from empty states works
- [ ] Error messages are user-friendly
- [ ] Network errors show appropriate message
- [ ] Error details can be toggled
- [ ] Error recovery doesn't lose user data

### 📝 Prompt for AI Assistant
```
I need to add comprehensive error and empty states across my React app.

Please help me:
1. Create error state components in kelmah-frontend/src/components/ui/ErrorStates.jsx:
   - ErrorState (generic error with retry)
   - NetworkErrorState (offline/network issues)
   - AuthErrorState (authentication required)
   - NotFoundState (resource not found)
   - EmptyState (no data available)

2. Update all data-fetching pages to use error states:
   - JobsPage.jsx: Show error state on failure, empty state when no jobs
   - MyApplicationsPage.jsx: Show empty state when no applications
   - MessagingPage.jsx: Show empty state when no conversations
   - DashboardPage.jsx: Handle widget errors gracefully

3. Enhance React Query hooks with better error handling:
   - Add custom error messages based on error type
   - Configure retry logic (retry network/server errors, not auth/validation)
   - Add retry delay with exponential backoff

4. Create error recovery component:
   - Show error details in development mode
   - Provide retry button
   - Allow toggling error details
   - Don't lose user's form data on error

5. Add empty state illustrations and helpful actions:
   - Empty jobs: Link to create job or adjust filters
   - Empty applications: Link to browse jobs
   - Empty messages: Link to find workers
   - Empty saved jobs: Link to browse jobs

6. Test all error scenarios:
   - Network offline
   - 401 unauthorized
   - 404 not found
   - 500 server error
   - Empty data sets

Files to create/update:
- Create: kelmah-frontend/src/components/ui/ErrorStates.jsx
- Create: kelmah-frontend/src/components/ui/ErrorRecovery.jsx
- Update: kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx
- Update: kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js
- Update: All data-fetching pages with error/empty states

Expected outcome: User-friendly error handling, clear guidance on empty states, better UX
```

---

## 🎉 Implementation Complete!

All 5 phases are now fully documented:

### ✅ Phase 1: Data Flow Architecture
- Task 1.1: Consolidate State Management
- Task 1.2: Unify API Client Layer
- Task 1.3: Fix API Base URL Resolution

### ✅ Phase 2: UI Component Restructuring
- Task 2.1: Consolidate Routing
- Task 2.2: Component Architecture Cleanup
- Task 2.3: Implement Responsive Design

### ✅ Phase 3: Performance Optimization
- Task 3.1: Implement React Query
- Task 3.2: Optimize Bundle Size
- Task 3.3: Add Request Caching

### ✅ Phase 4: UI/UX Improvements
- Task 4.1: Design System Implementation
- Task 4.2: Improve Loading States
- Task 4.3: Accessibility Improvements

### ✅ Phase 5: Error Handling & Monitoring
- Task 5.1: Centralized Error Handling
- Task 5.2: Add Comprehensive Error & Empty States

---

## 📊 Final Success Metrics

### Performance
- [ ] Bundle size reduced by 30%+
- [ ] API calls reduced by 70% (via caching)
- [ ] Page load time under 2 seconds
- [ ] Time to interactive under 3 seconds

### Code Quality
- [ ] No Context providers (only Redux + React Query)
- [ ] Single API client
- [ ] All routes in single config file
- [ ] Zero duplicate components
- [ ] WCAG 2.1 AA compliance

### User Experience
- [ ] Consistent design system
- [ ] Smooth loading states
- [ ] User-friendly error messages
- [ ] Responsive on all devices
- [ ] Accessible to all users

### Developer Experience
- [ ] Easy to maintain
- [ ] Clear code structure
- [ ] Comprehensive error logging
- [ ] Fast development iteration

---

**Next Steps:** Start with Phase 1, Task 1.3 (API URL fix) for immediate impact, then work through tasks sequentially!