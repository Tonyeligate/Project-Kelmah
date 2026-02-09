/**
 * Professional Mobile Login Component
 * Clean, minimal design optimized for mobile devices
 */

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login as loginAction } from '../../services/authSlice';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Stack,
  Fade,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import logoIcon from '../../../../assets/images/logo.png';

const MobileLogin = ({ registrationSuccess = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading: authLoading } = useSelector((state) => state.auth);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'At least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await dispatch(
        loginAction({
          email: email.trim(),
          password,
          rememberMe,
        }),
      ).unwrap();

      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (error) {
      setSubmitError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared input styles
  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderRadius: 2,
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.4)' },
      '&.Mui-focused fieldset': { borderColor: '#FFD700', borderWidth: 2 },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
    '& .MuiOutlinedInput-input': {
      color: 'white',
      fontSize: '16px',
      py: 1.5,
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        py: 4,
      }}
    >
      {/* Header with Logo */}
      <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            component="img"
            src={logoIcon}
            alt="Kelmah"
            sx={{
              width: 70,
              height: 70,
              mb: 2,
              borderRadius: '50%',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: '#FFD700',
              fontWeight: 800,
              letterSpacing: 1,
              mb: 0.5,
            }}
          >
            Kelmah
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
            }}
          >
            Ghana's Skilled Trades Platform
          </Typography>
        </motion.div>
      </Box>

      {/* Trade chips */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 0.75,
          mb: 4,
        }}
      >
        {['Verified', 'Skilled', 'Quality'].map((label) => (
          <Chip
            key={label}
            label={label}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              color: '#FFD700',
              fontSize: '11px',
              fontWeight: 600,
              height: 24,
            }}
          />
        ))}
      </Box>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(20, 20, 20, 0.9)',
            borderRadius: 3,
            p: 3,
            border: '1px solid rgba(255, 215, 0, 0.2)',
          }}
        >
          {/* Back button & Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                mr: 1,
                minWidth: 44,
                minHeight: 44,
                '&:hover': { color: '#FFD700' },
              }}
              aria-label="Go back to home"
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography
                variant="h6"
                sx={{ color: 'white', fontWeight: 700, fontSize: '18px' }}
              >
                Welcome back
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                Sign in to continue
              </Typography>
            </Box>
          </Box>

          {/* Success Alert */}
          <AnimatePresence>
            {(showSuccess || registrationSuccess) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon />}
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: '#4caf50',
                    borderRadius: 2,
                    py: 0.5,
                    '& .MuiAlert-message': { fontSize: '13px' },
                  }}
                >
                  {showSuccess ? 'Login successful!' : 'Account created! Please sign in.'}
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
                    mb: 2,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: '#f44336',
                    borderRadius: 2,
                    py: 0.5,
                    '& .MuiAlert-message': { fontSize: '13px' },
                  }}
                >
                  {submitError}
                </Alert>
              )}
            </Box>
          </Fade>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {/* Email */}
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                }}
                error={Boolean(errors.email)}
                helperText={errors.email}
                placeholder="Enter your email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputStyles}
              />

              {/* Password */}
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                }}
                error={Boolean(errors.password)}
                helperText={errors.password}
                placeholder="Enter your password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputStyles}
              />

              {/* Remember & Forgot */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        '&.Mui-checked': { color: '#FFD700' },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                      Remember me
                    </Typography>
                  }
                />
                <Button
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    color: '#FFD700',
                    fontSize: '12px',
                    textTransform: 'none',
                    p: 0,
                    minWidth: 'auto',
                    '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' },
                  }}
                >
                  Forgot Password?
                </Button>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting || authLoading}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                  color: '#000',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                    boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 215, 0, 0.3)',
                    color: 'rgba(0, 0, 0, 0.5)',
                  },
                }}
              >
                {isSubmitting || authLoading ? (
                  <CircularProgress size={22} sx={{ color: '#000' }} />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Stack>
          </Box>

          {/* Sign Up Link */}
          <Typography
            sx={{
              textAlign: 'center',
              mt: 3,
              color: 'rgba(255,255,255,0.6)',
              fontSize: '13px',
            }}
          >
            Don't have an account?{' '}
            <Button
              component={RouterLink}
              to="/register"
              sx={{
                color: '#FFD700',
                fontWeight: 700,
                fontSize: '13px',
                textTransform: 'none',
                p: 0,
                minWidth: 'auto',
                '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' },
              }}
            >
              Sign Up
            </Button>
          </Typography>
        </Box>
      </motion.div>

      {/* Spacer for bottom safe area */}
      <Box sx={{ pb: 'env(safe-area-inset-bottom, 0px)' }} />
    </Box>
  );
};

export default MobileLogin;
