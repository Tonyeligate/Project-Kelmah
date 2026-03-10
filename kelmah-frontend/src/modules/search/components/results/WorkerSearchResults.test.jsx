import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import WorkerSearchResults from './WorkerSearchResults';

jest.mock('../../../worker/components/WorkerCard', () => () => (
  <div data-testid="worker-card" />
));

const renderWithProviders = (ui) => {
  const store = configureStore({
    reducer: {
      auth: () => ({ isAuthenticated: false }),
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
};

describe('WorkerSearchResults', () => {
  test('disables sort changes while results are loading', () => {
    renderWithProviders(
      <WorkerSearchResults
        workers={[]}
        loading
        filters={{ sort: 'relevance' }}
        pagination={{ page: 1, totalPages: 0 }}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true');
  });

  test('limits the initial worker cards rendered on large result sets', () => {
    const workers = Array.from({ length: 13 }, (_, index) => ({
      id: `worker-${index + 1}`,
      name: `Worker ${index + 1}`,
    }));

    renderWithProviders(
      <WorkerSearchResults
        workers={workers}
        filters={{ sort: 'relevance' }}
        pagination={{ page: 1, totalPages: 1, total: 13 }}
      />,
    );

    expect(screen.getAllByTestId('worker-card')).toHaveLength(12);
    expect(screen.getByRole('button', { name: /show remaining 1 workers/i })).toBeInTheDocument();
  });
});