# JobCard Component Consolidation Guide

## Overview
The duplicate JobCard components have been consolidated into a single, feature-rich, reusable component located at:
`modules/common/components/cards/JobCard.jsx`

## Migration Path

### From `jobs/components/common/JobCard.jsx` (Full-featured version)
**Before:**
```jsx
import JobCard from '../../../jobs/components/common/JobCard';
<JobCard job={job} onViewDetails={handleViewDetails} />
```

**After:**
```jsx
import { InteractiveJobCard } from '../../../common/components/cards';
<InteractiveJobCard job={job} onViewDetails={handleViewDetails} />
```

### From `jobs/components/listing/JobCard.jsx` (Simplified version)
**Before:**
```jsx
import JobCard from '../../../jobs/components/listing/JobCard';
<JobCard job={job} onViewDetails={handleViewDetails} />
```

**After:**
```jsx
import { ListingJobCard } from '../../../common/components/cards';
<ListingJobCard job={job} onViewDetails={handleViewDetails} />
```

## Available Variants

### 1. InteractiveJobCard (Replaces common/JobCard)
- Full Redux save/unsave functionality
- Complete responsive design
- Hirer information display
- Navigation on click

### 2. ListingJobCard (Replaces listing/JobCard)
- Simplified display for job listings
- No save functionality
- Basic hirer info
- Navigation on click

### 3. CompactJobCard (New)
- Minimal space usage
- Perfect for sidebars/widgets
- No save functionality
- Essential info only

### 4. DetailedJobCard (New)
- Maximum information display
- Action buttons
- Full feature set
- Best for job detail pages

### 5. Custom Configuration
```jsx
import { JobCard } from '../../../common/components/cards';

<JobCard 
  job={job} 
  variant="default"
  features={{
    showSaveButton: true,
    showNavigation: true,
    showHirerInfo: true,
    showFullDescription: false
  }}
  onViewDetails={handleViewDetails}
/>
```

## Features Configuration

| Feature | Default | Description |
|---------|---------|-------------|
| `showSaveButton` | `true` | Enable save/unsave functionality |
| `showNavigation` | `true` | Enable click navigation |
| `showHirerInfo` | `true` | Show hirer name and rating |
| `showFullDescription` | `false` | Show complete vs truncated description |

## Variants

| Variant | Use Case | Features |
|---------|----------|----------|
| `compact` | Sidebars, widgets | Minimal space |
| `default` | Standard listings | Balanced display |
| `detailed` | Job detail pages | Maximum information |

## Next Steps

1. Update all JobCard imports to use the new consolidated component
2. Test each usage to ensure proper functionality
3. Remove the old duplicate JobCard files
4. Update any tests that reference the old components

## Benefits

- **Single Source of Truth**: One component instead of multiple duplicates
- **Feature Flags**: Configurable functionality for different use cases  
- **Consistent UI**: Uniform appearance across the application
- **Better Maintenance**: Updates only need to happen in one place
- **Performance**: Dynamic imports for Redux actions when not needed