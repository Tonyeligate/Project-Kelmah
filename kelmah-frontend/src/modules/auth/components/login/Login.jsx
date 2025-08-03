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
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isActualMobile = useMediaQuery('(max-width: 768px)');
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
          resultAction.payload ||
            resultAction.error.message ||
            'Login failed. Please check your credentials.',
        );
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(
        'Login failed. Please check your credentials and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile-first login view
  if (isActualMobile) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#181611',
          color: 'white',
          fontFamily: 'Manrope, "Noto Sans", sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
                textAlign: 'center',
                flex: 1,
                pl: 6,
              }}
            >
              Kelmah
            </Typography>
            <Box sx={{ width: 48, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton sx={{ color: 'white', p: 0 }}>
                <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                </svg>
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, px: 2 }}>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '22px',
              mb: 3,
              mt: 5,
            }}
          >
            Welcome back
          </Typography>

          {/* Error Alert */}
          {(apiError || loginError) && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                color: '#f44336',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '12px',
                '& .MuiAlert-icon': { color: '#f44336' },
              }}
            >
              {apiError || loginError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Email or Phone Number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={Boolean(errors.email)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#393528',
                    borderRadius: '12px',
                    height: '56px',
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': { border: 'none' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'white',
                    fontSize: '16px',
                    padding: '16px',
                    '&::placeholder': {
                      color: '#b9b29d',
                      opacity: 1,
                    },
                  },
                }}
              />
              {errors.email && (
                <Typography sx={{ color: '#f44336', fontSize: '14px', mt: 1 }}>
                  {errors.email}
                </Typography>
              )}
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={Boolean(errors.password)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{ color: '#b9b29d' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#393528',
                    borderRadius: '12px',
                    height: '56px',
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': { border: 'none' },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'white',
                    fontSize: '16px',
                    padding: '16px',
                    '&::placeholder': {
                      color: '#b9b29d',
                      opacity: 1,
                    },
                  },
                }}
              />
              {errors.password && (
                <Typography sx={{ color: '#f44336', fontSize: '14px', mt: 1 }}>
                  {errors.password}
                </Typography>
              )}
            </Box>

            {/* Remember Me */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, minHeight: '56px' }}>
              <Typography sx={{ color: 'white', fontSize: '16px', flex: 1 }}>
                Remember Me
              </Typography>
              <Box sx={{ flexShrink: 0 }}>
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: '#544e3b',
                    '&.Mui-checked': {
                      color: '#deae10',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '20px',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              sx={{
                backgroundColor: '#deae10',
                color: '#181611',
                height: '48px',
                borderRadius: '24px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                mb: 3,
                '&:hover': {
                  backgroundColor: '#c49a0e',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(222, 174, 16, 0.5)',
                  color: 'rgba(24, 22, 17, 0.7)',
                },
              }}
            >
              {submitting ? (
                <CircularProgress size={20} sx={{ color: '#181611' }} />
              ) : (
                'Login'
              )}
            </Button>

            {/* Forgot Password Link */}
            <Typography
              component={RouterLink}
              to="/forgot-password"
              sx={{
                color: '#b9b29d',
                fontSize: '14px',
                textAlign: 'center',
                display: 'block',
                textDecoration: 'underline',
                mb: 3,
                '&:hover': {
                  color: '#deae10',
                },
              }}
            >
              Forgot Password?
            </Typography>

            {/* Sign Up Link */}
            <Typography
              component={RouterLink}
              to="/register"
              sx={{
                color: '#b9b29d',
                fontSize: '14px',
                textAlign: 'center',
                display: 'block',
                textDecoration: 'underline',
                '&:hover': {
                  color: '#deae10',
                },
              }}
            >
              Don't have an account? Sign Up
            </Typography>
          </Box>
        </Box>

        {/* Bottom Image/Decoration */}
        <Box
          sx={{
            width: '100%',
            height: '320px',
            backgroundColor: '#27241c',
            backgroundImage: 'url("/api/placeholder/390/320")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxHeight: { xs: 'none', sm: '100vh' },
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        px: { xs: 0, sm: 2 },
        py: { xs: 0, sm: 2 },
        overflow: { xs: 'visible', sm: 'hidden' },
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{ 
          height: '100%', 
          width: '100%',
          maxWidth: { xs: '100%', sm: '480px' },
          mx: 'auto',
          display: 'flex', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          px: { xs: 0, sm: 2 },
          py: { xs: 0, sm: 0 },
          boxSizing: 'border-box',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%' }}
        >
          <Paper
            elevation={12}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              width: '100%',
              maxWidth: { xs: '100%', sm: 420 },
              mx: 'auto',
              borderRadius: { xs: 0, sm: 4 },
              background: {
                xs: 'transparent',
                sm: 'linear-gradient(145deg, rgba(38, 38, 38, 0.95) 0%, rgba(28, 28, 28, 0.98) 100%)',
              },
              boxShadow: {
                xs: 'none',
                sm: '0 8px 32px 0 rgba(0,0,0,0.3)',
              },
              border: {
                xs: 'none',
                sm: '2px solid rgba(255,215,0,0.3)',
              },
              backdropFilter: { xs: 'none', sm: 'blur(20px)' },
              position: 'relative',
              overflow: 'visible',
              minHeight: { xs: '100vh', sm: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: { xs: '2px', sm: '3px' },
                background:
                  'linear-gradient(90deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
                animation: 'shimmer 2s ease-in-out infinite',
                '@keyframes shimmer': {
                  '0%': { opacity: 0.5 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.5 },
                },
              },
            }}
          >
            {/* Compact Header Section */}
            <Stack
              spacing={{ xs: 1.5, sm: 2 }}
              alignItems="center"
              sx={{ mb: { xs: 2, sm: 3 } }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Box
                  sx={{
                    width: { xs: 45, sm: 55 },
                    height: { xs: 45, sm: 55 },
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(255,215,0,0.3)',
                  }}
                >
                  <WorkOutline
                    sx={{ fontSize: { xs: 22, sm: 28 }, color: '#000' }}
                  />
                </Box>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{ textAlign: 'center' }}
              >
                <Stack spacing={0.5} alignItems="center">
        <Typography
                    variant="h4"
          component="h1"
          sx={{
            color: '#FFD700',
            fontWeight: 800,
                      fontSize: { xs: '1.4rem', sm: '1.6rem' },
                      letterSpacing: 0.3,
                      textShadow: '0 2px 10px rgba(255,215,0,0.3)',
                      lineHeight: 1.1,
          }}
        >
          Welcome Back
        </Typography>
        <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: { xs: '0.8rem', sm: '0.85rem' },
                      textAlign: 'center',
                    }}
                  >
                    Access Kelmah - Ghana's Skilled Trades Platform
                  </Typography>
                </Stack>
              </motion.div>
            </Stack>

            {/* Compact Welcome Security Message */}
            {showWelcomeMessage && (
              <Fade in={showWelcomeMessage} timeout={800}>
                <Box
                  sx={{
                    mb: { xs: 1.5, sm: 2 },
                    p: { xs: 1, sm: 1.5 },
                    borderRadius: 1.5,
                    background:
                      'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.03) 100%)',
                    border: '1px solid rgba(255,215,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SecurityOutlined
                    sx={{
                      color: '#FFD700',
                      fontSize: { xs: 16, sm: 18 },
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#FFD700',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    Secure & Protected Login
        </Typography>
      </Box>
              </Fade>
            )}

            {/* Compact Error Alerts */}
            {(apiError || loginError) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Alert
                  severity="error"
                  sx={{
                    mb: { xs: 1.5, sm: 2 },
                    borderRadius: 1.5,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    py: { xs: 0.5, sm: 1 },
                    '& .MuiAlert-message': { fontWeight: 500 },
                  }}
                >
                  {apiError || loginError}
        </Alert>
              </motion.div>
            )}

            {/* Compact Login Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={{ xs: 1.8, sm: 2.2 }}>
                  {/* Email Field */}
        <TextField
                    label="Email"
          variant="outlined"
          fullWidth
                              required
                    size={isMobile ? 'medium' : 'small'}
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
          error={Boolean(errors.email)}
          helperText={errors.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined
                            sx={{
                              color: '#FFD700',
                              fontSize: { xs: 18, sm: 20 },
                            }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        color: '#FFFFFF',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 1.5,
                        minHeight: { xs: '56px', sm: '48px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                          borderWidth: 2,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.7)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                          boxShadow: '0 0 0 2px rgba(255,215,0,0.3)',
                        },
                        '& .MuiInputBase-input': {
                          color: '#FFFFFF',
                          fontWeight: 500,
                          fontSize: { xs: '1rem', sm: '1rem' },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          opacity: 1,
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: '#FFD700',
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '0.9rem' },
                        '&.Mui-focused': {
                          color: '#FFD700',
                        },
                        '&.Mui-filled': {
                          color: '#FFD700',
                        },
                      },
          }}
                    FormHelperTextProps={{
                      sx: {
                        fontSize: { xs: '0.8rem', sm: '0.75rem' },
                        mt: 0.5,
                        color: '#ff6b6b',
                        fontWeight: 500,
                      },
                    }}
                  />

                  {/* Password Field */}
                          <TextField
                    label="Password"
          variant="outlined"
          fullWidth
                              required
                    size={isMobile ? 'medium' : 'small'}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
          error={Boolean(errors.password)}
          helperText={errors.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined
                            sx={{
                              color: '#FFD700',
                              fontSize: { xs: 18, sm: 20 },
                            }}
                          />
                        </InputAdornment>
                      ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                            size="small"
                            sx={{
                              color: '#FFD700',
                              minWidth: '36px',
                              minHeight: '36px',
                            }}
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                </IconButton>
              </InputAdornment>
            ),
            sx: {
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        color: '#FFFFFF',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: 1.5,
                        minHeight: { xs: '56px', sm: '48px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                          borderWidth: 2,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.7)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                          boxShadow: '0 0 0 2px rgba(255,215,0,0.3)',
                        },
                        '& .MuiInputBase-input': {
                          color: '#FFFFFF',
                          fontWeight: 500,
                          fontSize: { xs: '1rem', sm: '1rem' },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          opacity: 1,
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: '#FFD700',
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '0.9rem' },
                        '&.Mui-focused': {
                          color: '#FFD700',
                        },
                        '&.Mui-filled': {
                          color: '#FFD700',
                        },
                      },
          }}
                    FormHelperTextProps={{
                      sx: {
                        fontSize: { xs: '0.8rem', sm: '0.75rem' },
                        mt: 0.5,
                        color: '#ff6b6b',
                        fontWeight: 500,
                      },
                    }}
                  />

                  {/* Compact Remember Me & Forgot Password */}
                <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            py: { xs: 1, sm: 0.5 },
            gap: { xs: 1.5, sm: 0 },
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                          size="small"
                          sx={{
                            color: 'rgba(255,215,0,0.7)',
                            '&.Mui-checked': { color: '#FFD700' },
                            p: 0.5,
                          }}
              />
            }
            label={
                        <Typography
                          sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: 500,
                            fontSize: { xs: '0.8rem', sm: '0.85rem' },
                          }}
                        >
                Remember me
                        </Typography>
            }
                      sx={{ 
                        m: 0,
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'center', sm: 'flex-start' },
                      }}
          />
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
                        sx={{
              color: '#FFD700',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: { xs: '0.9rem', sm: '0.85rem' },
              textAlign: { xs: 'center', sm: 'right' },
              py: { xs: 1, sm: 0 },
              '&:hover': {
                color: '#FFC000',
                textDecoration: 'underline',
              },
            }}
          >
            Forgot password?
          </Link>
        </Box>

                  {/* Compact Submit Button */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
        <Button
          type="submit"
          fullWidth
          variant="contained"
                      disabled={submitting}
          sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                                    py: { xs: 1.8, sm: 1.5 },
            minHeight: { xs: '56px', sm: '48px' },
                        background:
                          'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                        color: '#000',
                        boxShadow: '0 4px 16px rgba(255,215,0,0.2)',
                        borderRadius: 1.5,
                        textTransform: 'none',
            '&:hover': {
                          background:
                            'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                          boxShadow: '0 6px 20px rgba(255,215,0,0.3)',
                        },
                        '&:disabled': {
                          background: 'rgba(255,215,0,0.3)',
                          color: 'rgba(0,0,0,0.5)',
                        },
                      }}
                    >
                      {submitting ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CircularProgress size={16} sx={{ color: '#000' }} />
                          <Typography
                            sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                          >
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

            {/* Compact Footer Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Stack
                spacing={{ xs: 2, sm: 2.5 }}
                alignItems="center"
                sx={{ mt: { xs: 2.5, sm: 3 } }}
              >
                {/* Sign Up Link */}
        <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    textAlign: 'center',
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    fontWeight: 500,
                  }}
                >
                  New to Kelmah?{' '}
          <Link
            component={RouterLink}
            to="/register"
                    variant="body2"
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
                    Create account
          </Link>
        </Typography>

                {/* Compact Social Login */}
                <Divider
                  sx={{
                    width: '100%',
                    borderColor: 'rgba(255,215,0,0.25)',
                    '& .MuiDivider-wrapper': {
                      px: 1.5,
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#FFD700',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      letterSpacing: 0.3,
                    }}
                  >
                    OR CONTINUE WITH
          </Typography>
        </Divider>

                {/* Enhanced Mobile-Optimized Social Buttons */}
                <Grid container spacing={{ xs: 2, sm: 1.5 }} sx={{ width: '100%' }}>
                  <Grid item xs={6}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
            <Button
              fullWidth
              variant="outlined"
                        startIcon={
                          <GoogleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        }
              onClick={() => {
                window.location.href = `${API_BASE_URL}/api/auth/google`;
              }}
                            sx={{
                py: { xs: 1.5, sm: 1.2 },
                minHeight: { xs: '48px', sm: '42px' },
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '0.85rem' },
                          background: 'rgba(255,255,255,0.95)',
                color: '#4285F4',
                borderColor: '#4285F4',
                          borderWidth: 1.5,
                          borderRadius: 1.5,
                          textTransform: 'none',
                '&:hover': {
                  background: '#4285F4',
                  color: '#fff',
                  borderColor: '#4285F4',
                            borderWidth: 1.5,
                },
              }}
            >
              Google
            </Button>
                    </motion.div>
          </Grid>
                  <Grid item xs={6}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
            <Button
              fullWidth
              variant="outlined"
                        startIcon={
                          <LinkedInIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        }
              onClick={() => {
                window.location.href = `${API_BASE_URL}/api/auth/linkedin`;
              }}
                            sx={{
                py: { xs: 1.5, sm: 1.2 },
                minHeight: { xs: '48px', sm: '42px' },
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '0.85rem' },
                          background: 'rgba(255,255,255,0.95)',
                color: '#0077B5',
                borderColor: '#0077B5',
                          borderWidth: 1.5,
                          borderRadius: 1.5,
                          textTransform: 'none',
                '&:hover': {
                  background: '#0077B5',
                  color: '#fff',
                  borderColor: '#0077B5',
                            borderWidth: 1.5,
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
      </Box>
      </Box>
  );
};

export default Login;
