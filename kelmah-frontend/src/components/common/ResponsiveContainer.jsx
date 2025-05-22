import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

const ResponsiveContainer = ({ children, maxWidth = 'lg', padding = 3 }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: theme.breakpoints.values[maxWidth],
                margin: '0 auto',
                padding: isMobile ? 2 : padding,
                boxSizing: 'border-box'
            }}
        >
            {children}
        </Box>
    );
};

export default ResponsiveContainer; 