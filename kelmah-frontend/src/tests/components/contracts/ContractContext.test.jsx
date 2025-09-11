/* eslint-env jest */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ContractProvider, useContracts } from '../../../modules/contracts/contexts/ContractContext';

// Mock Redux useSelector
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

import { useSelector } from 'react-redux';

global.jest = require('jest-mock');

// Mock child components that use the context
const MockConsumer = () => {
  const { contracts, loading, error } = useContracts();
  if (loading) return <div>
    Loading...
  </div>;
  if (error) return <div>
    {error}
  </div>;
  return (
    <div>
      {contracts.map((c) => (
        <div key={c.id}>
          {c.title}
        </div>
      ))}
    </div>
  );
};

describe('ContractContext', () => {
  // Mock the API service
  const mockContractService = {
    getContracts: jest.fn(),
  };

  beforeEach(() => {
    useSelector.mockReturnValue({ id: 1, email: 'test@example.com' });
  });

  test('provides contracts to children', async () => {
    const mockContracts = [{ id: '1', title: 'Test Contract' }];
    mockContractService.getContracts.mockResolvedValue(mockContracts);

    render(
      <ContractProvider contractService={mockContractService}>
        <MockConsumer />
      </ContractProvider>
    );

    // Check that contracts are displayed
    await waitFor(() => {
      expect(screen.getByText('Test Contract')).toBeInTheDocument();
    });

    expect(mockContractService.getContracts).toHaveBeenCalledTimes(1);
  });

  test('handles loading state', async () => {
    mockContractService.getContracts.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <AuthProvider>
        <ContractProvider contractService={mockContractService}>
          <MockConsumer />
        </ContractProvider>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    const errorMessage = 'Failed to fetch contracts';
    mockContractService.getContracts.mockRejectedValue(new Error(errorMessage));

    render(
      <AuthProvider>
        <ContractProvider contractService={mockContractService}>
          <MockConsumer />
        </ContractProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
