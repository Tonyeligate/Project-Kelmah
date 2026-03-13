/* eslint-env jest */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

const mockQueryWorkerDirectory = jest.fn();
const mockGetWorkerSearchSuggestions = jest.fn();
const mockWorkerSearchResults = jest.fn((props) => (
  <div data-testid="worker-search-results" data-map-toggle={String(Boolean(props.onToggleView))} />
));

jest.mock('../../modules/worker/services/workerService', () => ({
  __esModule: true,
  default: {
    queryWorkerDirectory: (...args) => mockQueryWorkerDirectory(...args),
    getWorkerSearchSuggestions: (...args) => mockGetWorkerSearchSuggestions(...args),
    bookmarkWorker: jest.fn(),
  },
}));

jest.mock('../../modules/search/components/common/JobSearchForm', () => ({
  __esModule: true,
  default: () => <div data-testid="job-search-form" />,
}));

jest.mock('../../modules/search/components/common/CompactSearchBar', () => ({
  __esModule: true,
  default: () => <div data-testid="compact-search-bar" />,
}));

jest.mock('../../modules/search/components/common/MobileFilterDrawer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../modules/search/components/common/CollapsibleHeroSection', () => ({
  __esModule: true,
  default: () => <div data-testid="hero" />,
}));

jest.mock('../../modules/search/components/results/WorkerSearchResults', () => ({
  __esModule: true,
  default: (props) => mockWorkerSearchResults(props),
}));

jest.mock('../../modules/search/components/map/JobMapView', () => ({
  __esModule: true,
  default: () => <div data-testid="job-map-view" />,
}));

jest.mock('../../modules/search/components/suggestions/SearchSuggestions', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../modules/search/components/AdvancedFilters', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../modules/search/components/LocationBasedSearch', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../modules/common/components/common/SEO', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: jest.fn(),
  }),
}));

import WorkerDirectoryExperience from '../../modules/search/components/WorkerDirectoryExperience';

const buildStore = () =>
  configureStore({
    reducer: {
      auth: () => ({
        user: null,
        isAuthenticated: false,
      }),
    },
  });

describe('worker directory map feature flag smoke', () => {
  beforeEach(() => {
    mockQueryWorkerDirectory.mockReset();
    mockGetWorkerSearchSuggestions.mockReset();
    mockWorkerSearchResults.mockClear();

    mockQueryWorkerDirectory.mockResolvedValue({
      workers: [],
      pagination: { page: 1, limit: 12, totalItems: 0, totalPages: 0 },
    });
    mockGetWorkerSearchSuggestions.mockResolvedValue([]);
  });

  test('keeps map view path disabled by default so placeholder map is unreachable', async () => {
    render(
      <Provider store={buildStore()}>
        <MemoryRouter initialEntries={['/find-talents']}>
          <WorkerDirectoryExperience variant="public" basePath="/find-talents" />
        </MemoryRouter>
      </Provider>,
    );

    await waitFor(() => {
      expect(mockWorkerSearchResults).toHaveBeenCalled();
    });

    const latestProps = mockWorkerSearchResults.mock.calls.at(-1)[0];

    expect(latestProps.showMap).toBe(false);
    expect(latestProps.onToggleView).toBeUndefined();
    expect(screen.queryByTestId('job-map-view')).not.toBeInTheDocument();
  });
});
