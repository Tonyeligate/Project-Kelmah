import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkerReviewsPage from '../modules/reviews/pages/WorkerReviewsPage';
import useAuth from '../modules/auth/hooks/useAuth';
import reviewService from '../modules/reviews/services/reviewService';

// Mock the authentication hook and review service
jest.mock('../modules/auth/hooks/useAuth');
jest.mock('../modules/reviews/services/reviewService');

describe('WorkerReviewsPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { id: 'user1' } });
  });

  test('shows header and review cards after loading', async () => {
    reviewService.getUserReviews.mockResolvedValue({
      reviews: [
        { _id: 'r1', rating: 5, comment: 'Great work!', reviewer: { firstName: 'John', lastName: 'Doe', profilePicture: '' }, createdAt: '2023-01-01', job: 'job1' },
        { _id: 'r2', rating: 4, comment: 'Good job!', reviewer: { firstName: 'Jane', lastName: 'Smith', profilePicture: '' }, createdAt: '2023-02-01', job: 'job2' }
      ],
      pagination: { page: 1, limit: 10, total: 15, pageCount: 2 }
    });

    render(
      <MemoryRouter>
        <WorkerReviewsPage />
      </MemoryRouter>
    );

    // Wait for header to appear
    expect(await screen.findByText('My Reviews')).toBeInTheDocument();
    // Check that comments are displayed
    expect(screen.getByText('Great work!')).toBeInTheDocument();
    expect(screen.getByText('Good job!')).toBeInTheDocument();
    // Check pagination buttons
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });

  test('fetches next page when pagination clicked', async () => {
    reviewService.getUserReviews.mockResolvedValue({ reviews: [], pagination: { page: 1, limit: 10, total: 15, pageCount: 2 } });

    render(
      <MemoryRouter>
        <WorkerReviewsPage />
      </MemoryRouter>
    );

    // Wait for initial fetch
    await waitFor(() => expect(reviewService.getUserReviews).toHaveBeenCalledWith('user1', 1, 10));

    // Click page 2
    fireEvent.click(screen.getByRole('button', { name: '2' }));

    // Should fetch page 2
    await waitFor(() => expect(reviewService.getUserReviews).toHaveBeenLastCalledWith('user1', 2, 10));
  });
}); 