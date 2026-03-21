/**
 * Job Application Form Component
 * Handles the complete job application process for vocational workers
 *
 * DATA FLOW:
 *   /jobs/:id/apply route → JobApplicationForm → api.get(/jobs/:id) → display job
 *   Worker submits → api.post(/jobs/:id/apply, { proposedRate, coverLetter }) → applyToJob
 *
 * CRITICAL FIXES (Audit March 2026):
 *   - FIX-001: Removed duplicate /api prefix (api client already has /api base)
 *   - FIX-002: Replaced job.company.name → job.hirer (backend returns hirer object)
 *   - FIX-003: Renamed expectedSalary → proposedRate (matches Application model)
 *   - FIX-004: Replaced job.applyBy → job.expiresAt || job.bidding?.bidDeadline
 *   - FIX-005: Added null guards for job.skills, job.budget, etc.
 *   - FIX-006: Improved UX for vocational workers (simple language, large touch targets)
 *   - FIX-007: Added proper loading, error, and success states
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, TextField, Button, Grid, Card, CardContent, Divider, Chip, Avatar, Stack, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Breadcrumbs, Link, useTheme, InputAdornment } from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Edit as EditIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../../services/apiClient';
import { useBreakpointDown } from '@/hooks/useResponsive';

// Simple location formatter
const formatLocation = (loc) => {
  if (!loc) return 'Location not set';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object') {
    const parts = [loc.city, loc.region, loc.country].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    if (loc.address) return loc.address;
    if (loc.type) return loc.type === 'remote' ? 'Remote' : loc.type;
  }
  return 'Location not set';
};

// Simple hirer name extractor
const getHirerName = (job) => {
  if (!job) return 'Employer';
  if (job.hirer && typeof job.hirer === 'object') {
    if (job.hirer.firstName && job.hirer.lastName)
      return `${job.hirer.firstName} ${job.hirer.lastName}`;
    if (job.hirer.name) return job.hirer.name;
  }
  if (job.hirer_name) return job.hirer_name;
  return 'Employer';
};

// Format budget display
const formatBudget = (job) => {
  if (!job) return 'Not specified';
  const b = job.budget;
  const currency = job.currency === 'GHS' ? 'GH₵' : (job.currency || 'GH₵');
  if (!b && b !== 0) return 'Not specified';
  if (typeof b === 'number') return `${currency} ${b.toLocaleString()}`;
  if (typeof b === 'object') {
    if (b.min && b.max && b.min !== b.max)
      return `${b.currency || currency} ${b.min.toLocaleString()} – ${b.max.toLocaleString()}`;
    const amount = b.amount || b.min || b.max || 0;
    return `${b.currency || currency} ${amount.toLocaleString()}`;
  }
  return 'Not specified';
};

const JobApplicationForm = () => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('sm');
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Application form state — field names match Application model
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    proposedRate: '',
    availability: 'immediate',
    experience: '',
    portfolio: '',
    additionalInfo: '',
  });

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      setLoading(true);
      setError(null);
      try {
        // FIX-001: Use /jobs/:id — api client already prepends /api
        const response = await api.get(`/jobs/${jobId}`);
        const data = response.data?.data || response.data;
        if (data) {
          setJob(data);
          // Pre-fill proposed rate from job budget
          const budgetHint =
            typeof data.budget === 'number'
              ? data.budget
              : data.budget?.amount || data.budget?.min || '';
          setApplicationData((prev) => ({
            ...prev,
            proposedRate: budgetHint ? String(budgetHint) : '',
          }));
        } else {
          setError('Job not found or no longer available');
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error fetching job:', err);
        setError(
          err.response?.data?.message ||
            'Could not load job details. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, location.pathname]);

  const handleInputChange = (field) => (event) => {
    setApplicationData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate with clear messages for vocational workers
      if (!applicationData.coverLetter.trim()) {
        throw new Error(
          'Please tell the employer why you are good for this job',
        );
      }
      if (
        !applicationData.proposedRate ||
        Number(applicationData.proposedRate) <= 0
      ) {
        throw new Error('Please enter how much you want to be paid');
      }

      // FIX-003: Send proposedRate (matches Application schema)
      const submissionData = {
        proposedRate: parseFloat(applicationData.proposedRate),
        coverLetter: applicationData.coverLetter.trim(),
        estimatedDuration:
          applicationData.availability === 'immediate'
            ? { value: 1, unit: 'week' }
            : applicationData.availability === '1week'
              ? { value: 1, unit: 'week' }
              : applicationData.availability === '2weeks'
                ? { value: 2, unit: 'week' }
                : { value: 1, unit: 'month' },
      };

      // FIX-001: Correct path — no double /api
      const response = await api.post(`/jobs/${jobId}/apply`, submissionData);

      if (response.data) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard', {
            state: { message: 'Your application was sent!' },
          });
        }, 3000);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Submit error:', err);
      const serverMsg =
        err.response?.data?.message || err.response?.data?.error?.message;
      if (serverMsg?.includes('already applied')) {
        setError(
          'You have already applied for this job. Check your dashboard for updates.',
        );
      } else {
        setError(
          serverMsg || err.message || 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading ---
  if (loading) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ color: '#D4AF37' }} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading job details...
        </Typography>
      </Container>
    );
  }

  // --- Error (no job loaded) ---
  if (!job && error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
          sx={{
            bgcolor: '#D4AF37',
            color: '#000',
            '&:hover': { bgcolor: '#B8941F' },
          }}
        >
          Back to Jobs
        </Button>
      </Container>
    );
  }

  // --- No job ---
  if (!job) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          Job not found. It may have been removed.
        </Alert>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
        >
          Back to Jobs
        </Button>
      </Container>
    );
  }

  // --- Success ---
  if (success) {
    return (
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Application Sent!
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Your application for &quot;{job.title}&quot; has been sent to{' '}
            {getHirerName(job)}.
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            The employer will review your application and contact you. Check
            your dashboard for updates.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              sx={{
                bgcolor: '#D4AF37',
                color: '#000',
                '&:hover': { bgcolor: '#B8941F' },
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/jobs')}
              sx={{ borderColor: '#D4AF37', color: '#D4AF37' }}
            >
              Browse More Jobs
            </Button>
          </Box>
          <CircularProgress size={30} sx={{ mt: 3, color: '#D4AF37' }} />
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Going to your dashboard...
          </Typography>
        </motion.div>
      </Container>
    );
  }

  // FIX-005: Safe data extraction
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const hirerName = getHirerName(job);
  const locationLabel = formatLocation(job.location || job.locationDetails);
  const budgetLabel = formatBudget(job);
  const deadline = job.expiresAt || job.bidding?.bidDeadline || job.endDate;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to="/jobs"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowBackIcon fontSize="small" />
          Jobs
        </Link>
        <Link
          component={RouterLink}
          to={`/jobs/${jobId}`}
          underline="hover"
          color="inherit"
        >
          {job.title || 'Job'}
        </Link>
        <Typography color="text.primary">Apply</Typography>
      </Breadcrumbs>

      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Job Summary Card */}
        <Grid item xs={12} md={4} order={{ xs: 1, md: 1 }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              sx={{
                position: { md: 'sticky' },
                top: { md: 80 },
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  sx={{ mb: 2, color: '#D4AF37' }}
                >
                  {job.title}
                </Typography>

                {/* FIX-002: Hirer data, not company */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={job.hirer?.profileImage || job.hirer?.avatar}
                    sx={{
                      width: 44,
                      height: 44,
                      mr: 1.5,
                      bgcolor: '#D4AF37',
                      color: '#000',
                    }}
                  >
                    {hirerName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {hirerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Employer
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 1, color: '#4caf50' }} />
                    <Typography variant="body1" fontWeight={600}>
                      {budgetLabel}
                    </Typography>
                  </Box>

                  {job.category && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ mr: 1, color: '#D4AF37' }} />
                      <Typography>{job.category}</Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon
                      sx={{ mr: 1, color: theme.palette.info.main }}
                    />
                    <Typography>{locationLabel}</Typography>
                  </Box>

                  {job.paymentType && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkIcon
                        sx={{ mr: 1, color: theme.palette.primary.main }}
                      />
                      <Typography sx={{ textTransform: 'capitalize' }}>
                        {job.paymentType} pay
                      </Typography>
                    </Box>
                  )}

                  {deadline && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ClockIcon
                        sx={{ mr: 1, color: theme.palette.warning.main }}
                      />
                      <Typography>
                        Deadline: {new Date(deadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {skills.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, fontWeight: 600 }}
                    >
                      Skills Needed:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {skills.map((skill, i) => (
                        <Chip
                          key={`${typeof skill === 'string' ? skill : skill?.name || 'skill'}-${i}`}
                          label={
                            typeof skill === 'string'
                              ? skill
                              : skill?.name || 'Skill'
                          }
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#D4AF37', color: '#D4AF37' }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Application Form */}
        <Grid item xs={12} md={8} order={{ xs: 2, md: 2 }}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Paper
              sx={{
                p: { xs: 2, sm: 4 },
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                Apply for this Job
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Fill in the details below. The employer will see your profile
                and this application.
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                Keep your message short and clear: mention your relevant experience,
                your expected price, and when you can start.
              </Alert>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Cover Letter */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={isMobile ? 4 : 6}
                      label="Why should you be hired? *"
                      placeholder="Tell the employer about your experience and why you are right for this job. Example: I have 5 years experience in masonry work and have completed over 20 building projects in Accra."
                      value={applicationData.coverLetter}
                      onChange={handleInputChange('coverLetter')}
                      required
                      inputProps={{ 'aria-label': 'Application cover letter' }}
                      helperText="Use simple, specific details from similar jobs you have completed."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment
                            position="start"
                            sx={{ alignSelf: 'flex-start', mt: 1.5 }}
                          >
                            <EditIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {/* Proposed Rate — FIX-003 */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Price (GH₵) *"
                      type="number"
                      placeholder="e.g., 2000"
                      value={applicationData.proposedRate}
                      onChange={handleInputChange('proposedRate')}
                      required
                      inputProps={{ min: 0, inputMode: 'decimal', 'aria-label': 'Proposed rate in Ghana cedis' }}
                      helperText={`Job budget: ${budgetLabel}. Enter your realistic expected price.`}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon color="action" sx={{ mr: 0.5 }} />
                            GH₵
                          </InputAdornment>
                        ),
                      }}
                      
                    />
                  </Grid>

                  {/* Availability */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>When can you start?</InputLabel>
                      <Select
                        value={applicationData.availability}
                        onChange={handleInputChange('availability')}
                        label="When can you start?"
                      >
                        <MenuItem value="immediate">Right away</MenuItem>
                        <MenuItem value="1week">In 1 week</MenuItem>
                        <MenuItem value="2weeks">In 2 weeks</MenuItem>
                        <MenuItem value="1month">In 1 month</MenuItem>
                        <MenuItem value="negotiable">We can discuss</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Experience */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Years of experience</InputLabel>
                      <Select
                        value={applicationData.experience}
                        onChange={handleInputChange('experience')}
                        label="Years of experience"
                      >
                        <MenuItem value="0-1">Less than 1 year</MenuItem>
                        <MenuItem value="2-3">2–3 years</MenuItem>
                        <MenuItem value="4-5">4–5 years</MenuItem>
                        <MenuItem value="6-10">6–10 years</MenuItem>
                        <MenuItem value="10+">More than 10 years</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Portfolio */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Links to your work (optional)"
                      placeholder="Share links to photos or videos of your past work..."
                      value={applicationData.portfolio}
                      onChange={handleInputChange('portfolio')}
                      helperText="If you have photos of your work online, share the link here"
                    />
                  </Grid>

                  {/* Additional Info */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Anything else? (optional)"
                      placeholder="Any other information the employer should know..."
                      value={applicationData.additionalInfo}
                      onChange={handleInputChange('additionalInfo')}
                      helperText="Optional: mention transport readiness, team size, or equipment availability."
                    />
                  </Grid>

                  {/* Submit */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: { xs: 'stretch', sm: 'flex-end' },
                        flexDirection: { xs: 'column-reverse', sm: 'row' },
                      }}
                    >
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/jobs/${jobId}`)}
                        disabled={submitting}
                        sx={{ minHeight: 48, borderColor: 'divider' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={
                          submitting ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <SendIcon />
                          )
                        }
                        aria-label="Send job application"
                        disabled={submitting}
                        sx={{
                          minHeight: 52,
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          bgcolor: '#D4AF37',
                          color: '#000',
                          '&:hover': { bgcolor: '#B8941F' },
                        }}
                      >
                        {submitting ? 'Sending...' : 'Send Application'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default JobApplicationForm;
