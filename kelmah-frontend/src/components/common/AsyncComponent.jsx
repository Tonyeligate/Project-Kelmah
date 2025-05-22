import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import ErrorBoundary from './ErrorBoundary';

const LoadingFallback = () => (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
    </Box>
);

function AsyncComponent({ children }) {
    return (
        <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}

export default AsyncComponent; 