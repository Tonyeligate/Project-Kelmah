import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import RecentActivityFeed from './RecentActivityFeed';

jest.mock('../../../utils/formatters', () => ({
  formatRelativeTime: jest.fn(() => 'relative-time'),
}));

const renderFeed = (props) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <RecentActivityFeed {...props} />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('RecentActivityFeed', () => {
  test('renders application events from a flat applications array', () => {
    renderFeed({
      jobs: [],
      applications: [
        {
          id: 'app-1',
          workerName: 'Ama',
          jobTitle: 'Pipe repair',
          createdAt: '2026-03-10T10:00:00.000Z',
        },
      ],
    });

    expect(screen.getByText('Ama applied for "Pipe repair"')).toBeInTheDocument();
    expect(screen.getByText('relative-time')).toBeInTheDocument();
  });

  test('renders keyed application-record objects using record-level fallbacks', () => {
    renderFeed({
      jobs: [],
      applications: {
        'job-77': {
          jobTitle: 'Kitchen cabinet install',
          applications: [
            {
              _id: 'app-2',
              applicantName: 'Kojo',
              appliedAt: '2026-03-10T11:00:00.000Z',
            },
          ],
        },
      },
    });

    expect(screen.getByText('Kojo applied for "Kitchen cabinet install"')).toBeInTheDocument();
  });
});