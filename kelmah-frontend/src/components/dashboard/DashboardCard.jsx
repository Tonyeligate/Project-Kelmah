import React from 'react';
import { Paper, Box, Typography, IconButton, Tooltip, Divider, alpha } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: 12,
    background: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
    '&:hover': {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
        borderColor: alpha(theme.palette.primary.main, 0.2),
    },
}));

const CardHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
}));

const CardTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    color: theme.palette.text.primary,
    fontSize: '1.1rem',
}));

const ActionContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(0.5),
}));

export function DashboardCard({ 
    title, 
    action, 
    children, 
    onRefresh,
    elevation = 0,
    height,
    sx = {} 
}) {
    return (
        <StyledPaper
            elevation={elevation}
            sx={{
                height: height || 'auto',
                ...sx
            }}
        >
            {title && (
                <>
                    <CardHeader>
                        <CardTitle variant="h6">{title}</CardTitle>
                        <ActionContainer>
                            {onRefresh && (
                                <Tooltip title="Refresh" arrow>
                                    <IconButton size="small" onClick={onRefresh} 
                                        sx={{ 
                                            color: theme => theme.palette.text.secondary,
                                            '&:hover': {
                                                backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
                                                color: theme => theme.palette.primary.main,
                                            }
                                        }}
                                    >
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {action}
                        </ActionContainer>
                    </CardHeader>
                    <Divider sx={{ mb: 2, opacity: 0.7 }} />
                </>
            )}
            <Box sx={{ height: title ? 'calc(100% - 48px)' : '100%' }}>
                {children}
            </Box>
        </StyledPaper>
    );
}

export default DashboardCard; 