/* eslint-env jest */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import SmartJobRecommendations from './SmartJobRecommendations';
import searchService from '../services/smartSearchService';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: jest.fn(),
  }),
}));

jest.mock('../services/smartSearchService', () => ({
  __esModule: true,
  default: {
    getSmartJobRecommendations: jest.fn(),
    trackJobInteraction: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../jobs/hooks/useJobsQuery', () => ({
  useSavedJobsQuery: jest.fn(() => ({ data: [], isLoading: false })),
  useSavedJobIds: jest.fn(() => new Set()),
  useSaveJobMutation: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useUnsaveJobMutation: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

describe('SmartJobRecommendations regressions', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    useSelector.mockImplementation((selector) =>
      selector({
        auth: {
          user: {
            id: 'worker-1',
            role: 'worker',
          },
          isAuthenticated: true,
        },
      }),
    );
    searchService.getSmartJobRecommendations.mockResolvedValue({
      jobs: [
        {
          id: 'job-1',
          title: 'Commercial Wiring',
          description: 'Install conduits and lighting circuits.',
          budget: 950,
          currency: 'GHS',
          location: 'Accra',
          matchScore: 88,
          employer: {
            name: 'Kelmah Hire',
            verified: true,
          },
        },
      ],
      insights: { summary: 'Matched to verified electrical work skills.' },
      recommendationSource: 'worker-profile',
    });
  });

  test('routes the primary recommendations CTA to the live jobs page', async () => {
    render(<SmartJobRecommendations maxRecommendations={1} />);

    const button = await screen.findByRole('button', {
      name: /view all recommendations/i,
    });

    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });
});