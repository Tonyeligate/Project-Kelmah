import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Slider,
  Rating,
  Avatar,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import { format } from 'date-fns';

const WorkerSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [filters, setFilters] = useState({
    skills: [],
    minRating: 0,
    maxRate: 1000,
    location: '',
    availability: 'all',
    experience: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [savedWorkers, setSavedWorkers] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, [page, filters, searchQuery]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        ...filters,
        search: searchQuery
      });

      const response = await fetch(`/api/workers/search?${queryParams}`);
      const data = await response.json();
      
      setWorkers(data.workers);
      setTotalPages(data.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to load workers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleDialogOpen = (worker) => {
    setSelectedWorker(worker);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedWorker(null);
  };

  const handleSaveWorker = async (workerId) => {
    try {
      const response = await fetch(`/api/hirers/${user.id}/saved-workers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workerId })
      });

      if (!response.ok) {
        throw new Error('Failed to save worker');
      }

      setSavedWorkers(prev => [...prev, workerId]);
    } catch (err) {
      console.error('Failed to save worker:', err);
    }
  };

  const handleRemoveSavedWorker = async (workerId) => {
    try {
      const response = await fetch(`/api/hirers/${user.id}/saved-workers/${workerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove saved worker');
      }

      setSavedWorkers(prev => prev.filter(id => id !== workerId));
    } catch (err) {
      console.error('Failed to remove saved worker:', err);
    }
  };

  const renderWorkerCard = (worker) => (
    <Card key={worker.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={worker.avatar}
              alt={worker.name}
              sx={{ width: 56, height: 56 }}
            />
            <Box>
              <Typography variant="h6">{worker.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {worker.profession}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => savedWorkers.includes(worker.id)
              ? handleRemoveSavedWorker(worker.id)
              : handleSaveWorker(worker.id)
            }
          >
            {savedWorkers.includes(worker.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <StarIcon color="primary" />
              <Typography variant="body2">
                {worker.rating.toFixed(1)} ({worker.reviews} reviews)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WorkIcon color="action" />
              <Typography variant="body2">
                {worker.completedJobs} jobs completed
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon color="action" />
              <Typography variant="body2">
                ${worker.hourlyRate}/hr
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {worker.skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      <Divider />
      <CardActions>
        {user ? (
          <>        
            <Button
              size="small"
              startIcon={<MessageIcon />}
              onClick={() => handleDialogOpen(worker)}
            >
              Message
            </Button>
            <Button
              size="small"
              onClick={() => navigate(`/profiles/user/${worker.id}`)}
            >
              View Profile
            </Button>
          </>
        ) : (
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate('/login')}
          >
            Login to view
          </Button>
        )}
      </CardActions>
    </Card>
  );

  // Handler to clear all filters
  const clearFilters = () => {
    setFilters({
      skills: [],
      minRating: 0,
      maxRate: 1000,
      location: '',
      availability: 'all',
      experience: 'all'
    });
    setSearchQuery('');
    setPage(1);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Find Workers
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search workers by name, skills, or location"
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={filters.experience}
                label="Experience Level"
                onChange={(e) => handleFilterChange('experience', e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="entry">Entry Level</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={filters.availability}
                label="Availability"
                onChange={(e) => handleFilterChange('availability', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="week">Within a Week</MenuItem>
                <MenuItem value="month">Within a Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>
              Minimum Rating
            </Typography>
            <Rating
              value={filters.minRating}
              onChange={(_, value) => handleFilterChange('minRating', value)}
              precision={0.5}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>
              Maximum Rate ($/hr)
            </Typography>
            <Slider
              value={filters.maxRate}
              onChange={(_, value) => handleFilterChange('maxRate', value)}
              min={0}
              max={1000}
              step={10}
              marks
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Clear filters button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" color="secondary" onClick={clearFilters}>
          Clear Filters
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
      ) : workers.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No workers found matching your criteria
          </Typography>
        </Paper>
      ) : (
        <Box>
          {workers.map(renderWorkerCard)}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Worker Profile
        </DialogTitle>
        <DialogContent>
          {selectedWorker && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={selectedWorker.avatar}
                      alt={selectedWorker.name}
                      sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                    />
                    <Typography variant="h6">
                      {selectedWorker.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedWorker.profession}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedWorker.bio}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {selectedWorker.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Hourly Rate
                      </Typography>
                      <Typography variant="body1">
                        ${selectedWorker.hourlyRate}/hr
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Experience
                      </Typography>
                      <Typography variant="body1">
                        {selectedWorker.experience} years
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Rating
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={selectedWorker.rating} precision={0.5} readOnly />
                        <Typography variant="body2">
                          ({selectedWorker.reviews} reviews)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Completed Jobs
                      </Typography>
                      <Typography variant="body1">
                        {selectedWorker.completedJobs}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
          <Button
            variant="contained"
            startIcon={<MessageIcon />}
            onClick={() => {
              handleDialogClose();
              navigate(`/messages?participantId=${selectedWorker.id}`);
            }}
          >
            Message Worker
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerSearch; 


