import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Chip,
    Alert,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Visibility,
    Block,
    CheckCircle,
    Delete,
    Warning
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function JobManagement() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedJob, setSelectedJob] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        category: '',
        search: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, [page, rowsPerPage, filters]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                'http://localhost:3000/api/admin/jobs',
                {
                    params: {
                        page: page + 1,
                        limit: rowsPerPage,
                        ...filters
                    },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setJobs(response.data.jobs);
            setError(null);
        } catch (err) {
            setError('Failed to fetch jobs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (job) => {
        setSelectedJob(job);
        setOpenDialog(true);
    };

    const handleStatusChange = async (jobId, newStatus) => {
        try {
            setActionLoading(true);
            await axios.patch(
                `http://localhost:3000/api/admin/jobs/${jobId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchJobs();
        } catch (err) {
            setError('Failed to update job status');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await axios.delete(
                    `http://localhost:3000/api/admin/jobs/${jobId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                fetchJobs();
            } catch (err) {
                setError('Failed to delete job');
                console.error(err);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'completed': return 'info';
            case 'cancelled': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Job Management
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search jobs..."
                            value={filters.search}
                            onChange={(e) => setFilters({
                                ...filters,
                                search: e.target.value
                            })}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => setFilters({
                                    ...filters,
                                    status: e.target.value
                                })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                label="Category"
                                onChange={(e) => setFilters({
                                    ...filters,
                                    category: e.target.value
                                })}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="electrical">Electrical</MenuItem>
                                <MenuItem value="plumbing">Plumbing</MenuItem>
                                <MenuItem value="carpentry">Carpentry</MenuItem>
                                {/* Add more categories */}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Hirer</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Budget</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Posted</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : jobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No jobs found
                                </TableCell>
                            </TableRow>
                        ) : jobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell>{job.id}</TableCell>
                                <TableCell>{job.title}</TableCell>
                                <TableCell>{job.hirer_name}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={job.category}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{job.budget} XOF</TableCell>
                                <TableCell>
                                    <Chip
                                        label={job.status}
                                        color={getStatusColor(job.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {new Date(job.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleViewDetails(job)}
                                    >
                                        <Visibility />
                                    </IconButton>
                                    {job.status === 'active' && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleStatusChange(job.id, 'cancelled')}
                                        >
                                            <Block />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteJob(job.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={jobs.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Job Details</DialogTitle>
                <DialogContent>
                    {selectedJob && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedJob.title}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {selectedJob.description}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">
                                        Budget
                                    </Typography>
                                    <Typography>
                                        {selectedJob.budget} XOF
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">
                                        Location
                                    </Typography>
                                    <Typography>
                                        {selectedJob.location}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">
                                        Duration
                                    </Typography>
                                    <Typography>
                                        {selectedJob.duration}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2">
                                        Applications
                                    </Typography>
                                    <Typography>
                                        {selectedJob.applications_count}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default JobManagement; 