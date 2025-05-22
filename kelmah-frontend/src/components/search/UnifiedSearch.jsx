import React, { useState } from 'react';
import {
    Box,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Collapse,
    Typography
} from '@mui/material';
import { Search, FilterList, ExpandMore, ExpandLess, Clear } from '@mui/icons-material';

const PROFESSIONS = [
    'Electrician',
    'Plumber',
    'Carpenter',
    'HVAC Technician',
    'Painter',
    'General Contractor',
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Data Science',
    'DevOps',
    'Digital Marketing',
    'Content Writing',
    'Other'
];

function UnifiedSearch({ onSearch, type = 'jobs' }) {
    const [expanded, setExpanded] = useState(false);
    const [searchParams, setSearchParams] = useState({
        query: '',
        profession: '',
        location: '',
        minBudget: '',
        maxBudget: '',
        type: ''
    });

    const handleChange = (field) => (event) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(searchParams);
    };

    const handleClear = () => {
        setSearchParams({
            query: '',
            profession: '',
            location: '',
            minBudget: '',
            maxBudget: '',
            type: ''
        });
        onSearch({});
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <form onSubmit={handleSearch}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                placeholder={`Search ${type}...`}
                                value={searchParams.query}
                                onChange={handleChange('query')}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="outlined"
                                onClick={() => setExpanded(!expanded)}
                                endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                            >
                                Filters
                            </Button>
                            {Object.values(searchParams).some(v => v) && (
                                <Button
                                    variant="text"
                                    onClick={handleClear}
                                    startIcon={<Clear />}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                <Collapse in={expanded}>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Profession</InputLabel>
                                <Select
                                    value={searchParams.profession}
                                    onChange={handleChange('profession')}
                                    label="Profession"
                                >
                                    <MenuItem value="">All Professions</MenuItem>
                                    {PROFESSIONS.map(prof => (
                                        <MenuItem key={prof} value={prof}>
                                            {prof}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Location"
                                value={searchParams.location}
                                onChange={handleChange('location')}
                                placeholder="Enter location or 'Remote'"
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Min Budget"
                                        type="number"
                                        value={searchParams.minBudget}
                                        onChange={handleChange('minBudget')}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Max Budget"
                                        type="number"
                                        value={searchParams.maxBudget}
                                        onChange={handleChange('maxBudget')}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Collapse>
            </form>
        </Paper>
    );
}

export default UnifiedSearch; 