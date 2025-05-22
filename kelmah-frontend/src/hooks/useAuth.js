import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    logout, 
    selectCurrentUser, 
    selectIsAuthenticated, 
    selectAuthLoading, 
    selectAuthError,
    clearError
} from '../store/slices/authSlice';

export const useAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const user = useSelector(selectCurrentUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const loading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleClearError = () => {
        dispatch(clearError());
    };

    return {
        user,
        isAuthenticated,
        loading,
        error,
        logout: handleLogout,
        clearError: handleClearError
    };
}; 