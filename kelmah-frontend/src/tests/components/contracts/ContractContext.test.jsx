import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ContractProvider, useContracts } from '../../../modules/contracts/contexts/ContractContext';

// Mock USE_MOCK_DATA to true
jest.mock('../../../config/env', () => ({
  USE_MOCK_DATA: true,
}));

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
    <ContractProvider>
      <TestComponent />
    </ContractProvider>
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