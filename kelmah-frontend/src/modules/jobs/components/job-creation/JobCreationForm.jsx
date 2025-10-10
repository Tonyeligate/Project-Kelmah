import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Slider,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Skills as SkillsIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { createJob } from '../../services/jobSlice';

const JobCreationForm = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      skills: [],
      budget: 0,
      currency: 'GHS',
      paymentType: 'fixed',
      location: {
        type: 'on-site',
        address: '',
        city: '',
        region: '',
        coordinates: null,
      },
      duration: {
        value: 1,
        unit: 'week',
      },
      experienceLevel: 'intermediate',
      urgency: 'normal',
      requirements: [],
      benefits: [],
      remote: false,
      bidding: {
        enabled: false,
        minBidAmount: 0,
        maxBidAmount: 0,
      },
    },
  });

  const watchedBidding = watch('bidding.enabled');
  const watchedPaymentType = watch('paymentType');

  const categories = [
    { value: 'Electrical', label: 'Electrical Work' },
    { value: 'Plumbing', label: 'Plumbing Services' },
    { value: 'Carpentry', label: 'Carpentry & Woodwork' },
    { value: 'HVAC', label: 'HVAC & Climate Control' },
    { value: 'Construction', label: 'Construction & Building' },
    { value: 'Painting', label: 'Painting & Decoration' },
    { value: 'Roofing', label: 'Roofing Services' },
    { value: 'Masonry', label: 'Masonry & Stonework' },
    { value: 'Welding', label: 'Welding Services' },
    { value: 'Flooring', label: 'Flooring Installation' },
  ];

  const skills = [
    'Electrical Installation',
    'Industrial Wiring',
    'Safety Protocols',
    'Circuit Design',
    'Maintenance',
    'Pipe Installation',
    'Water Systems',
    'Drainage',
    'Fixture Installation',
    'Leak Detection',
    'Custom Furniture',
    'Cabinetry',
    'Wood Joinery',
    'Finishing',
    'Design',
    'HVAC Installation',
    'Climate Control',
    'Energy Efficiency',
    'Troubleshooting',
    'Refrigeration',
    'Project Management',
    'Team Leadership',
    'Quality Control',
    'Safety Management',
    'Cost Control',
    'Interior Painting',
    'Exterior Painting',
    'Decorative Finishes',
    'Surface Preparation',
    'Color Consultation',
  ];

  const ghanaRegions = [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Eastern',
    'Central',
    'Volta',
    'Northern',
    'Upper East',
    'Upper West',
    'Brong-Ahafo',
  ];

  const ghanaCities = [
    'Accra',
    'Kumasi',
    'Tema',
    'Takoradi',
    'Tamale',
    'Ho',
    'Koforidua',
    'Cape Coast',
    'Sunyani',
    'Wa',
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Transform data to match backend expectations
      const jobData = {
        ...data,
        hirer: user?.id,
        status: 'open',
        visibility: 'public',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Submitting job data:', jobData);

      const result = await dispatch(createJob(jobData)).unwrap();

      setSuccess(true);
      console.log('Job created successfully:', result);

      // Reset form and close dialog after a short delay
      setTimeout(() => {
        reset();
        setSuccess(false);
        onClose();
        // Navigate to the new job details page
        if (result.job?.id) {
          navigate(`/jobs/${result.job.id}`);
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to create job:', err);
      setError(err.message || 'Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          color: 'white',
          borderRadius: 2,
          border: '1px solid #D4AF37',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #D4AF37',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkIcon sx={{ color: '#D4AF37' }} />
          <Typography
            variant="h6"
            sx={{ color: '#D4AF37', fontWeight: 'bold' }}
          >
            Post a New Job
          </Typography>
        </Box>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ color: '#D4AF37', minWidth: 'auto', p: 1 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity="success"
              sx={{
                mb: 3,
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid #4CAF50',
              }}
            >
              Job created successfully! Redirecting to job details...
            </Alert>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid #F44336',
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Job Title */}
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Job title is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Job Title"
                    placeholder="e.g., Senior Electrical Engineer - Commercial Projects"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: '#D4AF37' },
                        '&:hover fieldset': { borderColor: '#B8941F' },
                        '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
                      },
                      '& .MuiInputLabel-root': { color: '#D4AF37' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#D4AF37' },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Category and Skills */}
            <Grid item xs={12} md={6}>
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel sx={{ color: '#D4AF37' }}>Category</InputLabel>
                    <Select
                      {...field}
                      label="Category"
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#B8941F',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                      }}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    options={skills}
                    freeSolo
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          sx={{
                            color: '#D4AF37',
                            borderColor: '#D4AF37',
                            '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Required Skills"
                        placeholder="Select or type skills"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'white',
                            '& fieldset': { borderColor: '#D4AF37' },
                            '&:hover fieldset': { borderColor: '#B8941F' },
                            '&.Mui-focused fieldset': {
                              borderColor: '#D4AF37',
                            },
                          },
                          '& .MuiInputLabel-root': { color: '#D4AF37' },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#D4AF37',
                          },
                        }}
                      />
                    )}
                    onChange={(_, value) => field.onChange(value)}
                  />
                )}
              />
            </Grid>

            {/* Budget Section */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'rgba(212,175,55,0.05)',
                  border: '1px solid #D4AF37',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#D4AF37',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <MoneyIcon /> Budget & Payment
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#D4AF37' }}>
                            Currency
                          </InputLabel>
                          <Select
                            {...field}
                            label="Currency"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#D4AF37',
                              },
                            }}
                          >
                            <MenuItem value="GHS">GHS (Ghana Cedi)</MenuItem>
                            <MenuItem value="USD">USD (US Dollar)</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="paymentType"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#D4AF37' }}>
                            Payment Type
                          </InputLabel>
                          <Select
                            {...field}
                            label="Payment Type"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#D4AF37',
                              },
                            }}
                          >
                            <MenuItem value="fixed">Fixed Price</MenuItem>
                            <MenuItem value="hourly">Hourly Rate</MenuItem>
                            <MenuItem value="daily">Daily Rate</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="budget"
                      control={control}
                      rules={{
                        required: 'Budget is required',
                        min: {
                          value: 1,
                          message: 'Budget must be greater than 0',
                        },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Budget Amount"
                          placeholder="5000"
                          error={!!errors.budget}
                          helperText={errors.budget?.message}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: '#D4AF37' },
                              '&:hover fieldset': { borderColor: '#B8941F' },
                              '&.Mui-focused fieldset': {
                                borderColor: '#D4AF37',
                              },
                            },
                            '& .MuiInputLabel-root': { color: '#D4AF37' },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#D4AF37',
                            },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Controller
                  name="bidding.enabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#D4AF37',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              { bgcolor: '#D4AF37' },
                          }}
                        />
                      }
                      label="Enable Bidding (Allow workers to submit proposals)"
                      sx={{ color: 'white', mt: 2 }}
                    />
                  )}
                />

                {watchedBidding && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Controller
                        name="bidding.minBidAmount"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Minimum Bid"
                            placeholder="1000"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: '#D4AF37' },
                              },
                              '& .MuiInputLabel-root': { color: '#D4AF37' },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="bidding.maxBidAmount"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label="Maximum Bid"
                            placeholder="10000"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: '#D4AF37' },
                              },
                              '& .MuiInputLabel-root': { color: '#D4AF37' },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                )}
              </Paper>
            </Grid>

            {/* Location Section */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'rgba(212,175,55,0.05)',
                  border: '1px solid #D4AF37',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#D4AF37',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LocationIcon /> Location
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="location.type"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#D4AF37' }}>
                            Work Type
                          </InputLabel>
                          <Select
                            {...field}
                            label="Work Type"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#D4AF37',
                              },
                            }}
                          >
                            <MenuItem value="on-site">On-Site</MenuItem>
                            <MenuItem value="remote">Remote</MenuItem>
                            <MenuItem value="hybrid">Hybrid</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="location.region"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#D4AF37' }}>
                            Region
                          </InputLabel>
                          <Select
                            {...field}
                            label="Region"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#D4AF37',
                              },
                            }}
                          >
                            {ghanaRegions.map((region) => (
                              <MenuItem key={region} value={region}>
                                {region}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="location.city"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="City"
                          placeholder="e.g., Accra"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: '#D4AF37' },
                            },
                            '& .MuiInputLabel-root': { color: '#D4AF37' },
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="location.address"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Full Address"
                          placeholder="e.g., 123 Independence Avenue, Accra, Greater Accra"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: '#D4AF37' },
                            },
                            '& .MuiInputLabel-root': { color: '#D4AF37' },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Job Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Job description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Job Description"
                    placeholder="Describe the job requirements, responsibilities, and what you're looking for in a candidate..."
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: '#D4AF37' },
                        '&:hover fieldset': { borderColor: '#B8941F' },
                        '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
                      },
                      '& .MuiInputLabel-root': { color: '#D4AF37' },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#D4AF37' },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Duration and Experience */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'rgba(212,175,55,0.05)',
                  border: '1px solid #D4AF37',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#D4AF37',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ScheduleIcon /> Duration
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Controller
                      name="duration.value"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Duration"
                          placeholder="1"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: 'white',
                              '& fieldset': { borderColor: '#D4AF37' },
                            },
                            '& .MuiInputLabel-root': { color: '#D4AF37' },
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Controller
                      name="duration.unit"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel sx={{ color: '#D4AF37' }}>
                            Unit
                          </InputLabel>
                          <Select
                            {...field}
                            label="Unit"
                            sx={{
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#D4AF37',
                              },
                            }}
                          >
                            <MenuItem value="hour">Hours</MenuItem>
                            <MenuItem value="day">Days</MenuItem>
                            <MenuItem value="week">Weeks</MenuItem>
                            <MenuItem value="month">Months</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: 'rgba(212,175,55,0.05)',
                  border: '1px solid #D4AF37',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#D4AF37',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SkillsIcon /> Experience Level
                </Typography>

                <Controller
                  name="experienceLevel"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: '#D4AF37' }}>
                        Experience Level
                      </InputLabel>
                      <Select
                        {...field}
                        label="Experience Level"
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#D4AF37',
                          },
                        }}
                      >
                        <MenuItem value="entry">
                          Entry Level (0-2 years)
                        </MenuItem>
                        <MenuItem value="intermediate">
                          Intermediate (2-5 years)
                        </MenuItem>
                        <MenuItem value="senior">Senior (5-10 years)</MenuItem>
                        <MenuItem value="expert">Expert (10+ years)</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Paper>
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #D4AF37' }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ color: '#ccc', mr: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          variant="contained"
          sx={{
            bgcolor: '#D4AF37',
            color: 'black',
            fontWeight: 'bold',
            px: 4,
            '&:hover': { bgcolor: '#B8941F' },
            '&:disabled': { bgcolor: 'rgba(212,175,55,0.3)' },
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: 'black' }} />
              Creating Job...
            </Box>
          ) : (
            'Create Job'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JobCreationForm;
