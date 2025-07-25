import React, { useState, useEffect } from 'react';
import Grow from '@mui/material/Grow';
import {
  Container,
  Breadcrumbs,
  Link,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  CircularProgress,
  Pagination,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Autocomplete,
  Skeleton,
  CardActions,
  IconButton,
} from '@mui/material';
import { Search, Star } from '@mui/icons-material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import searchService from '../../search/services/searchService';
import { hirerService } from '../services/hirerService';
import MessageIcon from '@mui/icons-material/Message';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

const WorkerCard = ({ worker, isSaved, onToggleSave }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        },
      }}
    >
      <IconButton
        onClick={() => onToggleSave(worker.id || worker._id)}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        color={isSaved ? 'primary' : 'default'}
      >
        {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
      </IconButton>
      <CardContent sx={{ flexGrow: 1, pt: 4 }}>
        <Avatar
          src={worker.avatar}
          sx={{ width: 80, height: 80, mb: 2, mx: 'auto' }}
        />
        <Typography variant="h6" align="center">
          {worker.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          gutterBottom
        >
          {worker.title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
          <Rating value={worker.rating} precision={0.5} readOnly />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 0.5,
            mt: 2,
          }}
        >
          {(worker.skills || []).slice(0, 3).map((skill) => (
            <Chip key={skill} label={skill} size="small" />
          ))}
        </Box>
      </CardContent>
      <CardActions
        sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate(`/profiles/user/${worker.id || worker._id}`)}
        >
          View Profile
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<MessageIcon />}
          onClick={() =>
            navigate('/messages?participantId=' + (worker.id || worker._id))
          }
        >
          Message
        </Button>
      </CardActions>
    </Card>
  );
};

const WorkerSearchPage = () => {
  // Available skill options (mock)
  const skillOptions = [
    'Pipe Repair',
    'Water Heater Installation',
    'Drainage Systems',
    'Wiring',
    'Circuit Breakers',
    'Lighting',
    'Home Automation',
    'Audio Systems',
    'Cabinetry',
    'Furniture Making',
    'Framing',
    'Interior Painting',
    'Exterior Painting',
    'Wallpaper',
    'AC Installation',
    'Heating Systems',
    'Ventilation',
  ];
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    skills: [],
    minRating: 0,
    location: '',
    workMode: '', // 'remote', 'onsite', 'hybrid'
  });
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [results, setResults] = useState({ workers: [], pagination: {} });
  const [loading, setLoading] = useState(false);

  // Toggle save/favorite worker
  const handleToggleSaveWorker = async (workerId) => {
    if (savedWorkers.includes(workerId)) {
      try {
        await hirerService.unsaveWorker(workerId);
        setSavedWorkers((prev) => prev.filter((id) => id !== workerId));
      } catch (error) {
        console.error('Error unsaving worker:', error);
      }
    } else {
      try {
        await hirerService.saveWorker(workerId);
        setSavedWorkers((prev) => [...prev, workerId]);
      } catch (error) {
        console.error('Error saving worker:', error);
      }
    }
  };

  const handleSearch = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, ...searchParams };
      const response = await searchService.searchWorkers(params);
      const workers = response.results || response.workers || response;
      const pagination =
        (response.meta && response.meta.pagination) ||
        response.pagination ||
        {};
      setResults({ workers, pagination });
    } catch (error) {
      console.error('Error searching workers:', error);
      setResults({ workers: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  };

  // Reset all filters to defaults and reload worker list
  const handleClearFilters = async () => {
    const defaultParams = {
      searchTerm: '',
      skills: [],
      minRating: 0,
      location: '',
      workMode: '',
    };
    setSearchParams(defaultParams);
    setLoading(true);
    try {
      const params = { page: 1, ...defaultParams };
      const response = await searchService.searchWorkers(params);
      const workers = response.results || response.workers || response;
      const pagination =
        (response.meta && response.meta.pagination) ||
        response.pagination ||
        {};
      setResults({ workers, pagination });
    } catch (error) {
      console.error('Error clearing filters:', error);
      setResults({ workers: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load saved favorites
    (async () => {
      try {
        const favs = await hirerService.getSavedWorkers();
        setSavedWorkers(favs.map((w) => w.id || w._id));
      } catch {}
    })();
    handleSearch();
  }, []);

  return (
    <Grow in timeout={500}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            component={RouterLink}
            to="/hirer/dashboard"
            underline="hover"
            color="inherit"
          >
            Dashboard
          </Link>
          <Typography color="text.primary">Find Talent</Typography>
        </Breadcrumbs>
        <Paper
          sx={{
            p: 3,
            mb: 4,
            position: 'sticky',
            top: (theme) => theme.spacing(10),
            zIndex: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Find a Worker
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search by name or keyword"
                value={searchParams.searchTerm}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Location"
                value={searchParams.location}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography gutterBottom>Minimum Rating</Typography>
              <Slider
                value={searchParams.minRating}
                onChange={(e, newValue) =>
                  setSearchParams((prev) => ({ ...prev, minRating: newValue }))
                }
                step={0.5}
                marks
                min={0}
                max={5}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                options={skillOptions}
                value={searchParams.skills}
                onChange={(event, newSkills) =>
                  setSearchParams((prev) => ({ ...prev, skills: newSkills }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skills"
                    placeholder="Select skills"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Work Mode</InputLabel>
                <Select
                  value={searchParams.workMode}
                  label="Work Mode"
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      workMode: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="remote">Remote</MenuItem>
                  <MenuItem value="onsite">On-site</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<Search />}
                onClick={() => handleSearch()}
              >
                Search
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={() => handleClearFilters()}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Grid container spacing={3}>
            {Array.from(new Array(8)).map((_, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                <Card>
                  <CardContent>
                    <Skeleton
                      variant="circular"
                      width={60}
                      height={60}
                      sx={{ mx: 'auto', mb: 1 }}
                    />
                    <Skeleton
                      width="60%"
                      height={24}
                      sx={{ mx: 'auto', mb: 1 }}
                    />
                    <Skeleton
                      width="40%"
                      height={20}
                      sx={{ mx: 'auto', mb: 2 }}
                    />
                    <Skeleton variant="rectangular" height={118} />
                  </CardContent>
                  <CardActions>
                    <Skeleton
                      variant="rectangular"
                      width="80%"
                      height={36}
                      sx={{ mx: 'auto', mb: 1 }}
                    />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : results.workers.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <SearchOffIcon
              sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No workers found matching your criteria
            </Typography>
            <Typography>Please adjust your filters or try again.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {results.workers.map((worker, idx) => (
              <Grow in timeout={300 + idx * 100} key={worker.id || worker._id}>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <WorkerCard
                    worker={worker}
                    isSaved={savedWorkers.includes(worker.id || worker._id)}
                    onToggleSave={handleToggleSaveWorker}
                  />
                </Grid>
              </Grow>
            ))}
          </Grid>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.max(results.pagination.totalPages || 1, 1)}
            page={Math.max(results.pagination.currentPage || 1, 1)}
            onChange={(e, page) => handleSearch(page)}
            color="primary"
          />
        </Box>
      </Container>
    </Grow>
  );
};

export default WorkerSearchPage;
