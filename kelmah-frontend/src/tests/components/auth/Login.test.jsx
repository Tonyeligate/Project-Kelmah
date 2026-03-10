/* eslint-env jest */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Login from '../../../modules/auth/components/login/Login';
import { checkApiHealth } from '../../../modules/common/utils/apiUtils';

jest.mock('../../../modules/auth/services/authSlice', () => ({
  clearError: () => ({ type: 'auth/clearError' }),
  login: jest.fn(() => ({ type: 'auth/login/mock' })),
}));

jest.mock('../../../modules/auth/components/mobile/MobileLogin', () => () => (
  <div data-testid="mobile-login-stub" />
));

jest.mock('../../../modules/common/utils/apiUtils', () => ({
  checkApiHealth: jest.fn(),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
  },
}));

const buildStore = (authOverrides = {}) =>
  configureStore({
    reducer: {
      auth: (
        state = {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
          ...authOverrides,
        },
        action,
      ) => {
        if (action.type === 'auth/clearError') {
          return { ...state, error: null };
        }

        return state;
      },
    },
  });

const renderLogin = (authOverrides = {}) => {
  const store = buildStore(authOverrides);

  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <MemoryRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Login />
          </MemoryRouter>
        </ThemeProvider>
      </Provider>,
    ),
  };
};

describe('Login component regressions', () => {
  beforeEach(() => {
    checkApiHealth.mockReset();
    checkApiHealth.mockResolvedValue({ success: true });
  });

  test('renders multiple active error messages instead of hiding later ones', async () => {
    checkApiHealth.mockRejectedValueOnce(new Error('gateway unavailable'));

    const { unmount } = renderLogin({ error: 'Authentication failed from Redux' });

    await waitFor(() => {
      expect(screen.getByText('Cannot connect to the server')).toBeInTheDocument();
      expect(screen.getByText('Authentication failed from Redux')).toBeInTheDocument();
    });

    unmount();
  });

  test('clears stale redux auth errors at submit start before showing validation errors', async () => {
    const { unmount } = renderLogin({ error: 'Stale auth error' });

    expect(screen.getByText('Stale auth error')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign in to kelmah/i }));

    await waitFor(() => {
      expect(screen.queryByText('Stale auth error')).not.toBeInTheDocument();
      expect(screen.getByText('Email address is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    unmount();
  });
});
