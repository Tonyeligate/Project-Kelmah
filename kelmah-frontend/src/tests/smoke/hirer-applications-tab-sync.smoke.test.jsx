import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import ApplicationManagementPage from '@/modules/hirer/pages/ApplicationManagementPage';
import * as responsiveHooks from '@/hooks/useResponsive';

const mockGetApplicationsSummary = jest.fn();
const mockGetJobApplications = jest.fn();
const mockNavigate = jest.fn();
const mockEnqueueSnackbar = jest.fn();

jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: (...args) => mockEnqueueSnackbar(...args),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@/modules/hirer/services/hirerService', () => ({
  hirerService: {
    getApplicationsSummary: (...args) => mockGetApplicationsSummary(...args),
    getJobApplications: (...args) => mockGetJobApplications(...args),
    updateApplicationStatus: jest.fn(),
  },
}));

jest.mock('@/modules/messaging/services/messagingService', () => ({
  messagingService: {
    createDirectConversation: jest.fn(),
  },
}));

const buildApplicationsSummaryResponse = () => ({
  jobs: [
    {
      id: 'job-1',
      title: 'Factory Paint Prep',
      responseMode: 'applications',
      responseCounts: { applications: 2, bids: 0 },
    },
  ],
  applications: [
    {
      id: 'app-accepted',
      jobId: 'job-1',
      jobTitle: 'Factory Paint Prep',
      workerId: 'worker-accepted',
      workerName: 'Ama Accepted',
      status: 'accepted',
      coverLetter: 'Ready to start this week.',
      createdAt: '2026-04-15T08:00:00.000Z',
      proposedRate: 200,
    },
    {
      id: 'app-pending',
      jobId: 'job-1',
      jobTitle: 'Factory Paint Prep',
      workerId: 'worker-pending',
      workerName: 'Kojo Pending',
      status: 'pending',
      coverLetter: 'Can begin tomorrow.',
      createdAt: '2026-04-14T08:00:00.000Z',
      proposedRate: 180,
    },
  ],
  summary: {
    totalJobs: 1,
    totalApplications: 2,
    countsByStatus: {
      pending: 1,
      accepted: 1,
      rejected: 0,
      under_review: 0,
      withdrawn: 0,
      total: 2,
    },
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 2,
    limit: 10,
  },
  filters: {
    sort: 'newest',
  },
});

const LocationSearchProbe = ({ onSearchChange }) => {
  const location = useLocation();

  useEffect(() => {
    onSearchChange(location.search || '');
  }, [location.search, onSearchChange]);

  return <div data-testid="location-search">{location.search}</div>;
};

const renderApplicationsPage = ({
  initialEntry = '/hirer/applications',
  routePath = '/hirer/applications',
  onSearchChange = () => {},
} = {}) =>
  render(
    <HelmetProvider>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter
          initialEntries={[initialEntry]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route
              path={routePath}
              element={
                <>
                  <ApplicationManagementPage />
                  <LocationSearchProbe onSearchChange={onSearchChange} />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>,
  );

describe('hirer applications tab query synchronization', () => {
  beforeEach(() => {
    mockGetApplicationsSummary.mockReset();
    mockGetJobApplications.mockReset();
    mockNavigate.mockReset();
    mockEnqueueSnackbar.mockReset();

    mockGetApplicationsSummary.mockResolvedValue(buildApplicationsSummaryResponse());
    jest.spyOn(responsiveHooks, 'useBreakpointDown').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('keeps tab=accepted stable when landing on /hirer/applications?tab=accepted', async () => {
    const searchHistory = [];

    renderApplicationsPage({
      initialEntry: '/hirer/applications?tab=accepted',
      onSearchChange: (search) => {
        searchHistory.push(search);
      },
    });

    await waitFor(() => {
      expect(mockGetApplicationsSummary).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toContain('tab=accepted');
    });

    const requestedStatuses = mockGetApplicationsSummary.mock.calls.map(
      ([request]) => request?.status,
    );

    expect(requestedStatuses.length).toBeGreaterThan(0);
    expect(requestedStatuses.every((status) => status === 'accepted')).toBe(true);
    expect(searchHistory.length).toBeGreaterThan(0);
    expect(searchHistory.every((search) => search.includes('tab=accepted'))).toBe(
      true,
    );
  });

  test('selecting Accepted filter writes tab=accepted and does not bounce back', async () => {
    const searchHistory = [];

    renderApplicationsPage({
      initialEntry: '/hirer/applications',
      onSearchChange: (search) => {
        searchHistory.push(search);
      },
    });

    const acceptedFilterChip = await screen.findByRole('button', {
      name: /accepted \(1\)/i,
    });

    fireEvent.click(acceptedFilterChip);

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toContain('tab=accepted');
    });

    const requestedStatuses = mockGetApplicationsSummary.mock.calls.map(
      ([request]) => request?.status,
    );

    await waitFor(() => {
      expect(requestedStatuses).toContain('accepted');
    });

    const firstAcceptedIndex = requestedStatuses.indexOf('accepted');
    expect(firstAcceptedIndex).toBeGreaterThan(-1);
    expect(
      requestedStatuses
        .slice(firstAcceptedIndex)
        .every((status) => status === 'accepted'),
    ).toBe(true);

    const firstAcceptedSearchIndex = searchHistory.findIndex((search) =>
      search.includes('tab=accepted'),
    );

    expect(firstAcceptedSearchIndex).toBeGreaterThan(-1);
    expect(
      searchHistory
        .slice(firstAcceptedSearchIndex)
        .every((search) => search.includes('tab=accepted')),
    ).toBe(true);
  });

  test('uses routed job title for scoped applicants view when payload title is missing', async () => {
    mockGetJobApplications.mockResolvedValue([
      {
        id: 'app-scoped-1',
        jobId: 'job-1',
        workerId: 'worker-scoped-1',
        workerName: 'Ama Scoped',
        status: 'pending',
        coverLetter: 'Available immediately.',
        createdAt: '2026-04-15T08:00:00.000Z',
        proposedRate: 210,
      },
    ]);

    renderApplicationsPage({
      initialEntry: {
        pathname: '/hirer/jobs/job-1/applicants',
        state: {
          jobTitle: 'Epoxy Floor Coating - Factory Floor',
        },
      },
      routePath: '/hirer/jobs/:jobId/applicants',
    });

    await waitFor(() => {
      expect(mockGetJobApplications).toHaveBeenCalledWith('job-1');
    });

    expect(
      await screen.findByText(/Reviewing: Epoxy Floor Coating - Factory Floor/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Unknown Job/i),
    ).not.toBeInTheDocument();
  });
});
