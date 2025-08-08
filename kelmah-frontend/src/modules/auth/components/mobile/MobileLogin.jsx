/**
 * Enhanced Mobile Login Component
 * 
 * A modern, user-friendly mobile login experience with:
 * - Improved visual design and spacing
 * - Better error handling and user feedback
 * - Social login integration
 * - Enhanced accessibility
 * - Loading states and animations
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
  Divider,
  Stack,
  Fade,
  Slide,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Google as GoogleIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const MobileLogin = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (field) => (event) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      await login({
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      // Show success state briefly
      setShowSuccess(true);
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setSubmitError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle social login
  const handleSocialLogin = (provider) => {
    console.log(`Social login with ${provider}`);
    // TODO: Implement social login
    setSubmitError(`${provider} login is coming soon!`);
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
            pr: 6, // Balance the back button
          }}
        >
          Kelmah
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 3,
          py: 2,
          position: 'relative',
          zIndex: 2,
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
              maxWidth: 400,
              mx: 'auto',
              width: '100%',
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
                Welcome back
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '16px',
                }}
              >
                Sign in to continue to Kelmah
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
                    Login successful! Redirecting...
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
                      '& .MuiAlert-icon': { color: '#f44336' },
                    }}
                  >
                    {submitError}
                  </Alert>
                )}
              </Box>
            </Fade>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
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
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                />

                {/* Password Field */}
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
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiOutlinedInput-input': {
                      color: 'white',
                    },
                  }}
                />

                {/* Remember Me & Forgot Password */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.rememberMe}
                        onChange={handleInputChange('rememberMe')}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          '&.Mui-checked': {
                            color: '#FFD700',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                        Remember me
                      </Typography>
                    }
                  />

                  <Button
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{
                      color: '#FFD700',
                      textDecoration: 'none',
                      fontSize: '14px',
                      '&:hover': {
                        textDecoration: 'underline',
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    Forgot Password?
                  </Button>
                </Box>

                {/* Login Button */}
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
                    'Sign In'
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
              onClick={() => handleSocialLogin('Google')}
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

            {/* Sign Up Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Don't have an account?{' '}
                <Button
                  component={RouterLink}
                  to="/register"
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
                  Sign Up
                </Button>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default MobileLogin;





