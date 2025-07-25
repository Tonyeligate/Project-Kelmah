import React from 'react';
React.useContext = () => ({});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Login from '../../../modules/auth/components/login/Login';
import authReducer, { login } from '../../../store/slices/authSlice';
import * as apiUtils from '../../../modules/common/utils/apiUtils';
import { useAuth } from '../../../modules/auth/contexts/AuthContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the APIs and slices
jest.mock('../../../modules/common/utils/apiUtils', () => ({
  checkApiHealth: jest.fn(() => Promise.resolve(true)),
  handleApiError: jest.fn(() => ({ message: 'Mock API error' })),
}));

// Mock the store to track dispatch calls
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        loading: false,
        error: null,
        user: null,
        ...initialState,
      },
    },
  });
};

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: { from: '/dashboard' } }),
}));

// Mock Material-UI components that use portal
jest.mock('@mui/material/Modal', () => {
  return ({ children, open }) => (open ? <div data-testid="modal">{children}</div> : null);
});

// Mock useAuth from AuthContext to provide a login function stub
jest.mock('../../../modules/auth/contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({ login: jest.fn().mockResolvedValue({ user: { id: 'mockUser' }, token: 'mockToken' }) }),
}));

describe.skip('Login Component', () => {
  let mockStore;
  
  beforeEach(() => {
    mockStore = createMockStore();
    // Reset mocks
    jest.clearAllMocks();
    apiUtils.checkApiHealth.mockResolvedValue(true);
  });
  
  const renderLoginComponent = (store = mockStore) => {
    return render(
      <Provider store={store}>
        <ThemeProvider theme={createTheme()}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
  };
  
  test('renders login form with required fields', async () => {
    renderLoginComponent();
    
    // Wait for API check to complete
    await waitFor(() => {
      expect(apiUtils.checkApiHealth).toHaveBeenCalled();
    });
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
  
  test('validates email and password fields', async () => {
    renderLoginComponent();
    
    // Get form fields
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit without filling fields
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // Enter invalid email
    const emailField = screen.getByLabelText(/email/i);
    fireEvent.change(emailField, { target: { name: 'email', value: 'invalid-email' } });
    
    // Submit with invalid email and missing password
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
  
  test('shows error when API is not reachable', async () => {
    // Mock API as unreachable
    apiUtils.checkApiHealth.mockRejectedValueOnce(new Error('API not reachable'));
    
    renderLoginComponent();
    
    // Wait for API check to fail
    await waitFor(() => {
      expect(apiUtils.checkApiHealth).toHaveBeenCalled();
      expect(screen.getByText(/cannot connect to the server/i)).toBeInTheDocument();
    });
  });
  
  test('handles successful login submission', async () => {
    // Create a store with a mock login action
    const loginMock = jest.fn().mockResolvedValue({ 
      user: { id: 'user123', email: 'test@example.com' },
      token: 'test-token'
    });
    
    mockStore = createMockStore();
    mockStore.dispatch = jest.fn().mockImplementation(() => ({
      unwrap: () => Promise.resolve({ user: { id: 'user123' } })
    }));
    
    renderLoginComponent(mockStore);
    
    // Fill in form fields
    const emailField = screen.getByLabelText(/email/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailField, { target: { name: 'email', value: 'test@example.com' } });
    fireEvent.change(passwordField, { target: { name: 'password', value: 'Password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check that dispatch was called
    await waitFor(() => {
      expect(mockStore.dispatch).toHaveBeenCalled();
    });
  });
  
  test('toggles password visibility', async () => {
    renderLoginComponent();
    
    // Get password field and toggle button
    const passwordField = screen.getByLabelText(/password/i);
    expect(passwordField).toHaveAttribute('type', 'password');
    
    // Find and click the visibility toggle button
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    fireEvent.click(toggleButton);
    
    // Check that password field type has changed
    expect(passwordField).toHaveAttribute('type', 'text');
    
    // Toggle back
    fireEvent.click(toggleButton);
    expect(passwordField).toHaveAttribute('type', 'password');
  });
  
  test('displays OAuth login options', async () => {
    renderLoginComponent();
    
    // Check for OAuth buttons
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /linkedin/i })).toBeInTheDocument();
  });
  
  test('handles MFA requirement', async () => {
    // Create a store that returns MFA requirement
    mockStore = createMockStore();
    mockStore.dispatch = jest.fn().mockImplementation(() => ({
      unwrap: () => Promise.resolve({ requireMFA: true })
    }));
    
    renderLoginComponent(mockStore);
    
    // Fill in form fields
    const emailField = screen.getByLabelText(/email/i);
    const passwordField = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailField, { target: { name: 'email', value: 'test@example.com' } });
    fireEvent.change(passwordField, { target: { name: 'password', value: 'Password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check that MFA form is shown
    await waitFor(() => {
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    });
  });
}); 