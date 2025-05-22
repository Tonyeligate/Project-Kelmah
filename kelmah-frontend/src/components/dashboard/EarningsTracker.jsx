import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    Divider,
    Stack,
    IconButton,
    Menu,
    MenuItem,
    useTheme,
    alpha
} from '@mui/material';
import {
    TrendingUp,
    AccountBalance,
    CalendarToday,
    MoreVert,
    KeyboardArrowUp,
    KeyboardArrowDown,
    AttachMoney
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

function EarningsTracker({
    currentEarnings = 0,
    targetEarnings = 1000,
    totalEarnings = 0,
    pendingPayments = 0,
    earningsHistory = [],
    period = 'Weekly'
}) {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedPeriod, setSelectedPeriod] = React.useState(period);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handlePeriodChange = (newPeriod) => {
        setSelectedPeriod(newPeriod);
        handleClose();
    };

    const progressPercentage = (currentEarnings / targetEarnings) * 100;
    const isOnTrack = progressPercentage >= (new Date().getDate() / 30) * 100;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
                <Typography variant="h6">
                    Earnings Overview
                </Typography>
                <Box>
                    <IconButton
                        size="small"
                        onClick={handleClick}
                        aria-label="select period"
                    >
                        <MoreVert />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        {PERIODS.map((p) => (
                            <MenuItem
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                selected={p === selectedPeriod}
                            >
                                {p}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Current Period Progress */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                sx={{ mb: 2 }}
                            >
                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Current {selectedPeriod} Earnings
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatCurrency(currentEarnings)}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: isOnTrack ?
                                        alpha(theme.palette.success.main, 0.1) :
                                        alpha(theme.palette.warning.main, 0.1),
                                    color: isOnTrack ?
                                        'success.main' :
                                        'warning.main'
                                }}>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        {isOnTrack ? (
                                            <KeyboardArrowUp fontSize="small" />
                                        ) : (
                                            <KeyboardArrowDown fontSize="small" />
                                        )}
                                        <Typography variant="body2">
                                            {isOnTrack ? 'On Track' : 'Below Target'}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>

                            <Box sx={{ mb: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progressPercentage}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4
                                        }
                                    }}
                                />
                            </Box>

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Target: {formatCurrency(targetEarnings)}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {progressPercentage.toFixed(1)}%
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Stats Cards */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                    }}
                                >
                                    <TrendingUp
                                        sx={{ color: 'primary.main' }}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Total Earnings
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(totalEarnings)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1,
                                        bgcolor: alpha(theme.palette.warning.main, 0.1)
                                    }}
                                >
                                    <AttachMoney
                                        sx={{ color: 'warning.main' }}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Pending Payments
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(pendingPayments)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 1,
                                        bgcolor: alpha(theme.palette.success.main, 0.1)
                                    }}
                                >
                                    <AccountBalance
                                        sx={{ color: 'success.main' }}
                                    />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        Available Balance
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(totalEarnings - pendingPayments)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Earnings Chart */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography
                                variant="subtitle1"
                                gutterBottom
                            >
                                Earnings History
                            </Typography>
                            <Box sx={{ height: 300, mt: 2 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={earningsHistory}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `$${value}`}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`$${value}`, 'Earnings']}
                                        />
                                        <Bar
                                            dataKey="amount"
                                            fill={theme.palette.primary.main}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default EarningsTracker;
