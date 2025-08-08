/**
 * Enhanced Mobile Registration Component
 * 
 * A streamlined, single-page mobile registration experience with:
 * - Progressive form sections
 * - Smart field validation
 * - Role-based field revelation
 * - Enhanced visual design
 * - Better accessibility
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Divider,
  Stack,
  Fade,
  Chip,
  Autocomplete,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Ghana phone number validation
const validateGhanaPhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, '');
  return /^(\+233|0)[0-9]{9}$/.test(cleaned);
};

// Password strength checker
const checkPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

// Common trades/skills in Ghana
const COMMON_TRADES = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Mason',
  'Painter',
  'Mechanic',
  'Welder',
  'Tailor',
  'Barber',
  'Hairdresser',
  'Cook',
  'Cleaner',
  'Security Guard',
  'Driver',
  'Gardener',
  'HVAC Technician',
  'Tiler',
  'Roofer',
  'Blacksmith',
  'Electronics Repair',
];

const MobileRegister = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register, loading: authLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    companyName: '',
    trades: [],
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    let value = event.target.value;
    
    if (field === 'acceptTerms') {
      value = event.target.checked;
    } else if (field === 'phone') {
      // Format phone number
      value = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }

    // Update password strength
    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // Handle role selection
  const handleRoleChange = (event) => {
    const role = event.target.value;
    setFormData(prev => ({ ...prev, role }));
    setErrors(prev => ({ ...prev, role: '' }));
  };

  // Handle trades selection
  const handleTradesChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, trades: newValue }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Basic info validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateGhanaPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Ghana phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      newErrors.password = 'Please choose a stronger password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select your account type';
    }

    // Role-specific validation
    if (formData.role === 'hirer' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.role === 'worker' && formData.trades.length === 0) {
      newErrors.trades = 'Please select at least one trade/skill';
    }

    // Terms validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\s/g, ''),
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'hirer' && { companyName: formData.companyName.trim() }),
        ...(formData.role === 'worker' && { trades: formData.trades }),
        acceptTerms: formData.acceptTerms,
      };

      await register(userData);

      // Show success state
      setShowSuccess(true);

      // Navigate to login after delay
      setTimeout(() => {
        navigate('/login', {
          state: {
            registered: true,
            message: 'Registration successful! Please check your email to verify your account.',
          },
        });
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#f44336';
    if (passwordStrength <= 3) return '#ff9800';
    return '#4caf50';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)
          `,
          zIndex: 0,
        }}
      />

      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pt: { xs: 4, sm: 2 },
        }}
      >
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            color: '#FFD700',
            fontWeight: 700,
            fontSize: '20px',
            textAlign: 'center',
            flex: 1,
            pr: 6,
          }}
        >
          Join Kelmah
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          px: 3,
          py: 2,
          position: 'relative',
          zIndex: 2,
          overflow: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              maxWidth: 500,
              mx: 'auto',
              width: '100%',
              mb: 4,
            }}
          >
            {/* Welcome Text */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '24px', sm: '28px' },
                  mb: 1,
                }}
              >
                Create Account
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '16px',
                }}
              >
                Join Ghana's premier skilled trades platform
              </Typography>
            </Box>

            {/* Success State */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Alert
                    severity="success"
                    icon={<CheckCircleIcon />}
                    sx={{
                      mb: 3,
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: '#4caf50',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      borderRadius: 2,
                    }}
                  >
                    Registration successful! Redirecting to login...
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Alert */}
            <Fade in={Boolean(submitError)}>
              <Box>
                {submitError && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      color: '#f44336',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      borderRadius: 2,
                    }}
                  >
                    {submitError}
                  </Alert>
                )}
              </Box>
            </Fade>

            {/* Registration Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Account Type Selection */}
                <FormControl error={Boolean(errors.role)}>
                  <FormLabel sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                    I want to:
                  </FormLabel>
                  <RadioGroup
                    value={formData.role}
                    onChange={handleRoleChange}
                    sx={{ flexDirection: 'row', gap: 1 }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        flex: 1,
                        background: formData.role === 'worker' 
                          ? 'rgba(255, 215, 0, 0.1)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: formData.role === 'worker' 
                          ? '2px solid #FFD700' 
                          : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        cursor: 'pointer',
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, role: 'worker' }))}
                    >
                      <FormControlLabel
                        value="worker"
                        control={<Radio sx={{ color: '#FFD700' }} />}
                        label={
                          <Box>
                            <WorkIcon sx={{ color: '#FFD700', mb: 1 }} />
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>
                              Find Work
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                              As a skilled worker
                            </Typography>
                          </Box>
                        }
                        sx={{ margin: 0, width: '100%' }}
                      />
                    </Paper>

                    <Paper
                      sx={{
                        p: 2,
                        flex: 1,
                        background: formData.role === 'hirer' 
                          ? 'rgba(255, 215, 0, 0.1)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: formData.role === 'hirer' 
                          ? '2px solid #FFD700' 
                          : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        cursor: 'pointer',
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, role: 'hirer' }))}
                    >
                      <FormControlLabel
                        value="hirer"
                        control={<Radio sx={{ color: '#FFD700' }} />}
                        label={
                          <Box>
                            <BusinessIcon sx={{ color: '#FFD700', mb: 1 }} />
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>
                              Hire Workers
                            </Typography>
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                              As a business/hirer
                            </Typography>
                          </Box>
                        }
                        sx={{ margin: 0, width: '100%' }}
                      />
                    </Paper>
                  </RadioGroup>
                  {errors.role && (
                    <Typography sx={{ color: '#f44336', fontSize: '12px', mt: 1 }}>
                      {errors.role}
                    </Typography>
                  )}
                </FormControl>

                {/* Personal Information */}
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                    Personal Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    {/* Name Fields */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange('firstName')}
                        error={Boolean(errors.firstName)}
                        helperText={errors.firstName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                          '& .MuiOutlinedInput-input': { color: 'white' },
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange('lastName')}
                        error={Boolean(errors.lastName)}
                        helperText={errors.lastName}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                          '& .MuiOutlinedInput-input': { color: 'white' },
                        }}
                      />
                    </Box>

                    {/* Email Field */}
                    <TextField
                      fullWidth
                      type="email"
                      label="Email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      error={Boolean(errors.email)}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiOutlinedInput-input': { color: 'white' },
                      }}
                    />

                    {/* Phone Field */}
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      error={Boolean(errors.phone)}
                      helperText={errors.phone || 'Ghana phone number (e.g., 0XX XXX XXXX)'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiOutlinedInput-input': { color: 'white' },
                      }}
                    />
                  </Stack>
                </Box>

                {/* Role-specific fields */}
                <AnimatePresence>
                  {formData.role === 'hirer' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <TextField
                        fullWidth
                        label="Company Name"
                        value={formData.companyName}
                        onChange={handleInputChange('companyName')}
                        error={Boolean(errors.companyName)}
                        helperText={errors.companyName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                          '& .MuiOutlinedInput-input': { color: 'white' },
                        }}
                      />
                    </motion.div>
                  )}

                  {formData.role === 'worker' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                          Your Trades/Skills
                        </Typography>
                        <Autocomplete
                          multiple
                          options={COMMON_TRADES}
                          value={formData.trades}
                          onChange={handleTradesChange}
                          freeSolo
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                key={index}
                                variant="outlined"
                                label={option}
                                {...getTagProps({ index })}
                                sx={{
                                  color: '#FFD700',
                                  borderColor: '#FFD700',
                                  '& .MuiChip-deleteIcon': { color: '#FFD700' },
                                }}
                              />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Select or type your trades/skills"
                              error={Boolean(errors.trades)}
                              helperText={errors.trades || 'Select multiple trades/skills'}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  borderRadius: 2,
                                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                  '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                                  '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                                },
                                '& .MuiOutlinedInput-input': { color: 'white' },
                              }}
                            />
                          )}
                        />
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password Fields */}
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                    Security
                  </Typography>
                  
                  <Stack spacing={2}>
                    {/* Password Field */}
                    <Box>
                      <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        label="Password"
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        error={Boolean(errors.password)}
                        helperText={errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                          '& .MuiOutlinedInput-input': { color: 'white' },
                        }}
                      />
                      
                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              flex: 1,
                              height: 4,
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${(passwordStrength / 5) * 100}%`,
                                height: '100%',
                                backgroundColor: getPasswordStrengthColor(),
                                transition: 'all 0.3s ease',
                              }}
                            />
                          </Box>
                          <Typography
                            sx={{
                              color: getPasswordStrengthColor(),
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            {getPasswordStrengthText()}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Confirm Password Field */}
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      error={Boolean(errors.confirmPassword)}
                      helperText={errors.confirmPassword}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                          '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                        '& .MuiOutlinedInput-input': { color: 'white' },
                      }}
                    />
                  </Stack>
                </Box>

                {/* Terms and Conditions */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.acceptTerms}
                      onChange={handleInputChange('acceptTerms')}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        '&.Mui-checked': { color: '#FFD700' },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                      I agree to the{' '}
                      <Button
                        component={RouterLink}
                        to="/terms"
                        sx={{
                          color: '#FFD700',
                          textDecoration: 'underline',
                          fontSize: '14px',
                          p: 0,
                          minWidth: 'auto',
                        }}
                      >
                        Terms and Conditions
                      </Button>
                      {' '}and{' '}
                      <Button
                        component={RouterLink}
                        to="/privacy"
                        sx={{
                          color: '#FFD700',
                          textDecoration: 'underline',
                          fontSize: '14px',
                          p: 0,
                          minWidth: 'auto',
                        }}
                      >
                        Privacy Policy
                      </Button>
                    </Typography>
                  }
                />

                {errors.acceptTerms && (
                  <Typography sx={{ color: '#f44336', fontSize: '12px', mt: -2 }}>
                    {errors.acceptTerms}
                  </Typography>
                )}

                {/* Register Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting || authLoading}
                  sx={{
                    height: 56,
                    borderRadius: 2,
                    fontSize: '16px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                    color: '#000',
                    mt: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 215, 0, 0.3)',
                      color: 'rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  {isSubmitting || authLoading ? (
                    <CircularProgress size={24} sx={{ color: '#000' }} />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Stack>
            </Box>

            {/* Divider */}
            <Box sx={{ my: 3 }}>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', px: 2 }}>
                  or continue with
                </Typography>
              </Divider>
            </Box>

            {/* Social Login */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{
                height: 48,
                borderRadius: 2,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                },
              }}
            >
              Continue with Google
            </Button>

            {/* Sign In Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Already have an account?{' '}
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#FFD700',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default MobileRegister;









