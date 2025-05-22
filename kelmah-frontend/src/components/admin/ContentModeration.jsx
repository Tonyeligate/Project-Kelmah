import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    CircularProgress
} from '@mui/material';
import { Search } from '@mui/icons-material';

function ContentModeration() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterContentType, setFilterContentType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [action, setAction] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    // Mock data for demonstration
    useEffect(() => {
        const fetchReports = async () => {
            try {
                // In production, replace with actual API call
                // const response = await api.get('/admin/content-reports');
                // setReports(response.data);
                
                // Mock data
                setReports([
                    {
                        id: '1',
                        contentType: 'job',
                        contentTitle: 'Web Developer Position',
                        reason: 'misleading',
                        description: 'Job listing contains misleading information about salary',
                        reporterName: 'John Doe',
                        status: 'pending',
                        createdAt: '2024-06-10T10:30:00Z'
                    },
                    {
                        id: '2',
                        contentType: 'profile',
                        contentTitle: 'User Profile: Jane Smith',
                        reason: 'inappropriate',
                        description: 'Profile contains inappropriate content',
                        reporterName: 'Mike Johnson',
                        status: 'reviewed',
                        createdAt: '2024-06-09T15:20:00Z'
                    },
                    {
                        id: '3',
                        contentType: 'review',
                        contentTitle: 'Review for Project X',
                        reason: 'offensive',
                        description: 'Review contains offensive language',
                        reporterName: 'Sarah Wilson',
                        status: 'resolved',
                        action: 'removal',
                        createdAt: '2024-06-08T09:15:00Z'
                    }
                ]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching reports:', error);
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        if (name === 'status') {
            setFilterStatus(value);
        } else if (name === 'contentType') {
            setFilterContentType(value);
        }
        setPage(0);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPage(0);
    };

    const handleViewReport = (report) => {
        setSelectedReport(report);
        setDialogOpen(true);
        setAction(report.action || '');
        setAdminNotes(report.adminNotes || '');
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedReport(null);
    };

    const handleSubmitDecision = async () => {
        try {
            // In production, replace with actual API call
            // await api.put(`/admin/content-reports/${selectedReport.id}`, {
            //     status: 'reviewed',
            //     action,
            //     adminNotes
            // });

            // Update local state
            setReports(reports.map(report => 
                report.id === selectedReport.id 
                    ? { ...report, status: 'reviewed', action, adminNotes } 
                    : report
            ));

            handleCloseDialog();
        } catch (error) {
            console.error('Error updating report:', error);
        }
    };

    const getStatusChip = (status) => {
        switch (status) {
            case 'pending':
                return <Chip label="Pending" color="warning" size="small" />;
            case 'reviewed':
                return <Chip label="Reviewed" color="info" size="small" />;
            case 'resolved':
                return <Chip label="Resolved" color="success" size="small" />;
            case 'dismissed':
                return <Chip label="Dismissed" color="default" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    // Filter and search
    const filteredReports = reports.filter(report => {
        const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
        const matchesContentType = filterContentType === 'all' || report.contentType === filterContentType;
        const matchesSearch = searchTerm === '' || 
            report.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesStatus && matchesContentType && matchesSearch;
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Content Moderation
            </Typography>

            {/* Filters */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Search"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={filterStatus}
                                label="Status"
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="reviewed">Reviewed</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="dismissed">Dismissed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Content Type</InputLabel>
                            <Select
                                name="contentType"
                                value={filterContentType}
                                label="Content Type"
                                onChange={handleFilterChange}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="job">Jobs</MenuItem>
                                <MenuItem value="profile">Profiles</MenuItem>
                                <MenuItem value="review">Reviews</MenuItem>
                                <MenuItem value="message">Messages</MenuItem>
                                <MenuItem value="comment">Comments</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {/* Reports Table */}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Content Type</TableCell>
                            <TableCell>Content</TableCell>
                            <TableCell>Reporter</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredReports
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell>{report.contentType}</TableCell>
                                    <TableCell>{report.contentTitle}</TableCell>
                                    <TableCell>{report.reporterName}</TableCell>
                                    <TableCell>{getStatusChip(report.status)}</TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="outlined" 
                                            size="small"
                                            onClick={() => handleViewReport(report)}
                                        >
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            <TablePagination
                component="div"
                count={filteredReports.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
            />

            {/* Review Dialog */}
            {selectedReport && (
                <Dialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Review Content Report</DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1">Report Details</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Typography><strong>Content:</strong> {selectedReport.contentTitle}</Typography>
                                    <Typography><strong>Type:</strong> {selectedReport.contentType}</Typography>
                                    <Typography><strong>Reason:</strong> {selectedReport.reason}</Typography>
                                    <Typography><strong>Description:</strong> {selectedReport.description}</Typography>
                                    <Typography><strong>Reporter:</strong> {selectedReport.reporterName}</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1">Take Action</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                        <InputLabel>Action</InputLabel>
                                        <Select
                                            value={action}
                                            label="Action"
                                            onChange={(e) => setAction(e.target.value)}
                                        >
                                            <MenuItem value="none">No Action Required</MenuItem>
                                            <MenuItem value="warning">Issue Warning</MenuItem>
                                            <MenuItem value="removal">Remove Content</MenuItem>
                                            <MenuItem value="suspension">Suspend User</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        label="Admin Notes"
                                        multiline
                                        rows={4}
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmitDecision}
                            disabled={!action}
                        >
                            Submit Decision
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Paper>
    );
}

export default ContentModeration; 