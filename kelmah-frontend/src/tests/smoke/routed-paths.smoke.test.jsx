/* eslint-env jest */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
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

jest.mock('../../modules/jobs/pages/JobsPage', () => ({
  __esModule: true,
  default: () => <div>JOBS_PAGE</div>,
}));

jest.mock('../../modules/hirer/pages/HirerDashboardPage', () => ({
  __esModule: true,
  default: () => <div>HIRER_DASHBOARD_PAGE</div>,
}));

jest.mock('../../modules/worker/pages/WorkerDashboardPage', () => ({
  __esModule: true,
  default: () => <div>WORKER_DASHBOARD_PAGE</div>,
}));

jest.mock('../../modules/messaging/pages/MessagingPage', () => ({
  __esModule: true,
  default: () => <div>MESSAGES_PAGE</div>,
}));

jest.mock('../../modules/hirer/pages/HirerProfilePage', () => ({
  __esModule: true,
  default: () => <div>HIRER_PROFILE_PAGE</div>,
}));

jest.mock('../../modules/worker/components/WorkerProfile', () => ({
  __esModule: true,
  default: () => <div>WORKER_PROFILE_PAGE</div>,
}));

jest.mock('../../modules/settings/pages/SettingsPage', () => ({
  __esModule: true,
  default: () => <div>SETTINGS_PAGE</div>,
}));

jest.mock('../../modules/notifications/contexts/NotificationContext', () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));

jest.mock('../../hooks/useKeyboardVisible', () => ({
  __esModule: true,
  default: () => ({ isKeyboardVisible: false }),
}));

jest.mock('../../modules/common/pages/NotFoundPage', () => ({
  __esModule: true,
  default: () => <div>NOT_FOUND_PAGE</div>,
}));

import { AppRoutes } from '../../routes/config';
import MobileBottomNav from '../../modules/layout/components/MobileBottomNav';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
};

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

const renderBottomNavAtPath = (path, role = 'worker') =>
  render(
    <Provider store={buildStore(role)}>
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter
          initialEntries={[path]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <MobileBottomNav />
          <LocationProbe />
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

  test('legacy route redirects to jobs page: /search/jobs', async () => {
    renderAtPath('/search/jobs');
    expect(await screen.findByText('JOBS_PAGE')).toBeInTheDocument();
  });

  test('legacy chat alias resolves to messages page: /chat', async () => {
    renderAtPath('/chat', 'worker');
    expect(await screen.findByText('MESSAGES_PAGE')).toBeInTheDocument();
  });

  test('legacy message thread alias resolves to messages page: /messages/:conversationId', async () => {
    renderAtPath('/messages/convo-123', 'worker');
    expect(await screen.findByText('MESSAGES_PAGE')).toBeInTheDocument();
  });

  test('role root redirects: /hirer resolves to hirer dashboard', async () => {
    renderAtPath('/hirer', 'hirer');
    expect(await screen.findByText('HIRER_DASHBOARD_PAGE')).toBeInTheDocument();
  });

  test('role root redirects: /worker resolves to worker dashboard', async () => {
    renderAtPath('/worker', 'worker');
    expect(await screen.findByText('WORKER_DASHBOARD_PAGE')).toBeInTheDocument();
  });

  test('profile alias resolves to hirer profile for hirer role', async () => {
    renderAtPath('/profile', 'hirer');
    expect(await screen.findByText('HIRER_PROFILE_PAGE')).toBeInTheDocument();
  });

  test('profile alias resolves to worker profile for worker role', async () => {
    renderAtPath('/profile', 'worker');
    expect(await screen.findByText('WORKER_PROFILE_PAGE')).toBeInTheDocument();
  });

  test('profile alias resolves to settings for admin role', async () => {
    renderAtPath('/profile', 'admin');
    expect(await screen.findByText('SETTINGS_PAGE')).toBeInTheDocument();
  });

  test('mobile bottom-nav does not incorrectly select Home on /wallet', () => {
    const { container } = renderBottomNavAtPath('/wallet', 'worker');
    const selectedActions = container.querySelectorAll(
      '.MuiBottomNavigationAction-root.Mui-selected',
    );
    expect(selectedActions).toHaveLength(0);
  });

  test('mobile bottom-nav does not incorrectly select Home on /contracts', () => {
    const { container } = renderBottomNavAtPath('/contracts', 'worker');
    const selectedActions = container.querySelectorAll(
      '.MuiBottomNavigationAction-root.Mui-selected',
    );
    expect(selectedActions).toHaveLength(0);
  });

  test('mobile bottom-nav shows productivity-first 5 tabs for hirer', () => {
    renderBottomNavAtPath('/hirer/dashboard', 'hirer');

    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Post Job')).toBeInTheDocument();
    expect(screen.getByLabelText('Find Talent')).toBeInTheDocument();
    expect(screen.getByLabelText('Applications')).toBeInTheDocument();
    expect(screen.getByLabelText('Messages')).toBeInTheDocument();
  });

  test('mobile bottom-nav shows productivity-first 5 tabs for worker', () => {
    renderBottomNavAtPath('/worker/dashboard', 'worker');

    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Find Work')).toBeInTheDocument();
    expect(screen.getByLabelText('Applications')).toBeInTheDocument();
    expect(screen.getByLabelText('Messages')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });

  test('mobile bottom-nav Home click routes hirer to /hirer/dashboard', async () => {
    renderBottomNavAtPath('/messages', 'hirer');

    fireEvent.click(screen.getByLabelText('Home'));

    await waitFor(() => {
      expect(screen.getByTestId('current-path')).toHaveTextContent('/hirer/dashboard');
    });
  });

  test('mobile bottom-nav Home click routes worker to /worker/dashboard', async () => {
    renderBottomNavAtPath('/messages', 'worker');

    fireEvent.click(screen.getByLabelText('Home'));

    await waitFor(() => {
      expect(screen.getByTestId('current-path')).toHaveTextContent('/worker/dashboard');
    });
  });
});
