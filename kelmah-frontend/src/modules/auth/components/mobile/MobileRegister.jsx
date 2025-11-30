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
import { useDispatch, useSelector } from 'react-redux';
import {
  register as registerAction,
  selectAuthLoading,
  selectAuthError,
} from '../../services/authSlice';

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
  const dispatch = useDispatch();
  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

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

  useEffect(() => {
    if (authError) {
      setSubmitError(authError);
    }
  }, [authError]);

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    let value = event.target.value;

    if (field === 'acceptTerms') {
      value = event.target.checked;
    } else if (field === 'phone') {
      // Format phone number
      value = value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
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
    setFormData((prev) => ({ ...prev, role }));
    setErrors((prev) => ({ ...prev, role: '' }));
  };

  // Handle trades selection
  const handleTradesChange = (event, newValue) => {
    setFormData((prev) => ({ ...prev, trades: newValue }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Basic info validation
    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required';
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
        ...(formData.role === 'hirer' && {
          companyName: formData.companyName.trim(),
        }),
        ...(formData.role === 'worker' && { trades: formData.trades }),
        acceptTerms: formData.acceptTerms,
      };

      await dispatch(registerAction(userData)).unwrap();

      // Show success state
      setShowSuccess(true);

      // Navigate to login after delay
      setTimeout(() => {
        navigate('/login', {
          state: {
            registered: true,
            message:
              'Registration successful! Please check your email to verify your account.',
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
        overflowX: 'hidden',
        overflowY: 'auto',
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
          p: 1.5,
          pt: 2,
          flexShrink: 0,
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
            fontSize: '18px',
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
          px: 2,
          py: 1,
          pb: 4,
          position: 'relative',
          zIndex: 2,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
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
              p: 2,
              borderRadius: 3,
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              maxWidth: 500,
              mx: 'auto',
              width: '100%',
              mb: 2,
            }}
          >
            {/* Welcome Text */}
            <Box sx={{ textAlign: 'center', mb: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '16px',
                  mb: 0.5,
                }}
              >
                Create Account
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11px',
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
              <Stack spacing={1}>
                {/* Personal Information */}
                <Box>
                  <Stack spacing={1}>
                    {/* Name Fields */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange('firstName')}
                        error={Boolean(errors.firstName)}
                        helperText={errors.firstName}
                        size="small"
                        placeholder="Enter first name"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 215, 0, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFD700',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '12px',
                            fontWeight: 500,
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#FFD700',
                          },
                          '& .MuiInputLabel-root.MuiFormLabel-filled': {
                            color: '#FFD700',
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                            fontSize: '12px',
                          },
                          '& .MuiOutlinedInput-input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            opacity: 1,
                          },
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange('lastName')}
                        error={Boolean(errors.lastName)}
                        helperText={errors.lastName}
                        size="small"
                        placeholder="Enter last name"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 215, 0, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFD700',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '12px',
                            fontWeight: 500,
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#FFD700',
                          },
                          '& .MuiInputLabel-root.MuiFormLabel-filled': {
                            color: '#FFD700',
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white',
                            fontSize: '12px',
                          },
                          '& .MuiOutlinedInput-input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.6)',
                            opacity: 1,
                          },
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
                      size="small"
                      placeholder="Enter your email"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 215, 0, 0.5)',
                          },
                          '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '12px',
                          fontWeight: 500,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#FFD700',
                        },
                        '& .MuiInputLabel-root.MuiFormLabel-filled': {
                          color: '#FFD700',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white',
                          fontSize: '12px',
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                          color: 'rgba(255, 255, 255, 0.6)',
                          opacity: 1,
                        },
                      }}
                    />

                    {/* Phone Field */}
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange('phone')}
                      error={Boolean(errors.phone)}
                      helperText={
                        errors.phone ||
                        'Ghana phone number (e.g., 0XX XXX XXXX)'
                      }
                      size="small"
                      placeholder="Enter phone number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 215, 0, 0.5)',
                          },
                          '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '12px',
                          fontWeight: 500,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#FFD700',
                        },
                        '& .MuiInputLabel-root.MuiFormLabel-filled': {
                          color: '#FFD700',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white',
                          fontSize: '12px',
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                          color: 'rgba(255, 255, 255, 0.6)',
                          opacity: 1,
                        },
                      }}
                    />
                  </Stack>
                </Box>

                {/* Password Fields */}
                <Box>
                  <Stack spacing={1}>
                    {/* Password Field */}
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      error={Boolean(errors.password)}
                      helperText={errors.password}
                      size="small"
                      placeholder="Enter password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              sx={{ color: 'rgba(255, 255, 255, 0.5)', p: 0.5 }}
                              size="small"
                            >
                              {showPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 215, 0, 0.5)',
                          },
                          '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '12px',
                          fontWeight: 500,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#FFD700',
                        },
                        '& .MuiInputLabel-root.MuiFormLabel-filled': {
                          color: '#FFD700',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white',
                          fontSize: '12px',
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                          color: 'rgba(255, 255, 255, 0.6)',
                          opacity: 1,
                        },
                      }}
                    />

                    {/* Confirm Password Field */}
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      error={Boolean(errors.confirmPassword)}
                      helperText={errors.confirmPassword}
                      size="small"
                      placeholder="Confirm password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              sx={{ color: 'rgba(255, 255, 255, 0.5)', p: 0.5 }}
                              size="small"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 215, 0, 0.5)',
                          },
                          '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '12px',
                          fontWeight: 500,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#FFD700',
                        },
                        '& .MuiInputLabel-root.MuiFormLabel-filled': {
                          color: '#FFD700',
                        },
                        '& .MuiOutlinedInput-input': {
                          color: 'white',
                          fontSize: '12px',
                        },
                        '& .MuiOutlinedInput-input::placeholder': {
                          color: 'rgba(255, 255, 255, 0.6)',
                          opacity: 1,
                        },
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
                      size="small"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        '&.Mui-checked': { color: '#FFD700' },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '10px',
                      }}
                    >
                      I agree to the{' '}
                      <Button
                        component={RouterLink}
                        to="/terms"
                        sx={{
                          color: '#FFD700',
                          textDecoration: 'underline',
                          fontSize: '10px',
                          p: 0,
                          minWidth: 'auto',
                        }}
                      >
                        Terms
                      </Button>{' '}
                      and{' '}
                      <Button
                        component={RouterLink}
                        to="/privacy"
                        sx={{
                          color: '#FFD700',
                          textDecoration: 'underline',
                          fontSize: '10px',
                          p: 0,
                          minWidth: 'auto',
                        }}
                      >
                        Privacy
                      </Button>
                    </Typography>
                  }
                />

                {errors.acceptTerms && (
                  <Typography
                    sx={{ color: '#f44336', fontSize: '10px', mt: -1 }}
                  >
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
                    height: 40,
                    borderRadius: 2,
                    fontSize: '12px',
                    fontWeight: 600,
                    background:
                      'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                    color: '#000',
                    mt: 0.5,
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(255, 215, 0, 0.3)',
                      color: 'rgba(0, 0, 0, 0.5)',
                    },
                  }}
                >
                  {isSubmitting || authLoading ? (
                    <CircularProgress size={18} sx={{ color: '#000' }} />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Stack>
            </Box>

            {/* Sign In Link */}
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography
                sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '10px' }}
              >
                Already have an account?{' '}
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#FFD700',
                    textDecoration: 'none',
                    fontSize: '10px',
                    fontWeight: 600,
                    p: 0.5,
                    minWidth: 'auto',
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
