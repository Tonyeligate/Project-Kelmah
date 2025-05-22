import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
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
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Visibility,
    FilterList
} from '@mui/icons-material';
import { format } from 'date-fns';
import DisputeDetails from './DisputeDetails';
import api from '../../api/axios';

function DisputeList() {
    const [disputes, setDisputes] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDisputes();
    }, [page, rowsPerPage]);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/disputes', {
                params: {
                    page: page + 1,
                    limit: rowsPerPage
                }
            });
            setDisputes(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Error loading disputes');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Payment Disputes</Typography>
                <Button startIcon={<FilterList />}>
                    Filter
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
                                    <TableCell>Transaction</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {disputes.map((dispute) => (
                                    <TableRow key={dispute.id}>
                                        <TableCell>{dispute.id}</TableCell>
                                        <TableCell>
                                            {format(new Date(dispute.created_at), 'PPp')}
                                        </TableCell>
                                        <TableCell>{dispute.transaction_reference}</TableCell>
                                        <TableCell>{dispute.reason}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={dispute.status}
                                                color={
                                                    dispute.status === 'resolved' ? 'success' :
                                                    dispute.status === 'investigating' ? 'info' :
                                                    dispute.status === 'closed' ? 'default' :
                                                    'warning'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedDispute(dispute.id)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        component="div"
                        count={disputes.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </>
            )}

            {selectedDispute && (
                <DisputeDetails
                    open={true}
                    onClose={() => setSelectedDispute(null)}
                    disputeId={selectedDispute}
                />
            )}
        </Paper>
    );
}

export default DisputeList; 