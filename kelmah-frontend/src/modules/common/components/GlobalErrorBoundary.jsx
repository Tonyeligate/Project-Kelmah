import { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    Button,
    Stack,
    Chip,
    Divider,
    useTheme,
} from '@mui/material';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Link as RouterLink } from 'react-router-dom';
import {
    checkServiceHealth,
    getServiceStatusMessage,
} from '../../../utils/serviceHealthCheck';
import { BRAND_COLORS } from '../../../theme';

class GlobalErrorBoundaryInner extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            status: getServiceStatusMessage('aggregate'),
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('GlobalErrorBoundary caught an error:', error, info);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
            this.resetBoundary();
        }

        if (this.state.hasError && !prevState.hasError) {
            this.updateStatus();
        }
    }

    updateStatus = async () => {
        try {
            await checkServiceHealth('aggregate', 10000);
            this.setState({ status: getServiceStatusMessage('aggregate') });
        } catch (error) {
            console.warn('GlobalErrorBoundary status check failed:', error);
        }
    };

    resetBoundary = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    handleRetry = () => {
        this.resetBoundary();
    };

    handleHardReload = () => {
        window.location.reload();
    };

    renderFallback(theme) {
        const { status, error } = this.state;
        const statusChipPalette = {
            healthy: {
                label: 'Platform Operational',
                color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : '#2e7d32',
                bg:
                    theme.palette.mode === 'dark'
                        ? 'rgba(255,215,0,0.12)'
                        : 'rgba(46,125,50,0.12)',
            },
            cold: {
                label: 'Services Warming Up',
                color: '#ef6c00',
                bg: 'rgba(255,152,0,0.15)',
            },
            error: {
                label: 'Service Disruption',
                color: '#c62828',
                bg: 'rgba(244,67,54,0.12)',
            },
            checking: {
                label: 'Checking Status…',
                color: '#0288d1',
                bg: 'rgba(3,169,244,0.12)',
            },
            unknown: {
                label: 'Status Unknown',
                color: theme.palette.text.primary,
                bg: 'rgba(158,158,158,0.2)',
            },
        };

        const chipConfig =
            statusChipPalette[status.status] || statusChipPalette.unknown;

        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    py: 6,
                    backgroundColor:
                        theme.palette.mode === 'dark'
                            ? BRAND_COLORS.blackDark
                            : theme.palette.grey[50],
                }}
            >
                <Box
                    sx={{
                        maxWidth: 640,
                        width: '100%',
                        backgroundColor:
                            theme.palette.mode === 'dark'
                                ? BRAND_COLORS.blackMedium
                                : theme.palette.common.white,
                        borderRadius: 4,
                        p: { xs: 3, md: 5 },
                        boxShadow:
                            theme.palette.mode === 'dark'
                                ? '0 25px 60px rgba(0,0,0,0.8)'
                                : '0 25px 60px rgba(0,0,0,0.12)',
                        border:
                            theme.palette.mode === 'dark'
                                ? '1px solid rgba(255,215,0,0.25)'
                                : '1px solid rgba(0,0,0,0.08)',
                    }}
                >
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <WarningAmberIcon
                                sx={{
                                    fontSize: 40,
                                    color:
                                        theme.palette.mode === 'dark'
                                            ? BRAND_COLORS.gold
                                            : BRAND_COLORS.black,
                                }}
                            />
                            <Box>
                                <Typography variant="h4" fontWeight={800} gutterBottom>
                                    Something went wrong
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Our team has been notified. You can retry your last action,
                                    head back home, or contact support if this continues.
                                </Typography>
                            </Box>
                        </Stack>

                        <Chip
                            icon={<SupportAgentIcon />}
                            label={`${chipConfig.label} · ${status.message}`}
                            sx={{
                                width: 'fit-content',
                                backgroundColor: chipConfig.bg,
                                color: chipConfig.color,
                                fontWeight: 600,
                            }}
                        />

                        {error && (
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor:
                                        theme.palette.mode === 'dark'
                                            ? 'rgba(0,0,0,0.4)'
                                            : theme.palette.grey[100],
                                    fontFamily: 'JetBrains Mono, SFMono-Regular, monospace',
                                    fontSize: '0.85rem',
                                }}
                            >
                                {error.message || 'Unknown runtime error'}
                            </Box>
                        )}

                        <Divider />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<ReplayRoundedIcon />}
                                onClick={this.handleRetry}
                                fullWidth
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                component={RouterLink}
                                to="/"
                                startIcon={<HomeRoundedIcon />}
                                fullWidth
                            >
                                Go Home
                            </Button>
                        </Stack>

                        <Button
                            variant="text"
                            size="large"
                            onClick={this.handleHardReload}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            Reload Application
                        </Button>
                    </Stack>
                </Box>
            </Box>
        );
    }

    render() {
        const { hasError } = this.state;
        const theme = this.props.theme;

        if (hasError) {
            return this.renderFallback(theme);
        }

        return this.props.children;
    }
}

GlobalErrorBoundaryInner.propTypes = {
    children: PropTypes.node.isRequired,
    resetKey: PropTypes.string,
    onReset: PropTypes.func,
    theme: PropTypes.object.isRequired,
};

const GlobalErrorBoundary = (props) => {
    const theme = useTheme();
    return <GlobalErrorBoundaryInner {...props} theme={theme} />;
};

GlobalErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    resetKey: PropTypes.string,
    onReset: PropTypes.func,
};

export default GlobalErrorBoundary;
