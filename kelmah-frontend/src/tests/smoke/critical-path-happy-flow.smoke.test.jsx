/* eslint-env jest */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

jest.mock('../../modules/layout/components/Layout', () => {
  const React = require('react');
  const { Outlet } = require('react-router-dom');
  return {
    __esModule: true,
    default: () => <Outlet />,
  };
});

jest.mock('../../modules/auth/components/common/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('../../modules/common/components/loading/LoadingScreen', () => () => (
  <div>LOADING_SCREEN</div>
));

jest.mock('../../modules/common/components/RouteErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('../../modules/payment/contexts/PaymentContext', () => ({
  PaymentProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../../modules/contracts/contexts/ContractContext', () => ({
  ContractProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../../modules/auth/pages/LoginPage', () => ({
  __esModule: true,
  default: () => <div>LOGIN_PAGE</div>,
}));

jest.mock('../../modules/search/pages/SearchPage', () => ({
  __esModule: true,
  default: () => <div>SEARCH_PAGE</div>,
}));

jest.mock('../../modules/quickjobs/pages/QuickJobRequestPage', () => ({
  __esModule: true,
  default: () => <div>QUICKJOB_REQUEST_PAGE</div>,
}));

jest.mock('../../modules/contracts/pages/ContractsPage', () => ({
  __esModule: true,
  default: () => <div>CONTRACTS_PAGE</div>,
}));

jest.mock('../../modules/payment/pages/WalletPage', () => ({
  __esModule: true,
  default: () => <div>WALLET_PAGE</div>,
}));

jest.mock('../../modules/common/pages/NotFoundPage', () => ({
  __esModule: true,
  default: () => <div>NOT_FOUND_PAGE</div>,
}));

import { AppRoutes } from '../../routes/config';

const buildStore = (role = null) =>
  configureStore({
    reducer: {
      auth: () => ({
        user: role ? { role } : null,
        isAuthenticated: Boolean(role),
      }),
    },
  });

const renderAtPath = (path, role = null) =>
  render(
    <Provider store={buildStore(role)}>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter
          initialEntries={[path]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );

describe('critical-path route smoke suite', () => {
  test('auth entry route resolves: /login', async () => {
    renderAtPath('/login');
    expect(await screen.findByText('LOGIN_PAGE')).toBeInTheDocument();
  });

  test('search route resolves: /search', async () => {
    renderAtPath('/search');
    expect(await screen.findByText('SEARCH_PAGE')).toBeInTheDocument();
  });

  test('quickjob request route resolves for hirer: /hirer/quick-hire/request', async () => {
    renderAtPath('/hirer/quick-hire/request', 'hirer');
    expect(await screen.findByText('QUICKJOB_REQUEST_PAGE')).toBeInTheDocument();
  });

  test('contracts route resolves for hirer: /contracts', async () => {
    renderAtPath('/contracts', 'hirer');
    expect(await screen.findByText('CONTRACTS_PAGE')).toBeInTheDocument();
  });

  test('wallet route resolves for hirer: /wallet', async () => {
    renderAtPath('/wallet', 'hirer');
    expect(await screen.findByText('WALLET_PAGE')).toBeInTheDocument();
  });
});
