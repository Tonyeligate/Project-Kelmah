import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import JobManagementPage from '@/modules/hirer/pages/JobManagementPage';
import { api } from '@/services/apiClient';
import * as responsiveHooks from '@/hooks/useResponsive';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockGet = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithProviders = (ui) =>
  render(
    <HelmetProvider>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {ui}
        </MemoryRouter>
      </ThemeProvider>
    </HelmetProvider>,
  );

describe('hirer review responses route and count consistency', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockDispatch.mockReset();
    mockGet.mockReset();
    jest.spyOn(responsiveHooks, 'useBreakpointDown').mockReturnValue(false);
    jest.spyOn(api, 'get').mockImplementation((...args) => mockGet(...args));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('routes each job to the correct review surface and keeps count labels aligned', async () => {
    mockGet.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              _id: 'job-app-1',
              id: 'job-app-1',
              title: 'Epoxy Floor Coating - Factory Floor',
              status: 'open',
              visibility: 'public',
              location: { city: 'Tema', region: 'Greater Accra' },
              budget: 1200,
              paymentType: 'fixed',
              createdAt: '2026-03-01T00:00:00.000Z',
              endDate: '2026-04-01T00:00:00.000Z',
              bidding: { bidStatus: 'open', currentBidders: 0, maxBidders: 5 },
              biddingEnabled: false,
              responseMode: 'applications',
              responseCount: 8,
              responseCounts: { applications: 8, bids: 0 },
            },
            {
              _id: 'job-bids-1',
              id: 'job-bids-1',
              title: 'Residential Plumbing Installation',
              status: 'open',
              visibility: 'public',
              location: { city: 'Accra', region: 'Greater Accra' },
              budget: 5000,
              paymentType: 'fixed',
              createdAt: '2026-03-03T00:00:00.000Z',
              endDate: '2026-04-03T00:00:00.000Z',
              bidding: { bidStatus: 'open', currentBidders: 0, maxBidders: 5 },
              biddingEnabled: true,
              responseMode: 'bids',
              responseCount: 7,
              responseCounts: { applications: 0, bids: 7 },
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        },
        meta: {
          countsByStatus: {
            open: 2,
            'in-progress': 0,
            completed: 0,
            cancelled: 0,
            draft: 0,
          },
        },
      },
    });

    renderWithProviders(<JobManagementPage />);

    const appJobTitle = await screen.findByText('Epoxy Floor Coating - Factory Floor');
    const bidJobTitle = await screen.findByText('Residential Plumbing Installation');

    const appRow = appJobTitle.closest('tr');
    const bidRow = bidJobTitle.closest('tr');

    expect(appRow).not.toBeNull();
    expect(bidRow).not.toBeNull();

    expect(appRow.textContent).toContain('8');

    expect(bidRow.textContent).toContain('7');

    const appReviewButton = within(appRow).getByRole('button', {
      name: /view applicants/i,
    });
    const bidReviewButton = within(bidRow).getByRole('button', {
      name: /review bids/i,
    });

    fireEvent.click(appReviewButton);

    fireEvent.click(bidReviewButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenNthCalledWith(
        1,
        '/hirer/jobs/job-app-1/applicants',
      );
      expect(mockNavigate).toHaveBeenNthCalledWith(
        2,
        '/hirer/jobs/job-bids-1/bids',
      );
    });
  });
});
