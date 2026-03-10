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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useSavedJobsQuery param normalization', () => {
  beforeEach(() => {
    jobsApi.getSavedJobs.mockReset();
    jobsApi.getSavedJobs.mockResolvedValue({ jobs: [], totalPages: 1 });
  });

  test('normalizes empty saved-job params before calling the service', async () => {
    const wrapper = createWrapper();

    renderHook(
      () => useSavedJobsQuery({ search: '   ', tags: [], includeClosed: undefined }),
      { wrapper },
    );

    await waitFor(() => {
      expect(jobsApi.getSavedJobs).toHaveBeenCalledWith({});
    });
  });

  test('does not refetch when rerendered with fresh equal empty params', async () => {
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
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
  });
});