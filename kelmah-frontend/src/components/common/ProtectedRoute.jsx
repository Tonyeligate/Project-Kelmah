import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import { selectIsAuthenticated, selectAuthLoading } from '../../store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute component
 * Wraps routes that require authentication
 * Redirects to login if not authenticated
 * Compatible with both Redux state and AuthContext
 */
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
    // Get auth state from Redux
    const isAuthenticatedRedux = useSelector(selectIsAuthenticated);
    const loadingRedux = useSelector(selectAuthLoading);
    
    // Also support AuthContext for backward compatibility
    const { isAuthenticated, loading: loadingContext, user } = useAuth();
    
    // Determine auth state (prefer Redux over context)
    const isUserAuthenticated = isAuthenticatedRedux || isAuthenticated();
    const isLoading = loadingRedux || loadingContext;
    
    const location = useLocation();

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress color="secondary" />
            </Box>
        );
    }

    if (!isUserAuthenticated) {
        // Redirect to login page with the return url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check for role-based access if roles are specified
    if (requiredRoles.length > 0) {
        const userRole = user?.role;
        if (!userRole || !requiredRoles.includes(userRole)) {
            return <Navigate to="/unauthorized" state={{ from: location }} replace />;
        }
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    requiredRoles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;