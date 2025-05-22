import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loading = () => (
    <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
    >
        <CircularProgress />
    </Box>
);

export const lazyLoad = (importFunc) => {
    const LazyComponent = React.lazy(importFunc);

    return props => (
        <Suspense fallback={<Loading />}>
            <LazyComponent {...props} />
        </Suspense>
    );
}; 