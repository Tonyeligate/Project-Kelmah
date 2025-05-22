import React from 'react';
import { Paper, Box, Typography, IconButton } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

function StatsCard({ title, value, icon, color, tooltip }) {
    return (
        <Paper
            sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    transition: 'all 0.3s'
                }
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    right: -20,
                    top: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    backgroundColor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {React.cloneElement(icon, { sx: { fontSize: 40, color: color } })}
            </Box>

            <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                {title}
                {tooltip && (
                    <IconButton size="small" sx={{ ml: 1 }} title={tooltip}>
                        <InfoIcon fontSize="small" />
                    </IconButton>
                )}
            </Typography>

            <Typography variant="h4" component="div" sx={{ mt: 'auto', color: color }}>
                {value}
            </Typography>
        </Paper>
    );
}

export default StatsCard; 