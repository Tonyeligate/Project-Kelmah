import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingStates = ({ loading, children }) => {
    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }
    return children;
};

export default LoadingStates; 