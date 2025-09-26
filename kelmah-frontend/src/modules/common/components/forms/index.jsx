/**
 * Common Form Components
 * Reusable form components used across different modules
 */

export { default as SearchForm } from './SearchForm';

// Export different SearchForm configurations
import SearchForm from './SearchForm';

export const JobSearchForm = (props) => (
  <SearchForm
    {...props}
    searchType="jobs"
  />
);

export const WorkerSearchForm = (props) => (
  <SearchForm
    {...props}
    searchType="workers"
  />
);

export const CompactSearchForm = (props) => (
  <SearchForm
    {...props}
    variant="compact"
  />
);