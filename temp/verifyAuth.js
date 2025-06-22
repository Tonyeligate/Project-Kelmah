// Verify auth status thunk
export const verifyAuth = createAsyncThunk(
    'auth/verify',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Verifying auth status...');
            
            // In development mode, always use mock authentication
            if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
                console.log('Development mode: Using mock authentication');
                const storedUser = localStorage.getItem('user');
                
                // If there's already user data in localStorage, use it
                if (storedUser) {
                    console.log('Using stored user data in dev mode');
                    return {
                        user: JSON.parse(storedUser),
                        isAuthenticated: true
                    };
                }
                
                // Otherwise, use the mock data from authService
                console.log('No stored user, using default dev user');
                const mockUser = await authService.getCurrentUser();
                localStorage.setItem('user', JSON.stringify(mockUser));
                localStorage.setItem(TOKEN_KEY, 'dev-mode-fake-token-12345');
                
                return {
                    user: mockUser,
                    isAuthenticated: true
                };
            }
            
            // Production mode auth verification logic
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                console.warn('No token found in localStorage');
                throw new Error('No authentication token found');
            }
            
            // Check if there's user data in localStorage
            const storedUser = localStorage.getItem('user');
            console.log('Currently stored user:', storedUser ? JSON.parse(storedUser) : 'none');
            
            try {
                const response = await authService.getCurrentUser();
                console.log('User profile data received:', response);
                
                if (response) {
                    // Update stored user data with fresh data from API
                    localStorage.setItem('user', JSON.stringify(response));
                    
                    return {
                        user: response,
                        isAuthenticated: true
                    };
                } 
            } catch (apiError) {
                console.warn('API unreachable, using stored user data:', apiError);
                // If API is unreachable but we have stored user data, use that
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    return {
                        user: userData,
                        isAuthenticated: true
                    };
                }
            }
            
            throw new Error('Could not verify authentication');
        } catch (error) {
            console.error('Auth verification failed:', error);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('user');
            return rejectWithValue(error.message || 'Authentication verification failed');
        }
    }
); 