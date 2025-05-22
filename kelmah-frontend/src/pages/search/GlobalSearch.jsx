import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import JobList from '../../components/jobs/JobList';

function GlobalSearch() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (query) {
            fetchSearchResults(query);
        }
    }, [query]);

    const fetchSearchResults = async (searchQuery) => {
        try {
            setLoading(true);
            setError(null);
            // Implement your global search API call here
            const response = await fetch(`/api/search?q=${searchQuery}`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
            setError('Failed to fetch search results');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom color="secondary">
                Search Results for "{query}"
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress color="secondary" />
                </Box>
            ) : error ? (
                <Typography color="error" align="center">
                    {error}
                </Typography>
            ) : results.length > 0 ? (
                <JobList 
                    jobs={results} 
                    loading={loading}
                    error={error}
                />
            ) : (
                <Typography variant="body1" color="text.secondary" align="center">
                    No results found for "{query}"
                </Typography>
            )}
        </Container>
    );
}

export default GlobalSearch; 