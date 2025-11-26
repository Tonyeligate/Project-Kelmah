import { useMemo, useState } from 'react';
import Grow from '@mui/material/Grow';
import {
  Container,
  Breadcrumbs,
  Link,
  Typography,
  Grid,
  Paper,
  Box,
  TextField,
  Button,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Skeleton,
  useTheme,
  Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useJobsQuery,
  useSavedJobIds,
  useSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from '../../jobs/hooks/useJobsQuery';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  WorkOutline as WorkOutlineIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const JobApplicationPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [jobType, setJobType] = useState('');
  const [page, setPage] = useState(1);
  const jobsPerPage = 5;
  const [sortBy, setSortBy] = useState('recent');

  const sortParam = useMemo(() => {
    switch (sortBy) {
      case 'salary-high':
        return '-budget';
      case 'salary-low':
        return 'budget';
      case 'recent':
        return '-createdAt';
      case 'relevant':
        return 'relevance';
      default:
        return undefined;
    }
  }, [sortBy]);

  const queryFilters = useMemo(() => {
    const params = {
      page,
      limit: jobsPerPage,
    };
    if (searchTerm) params.search = searchTerm;
    if (location) params.location = location;
    if (category) params.category = category;
    if (jobType) params.type = jobType;
    if (sortParam && sortParam !== 'relevance') params.sort = sortParam;
    return params;
  }, [page, jobsPerPage, searchTerm, location, category, jobType, sortParam]);

  const {
    data: jobsData,
    isLoading,
    error,
  } = useJobsQuery(queryFilters, {
    keepPreviousData: true,
  });

  const jobs = jobsData?.jobs || jobsData?.data || [];
  const totalPages = jobsData?.totalPages || 1;
  const totalItems =
    jobsData?.totalJobs ||
    jobsData?.meta?.pagination?.totalItems ||
    jobs.length;
  const isInitialLoading = isLoading && jobs.length === 0;

  const { data: savedJobsData } = useSavedJobsQuery(
    {},
    { enabled: Boolean(isAuthenticated) },
  );

  const savedJobIds = useSavedJobIds(savedJobsData);
  const saveJobMutation = useSaveJobMutation();
  const unsaveJobMutation = useUnsaveJobMutation();

  const handleChangePage = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleSaveJob = async (job) => {
    const jobId = job?._id || job?.id;
    if (!jobId) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/worker/find-work' } });
      return;
    }

    const isSaved = savedJobIds.has(jobId);
    try {
      if (isSaved) {
        await unsaveJobMutation.mutateAsync({ jobId });
      } else {
        await saveJobMutation.mutateAsync({ jobId, job });
      }
    } catch (saveError) {
      console.error('Error toggling saved job:', saveError);
    }
  };

  // add handlers for sorting and clearing filters
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
  };
  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setCategory('');
    setJobType('');
    setPage(1);
    setSortBy('recent');
  };

  return (
    <Grow in timeout={500}>
      <Container sx={{ py: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            component={RouterLink}
            to="/worker/dashboard"
            underline="hover"
            color="inherit"
          >
            Dashboard
          </Link>
          <Typography color="text.primary">Find Work</Typography>
        </Breadcrumbs>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Find Work
        </Typography>

        {/* Search and Filter Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Jobs"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Location"
                variant="outlined"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="Plumbing">Plumbing</MenuItem>
                  <MenuItem value="Carpentry">Carpentry</MenuItem>
                  <MenuItem value="Electrical">Electrical</MenuItem>
                  <MenuItem value="HVAC">HVAC</MenuItem>
                  <MenuItem value="Construction">Construction</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobType}
                  label="Job Type"
                  onChange={(e) => setJobType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Full-time">Full-time</MenuItem>
                  <MenuItem value="Part-time">Part-time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Removed redundant Filter button */}
          </Grid>
        </Paper>

        {/* Clear all filters button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="outlined" color="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
        </Box>

        {/* Results Section */}
        {isInitialLoading ? (
          <Grid container spacing={3} sx={{ p: 2 }}>
            {Array.from({ length: jobsPerPage }).map((_, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Card sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent>
                    <Skeleton variant="text" width="40%" height={30} />
                    <Skeleton
                      variant="rectangular"
                      height={150}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Skeleton variant="rectangular" height={36} width="30%" />
                    <Skeleton
                      variant="rectangular"
                      height={36}
                      width="30%"
                      sx={{ ml: 'auto' }}
                    />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" component="h2">
                {totalItems} jobs found
              </Typography>
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortChange}
                >
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="relevant">Most Relevant</MenuItem>
                  <MenuItem value="salary-high">Highest Salary</MenuItem>
                  <MenuItem value="salary-low">Lowest Salary</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message || 'Failed to load jobs'}
              </Alert>
            )}

            {jobs.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <WorkOutlineIcon
                  sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h6">
                  No jobs found matching your criteria
                </Typography>
                <Typography color="textSecondary">
                  Try adjusting your search filters or search term
                </Typography>
              </Paper>
            ) : (
              <>
                <Grid container spacing={3}>
                  {jobs.map((job) => (
                    <Grid item xs={12} sm={6} key={job._id || job.id}>
                      <Card
                        sx={{
                          mb: 3,
                          borderRadius: 2,
                          boxShadow: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Box>
                              <Typography
                                variant="h5"
                                component="h2"
                                gutterBottom
                              >
                                {job.title}
                              </Typography>
                              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <BusinessIcon
                                    fontSize="small"
                                    sx={{ mr: 0.5, color: 'text.secondary' }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {job.company}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <LocationIcon
                                    fontSize="small"
                                    sx={{ mr: 0.5, color: 'text.secondary' }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {job.location}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <MoneyIcon
                                    fontSize="small"
                                    sx={{ mr: 0.5, color: 'text.secondary' }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {job.salary}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <AccessTimeIcon
                                    fontSize="small"
                                    sx={{ mr: 0.5, color: 'text.secondary' }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {new Date(job.date).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                            <IconButton onClick={() => handleSaveJob(job)}>
                              {savedJobIds.has(job._id || job.id) ? (
                                <BookmarkIcon color="primary" />
                              ) : (
                                <BookmarkBorderIcon />
                              )}
                            </IconButton>
                          </Box>
                          <Typography variant="body1" paragraph>
                            {job.description}
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={job.type}
                              size="small"
                              sx={{
                                mr: 1,
                                backgroundColor:
                                  job.type === 'Contract'
                                    ? theme.palette.info.light
                                    : theme.palette.success.light,
                              }}
                            />
                            <Chip
                              label={job.category}
                              size="small"
                              sx={{ mr: 1 }}
                              color="primary"
                              variant="outlined"
                            />
                            {job.skills.map((skill) => (
                              <Chip
                                key={skill}
                                label={skill}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                            ))}
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="text"
                            component={RouterLink}
                            to={`/jobs/${job._id || job.id}`}
                          >
                            View Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            component={RouterLink}
                            to={`/jobs/${job._id || job.id}?apply=true`}
                          >
                            Apply Now
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 4,
                    mb: 2,
                  }}
                >
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handleChangePage}
                    color="primary"
                  />
                </Box>
              </>
            )}
          </>
        )}
      </Container>
    </Grow>
  );
};

export default JobApplicationPage;
