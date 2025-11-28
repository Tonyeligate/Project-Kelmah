import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    Breadcrumbs,
    Link,
    Button,
    IconButton,
    Tooltip,
    Skeleton,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
    Home as HomeIcon,
    NavigateNext as NavigateNextIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

/**
 * Reusable PageHeader component for consistent page layouts
 * Provides breadcrumbs, title, subtitle, and action buttons
 */
const PageHeader = ({
    title,
    subtitle,
    breadcrumbs = [],
    primaryAction,
    secondaryAction,
    onRefresh,
    isRefreshing = false,
    loading = false,
    children, // Additional content to render in header
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (loading) {
        return (
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width={200} height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
                {subtitle && <Skeleton variant="text" width={250} height={20} />}
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 3 }}>
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
                    sx={{ mb: 1.5 }}
                    aria-label="breadcrumb navigation"
                >
                    <Link
                        component={RouterLink}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.secondary',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            '&:hover': { color: 'primary.main' },
                        }}
                    >
                        <HomeIcon sx={{ fontSize: 18, mr: 0.5 }} />
                        Home
                    </Link>
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;

                        if (isLast) {
                            return (
                                <Typography
                                    key={crumb.label}
                                    sx={{
                                        color: 'text.primary',
                                        fontWeight: 500,
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    {crumb.label}
                                </Typography>
                            );
                        }

                        return (
                            <Link
                                key={crumb.label}
                                component={RouterLink}
                                to={crumb.path}
                                sx={{
                                    color: 'text.secondary',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    '&:hover': { color: 'primary.main' },
                                }}
                            >
                                {crumb.label}
                            </Link>
                        );
                    })}
                </Breadcrumbs>
            )}

            {/* Title Row */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                }}
            >
                {/* Title & Subtitle */}
                <Box sx={{ flex: 1 }}>
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'text.secondary',
                                mt: 0.5,
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {/* Actions */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'center',
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                    }}
                >
                    {/* Refresh Button */}
                    {onRefresh && (
                        <Tooltip title="Refresh" arrow>
                            <IconButton
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': { color: 'primary.main' },
                                }}
                                aria-label="Refresh data"
                            >
                                <RefreshIcon
                                    sx={{
                                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                                        '@keyframes spin': {
                                            '0%': { transform: 'rotate(0deg)' },
                                            '100%': { transform: 'rotate(360deg)' },
                                        },
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Secondary Action */}
                    {secondaryAction && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={secondaryAction.onClick}
                            startIcon={secondaryAction.icon}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 500,
                            }}
                        >
                            {isMobile ? secondaryAction.shortLabel || secondaryAction.label : secondaryAction.label}
                        </Button>
                    )}

                    {/* Primary Action */}
                    {primaryAction && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={primaryAction.onClick}
                            startIcon={primaryAction.icon}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                boxShadow: 2,
                                '&:hover': {
                                    boxShadow: 4,
                                },
                            }}
                        >
                            {isMobile ? primaryAction.shortLabel || primaryAction.label : primaryAction.label}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Additional children content */}
            {children}
        </Box>
    );
};

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    breadcrumbs: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            path: PropTypes.string,
        })
    ),
    primaryAction: PropTypes.shape({
        label: PropTypes.string.isRequired,
        shortLabel: PropTypes.string,
        icon: PropTypes.node,
        onClick: PropTypes.func.isRequired,
    }),
    secondaryAction: PropTypes.shape({
        label: PropTypes.string.isRequired,
        shortLabel: PropTypes.string,
        icon: PropTypes.node,
        onClick: PropTypes.func.isRequired,
    }),
    onRefresh: PropTypes.func,
    isRefreshing: PropTypes.bool,
    loading: PropTypes.bool,
    children: PropTypes.node,
};

export default PageHeader;
