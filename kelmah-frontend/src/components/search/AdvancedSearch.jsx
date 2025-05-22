import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Typography,
    Chip,
    InputAdornment,
    CircularProgress,
    Pagination
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList,
    Clear
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function AdvancedSearch({ type = 'workers' }) {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useState({
        query: '',
        profession: '',
        location: '',
        minRating: 0,
        maxRate: '',
        availability: '',
        experience: '',
        skills: [],
        page: 1,
        limit: 10
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        if (searchParams.query || searchParams.profession || searchParams.location) {
            handleSearch();
        }
    }, [searchParams.page]);

    const handleSearch = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:3000/api/search/${type}`,
                {
                    params: searchParams,
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setResults(response.data.results);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setSearchParams({
            ...searchParams,
            [e.target.name]: e.target.value,
            page: 1 // Reset page when changing filters
        });
    };

    const handlePageChange = (event, value) => {
        setSearchParams({
            ...searchParams,
            page: value
        });
    };

    const clearFilters = () => {
        setSearchParams({
            query: '',
            profession: '',
            location: '',
            minRating: 0,
            maxRate: '',
            availability: '',
            experience: '',
            skills: [],
            page: 1,
            limit: 10
        });
        setResults([]);
    };

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            name="query"
                            value={searchParams.query}
                            onChange={handleInputChange}
                            placeholder={`Search ${type}...`}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            name="location"
                            value={searchParams.location}
                            onChange={handleInputChange}
                            placeholder="Location"
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => setShowFilters(!showFilters)}
                            startIcon={<FilterList />}
                        >
                            Filters
                        </Button>
                    </Grid>
                </Grid>

                {showFilters && (
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                            {type === 'workers' && (
                                <>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Profession</InputLabel>
                                            <Select
                                                name="profession"
                                                value={searchParams.profession}
                                                onChange={handleInputChange}
                                            >
                                                <MenuItem value="">All</MenuItem>
                                                <MenuItem value="electrician">Electrician</MenuItem>
                                                <MenuItem value="plumber">Plumber</MenuItem>
                                                <MenuItem value="carpenter">Carpenter</MenuItem>
                                                {/* Add more professions */}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Experience</InputLabel>
                                            <Select
                                                name="experience"
                                                value={searchParams.experience}
                                                onChange={handleInputChange}
                                            >
                                                <MenuItem value="">Any</MenuItem>
                                                <MenuItem value="1">1+ year</MenuItem>
                                                <MenuItem value="3">3+ years</MenuItem>
                                                <MenuItem value="5">5+ years</MenuItem>
                                                <MenuItem value="10">10+ years</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Availability</InputLabel>
                                            <Select
                                                name="availability"
                                                value={searchParams.availability}
                                                onChange={handleInputChange}
                                            >
                                                <MenuItem value="">Any</MenuItem>
                                                <MenuItem value="full-time">Full Time</MenuItem>
                                                <MenuItem value="part-time">Part Time</MenuItem>
                                                <MenuItem value="weekends">Weekends</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12}>
                                <Typography gutterBottom>
                                    Price Range (per hour)
                                </Typography>
                                <Slider
                                    value={[searchParams.minRate || 0, searchParams.maxRate || 100]}
                                    onChange={(event, newValue) => {
                                        setSearchParams({
                                            ...searchParams,
                                            minRate: newValue[0],
                                            maxRate: newValue[1],
                                            page: 1
                                        });
                                    }}
                                    valueLabelDisplay="auto"
                                    min={0}
                                    max={100}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    onClick={clearFilters}
                                    startIcon={<Clear />}
                                >
                                    Clear Filters
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : results.length > 0 ? (
                <>
                    <Grid container spacing={2}>
                        {results.map((result) => (
                            <Grid item xs={12} md={6} key={result.id}>
                                {/* Render appropriate result card based on type */}
                                {type === 'workers' ? (
                                    <WorkerCard worker={result} />
                                ) : (
                                    <JobCard job={result} />
                                )}
                            </Grid>
                        ))}
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={searchParams.page}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </>
            ) : (
                <Typography color="text.secondary" align="center">
                    No results found
                </Typography>
            )}
        </Box>
    );
}

export default AdvancedSearch; 