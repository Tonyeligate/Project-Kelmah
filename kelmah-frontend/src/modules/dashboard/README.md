# Dashboard Module

The dashboard module provides role-specific dashboards for workers and hirers in the Kelmah platform.

## Structure

```
modules/dashboard/
├── components/
│   ├── common/           # Shared components
│   │   ├── DashboardCard.jsx
│   │   ├── ActivityFeed.jsx
│   │   ├── PerformanceMetrics.jsx
│   │   ├── QuickActions.jsx
│   │   └── StatisticsCard.jsx
│   ├── worker/          # Worker-specific components
│   │   └── WorkerDashboard.jsx
│   └── hirer/           # Hirer-specific components
│       └── HirerDashboard.jsx
├── hooks/
│   └── useDashboard.js  # Dashboard data and operations
├── pages/
│   └── DashboardPage.jsx # Main dashboard page
└── services/
    └── dashboardService.js # API integration with real-time socket support
```

## Features

### Worker Dashboard
- Earnings tracking and visualization
- Skills management and progress
- Job recommendations
- Profile completion status
- Upcoming jobs schedule
- Task management
- Availability scheduling
- Quick actions for common tasks

### Hirer Dashboard
- Job metrics and analytics
- Active jobs management
- Worker management
- Application tracking
- Job scheduling
- Earnings overview
- Quick actions for common tasks

## Components

### Common Components
- `DashboardCard`: Base card component for dashboard items with consistent styling
- `ActivityFeed`: Displays recent user activities in a feed format
- `PerformanceMetrics`: Shows performance statistics with progress bars
- `QuickActions`: Provides quick access to common tasks with icons and tooltips
- `StatisticsCard`: Displays statistical information with trend indicators

### Worker Components
- `WorkerDashboard`: Main worker dashboard layout with personalized sections

### Hirer Components
- `HirerDashboard`: Main hirer dashboard layout with job management sections

## Usage

```jsx
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';

// In your router or app
<Route path="/dashboard" element={<DashboardPage />} />
```

## State Management

The dashboard uses the `useDashboard` hook for state management and data fetching:

```jsx
const {
    loading,
    error,
    overview,
    recentActivity,
    statistics,
    realTimeData,         // Real-time data from socket
    isSocketConnected,    // Socket connection status
    // ... other state
    loadOverview,
    loadRecentActivity,
    // ... other actions
} = useDashboard();
```

## Real-time Updates

The dashboard module includes real-time updates via WebSockets:

1. **Socket Connection**: Automatically connects when user is authenticated
2. **Real-time Events**:
   - `dashboard:update`: General dashboard updates
   - `dashboard:new-job`: New job notifications
   - `dashboard:status-change`: Status changes for jobs/applications

Example usage:

```jsx
// Real-time updates are automatically handled by the useDashboard hook
const { realTimeData, isSocketConnected } = useDashboard();

// Display connection status
{isSocketConnected ? (
  <Chip color="success" label="Connected" />
) : (
  <Chip color="error" label="Disconnected" />
)}

// Use real-time data
{realTimeData.stats && (
  <Typography>Active Users: {realTimeData.stats.activeUsers}</Typography>
)}
```

## Styling

The dashboard uses Material-UI components and follows the application's theme. Custom styling is applied through the `sx` prop and theme customization.

## Best Practices

1. Keep components focused and single-responsibility
2. Use proper error handling and loading states
3. Implement responsive design for all screen sizes
4. Follow the established component hierarchy
5. Use proper TypeScript types and PropTypes
6. Maintain consistent styling and theming
7. Implement proper error boundaries
8. Use proper data fetching and caching strategies

## Migration Plan

The following components should be migrated from `/components/dashboard/` to the module structure:

### Worker Components to Migrate
- EarningsTracker.jsx → modules/dashboard/components/worker/
- SkillsManager.jsx → modules/dashboard/components/worker/
- JobRecommendations.jsx → modules/dashboard/components/worker/
- ProfileProgress.jsx → modules/dashboard/components/worker/
- UpcomingJobs.jsx → modules/dashboard/components/worker/
- RecentEarningsChart.jsx → modules/dashboard/components/worker/
- WorkerTaskSummary.jsx → modules/dashboard/components/worker/

### Hirer Components to Migrate
- JobMetrics.jsx → modules/dashboard/components/hirer/
- ActiveJobsList.jsx → modules/dashboard/components/hirer/
- ActiveWorkersList.jsx → modules/dashboard/components/hirer/
- ApplicationTracker.jsx → modules/dashboard/components/hirer/
- CreateJobDialog.jsx → modules/dashboard/components/hirer/
- JobSchedule.jsx → modules/dashboard/components/hirer/
- WorkerManagement.jsx → modules/dashboard/components/hirer/
- EarningsOverview.jsx → modules/dashboard/components/hirer/

## Contributing

When adding new features or components:
1. Follow the established folder structure
2. Add proper documentation
3. Include loading and error states
4. Implement responsive design
5. Add proper TypeScript types
6. Update this README if necessary 