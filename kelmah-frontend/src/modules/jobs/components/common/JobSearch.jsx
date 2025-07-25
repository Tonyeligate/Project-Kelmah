import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Work,
  AttachMoney,
  FilterList,
  Clear,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const JobSearch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    location: '',
    category: '',
    minBudget: 0,
    maxBudget: 1000,
    skills: [],
    availability: 'all',
    sortBy: 'relevance',
  });
  const [categories] = useState([
    'Electrical',
    'Plumbing',
    'Carpentry',
    'HVAC',
    'Masonry',
    'Painting',
    'Landscaping',
    'General Maintenance',
  ]);
  const [skills] = useState([
    'Electrical Installation',
    'Pipe Fitting',
    'Woodworking',
    'HVAC Systems',
    'Concrete Work',
    'Interior Painting',
    'Garden Design',
    'General Repairs',
  ]);

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/jobs/search`, {
        params: filters,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setJobs(response.data.data);
    } catch (err) {
      setError('Failed to fetch jobs. Please try again later.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      location: '',
      category: '',
      minBudget: 0,
      maxBudget: 1000,
      skills: [],
      availability: 'all',
      sortBy: 'relevance',
    });
  };

  const handleApplyJob = async (jobId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/jobs/${jobId}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        },
      );
      // Show success message or update UI
    } catch (err) {
      console.error('Error applying for job:', err);
    }
  };

  const renderJobCard = (job) => (
    <Card key={job.id} sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              {job.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {job.description}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip icon={<LocationOn />} label={job.location} size="small" />
              <Chip icon={<Work />} label={job.category} size="small" />
              <Chip
                icon={<AttachMoney />}
                label={`$${job.budget}`}
                size="small"
              />
            </Box>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleApplyJob(job.id)}
            >
              Apply Now
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Find Jobs
      </Typography>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Jobs"
                value={filters.searchTerm}
                onChange={(e) =>
                  handleFilterChange('searchTerm', e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: filters.searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('searchTerm', '')}
                      >
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) =>
                    handleFilterChange('category', e.target.value)
                  }
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Budget Range</Typography>
              <Slider
                value={[filters.minBudget, filters.maxBudget]}
                onChange={(_, newValue) => {
                  handleFilterChange('minBudget', newValue[0]);
                  handleFilterChange('maxBudget', newValue[1]);
                }}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={10}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Skills</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onClick={() => {
                      const newSkills = filters.skills.includes(skill)
                        ? filters.skills.filter((s) => s !== skill)
                        : [...filters.skills, skill];
                      handleFilterChange('skills', newSkills);
                    }}
                    color={
                      filters.skills.includes(skill) ? 'primary' : 'default'
                    }
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Button startIcon={<FilterList />} onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    label="Sort By"
                    onChange={(e) =>
                      handleFilterChange('sortBy', e.target.value)
                    }
                  >
                    <MenuItem value="relevance">Relevance</MenuItem>
                    <MenuItem value="budget_high">
                      Budget (High to Low)
                    </MenuItem>
                    <MenuItem value="budget_low">Budget (Low to High)</MenuItem>
                    <MenuItem value="newest">Newest First</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : jobs.length === 0 ? (
        <Alert severity="info">No jobs found matching your criteria.</Alert>
      ) : (
        <Box>{jobs.map((job) => renderJobCard(job))}</Box>
      )}
    </Box>
  );
};

export default JobSearch;
