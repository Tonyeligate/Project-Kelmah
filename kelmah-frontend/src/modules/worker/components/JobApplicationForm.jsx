/**
 * Job Application Form Component
 * Handles the complete job application process
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const JobApplicationForm = () => {
  console.log('🎯 JobApplicationForm component rendering...');
  const theme = useTheme();
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Application form state
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    expectedSalary: '',
    availability: 'immediate',
    experience: '',
    portfolio: '',
    references: '',
    additionalInfo: '',
  });

  // Sample job data (in real app, this would come from API)
  const sampleJob = {
    id: jobId,
    title: 'Senior Electrical Engineer - Commercial Projects',
    company: {
      name: 'PowerTech Solutions Ghana',
      logo: null,
    },
    location: 'Accra, Greater Accra',
    type: 'Full-time',
    budget: { min: 3500, max: 5500, type: 'monthly', currency: 'GHS' },
    description: 'Seeking certified electrician for high-rise commercial installations. Must have 5+ years experience with industrial wiring and safety protocols.',
    skills: ['Electrical Installation', 'Industrial Wiring', 'Safety Protocols', 'Project Management', 'Team Leadership'],
    benefits: ['Health Insurance', 'Company Vehicle', 'Tool Allowance', 'Performance Bonus'],
    postedDate: new Date('2024-01-11'),
    applyBy: new Date('2024-09-08'),
    urgency: 'high'
  };

  useEffect(() => {
    console.log('🎯 JobApplicationForm mounted with jobId:', jobId);
    console.log('📍 Current location:', location.pathname);
    // In a real app, fetch job details from API
    setJob(sampleJob);
  }, [jobId, location.pathname]);

  const handleInputChange = (field) => (event) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!applicationData.coverLetter.trim()) {
        throw new Error('Cover letter is required');
      }
      if (!applicationData.expectedSalary.trim()) {
        throw new Error('Expected salary is required');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('📝 Application submitted:', {
        jobId,
        applicationData,
        timestamp: new Date().toISOString()
      });

      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/worker/applications', { 
          state: { 
            message: 'Application submitted successfully!',
            applicationId: `APP-${Date.now()}`
          }
        });
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading job details...
        </Typography>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          Job not found. Please check the job ID and try again.
        </Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" color="success.main" sx={{ mb: 2 }}>
              ✅ Application Submitted!
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Your application has been sent to {job.company.name}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              You will receive a confirmation email shortly. The employer will review your application and contact you if you're selected for an interview.
            </Typography>
          </Box>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Redirecting to your applications...
          </Typography>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/jobs"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <ArrowBackIcon fontSize="small" />
          Back to Jobs
        </Link>
        <Typography color="text.primary">Apply for Job</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Job Details Card */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                  {job.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                    {job.company.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{job.company.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {job.location}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MoneyIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                    <Typography>
                      {job.budget ? (
                        typeof job.budget === 'object' ? (
                          `GH₵${job.budget.min} - ${job.budget.max} ${job.budget.type}`
                        ) : (
                          `GH₵${job.budget} ${job.paymentType === 'hourly' ? 'per hour' : 'fixed'}`
                        )
                      ) : (
                        'Salary not specified'
                      )}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WorkIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    <Typography>{job.type}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                    <Typography>{job.location}</Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ mb: 1 }}>
                  Required Skills:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {job.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  <strong>Apply by:</strong> {format(new Date(job.applyBy), 'MMM dd, yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Application Form */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper sx={{ p: 4 }}>
              <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
                Apply for this Position
              </Typography>

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
                      rows={6}
                      label="Cover Letter *"
                      placeholder="Tell the employer why you're the perfect fit for this role. Highlight your relevant experience, skills, and enthusiasm for the position..."
                      value={applicationData.coverLetter}
                      onChange={handleInputChange('coverLetter')}
                      required
                      helperText="This is your chance to make a great first impression. Be specific about your qualifications and interest in the role."
                    />
                  </Grid>

                  {/* Expected Salary */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expected Salary (GHS) *"
                      type="number"
                      placeholder="e.g., 4000"
                      value={applicationData.expectedSalary}
                      onChange={handleInputChange('expectedSalary')}
                      required
                      helperText={job.budget ? (
                        typeof job.budget === 'object' ? (
                          `Job offers GH₵${job.budget.min} - ${job.budget.max}`
                        ) : (
                          `Job offers GH₵${job.budget}`
                        )
                      ) : (
                        'Job salary not specified'
                      )}
                    />
                  </Grid>

                  {/* Availability */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Availability</InputLabel>
                      <Select
                        value={applicationData.availability}
                        onChange={handleInputChange('availability')}
                        label="Availability"
                      >
                        <MenuItem value="immediate">Immediate</MenuItem>
                        <MenuItem value="1week">1 Week Notice</MenuItem>
                        <MenuItem value="2weeks">2 Weeks Notice</MenuItem>
                        <MenuItem value="1month">1 Month Notice</MenuItem>
                        <MenuItem value="negotiable">Negotiable</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Years of Experience */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Years of Experience</InputLabel>
                      <Select
                        value={applicationData.experience}
                        onChange={handleInputChange('experience')}
                        label="Years of Experience"
                      >
                        <MenuItem value="0-1">0-1 years</MenuItem>
                        <MenuItem value="2-3">2-3 years</MenuItem>
                        <MenuItem value="4-5">4-5 years</MenuItem>
                        <MenuItem value="6-10">6-10 years</MenuItem>
                        <MenuItem value="10+">10+ years</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Portfolio/Work Samples */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Portfolio/Work Samples"
                      placeholder="Share links to your portfolio, previous work, or projects that demonstrate your skills..."
                      value={applicationData.portfolio}
                      onChange={handleInputChange('portfolio')}
                      helperText="Include links to your best work, GitHub profile, or portfolio website"
                    />
                  </Grid>

                  {/* References */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="References"
                      placeholder="Provide contact information for 2-3 professional references..."
                      value={applicationData.references}
                      onChange={handleInputChange('references')}
                      helperText="Include name, position, company, and contact information"
                    />
                  </Grid>

                  {/* Additional Information */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Additional Information"
                      placeholder="Any additional information you'd like to share with the employer..."
                      value={applicationData.additionalInfo}
                      onChange={handleInputChange('additionalInfo')}
                      helperText="Optional: Share any other relevant information about yourself"
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/jobs')}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                        disabled={submitting}
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                          },
                        }}
                      >
                        {submitting ? 'Submitting...' : 'Submit Application'}
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
