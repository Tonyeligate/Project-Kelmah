import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import Register from '@/modules/auth/components/register/Register';
import MobileRegister from '@/modules/auth/components/mobile/MobileRegister';

const mockDispatch = jest.fn();
let mockAuthState = { loading: false, error: null };

const mockRegistrationValues = {
  role: 'hirer',
  firstName: 'Ama',
  lastName: 'Mensah',
  email: 'ama@example.com',
  phone: '024 123 4567',
  companyName: 'Ama Repairs Ltd',
  trades: [],
  experienceYears: undefined,
  password: 'StrongPass1!',
  confirmPassword: 'StrongPass1!',
  acceptTerms: true,
};

const mockUseRegistrationForm = jest.fn();

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector({ auth: mockAuthState }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ search: '', state: null }),
}));

jest.mock('@/modules/auth/hooks/useRegistrationForm', () => ({
  __esModule: true,
  default: () => mockUseRegistrationForm(),
}));

jest.mock('@/modules/auth/services/authSlice', () => ({
  register: (payload) => ({ type: 'auth/register', payload }),
  selectAuthLoading: (state) => state.auth.loading,
  selectAuthError: (state) => state.auth.error,
}));

jest.mock('@/modules/auth/utils/registrationDraftStorage', () => ({
  saveRegistrationDraft: jest.fn(),
  clearRegistrationDraft: jest.fn(),
}));

const renderWithProviders = (ui) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('registration smoke flows', () => {
  beforeEach(() => {
    mockAuthState = { loading: false, error: null };
    mockDispatch.mockReset();
    mockUseRegistrationForm.mockReturnValue({
      control: {},
      register: () => ({ onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() }),
      handleSubmit: (callback) => () => callback(mockRegistrationValues),
      trigger: jest.fn().mockResolvedValue(true),
      watch: (field) => mockRegistrationValues[field],
      setValue: jest.fn(),
      getValues: (field) => (field ? mockRegistrationValues[field] : mockRegistrationValues),
      formState: { errors: {} },
      draftLoaded: false,
      clearDraft: jest.fn(),
      passwordStrength: { score: 5, label: 'Strong' },
    });
  });

  test('desktop registration surfaces duplicate-email backend message', async () => {
    mockDispatch.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue('Email already in use'),
    });

    renderWithProviders(<Register />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^Create account$/i }),
      ).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Create account$/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  test('mobile registration surfaces duplicate-email backend message', async () => {
    mockDispatch.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue('Email already in use'),
    });

    renderWithProviders(<MobileRegister />);

    fireEvent.click(screen.getByText('Hire Workers'));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: 'Ama' },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Mensah' },
    });
    fireEvent.change(screen.getByLabelText(/^Email$/i), {
      target: { value: 'ama@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone \(Ghana\)/i), {
      target: { value: '024 123 4567' },
    });
    fireEvent.change(screen.getByLabelText(/Company Name/i), {
      target: { value: 'Ama Repairs Ltd' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Continue$/i }));

    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'StrongPass1!' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /^Create Account$/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });
});