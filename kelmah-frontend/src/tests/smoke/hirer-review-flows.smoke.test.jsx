import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

const mockDispatch = jest.fn();
let mockHirerState;

const mockCreateWorkerReview = jest.fn();
const mockGetCompletedWorkersForReview = jest.fn();
const mockPost = jest.fn();

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockHirerState),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('@/modules/hirer/services/hirerService', () => ({
  hirerService: {
    getCompletedWorkersForReview: (...args) => mockGetCompletedWorkersForReview(...args),
    createWorkerReview: (...args) => mockCreateWorkerReview(...args),
    releaseMilestonePayment: jest.fn(),
  },
}));

jest.mock('@/services/apiClient', () => ({
  api: {
    post: (...args) => mockPost(...args),
  },
}));

jest.mock('@/config/environment', () => ({
  API_ENDPOINTS: {
    USER: {},
    JOB: {},
  },
}));

const WorkerReview = require('@/modules/hirer/components/WorkerReview').default;
const JobProgressTracker = require('@/modules/hirer/components/JobProgressTracker').default;

const renderWithProviders = (ui) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('hirer review smoke flows', () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockCreateWorkerReview.mockReset();
    mockGetCompletedWorkersForReview.mockReset();
    mockPost.mockReset();
    mockHirerState = {
      hirer: {
        jobs: {
          open: [],
          completed: [],
        },
        loading: {
          jobs: false,
        },
      },
    };
  });

  test('createWorkerReview strips forged identifiers before posting', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });

    const actualModule = jest.requireActual('@/modules/hirer/services/hirerService');
    await actualModule.hirerService.createWorkerReview('worker-real', 'job-real', {
      workerId: 'worker-forged',
      jobId: 'job-forged',
      rating: 5,
      comment: 'Excellent work',
    });

    expect(mockPost).toHaveBeenCalledWith('/reviews', {
      rating: 5,
      comment: 'Excellent work',
      workerId: 'worker-real',
      jobId: 'job-real',
    });
  });

  test('WorkerReview submits the selected worker and job through the menu flow', async () => {
    mockGetCompletedWorkersForReview.mockResolvedValue([
      {
        id: 'worker-1',
        name: 'Ama Worker',
        avatar: '',
        overallRating: 4.7,
        skills: ['Plumbing'],
        location: 'Accra',
        completedJobs: [
          {
            id: 'job-1',
            title: 'Sink repair',
            amount: 250,
            duration: '2 days',
            completedDate: '2026-03-01T00:00:00.000Z',
          },
        ],
      },
    ]);
    mockCreateWorkerReview.mockResolvedValue({ success: true });

    renderWithProviders(<WorkerReview />);

    await screen.findByText('Sink repair');
    fireEvent.click(
      screen.getByRole('button', { name: /Open review actions for Ama Worker/i }),
    );
    fireEvent.click(await screen.findByText('Write Review'));
    fireEvent.click(screen.getByRole('button', { name: /^Submit Review$/i }));

    await waitFor(() => {
      expect(mockCreateWorkerReview).toHaveBeenCalledWith(
        'worker-1',
        'job-1',
        expect.objectContaining({ rating: 5, comment: '' }),
      );
    });
  });

  test('JobProgressTracker exposes the completed-job review entry point and submits the selected ids', async () => {
    mockHirerState = {
      hirer: {
        jobs: {
          open: [],
          completed: [
            {
              _id: 'job-2',
              title: 'Kitchen remodel',
              status: 'completed',
              worker: {
                _id: 'worker-2',
                name: 'Kojo Builder',
                avatar: '',
                rating: 4.8,
                completedJobs: 12,
              },
              budget: 1400,
              paidAmount: 1000,
              progress: 100,
              createdAt: '2026-02-20T00:00:00.000Z',
              dueDate: '2026-03-05T00:00:00.000Z',
              milestones: [],
              updates: [],
            },
          ],
        },
        loading: {
          jobs: false,
        },
      },
    };
    mockCreateWorkerReview.mockResolvedValue({ success: true });

    renderWithProviders(<JobProgressTracker />);

    fireEvent.click(screen.getByRole('button', { name: /Review Worker/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Submit Review$/i }));

    await waitFor(() => {
      expect(mockCreateWorkerReview).toHaveBeenCalledWith(
        'worker-2',
        'job-2',
        { rating: 5, comment: '' },
      );
    });
  });
});