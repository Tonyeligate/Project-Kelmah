/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import useAuth from '../../auth/hooks/useAuth';
import Login from '../Login';
import { thunk } from 'redux-thunk';

// Mock Redux store
const mockStore = configureStore([thunk]);

// Mock the useAuth hook
jest.mock('../../auth/hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// Mock child components to isolate the Login component
jest.mock(
  '../../common/components/auth/AuthLayout',
  () =>
    ({ children }) =>
      (
        <div>
          AuthLayout {children}
        </div>
      ),
);
jest.mock(
  '../../common/components/ui/AuthCard',
  () =>
    ({ children, title }) =>
      (
        <div>
          <h1>
            {title}
          </h1>
          {children}
        </div>
      ),
);

describe('Login Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        loading: false,
        error: null,
        isAuthenticated: false,
        user: null,
      },
    });

    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
      error: null,
      isAdmin: false,
    });
    store.clearActions();
    mockedNavigate.mockClear();
  });

  test('renders login form correctly', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
            <Login />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /login/i }),
    ).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  test('shows validation error for invalid email', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const loginMock = jest
      .fn()
      .mockResolvedValue({ success: true, user: { role: 'user' } });
    useAuth.mockReturnValue({
      login: loginMock,
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('handles login failure', async () => {
    const error = 'Invalid credentials';
    const loginMock = jest.fn().mockRejectedValue(new Error(error));
    useAuth.mockReturnValue({
      login: loginMock,
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  test('redirects to dashboard on successful login', async () => {
    useAuth.mockReturnValue({
      login: jest.fn().mockResolvedValue({ user: { role: 'user' } }),
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<div>
              Dashboard
            </div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('navigates to forgot password page', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.click(screen.getByText(/forgot password/i));
    expect(mockedNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  test('navigates to register page', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>,
    );

    fireEvent.click(screen.getByText(/sign up/i));
    expect(mockedNavigate).toHaveBeenCalledWith('/register');
  });
});






