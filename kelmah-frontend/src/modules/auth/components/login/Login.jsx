import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login as loginAction } from '../../services/authSlice';
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
import { FEATURES, getApiBaseUrl } from '../../../../config/environment';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
// Removed AuthContext import to use Redux auth system
// import { useAuth } from '../../contexts/AuthContext';
import { checkApiHealth } from '../../../common/utils/apiUtils';
import MobileLogin from '../mobile/MobileLogin';
import { alpha } from '@mui/material/styles';

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isActualMobile = useMediaQuery('(max-width: 768px)');
  const isDarkMode = theme.palette.mode === 'dark';
  const accentColor = theme.palette.primary.main || '#FFD700';
  const accentStrong = theme.palette.primary.dark || '#D39D00';
  const panelText = isDarkMode ? '#FFFFFF' : '#171A1F';
  const panelMuted = isDarkMode ? alpha('#FFFFFF', 0.8) : alpha('#171A1F', 0.7);
  const panelSoft = isDarkMode ? alpha('#FFFFFF', 0.66) : alpha('#171A1F', 0.52);
  const panelBackground = isDarkMode
    ? 'linear-gradient(145deg, rgba(38, 38, 38, 0.95) 0%, rgba(28, 28, 28, 0.98) 100%)'
    : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,248,244,0.99) 100%)';
  const panelBorder = isDarkMode
    ? alpha(accentColor, 0.3)
    : alpha('#101113', 0.12);
  const panelShadow = isDarkMode
    ? '0 8px 32px 0 rgba(0,0,0,0.3)'
    : '0 16px 40px rgba(16,17,19,0.12)';
  const inputBackground = isDarkMode ? alpha('#FFFFFF', 0.08) : alpha('#FFFFFF', 0.9);
  const inputBorder = isDarkMode ? alpha(accentColor, 0.5) : alpha('#171A1F', 0.14);
  const inputBorderHover = isDarkMode ? alpha(accentColor, 0.7) : alpha(accentColor, 0.38);
  const inputPlaceholder = isDarkMode ? alpha('#FFFFFF', 0.7) : alpha('#171A1F', 0.46);
  const subtleSurface = isDarkMode ? alpha(accentColor, 0.08) : alpha(accentColor, 0.1);
  const subtleSurfaceBorder = isDarkMode ? alpha(accentColor, 0.15) : alpha('#101113', 0.1);
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

  const navigate = useNavigate();
  const location = useLocation();
  // Use Redux auth system instead of AuthContext
  const dispatch = useDispatch();
  const { loading: authLoading, error: authError } = useSelector(
    (state) => state.auth,
  );

  const getDefaultRouteByRole = (role) => {
    if (role === 'worker') return '/worker/dashboard';
    if (role === 'hirer') return '/hirer/dashboard';
    if (role === 'admin') return '/admin/skills-management';
    return '/dashboard';
  };

  const resolveLoginRedirect = (user) => {
    const requestedPath = location.state?.from || location.state?.redirectTo;
    if (
      typeof requestedPath === 'string' &&
      requestedPath.startsWith('/') &&
      !requestedPath.startsWith('/login') &&
      !requestedPath.startsWith('/register')
    ) {
      return requestedPath;
    }
    return getDefaultRouteByRole(user?.role);
  };

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
      const result = await dispatch(
        loginAction({
          email: email.trim(),
          password,
          rememberMe,
        }),
      ).unwrap();

      const destination = resolveLoginRedirect(result?.user);
      if (import.meta.env.DEV) console.log(`Login successful, redirecting to ${destination}`);
      navigate(destination, { replace: true });
    } catch (err) {
      if (import.meta.env.DEV) console.error('Login error:', err);
      const errorMessage =
        err.message || 'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile detection now handled by LoginPage
  // Desktop Login form
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
                sm: panelBackground,
              },
              boxShadow: {
                xs: 'none',
                sm: panelShadow,
              },
              border: {
                xs: 'none',
                sm: `2px solid ${panelBorder}`,
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
                background: `linear-gradient(90deg, ${accentColor} 0%, #FFC000 50%, ${accentColor} 100%)`,
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
                    background: `linear-gradient(135deg, ${accentColor} 0%, #FFC000 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 15px ${alpha(accentColor, 0.3)}`,
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
                      color: accentColor,
                      fontWeight: 800,
                      fontSize: { xs: '1.4rem', sm: '1.6rem' },
                      letterSpacing: 0.3,
                      textShadow: `0 2px 10px ${alpha(accentColor, 0.24)}`,
                      lineHeight: 1.1,
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: panelMuted,
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
                    background: `linear-gradient(135deg, ${subtleSurface} 0%, ${alpha(accentColor, isDarkMode ? 0.03 : 0.05)} 100%)`,
                    border: `1px solid ${subtleSurfaceBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <SecurityOutlined
                    sx={{
                      color: accentColor,
                      fontSize: { xs: 16, sm: 18 },
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: accentStrong,
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
            {(apiError || loginError || authError) && (
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
                  {apiError || loginError || authError}
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
                              color: accentColor,
                              fontSize: { xs: 18, sm: 20 },
                            }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 500,
                        color: panelText,
                        background: inputBackground,
                        borderRadius: 1.5,
                        minHeight: { xs: '56px', sm: '48px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: inputBorder,
                          borderWidth: 2,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: inputBorderHover,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: accentColor,
                          boxShadow: `0 0 0 2px ${alpha(accentColor, 0.2)}`,
                        },
                        '& .MuiInputBase-input': {
                          color: panelText,
                          fontWeight: 500,
                          fontSize: { xs: '1rem', sm: '1rem' },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: inputPlaceholder,
                          opacity: 1,
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: panelSoft,
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '0.9rem' },
                        '&.Mui-focused': {
                          color: accentColor,
                        },
                        '&.Mui-filled': {
                          color: accentColor,
                        },
                      },
                    }}
                    FormHelperTextProps={{
                      sx: {
                        fontSize: { xs: '0.8rem', sm: '0.75rem' },
                        mt: 0.5,
                        color: theme.palette.error.main,
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
                              color: accentColor,
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
                              color: accentColor,
                              minWidth: '44px',
                              minHeight: '44px',
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
                        color: panelText,
                        background: inputBackground,
                        borderRadius: 1.5,
                        minHeight: { xs: '56px', sm: '48px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: inputBorder,
                          borderWidth: 2,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: inputBorderHover,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: accentColor,
                          boxShadow: `0 0 0 2px ${alpha(accentColor, 0.2)}`,
                        },
                        '& .MuiInputBase-input': {
                          color: panelText,
                          fontWeight: 500,
                          fontSize: { xs: '1rem', sm: '1rem' },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: inputPlaceholder,
                          opacity: 1,
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: {
                        color: panelSoft,
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '0.9rem' },
                        '&.Mui-focused': {
                          color: accentColor,
                        },
                        '&.Mui-filled': {
                          color: accentColor,
                        },
                      },
                    }}
                    FormHelperTextProps={{
                      sx: {
                        fontSize: { xs: '0.8rem', sm: '0.75rem' },
                        mt: 0.5,
                        color: theme.palette.error.main,
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
                            color: alpha(accentColor, 0.7),
                            '&.Mui-checked': { color: accentColor },
                            p: 0.5,
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            color: panelMuted,
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
                        color: accentColor,
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
                      disabled={submitting || authLoading}
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        py: { xs: 1.8, sm: 1.5 },
                        minHeight: { xs: '56px', sm: '48px' },
                        background:
                          'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                        color: '#000',
                        boxShadow: isDarkMode
                          ? '0 4px 16px rgba(255,215,0,0.2)'
                          : '0 10px 24px rgba(170,129,19,0.2)',
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
                      {submitting || authLoading ? (
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
                    color: panelMuted,
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
                      color: accentColor,
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

                {/* Social Login - Coming Soon */}
                <Divider
                  sx={{
                    width: '100%',
                    borderColor: alpha(accentStrong, isDarkMode ? 0.25 : 0.16),
                    '& .MuiDivider-wrapper': {
                      px: 1.5,
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: alpha(accentStrong, isDarkMode ? 0.5 : 0.62),
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      letterSpacing: 0.3,
                    }}
                  >
                    SOCIAL LOGIN COMING SOON
                  </Typography>
                </Divider>

                {/* Disabled Social Buttons with Coming Soon label */}
                <Grid
                  container
                  spacing={{ xs: 2, sm: 1.5 }}
                  sx={{ width: '100%' }}
                >
                  <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        disabled
                        startIcon={
                          <GoogleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        }
                        sx={{
                          py: { xs: 1.5, sm: 1.2 },
                          minHeight: { xs: '48px', sm: '42px' },
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '0.85rem' },
                          background: isDarkMode ? alpha('#FFFFFF', 0.3) : alpha('#FFFFFF', 0.72),
                          color: 'rgba(66,133,244,0.5)',
                          borderColor: isDarkMode ? 'rgba(66,133,244,0.3)' : 'rgba(66,133,244,0.22)',
                          borderWidth: 1.5,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          opacity: 0.6,
                        }}
                      >
                        Google
                      </Button>
                  </Grid>
                  <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        disabled
                        startIcon={
                          <LinkedInIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        }
                        sx={{
                          py: { xs: 1.5, sm: 1.2 },
                          minHeight: { xs: '48px', sm: '42px' },
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '0.85rem' },
                          background: isDarkMode ? alpha('#FFFFFF', 0.3) : alpha('#FFFFFF', 0.72),
                          color: 'rgba(0,119,181,0.5)',
                          borderColor: isDarkMode ? 'rgba(0,119,181,0.3)' : 'rgba(0,119,181,0.22)',
                          borderWidth: 1.5,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          opacity: 0.6,
                        }}
                      >
                        LinkedIn
                      </Button>
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
