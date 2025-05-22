import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Button,
    Card,
    CardContent,
    Menu,
    MenuItem,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Search,
    FilterList,
    Visibility,
    MoreVert,
    TrendingUp,
    Warning,
    CheckCircle
} from '@mui/icons-material';
import { format } from 'date-fns';
import DisputeDetails from '../../components/disputes/DisputeDetails';
import api from '../../api/axios';

function DisputeDashboard() {
    const [disputes, setDisputes] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        highPriority: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        search: ''
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        fetchDisputes();
        fetchStats();
    }, [page, rowsPerPage, filters]);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/disputes', {
                params: {
                    page: page + 1,
                    limit: rowsPerPage,
                    ...filters
                }
            });
            setDisputes(response.data.disputes);
            setStats(response.data.stats);
        } catch (error) {
            setError(error.response?.data?.message || 'Error loading disputes');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/disputes/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleMenuOpen = (event, dispute) => {
        setAnchorEl(event.currentTarget);
        setSelectedRow(dispute);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedRow(null);
    };

    const handleStatusChange = async (status) => {
        try {
            await api.patch(`/api/admin/disputes/${selectedRow.id}/status`, { status });
            fetchDisputes();
            handleMenuClose();
        } catch (error) {
            setError(error.response?.data?.message || 'Error updating status');
        }
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            pending: { color: 'warning', label: 'Pending' },
            investigating: { color: 'info', label: 'Investigating' },
            resolved: { color: 'success', label: 'Resolved' },
            closed: { color: 'default', label: 'Closed' }
        };

        const config = statusConfig[status] || { color: 'default', label: status };
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const getPriorityChip = (priority) => {
        const priorityConfig = {
            high: { color: 'error', label: 'High' },
            medium: { color: 'warning', label: 'Medium' },
            low: { color: 'success', label: 'Low' }
        };

        const config = priorityConfig[priority] || { color: 'default', label: priority };
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Dispute Management
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Disputes
                            </Typography>
                            <Typography variant="h4">
                                {stats.total}
                            </Typography>
                            <TrendingUp color="primary" />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Pending Review
                            </Typography>
                            <Typography variant="h4">
                                {stats.pending}
                            </Typography>
                            <Warning color="warning" />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Resolved
                            </Typography>
                            <Typography variant="h4">
                                {stats.resolved}
                            </Typography>
                            <CheckCircle color="success" />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                High Priority
                            </Typography>
                            <Typography variant="h4">
                                {stats.highPriority}
                            </Typography>
                            <Warning color="error" />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search disputes..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button
                        startIcon={<FilterList />}
                        variant="outlined"
                        onClick={() => {/* Add filter dialog */}}
                    >
                        Filters
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>User</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Reason</TableCell>
                                        <TableCell>Priority</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {disputes.map((dispute) => (
                                        <TableRow key={dispute.id}>
                                            <TableCell>#{dispute.id}</TableCell>
                                            <TableCell>
                                                {format(new Date(dispute.created_at), 'PPp')}
                                            </TableCell>
                                            <TableCell>{dispute.user_name}</TableCell>
                                            <TableCell>
                                                KES {dispute.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>{dispute.reason}</TableCell>
                                            <TableCell>
                                                {getPriorityChip(dispute.priority)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(dispute.status)}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setSelectedDispute(dispute.id)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, dispute)}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={stats.total}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </Paper>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleStatusChange('investigating')}>
                    Mark as Investigating
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('resolved')}>
                    Mark as Resolved
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('closed')}>
                    Close Dispute
                </MenuItem>
            </Menu>

            {selectedDispute && (
                <DisputeDetails
                    open={true}
                    onClose={() => setSelectedDispute(null)}
                    disputeId={selectedDispute}
                    isAdmin={true}
                />
            )}
        </Box>
    );
}

export default DisputeDashboard; 