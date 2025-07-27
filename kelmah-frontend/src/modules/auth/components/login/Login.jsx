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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 1, sm: 2 },
        py: { xs: 1, sm: 2 },
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="sm"
        sx={{ height: '100%', display: 'flex', alignItems: 'center' }}
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
              maxWidth: 420,
              mx: 'auto',
              borderRadius: { xs: 3, sm: 4 },
              background:
                'linear-gradient(145deg, rgba(38, 38, 38, 0.95) 0%, rgba(28, 28, 28, 0.98) 100%)',
              boxShadow: {
                xs: '0 6px 24px 0 rgba(0,0,0,0.25)',
                sm: '0 8px 32px 0 rgba(0,0,0,0.3)',
              },
              border: {
                xs: '1px solid rgba(255,215,0,0.2)',
                sm: '2px solid rgba(255,215,0,0.3)',
              },
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
              maxHeight: { xs: '95vh', sm: 'auto' },
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
                    size="small"
                    type="email"
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
                              color: 'rgba(255,215,0,0.7)',
                              fontSize: { xs: 18, sm: 20 },
                            }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        color: 'white',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 1.5,
                        minHeight: { xs: '44px', sm: '48px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.25)',
                          borderWidth: 1.5,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                          boxShadow: '0 0 0 2px rgba(255,215,0,0.1)',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'rgba(255,215,0,0.8)',
                        fontWeight: 600,
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        '&.Mui-focused': {
                          color: '#FFD700',
                        },
                      },
                    }}
                    FormHelperTextProps={{
                      sx: {
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        mt: 0.5,
                      },
                    }}
                  />

                  {/* Password Field */}
                  <TextField
                    label="Password"
                    variant="outlined"
                    fullWidth
                    required
                    size="small"
                    type={showPassword ? 'text' : 'password'}
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
                              color: 'rgba(255,215,0,0.7)',
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
                              color: 'rgba(255,215,0,0.7)',
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
                        color: 'white',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 1.5,
                        minHeight: { xs: '44px', sm: '48px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.25)',
                          borderWidth: 1.5,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                          boxShadow: '0 0 0 2px rgba(255,215,0,0.1)',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: 'rgba(255,215,0,0.8)',
                        fontWeight: 600,
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        '&.Mui-focused': {
                          color: '#FFD700',
                        },
                      },
                    }}
                    FormHelperTextProps={{
                      sx: {
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        mt: 0.5,
                      },
                    }}
                  />

                  {/* Compact Remember Me & Forgot Password */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.5,
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
                        fontSize: { xs: '0.8rem', sm: '0.85rem' },
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
                        py: { xs: 1.3, sm: 1.5 },
                        minHeight: { xs: '44px', sm: '48px' },
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

                {/* Compact Social Buttons */}
                <Grid container spacing={1.5} sx={{ width: '100%' }}>
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
                          py: { xs: 1, sm: 1.2 },
                          minHeight: { xs: '38px', sm: '42px' },
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.85rem' },
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
                          py: { xs: 1, sm: 1.2 },
                          minHeight: { xs: '38px', sm: '42px' },
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.85rem' },
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
      </Container>
    </Box>
  );
};

export default Login;
