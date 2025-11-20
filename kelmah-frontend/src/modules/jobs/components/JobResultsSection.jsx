import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  Button,
  IconButton,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Tooltip,
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn,
  MonetizationOn,
  Star,
  FlashOn as FlashOnIcon,
  LocalFireDepartment as FireIcon,
  Verified,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility,
  BookmarkBorder,
  Share,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import {
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Handyman as CarpenterIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';

const CATEGORY_ICONS = {
  Electrical: ElectricalIcon,
  Plumbing: PlumbingIcon,
  Carpentry: CarpenterIcon,
  HVAC: ConstructionIcon,
  Construction: ConstructionIcon,
};

const AnimatedStatCard = ({ value, suffix = '', label, isLive = false }) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <Paper
      ref={ref}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        textAlign: 'center',
        bgcolor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(212,175,55,0.2)',
        minHeight: { xs: '120px', sm: '140px', md: '160px' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          border: '1px solid #D4AF37',
          boxShadow: '0 8px 32px rgba(212,175,55,0.2)',
          transform: { xs: 'none', sm: 'translateY(-4px)' },
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
          transition: 'left 0.5s ease-in-out',
          '.MuiPaper-root:hover &': {
            left: '100%',
          },
        }}
      />
      <Typography
        variant="h3"
        sx={{
          color: '#D4AF37',
          fontWeight: 'bold',
          mb: { xs: 0.5, sm: 0.75, md: 1 },
          fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {inView ? (
          <CountUp end={value} duration={2.5} separator="," suffix={suffix} useEasing={true} />
        ) : (
          '0'
        )}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: 'rgba(255,255,255,0.8)',
          fontWeight: 'medium',
          fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {label}
      </Typography>
      {isLive && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#4CAF50',
            animation: 'pulse 1.8s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.2 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.2 },
            },
          }}
        />
      )}
    </Paper>
  );
};

const getCategoryIcon = (category) => CATEGORY_ICONS[category] || WorkIcon;

