/* eslint-env jest */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import jobsApi from '../services/jobsService';
import { useSavedJobsQuery } from './useJobsQuery';

jest.mock('../services/jobsService', () => ({
  __esModule: true,
  default: {
    getSavedJobs: jest.fn(),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

const createWrapper = (queryClient) => ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSavedJobsQuery param normalization', () => {
  beforeEach(() => {
    jobsApi.getSavedJobs.mockReset();
    jobsApi.getSavedJobs.mockResolvedValue({ jobs: [], totalPages: 1 });
  });

  test('normalizes empty saved-job params before calling the service', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    const { unmount } = renderHook(
      () => useSavedJobsQuery({ search: '   ', tags: [], includeClosed: undefined }),
      { wrapper },
    );

    await waitFor(() => {
      expect(jobsApi.getSavedJobs).toHaveBeenCalledWith({});
    });

    unmount();
    queryClient.clear();
  });

  test('does not refetch when rerendered with fresh equal empty params', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result, rerender, unmount } = renderHook(
      ({ params }) => useSavedJobsQuery(params),
      {
        initialProps: {
          params: { search: '   ', tags: [], includeClosed: undefined },
        },
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    rerender({ params: {} });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(jobsApi.getSavedJobs).toHaveBeenCalledTimes(1);

    unmount();
    queryClient.clear();
  });
});