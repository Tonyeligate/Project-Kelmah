import React from 'react';
import { Grid, useTheme, useMediaQuery } from '@mui/material';

const ResponsiveGrid = ({ items, renderItem, spacing = 2 }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const getGridSize = () => {
        if (isMobile) return 12;
        if (isTablet) return 6;
        return 4;
    };

    return (
        <Grid container spacing={spacing}>
            {items.map((item, index) => (
                <Grid item xs={12} sm={getGridSize()} key={index}>
                    {renderItem(item)}
                </Grid>
            ))}
        </Grid>
    );
};

export default ResponsiveGrid; 