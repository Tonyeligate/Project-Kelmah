import React, { useEffect, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  fetchJobs,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  selectJobFilters,
  setFilters,
  selectJobsPagination,
} from '../../jobs/services/jobSlice';

const JobSearchPage = () => {
  const [viewMode, setViewMode] = useState('list');
  const [userPosition, setUserPosition] = useState(null);
  const theme = useTheme();
  const dispatch = useDispatch();
  const jobs = useSelector(selectJobs);
  const loading = useSelector(selectJobsLoading);
  const error = useSelector(selectJobsError);
  const filters = useSelector(selectJobFilters);
  const { currentPage, totalPages } = useSelector(selectJobsPagination);

  useEffect(() => {
    dispatch(fetchJobs({ ...filters, page: currentPage }));
  }, [dispatch, filters, currentPage]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const handleSearchChange = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleViewChange = (e, mode) => {
    if (mode) setViewMode(mode);
  };

  return (
    <Box p={2}>
      {/* View Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Search jobs"
          variant="outlined"
          fullWidth
          value={filters.search}
          onChange={handleSearchChange}
          sx={{ mr: 2 }}
        />
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="list">List</ToggleButton>
          <ToggleButton value="map">Map</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* List View */}
      {viewMode === 'list' &&
        (loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : jobs.length === 0 ? (
          <Typography>No jobs found.</Typography>
        ) : (
          <Grid container spacing={2}>
            {jobs.map((job) => (
              <Grid item xs={12} sm={6} md={4} key={job.id}>
                <Card
                  sx={{
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.02)' },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {job.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {job.location}
                    </Typography>
                    <Box mt={1} mb={1}>
                      <Chip
                        label={job.category}
                        size="small"
                        sx={{ backgroundColor: theme.palette.secondary.light }}
                      />
                    </Box>
                    <Typography variant="body2">
                      {job.description.substring(0, 100)}...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ))}

      {/* Map View */}
      {viewMode === 'map' &&
        (jobs && jobs.length > 0 ? (
          <Box sx={{ height: 500, mb: 2 }}>
            <MapContainer
              center={
                userPosition || [
                  jobs[0].coordinates.lat,
                  jobs[0].coordinates.lng,
                ]
              }
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              {/* User Location Marker */}
              {userPosition && (
                <Marker position={userPosition}>
                  <Popup>You are here</Popup>
                </Marker>
              )}
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {jobs
                .filter((j) => j.coordinates)
                .map((job) => (
                  <Marker
                    key={job.id}
                    position={[job.coordinates.lat, job.coordinates.lng]}
                  >
                    <Popup>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {job.title}
                      </Typography>
                      <Typography variant="body2">{job.location}</Typography>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </Box>
        ) : (
          <Typography>No job locations available to display on map.</Typography>
        ))}
    </Box>
  );
};

export default JobSearchPage;
