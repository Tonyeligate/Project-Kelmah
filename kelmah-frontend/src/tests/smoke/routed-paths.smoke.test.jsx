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

// Route-level page markers used by this smoke suite.
jest.mock('../../modules/search/pages/SearchPage', () => ({
  __esModule: true,
  default: () => <div>PUBLIC_FIND_TALENTS_PAGE</div>,
}));

jest.mock('../../modules/worker/pages/MyApplicationsPage', () => ({
  __esModule: true,
  default: () => <div>WORKER_APPLICATIONS_PAGE</div>,
}));

jest.mock('../../modules/quickjobs/pages/QuickJobRequestPage', () => ({
  __esModule: true,
  default: () => <div>HIRER_QUICK_HIRE_PAGE</div>,
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

describe('routed path smoke suite', () => {
  test('public route resolves: /find-talents', async () => {
    renderAtPath('/find-talents');
    expect(await screen.findByText('PUBLIC_FIND_TALENTS_PAGE')).toBeInTheDocument();
  });

  test('worker route resolves: /worker/applications', async () => {
    renderAtPath('/worker/applications', 'worker');
    expect(await screen.findByText('WORKER_APPLICATIONS_PAGE')).toBeInTheDocument();
  });

  test('hirer route resolves: /hirer/quick-hire', async () => {
    renderAtPath('/hirer/quick-hire', 'hirer');
    expect(await screen.findByText('HIRER_QUICK_HIRE_PAGE')).toBeInTheDocument();
  });

  test('invalid legacy route falls through to not found: /search/jobs', async () => {
    renderAtPath('/search/jobs');
    expect(await screen.findByText('NOT_FOUND_PAGE')).toBeInTheDocument();
  });
});
