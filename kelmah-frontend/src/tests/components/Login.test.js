import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../components/auth/Login';
import { AuthProvider } from '../../contexts/AuthContext';

const renderWithRouter = (ui) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                {ui}
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Login Component', () => {
    it('renders login form', () => {
        renderWithRouter(<Login />);
        
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('shows error with invalid email', async () => {
        renderWithRouter(<Login />);
        
        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.blur(emailInput);

        expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
        const mockLogin = jest.fn();
        renderWithRouter(<Login onLogin={mockLogin} />);
        
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' }
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'Password123!' }
        });
        
        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'test@example.com',
                    password: 'Password123!'
                })
            );
        });
    });
}); 