const JobResultsSection = ({
  jobs,
  loading,
  error,
  searchQuery,
  selectedCategory,
  selectedLocation,
  onClearSearch,
  onClearCategory,
  onClearLocation,
  onClearAllFilters,
  navigate,
  authState,
  platformStats,
  isSmallMobile,
}) => {
  const hasFilters = Boolean(searchQuery || selectedCategory || selectedLocation);
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const isAuthenticated = Boolean(authState?.isAuthenticated);

  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.05)',
          border: '2px dashed rgba(212,175,55,0.3)',
          borderRadius: 3,
          p: 6,
          maxWidth: 600,
          mx: 'auto',
        }}
      >
        <SearchIcon sx={{ fontSize: 80, color: '#D4AF37', mb: 2, opacity: 0.5 }} />
        <Typography variant="h5" sx={{ color: '#D4AF37', mb: 2, fontWeight: 'bold' }}>
          No Jobs Found
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
          {hasFilters
            ? "We couldn't find any jobs matching your search criteria. Try adjusting your filters or search terms."
            : 'No jobs are currently available. Check back soon for new opportunities!'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {hasFilters && (
            <Button
              variant="contained"
              onClick={onClearAllFilters}
              sx={{
                bgcolor: '#D4AF37',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#B8941F' },
              }}
            >
              Clear All Filters
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => navigate('/hirer/jobs/post')}
            sx={{
              borderColor: '#D4AF37',
              color: '#D4AF37',
              '&:hover': {
                borderColor: '#B8941F',
                bgcolor: 'rgba(212,175,55,0.1)',
              },
            }}
          >
            Post a Job
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const handleBookmark = (job) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `/jobs/${job.id}`,
          message: 'Please sign in to save jobs',
        },
      });
      return;
    }
    console.log('Bookmark functionality to be implemented', job.id);
  };

  const handleShare = (job) => {
    if (navigator?.share) {
      navigator
        .share({
          title: job.title,
          text: `Check out this job opportunity: ${job.title} at ${job.company}`,
          url: `${window.location.origin}/jobs/${job.id}`,
        })
        .catch((err) => console.warn('Error sharing job', err));
      return;
    }
    navigator?.clipboard?.writeText(
      `${job.title} at ${job.company} - ${window.location.origin}/jobs/${job.id}`,
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 1 }}>
            Featured Opportunities
          </Typography>
          {hasFilters && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Active filters:
              </Typography>
              {searchQuery && (
                <Chip
                  label={`Search: "${searchQuery}"`}
                  size="small"
                  onDelete={onClearSearch}
                  sx={{
                    bgcolor: 'rgba(212,175,55,0.2)',
                    color: '#D4AF37',
                    '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                  }}
                />
              )}
              {selectedCategory && (
                <Chip
                  label={`Category: ${selectedCategory}`}
                  size="small"
                  onDelete={onClearCategory}
                  sx={{
                    bgcolor: 'rgba(212,175,55,0.2)',
                    color: '#D4AF37',
                    '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                  }}
                />
              )}
              {selectedLocation && (
                <Chip
                  label={`Location: ${selectedLocation}`}
                  size="small"
                  onDelete={onClearLocation}
                  sx={{
                    bgcolor: 'rgba(212,175,55,0.2)',
                    color: '#D4AF37',
                    '& .MuiChip-deleteIcon': { color: '#D4AF37' },
                  }}
                />
              )}
            </Box>
          )}
        </Box>
        <Chip
          label={`${safeJobs.length} Job${safeJobs.length === 1 ? '' : 's'} Found`}
          icon={<WorkIcon sx={{ fontSize: 18 }} />}
          sx={{
            bgcolor: 'rgba(212,175,55,0.2)',
            color: '#D4AF37',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            px: 1,
          }}
        />
      </Box>

      {loading && (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={`job-skeleton-${item}`}>
              <Paper
                sx={{
                  height: '100%',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 2,
                  minHeight: 320,
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {error && (
        <Box sx={{ py: 4 }}>
          <Paper
            sx={{
              p: 4,
              bgcolor: 'rgba(244,67,54,0.1)',
              border: '1px solid rgba(244,67,54,0.3)',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2, fontWeight: 'bold' }}>
              Unable to Load Jobs
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={onClearAllFilters}
              sx={{ bgcolor: '#D4AF37', color: 'black', fontWeight: 'bold', '&:hover': { bgcolor: '#B8941F' } }}
            >
              Retry
            </Button>
          </Paper>
        </Box>
      )}

      {!loading && !error && safeJobs.length === 0 && renderEmptyState()}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {!loading &&
          !error &&
          safeJobs.map((job, index) => {
            const skills = Array.isArray(job.skills) ? job.skills : [];
            const jobId = job.id || job._id || index;
            const CardIcon = getCategoryIcon(job.category);
            return (
              <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={`job-${jobId}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: isSmallMobile ? 1 : 1.02 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      borderRadius: { xs: 2, sm: 2 },
                      minHeight: { xs: '300px', sm: '320px' },
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      mx: { xs: 1, sm: 0 },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #D4AF37, #FFD700)',
                        transform: 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s ease',
                      },
                      '&:hover': {
                        border: '1px solid #D4AF37',
                        boxShadow: '0 12px 40px rgba(212,175,55,0.4)',
                        transform: { xs: 'none', sm: 'translateY(-4px)' },
                        '&::before': {
                          transform: 'scaleX(1)',
                        },
                      },
                      '&:active': {
                        transform: { xs: 'scale(0.98)', sm: 'translateY(-4px)' },
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onClick={() => navigate(`/jobs/${job._id || job.id}`)}
                    role="article"
                    aria-label={`Job posting: ${job.title}`}
                  >
                    <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 2,
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 1, sm: 0 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          {React.createElement(CardIcon, {
                            sx: { mr: 1, color: '#D4AF37', fontSize: { xs: 20, sm: 24 } },
                          })}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              component="h2"
                              sx={{
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                lineHeight: { xs: 1.3, sm: 1.4 },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: { xs: 2, sm: 1 },
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {job.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              {job.employer?.logo && (
                                <Avatar src={job.employer.logo} alt={job.employer.name} sx={{ width: 16, height: 16, mr: 0.5 }} />
                              )}
                              {job.employer?.name || 'Employer Name Pending'}
                              {job.employer?.verified && (
                                <Verified sx={{ fontSize: 12, color: '#4CAF50', ml: 0.5 }} />
                              )}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: 0.5 }}>
                          {(job.urgent || job.proposalCount > 10) && (
                            <Tooltip
                              title={job.urgent ? 'This job needs immediate attention' : 'High competition - many applicants'}
                              arrow
                              placement="left"
                            >
                              <Chip
                                label={job.urgent ? 'URGENT' : 'HOT'}
                                size="small"
                                icon={job.urgent ? <FlashOnIcon sx={{ fontSize: 16 }} /> : <FireIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                  bgcolor: job.urgent ? '#ff4444' : '#ff9800',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  animation: 'pulse 2s infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.7 },
                                  },
                                  cursor: 'help',
                                }}
                              />
                            </Tooltip>
                          )}
                          {job.verified && (
                            <Tooltip title="This employer has been verified by Kelmah" arrow placement="left">
                              <Chip
                                icon={<Verified sx={{ fontSize: 14 }} />}
                                label="Verified"
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(76,175,80,0.2)',
                                  color: '#4CAF50',
                                  border: '1px solid #4CAF50',
                                  fontSize: '0.7rem',
                                  cursor: 'help',
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" sx={{ color: 'white', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {job.location?.city
                              ? `${job.location.city}${job.location.country ? `, ${job.location.country}` : ''}`
                              : typeof job.location === 'string'
                                ? job.location
                                : 'Remote/Flexible'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MonetizationOn fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ color: '#D4AF37', fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
                          >
                            {job?.budget
                              ? typeof job?.budget === 'object'
                                ? job.budget.min === job.budget.max || !job.budget.max
                                  ? `GHS ${(job.budget.amount || job.budget.min)?.toLocaleString()}`
                                  : `GHS ${job.budget.min?.toLocaleString()} - ${job.budget.max?.toLocaleString()}`
                                : `GHS ${job?.budget?.toLocaleString()}`
                              : 'Negotiable'}
                          </Typography>
                          <Chip
                            label={job.paymentType || 'Fixed'}
                            size="small"
                            sx={{ ml: 1, bgcolor: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Star fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {job.rating || '4.5'} Rating • {job.proposalCount || 0} Applicants
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                        {job.description}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37', fontWeight: 'bold' }}>
                          Required Skills:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {skills.slice(0, 3).map((skill, idx) => (
                            <Chip
                              key={`${jobId}-skill-${idx}`}
                              label={skill}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.75rem' }}
                            />
                          ))}
                          {skills.length > 3 && (
                            <Chip
                              label={`+${skills.length - 3} more`}
                              size="small"
                              sx={{ bgcolor: 'rgba(212,175,55,0.2)', color: '#D4AF37' }}
                            />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Posted {formatDistanceToNow(new Date(job.postedDate || Date.now()), { addSuffix: true })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ff6b6b' }}>
                          Apply by {job.deadline ? format(new Date(job.deadline), 'MMM dd') : 'Soon'}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions
                      sx={{
                        p: { xs: 2, sm: 3 },
                        pt: 0,
                        gap: { xs: 1, sm: 0 },
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      }}
                    >
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!isAuthenticated) {
                            navigate('/login', {
                              state: {
                                from: `/jobs/${job.id}/apply`,
                                message: 'Please sign in to apply for this job',
                              },
                            });
                            return;
                          }
                          navigate(`/jobs/${job.id}/apply`);
                        }}
                        sx={{
                          bgcolor: '#D4AF37',
                          color: 'black',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.9rem', sm: '0.875rem' },
                          padding: { xs: '10px 16px', sm: '8px 16px' },
                          minHeight: { xs: '44px', sm: '40px' },
                          '&:hover': { bgcolor: '#B8941F' },
                          '&:active': { transform: 'scale(0.98)' },
                        }}
                      >
                        Apply Now
                      </Button>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          if (typeof job.id === 'number') {
                            alert('This is sample data. Please ensure the API is connected to view real job details.');
                            return;
                          }
                          navigate(`/jobs/${job.id}`);
                        }}
                        sx={{
                          color: '#D4AF37',
                          minWidth: { xs: '44px', sm: '40px' },
                          minHeight: { xs: '44px', sm: '40px' },
                          '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                          '&:active': { transform: 'scale(0.95)' },
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          handleBookmark(job);
                        }}
                        sx={{
                          color: '#D4AF37',
                          minWidth: { xs: '44px', sm: '40px' },
                          minHeight: { xs: '44px', sm: '40px' },
                          '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                          '&:active': { transform: 'scale(0.95)' },
                        }}
                      >
                        <BookmarkBorder />
                      </IconButton>
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation();
                          handleShare(job);
                        }}
                        sx={{ color: '#D4AF37', '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' } }}
                      >
                        <Share />
                      </IconButton>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
      </Grid>

      {!loading && !error && safeJobs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
              Showing {safeJobs.length} of 12 total opportunities
            </Typography>
            <Button
              variant="outlined"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={() => console.log('Load more functionality - to be implemented')}
              sx={{
                borderColor: '#D4AF37',
                color: '#D4AF37',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: '#B8941F',
                  bgcolor: 'rgba(212,175,55,0.1)',
                },
              }}
            >
              Load More Opportunities
            </Button>
          </Box>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
        <Box sx={{ mt: { xs: 6, md: 8 }, mb: { xs: 4, md: 6 }, px: { xs: 1, sm: 0 } }}>
          <Typography
            variant="h4"
            sx={{
              color: '#D4AF37',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: { xs: 3, md: 4 },
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Platform Statistics
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={6} sm={6} md={3}>
              <AnimatedStatCard
                value={platformStats.loading ? safeJobs.length : platformStats.availableJobs}
                label="Available Jobs"
                isLive
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AnimatedStatCard
                value={platformStats.loading ? 0 : platformStats.activeEmployers}
                suffix="+"
                label="Active Employers"
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AnimatedStatCard
                value={platformStats.loading ? 0 : platformStats.skilledWorkers}
                suffix="+"
                label="Skilled Workers"
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AnimatedStatCard
                value={platformStats.loading ? 0 : platformStats.successRate}
                suffix="%"
                label="Success Rate"
              />
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
        <Paper
          sx={{
            mt: { xs: 3, md: 4 },
            p: { xs: 2.5, sm: 3, md: 4 },
            mx: { xs: 1, sm: 0 },
            textAlign: 'center',
            bgcolor: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#D4AF37',
              fontWeight: 'bold',
              mb: { xs: 1.5, md: 2 },
              fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2rem' },
              px: { xs: 1, sm: 0 },
            }}
          >
            Ready to Take Your Career to the Next Level?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: { xs: 2.5, md: 3 },
              fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
              lineHeight: { xs: 1.5, md: 1.6 },
              maxWidth: 600,
              mx: 'auto',
              px: { xs: 1, sm: 0 },
            }}
          >
            Join thousands of skilled professionals who've found their dream jobs through Kelmah. Get personalized job
            recommendations and connect directly with employers.
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, justifyContent: 'center', flexWrap: 'wrap', px: { xs: 1, sm: 0 } }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login', {
                    state: { from: '/jobs', message: 'Sign in to create job alerts' },
                  });
                  return;
                }
                console.log('Create job alert feature - to be implemented');
              }}
              sx={{
                bgcolor: '#D4AF37',
                color: 'black',
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                px: { xs: 3, sm: 3.5, md: 4 },
                minHeight: { xs: '44px', sm: '48px' },
                '&:hover': { bgcolor: '#B8941F' },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              Create Job Alert
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login', {
                    state: { from: '/profile/upload-cv', message: 'Sign in to upload your CV' },
                  });
                  return;
                }
                navigate('/profile/upload-cv');
              }}
              sx={{
                borderColor: '#D4AF37',
                color: '#D4AF37',
                fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                px: { xs: 3, sm: 3.5, md: 4 },
                minHeight: { xs: '44px', sm: '48px' },
                '&:hover': {
                  borderColor: '#B8941F',
                  bgcolor: 'rgba(212,175,55,0.1)',
                },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              Upload CV
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </motion.div>
  );
};

JobResultsSection.propTypes = {
  jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  searchQuery: PropTypes.string.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  selectedLocation: PropTypes.string.isRequired,
  onClearSearch: PropTypes.func.isRequired,
  onClearCategory: PropTypes.func.isRequired,
  onClearLocation: PropTypes.func.isRequired,
  onClearAllFilters: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  authState: PropTypes.shape({ isAuthenticated: PropTypes.bool }),
  platformStats: PropTypes.shape({
    availableJobs: PropTypes.number,
    activeEmployers: PropTypes.number,
    skilledWorkers: PropTypes.number,
    successRate: PropTypes.number,
    loading: PropTypes.bool,
  }).isRequired,
  isSmallMobile: PropTypes.bool.isRequired,
};

JobResultsSection.defaultProps = {
  error: null,
  authState: { isAuthenticated: false },
};

export default JobResultsSection;
