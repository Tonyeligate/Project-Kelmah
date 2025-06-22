import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { 
    fetchJobs,
    selectJobs,
    selectJobsLoading,
    selectJobsError,
    selectJobFilters,
    selectJobsPagination,
    setFilters,
    setCurrentPage
} from '../../../jobs/services/jobSlice';
import { selectCurrentUser } from '../../../auth/services/authSlice';
import JobList from './JobList';
import SearchFilters from './SearchFilters';
import CreateJobDialog from './CreateJobDialog';

const ITEMS_PER_PAGE = 9;

function Jobs() {
    const dispatch = useDispatch();
    const jobs = useSelector(selectJobs);
    const loading = useSelector(selectJobsLoading);
    const error = useSelector(selectJobsError);
    const filters = useSelector(selectJobFilters);
    const pagination = useSelector(selectJobsPagination);
    const currentUser = useSelector(selectCurrentUser);

    const [showCreateDialog, setShowCreateDialog] = useState(false);

    useEffect(() => {
        dispatch(fetchJobs({ ...filters, page: pagination.currentPage, limit: ITEMS_PER_PAGE }));
    }, [dispatch, filters, pagination.currentPage]);

    const handleFilterChange = (newFilters) => {
        dispatch(setFilters(newFilters));
    };

    const handlePageChange = (page) => {
        dispatch(setCurrentPage(page));
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" color="secondary">
                    Available Jobs
                </Typography>
                {currentUser?.role === 'hirer' && (
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() => setShowCreateDialog(true)}
                    >
                        Post Job
                    </Button>
                )}
            </Box>

            <SearchFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <JobList
                jobs={jobs}
                loading={loading}
                error={error}
                pagination={{
                    currentPage: pagination.currentPage,
                    totalPages: pagination.totalPages,
                    onPageChange: handlePageChange
                }}
            />

            {showCreateDialog && (
                <CreateJobDialog
                    open={showCreateDialog}
                    onClose={() => setShowCreateDialog(false)}
                    onSuccess={() => {
                        setShowCreateDialog(false);
                        dispatch(fetchJobs({ ...filters, limit: ITEMS_PER_PAGE }));
                    }}
                />
            )}
        </Container>
    );
}

export default Jobs; 

