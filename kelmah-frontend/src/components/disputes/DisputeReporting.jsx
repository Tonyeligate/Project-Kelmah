import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Chip,
    IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
    FileDownload,
    PictureAsPdf,
    TableChart,
    Refresh,
    Save
} from '@mui/icons-material';
import api from '../../api/axios';

function DisputeReporting() {
    const [filters, setFilters] = useState({
        dateFrom: null,
        dateTo: null,
        status: '',
        category: '',
        priority: ''
    });
    const [reportFormat, setReportFormat] = useState('excel');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.post('/api/disputes/reports/generate', {
                ...filters,
                format: reportFormat
            }, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `dispute_report_${new Date().toISOString()}.${reportFormat}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            setError('Error generating report');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.post('/api/disputes/reports/preview', filters);
            setPreviewData(response.data);
            setShowPreview(true);

        } catch (error) {
            setError('Error generating preview');
        } finally {
            setLoading(false);
        }
    };

    const renderPreview = () => {
        if (!previewData) return null;

        return (
            <Dialog
                open={showPreview}
                onClose={() => setShowPreview(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Report Preview</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {/* Summary Section */}
                        <Typography variant="h6" gutterBottom>
                            Summary
                        </Typography>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={4}>
                                <Typography variant="subtitle2">Total Disputes</Typography>
                                <Typography variant="h4">{previewData.summary.total}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="subtitle2">Resolution Rate</Typography>
                                <Typography variant="h4">{previewData.summary.resolutionRate}%</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="subtitle2">Avg Resolution Time</Typography>
                                <Typography variant="h4">{previewData.summary.avgResolutionTime}h</Typography>
                            </Grid>
                        </Grid>

                        {/* Status Breakdown */}
                        <Typography variant="h6" gutterBottom>
                            Status Breakdown
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                            {Object.entries(previewData.statusBreakdown).map(([status, count]) => (
                                <Box key={status} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Chip 
                                        label={status} 
                                        size="small"
                                        sx={{ minWidth: 100, mr: 2 }}
                                    />
                                    <Typography>{count}</Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Sample Data */}
                        <Typography variant="h6" gutterBottom>
                            Sample Data (First 5 Records)
                        </Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                        <th>Resolution Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.sampleData.map(row => (
                                        <tr key={row.id}>
                                            <td>{row.id}</td>
                                            <td>{new Date(row.created_at).toLocaleDateString()}</td>
                                            <td>{row.status}</td>
                                            <td>KES {row.amount.toLocaleString()}</td>
                                            <td>{row.resolution_time || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPreview(false)}>Close</Button>
                    <Button 
                        variant="contained"
                        onClick={handleGenerateReport}
                        startIcon={<FileDownload />}
                    >
                        Generate Full Report
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Generate Dispute Report
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <DatePicker
                            label="From Date"
                            value={filters.dateFrom}
                            onChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DatePicker
                            label="To Date"
                            value={filters.dateTo}
                            onChange={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                label="Status"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="investigating">Investigating</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="escalated">Escalated</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                label="Category"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="payment">Payment</MenuItem>
                                <MenuItem value="service">Service</MenuItem>
                                <MenuItem value="technical">Technical</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={filters.priority}
                                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                label="Priority"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setFilters({
                            dateFrom: null,
                            dateTo: null,
                            status: '',
                            category: '',
                            priority: ''
                        })}
                        startIcon={<Refresh />}
                    >
                        Reset Filters
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handlePreview}
                        startIcon={<TableChart />}
                        disabled={loading}
                    >
                        Preview
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setReportFormat('excel');
                            handleGenerateReport();
                        }}
                        startIcon={<FileDownload />}
                        disabled={loading}
                    >
                        Export Excel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setReportFormat('pdf');
                            handleGenerateReport();
                        }}
                        startIcon={<PictureAsPdf />}
                        disabled={loading}
                    >
                        Export PDF
                    </Button>
                </Box>

                {loading && (
                    <Box display="flex" justifyContent="center" mt={3}>
                        <CircularProgress />
                    </Box>
                )}
            </Paper>

            {renderPreview()}
        </Box>
    );
}

export default DisputeReporting; 