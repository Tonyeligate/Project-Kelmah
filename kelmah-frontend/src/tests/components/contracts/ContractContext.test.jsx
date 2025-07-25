import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ContractProvider, useContracts } from '../../../modules/contracts/contexts/ContractContext';
import { NotificationProvider } from '../../../modules/notifications/contexts/NotificationContext';
import { AuthProvider } from '../../../modules/auth/contexts/AuthContext';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock USE_MOCK_DATA to true
jest.mock('../../../config/env', () => ({
  USE_MOCK_DATA: true,
}));

const mockStore = configureStore({
  reducer: { auth: (state = { isAuthenticated: true, user: { id: 'user1' }, token: null, loading: false, error: null }) => state }
});

test('ContractProvider supplies mock contracts when USE_MOCK_DATA is true', async () => {
  // Use fake timers to control setTimeout
  jest.useFakeTimers();

  const TestComponent = () => {
    const { contracts, loading } = useContracts();
    return (
      <div>
        {loading && <div>Loading...</div>}
        {!loading && (
          <ul>
            {contracts.map(c => (
              <li key={c.id}>{c.title}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  render(
    <Provider store={mockStore}>
      <NotificationProvider>
        <ContractProvider>
          <TestComponent />
        </ContractProvider>
      </NotificationProvider>
    </Provider>
  );

  // Initially loading
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Advance timers to simulate mock data delay
  jest.advanceTimersByTime(500);

  // Wait for loading to finish and mock contracts to render
  await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
  expect(screen.getByText('Complete Kitchen Remodel')).toBeInTheDocument();
  expect(screen.getByText('New Website Design')).toBeInTheDocument();

  jest.useRealTimers();
});