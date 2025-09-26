/**
 * Common Card Components
 * Reusable card components used across different modules
 */

export { default as JobCard } from './JobCard';
export { default as UserCard } from './UserCard';

// Export different JobCard configurations as named exports for convenience
import JobCard from './JobCard';

export const CompactJobCard = (props) => (
  <JobCard 
    {...props} 
    variant="compact" 
    features={{
      showSaveButton: false,
      showNavigation: true,
      showHirerInfo: false,
      showFullDescription: false
    }} 
  />
);

export const DetailedJobCard = (props) => (
  <JobCard 
    {...props} 
    variant="detailed"
    features={{
      showSaveButton: true,
      showNavigation: true,
      showHirerInfo: true,
      showFullDescription: false
    }} 
  />
);

export const ListingJobCard = (props) => (
  <JobCard 
    {...props} 
    variant="default"
    features={{
      showSaveButton: false,
      showNavigation: true,
      showHirerInfo: true,
      showFullDescription: false
    }} 
  />
);

export const InteractiveJobCard = (props) => (
  <JobCard 
    {...props} 
    variant="default"
    features={{
      showSaveButton: true,
      showNavigation: true,
      showHirerInfo: true,
      showFullDescription: false
    }} 
  />
);

// Export different UserCard configurations
import UserCard from './UserCard';

export const CompactUserCard = (props) => (
  <UserCard
    {...props}
    variant="compact"
    features={{
      showEmail: false,
      showPhone: false,
      showLocation: true,
      showRating: false,
      showStatus: true,
      showActions: false,
      clickable: true
    }}
  />
);

export const DetailedUserCard = (props) => (
  <UserCard
    {...props}
    variant="detailed"
    features={{
      showEmail: true,
      showPhone: true,
      showLocation: true,
      showRating: true,
      showStatus: true,
      showActions: true,
      clickable: true
    }}
  />
);

export const WorkerCard = (props) => (
  <UserCard
    {...props}
    variant="default"
    features={{
      showEmail: false,
      showPhone: false,
      showLocation: true,
      showRating: true,
      showStatus: true,
      showActions: false,
      clickable: true
    }}
  />
);