import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Link,
  Divider,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Fade,
  Container,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  Google as GoogleIcon,
  LinkedIn as LinkedInIcon,
  WorkOutline,
  SecurityOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../../../config/constants';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  login as loginThunk,
  selectAuthLoading,
  selectAuthError,
} from '../../services/authSlice';
import { checkApiHealth } from '../../../common/utils/apiUtils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [apiError, setApiError] = useState('');
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

  useEffect(() => {
    checkApiHealth().catch(() => {
      setApiError('Cannot connect to the server');
    });
    
    // Hide welcome message after animation
    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reduxLoading = useSelector(selectAuthLoading);
  const reduxError = useSelector(selectAuthError);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setErrors({});
    setLoginError('');

    // Enhanced validation
    let valid = true;
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    if (!valid) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    setSubmitting(true);

    try {
      const resultAction = await dispatch(loginThunk({ email, password }));
      if (loginThunk.fulfilled.match(resultAction)) {
        navigate('/dashboard');
      } else {
        setLoginError(
          resultAction.payload || resultAction.error.message || 'Login failed. Please check your credentials.',
        );
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Login failed. Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ width: '100%', px: { xs: 2, sm: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ width: '100%' }}
      >
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            width: '100%',
            maxWidth: 480,
            mx: 'auto',
            borderRadius: { xs: 4, sm: 5 },
            background: 'linear-gradient(145deg, rgba(38, 38, 38, 0.95) 0%, rgba(28, 28, 28, 0.98) 100%)',
            boxShadow: {
              xs: '0 8px 32px 0 rgba(0,0,0,0.3)',
              sm: '0 12px 50px 0 rgba(0,0,0,0.4)',
            },
            border: { xs: '1px solid rgba(255,215,0,0.2)', sm: '2px solid rgba(255,215,0,0.3)' },
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: { xs: '3px', sm: '4px' },
              background: 'linear-gradient(90deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
              animation: 'shimmer 2s ease-in-out infinite',
              '@keyframes shimmer': {
                '0%': { opacity: 0.5 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.5 },
              },
            },
          }}
        >
          {/* Header Section - Better Structured */}
          <Stack spacing={3} alignItems="center" sx={{ mb: { xs: 3, sm: 4 } }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box
                sx={{
                  width: { xs: 60, sm: 70 },
                  height: { xs: 60, sm: 70 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
                }}
              >
                <WorkOutline sx={{ fontSize: { xs: 28, sm: 35 }, color: '#000' }} />
              </Box>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ textAlign: 'center' }}
            >
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 800,
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    letterSpacing: 0.5,
                    textShadow: '0 2px 15px rgba(255,215,0,0.3)',
                    lineHeight: 1.2,
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ 
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 500, 
                    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                    textAlign: 'center',
                  }}
                >
                  Access your Kelmah account
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                    textAlign: 'center',
                    maxWidth: { xs: '280px', sm: '320px' },
                  }}
                >
                  Connect with Ghana's finest skilled workers
                </Typography>
              </Stack>
            </motion.div>
          </Stack>

          {/* Welcome Security Message - Mobile Optimized */}
          <Fade in={showWelcomeMessage} timeout={1000}>
            <Box
              sx={{
                mb: { xs: 2, sm: 3 },
                p: { xs: 1.5, sm: 2 },
                borderRadius: { xs: 1.5, sm: 2 },
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <SecurityOutlined sx={{ color: '#FFD700', fontSize: { xs: 20, sm: 24 }, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#FFD700', 
                    fontWeight: 600,
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    mb: 0.5,
                  }}
                >
                  Secure Login
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    lineHeight: 1.3,
                  }}
                >
                  Your data is protected with enterprise-grade security
                </Typography>
              </Box>
            </Box>
          </Fade>

          {/* Error Alerts - Better Positioned */}
          <Stack spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    '& .MuiAlert-message': { fontWeight: 500 }
                  }}
                >
                  {apiError}
                </Alert>
              </motion.div>
            )}
            
            {loginError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                    '& .MuiAlert-message': { fontWeight: 500 }
                  }}
                >
                  {loginError}
                </Alert>
              </motion.div>
            )}
          </Stack>

          {/* Login Form - Improved Structure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={{ xs: 2.5, sm: 3 }}>
                {/* Email Field */}
                <TextField
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  required
                  type="email"
                  autoComplete="email"
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ color: 'rgba(255,215,0,0.7)', fontSize: { xs: 20, sm: 24 } }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      fontWeight: 500,
                      color: 'white',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: { xs: 1.5, sm: 2 },
                      minHeight: { xs: '56px', sm: '60px' },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,215,0,0.3)',
                        borderWidth: { xs: 1.5, sm: 2 },
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,215,0,0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FFD700',
                        boxShadow: '0 0 0 3px rgba(255,215,0,0.1)',
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: 'rgba(255,215,0,0.8)',
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      '&.Mui-focused': {
                        color: '#FFD700',
                      },
                    },
                  }}
                />
                
                {/* Password Field */}
                <TextField
                  label="Password"
                  variant="outlined"
                  fullWidth
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: 'rgba(255,215,0,0.7)', fontSize: { xs: 20, sm: 24 } }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size={window.innerWidth < 600 ? 'small' : 'medium'}
                          sx={{ 
                            color: 'rgba(255,215,0,0.7)',
                            minWidth: { xs: '40px', sm: '48px' },
                            minHeight: { xs: '40px', sm: '48px' },
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      fontWeight: 500,
                      color: 'white',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: { xs: 1.5, sm: 2 },
                      minHeight: { xs: '56px', sm: '60px' },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,215,0,0.3)',
                        borderWidth: { xs: 1.5, sm: 2 },
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,215,0,0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#FFD700',
                        boxShadow: '0 0 0 3px rgba(255,215,0,0.1)',
                      },
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: 'rgba(255,215,0,0.8)',
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      '&.Mui-focused': {
                        color: '#FFD700',
                      },
                    },
                  }}
                />
                
                {/* Remember Me & Forgot Password - Better Mobile Layout */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 2, sm: 1 },
                    pt: 1,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        size={window.innerWidth < 600 ? 'small' : 'medium'}
                        sx={{ 
                          color: 'rgba(255,215,0,0.7)', 
                          '&.Mui-checked': { color: '#FFD700' },
                          p: { xs: 0.5, sm: 1 },
                        }}
                      />
                    }
                    label={
                      <Typography 
                        sx={{ 
                          color: 'rgba(255,255,255,0.9)', 
                          fontWeight: 500,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }}
                      >
                        Remember me
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{
                      color: '#FFD700',
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      '&:hover': {
                        color: '#FFC000',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
                
                {/* Submit Button - Better Mobile Touch Target */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.1rem', sm: '1.2rem' },
                      py: { xs: 1.75, sm: 2 },
                      minHeight: { xs: '52px', sm: '60px' },
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                      color: '#000',
                      boxShadow: '0 6px 20px rgba(255,215,0,0.25)',
                      borderRadius: { xs: 1.5, sm: 2 },
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                        boxShadow: '0 8px 25px rgba(255,215,0,0.35)',
                        transform: 'translateY(-1px)',
                      },
                      '&:disabled': {
                        background: 'rgba(255,215,0,0.3)',
                        color: 'rgba(0,0,0,0.5)',
                      },
                    }}
                  >
                    {submitting ? (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <CircularProgress size={20} sx={{ color: '#000' }} />
                        <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                          Signing In...
                        </Typography>
                      </Stack>
                    ) : (
                      'Sign In to Kelmah'
                    )}
                  </Button>
                </motion.div>
              </Stack>
            </Box>
          </motion.div>

          {/* Sign Up Section - Better Mobile Layout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Stack spacing={{ xs: 3, sm: 4 }} alignItems="center" sx={{ mt: { xs: 4, sm: 5 } }}>
              {/* Sign Up Link */}
              <Typography
                variant="body1"
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center', 
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 500,
                }}
              >
                New to Kelmah?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body1"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: 'inherit',
                    '&:hover': {
                      color: '#FFC000',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Create your account
                </Link>
              </Typography>
              
              {/* Social Login Divider */}
              <Divider 
                sx={{ 
                  width: '100%',
                  borderColor: 'rgba(255,215,0,0.3)',
                  '& .MuiDivider-wrapper': {
                    px: { xs: 2, sm: 3 },
                  },
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#FFD700', 
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    letterSpacing: 0.5,
                  }}
                >
                  OR CONTINUE WITH
                </Typography>
              </Divider>
              
              {/* Social Login Buttons - Improved Mobile Layout */}
              <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%' }}>
                <Grid item xs={12} sm={6}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<GoogleIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                      onClick={() => {
                        window.location.href = `${API_BASE_URL}/api/auth/google`;
                      }}
                      sx={{
                        py: { xs: 1.5, sm: 2 },
                        minHeight: { xs: '48px', sm: '56px' },
                        fontWeight: 600,
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                        background: 'rgba(255,255,255,0.95)',
                        color: '#4285F4',
                        borderColor: '#4285F4',
                        borderWidth: { xs: 1.5, sm: 2 },
                        borderRadius: { xs: 1.5, sm: 2 },
                        textTransform: 'none',
                        boxShadow: '0 3px 12px rgba(66,133,244,0.15)',
                        '&:hover': {
                          background: '#4285F4',
                          color: '#fff',
                          borderColor: '#4285F4',
                          boxShadow: '0 5px 15px rgba(66,133,244,0.25)',
                          borderWidth: { xs: 1.5, sm: 2 },
                        },
                      }}
                    >
                      Google
                    </Button>
                  </motion.div>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<LinkedInIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                      onClick={() => {
                        window.location.href = `${API_BASE_URL}/api/auth/linkedin`;
                      }}
                      sx={{
                        py: { xs: 1.5, sm: 2 },
                        minHeight: { xs: '48px', sm: '56px' },
                        fontWeight: 600,
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                        background: 'rgba(255,255,255,0.95)',
                        color: '#0077B5',
                        borderColor: '#0077B5',
                        borderWidth: { xs: 1.5, sm: 2 },
                        borderRadius: { xs: 1.5, sm: 2 },
                        textTransform: 'none',
                        boxShadow: '0 3px 12px rgba(0,119,181,0.15)',
                        '&:hover': {
                          background: '#0077B5',
                          color: '#fff',
                          borderColor: '#0077B5',
                          boxShadow: '0 5px 15px rgba(0,119,181,0.25)',
                          borderWidth: { xs: 1.5, sm: 2 },
                        },
                      }}
                    >
                      LinkedIn
                    </Button>
                  </motion.div>
                </Grid>
              </Grid>
            </Stack>
          </motion.div>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Login;
