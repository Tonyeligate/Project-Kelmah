import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RegisterPage from './RegisterPage';

const mockUseBreakpointDown = jest.fn();

jest.mock('../components/register/Register', () => () => (
  <div data-testid="desktop-register">Desktop Register</div>
));

jest.mock('../components/mobile/MobileRegister', () => () => (
  <div data-testid="mobile-register">Mobile Register</div>
));

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }) => <>{children}</>,
}));

jest.mock('@/hooks/useResponsive', () => ({
  useBreakpointDown: (...args) => mockUseBreakpointDown(...args),
}));

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <RegisterPage />
    </ThemeProvider>,
  );

describe('RegisterPage', () => {
  beforeEach(() => {
    mockUseBreakpointDown.mockReset();
  });

  test('renders the mobile register flow on small screens', () => {
    mockUseBreakpointDown.mockReturnValue(true);

    renderPage();

    expect(screen.getByTestId('mobile-register')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-register')).not.toBeInTheDocument();
  });

  test('renders the desktop register flow on larger screens', () => {
    mockUseBreakpointDown.mockReturnValue(false);

    renderPage();

    expect(screen.getByTestId('desktop-register')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-register')).not.toBeInTheDocument();
  });
});