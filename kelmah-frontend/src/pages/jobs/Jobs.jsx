import React, { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import UnifiedSearch from '../../components/search/UnifiedSearch';
import JobList from '../../components/jobs/JobList';
import ServiceNavigation from '../../components/common/ServiceNavigation';

function Jobs() {
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (searchParams) => {
        setLoading(true);
        try {
            // Implement your search logic here
            // This could be an API call to your backend
            const results = await searchJobs(searchParams);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            // Handle error appropriately
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ py: 4 }}>
            <ServiceNavigation />
            <Container>
                <Typography variant="h4" gutterBottom color="secondary">
                    Find Your Perfect Job
                </Typography>
                <UnifiedSearch 
                    onSearch={handleSearch}
                    type="jobs"
                />
                <JobList 
                    jobs={searchResults}
                    loading={loading}
                />
            </Container>
        </Box>
    );
}

export default Jobs;