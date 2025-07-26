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
  alpha,
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
  LoginOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UI_CONFIG, FEATURES, OAUTH_CONFIG } from '../../../../config/environment';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

  const theme = useTheme();
  const navigate = useNavigate();
  const { login, loading, error, clearError, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Hide welcome message after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeMessage(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login({ email: email.trim(), password });
      
      // Navigate to dashboard or intended page
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';
      navigate(redirectTo);
      
    } catch (err) {
      console.error('Login failed:', err);
      // Error is handled by AuthContext
    }
  };

  const handleOAuthLogin = (provider) => {
    if (!OAUTH_CONFIG[`${provider.toUpperCase()}_CLIENT_ID`]) {
      alert(`${provider} login is not configured yet.`);
      return;
    }
    
    // Redirect to OAuth provider
    window.location.href = `/api/auth/${provider}`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Message */}
        <Fade in={showWelcomeMessage} timeout={1000}>
          <Box textAlign="center" mb={3}>
            <motion.div variants={itemVariants}>
              <WorkOutline 
                sx={{ 
                  fontSize: 48, 
                  color: UI_CONFIG.theme.secondary,
                  mb: 1
                }} 
              />
              <Typography 
                variant="h4" 
                fontWeight="bold"
                sx={{ 
                  background: `linear-gradient(45deg, ${UI_CONFIG.theme.primary}, ${UI_CONFIG.theme.secondary})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Welcome to Kelmah
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Connect with skilled workers and quality jobs
              </Typography>
            </motion.div>
          </Box>
        </Fade>

        {/* Login Form */}
        <motion.div variants={itemVariants}>
          <Paper
            elevation={8}
            sx={{
              p: 4,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${alpha(UI_CONFIG.theme.secondary, 0.2)}`,
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(UI_CONFIG.theme.primary, 0.1)}`,
            }}
          >
            <Box textAlign="center" mb={3}>
              <LoginOutlined 
                sx={{ 
                  fontSize: 40, 
                  color: UI_CONFIG.theme.secondary,
                  mb: 1
                }} 
              />
              <Typography variant="h5" fontWeight="600" color="text.primary">
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Access your Kelmah account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                  onClose={clearError}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Email Field */}
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ color: UI_CONFIG.theme.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: UI_CONFIG.theme.secondary,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: UI_CONFIG.theme.secondary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: UI_CONFIG.theme.secondary,
                    },
                  }}
                />

                {/* Password Field */}
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: UI_CONFIG.theme.secondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: UI_CONFIG.theme.secondary,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: UI_CONFIG.theme.secondary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: UI_CONFIG.theme.secondary,
                    },
                  }}
                />

                {/* Remember Me & Forgot Password */}
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{
                          color: UI_CONFIG.theme.secondary,
                          '&.Mui-checked': {
                            color: UI_CONFIG.theme.secondary,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Remember me
                      </Typography>
                    }
                  />
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{
                      color: UI_CONFIG.theme.secondary,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                {/* Login Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${UI_CONFIG.theme.primary}, ${UI_CONFIG.theme.secondary})`,
                    boxShadow: `0 4px 16px ${alpha(UI_CONFIG.theme.secondary, 0.4)}`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${alpha(UI_CONFIG.theme.primary, 0.9)}, ${alpha(UI_CONFIG.theme.secondary, 0.9)})`,
                      boxShadow: `0 6px 20px ${alpha(UI_CONFIG.theme.secondary, 0.5)}`,
                    },
                    '&:disabled': {
                      background: alpha(UI_CONFIG.theme.primary, 0.5),
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Stack>
            </Box>

            {/* OAuth Login Options */}
            {(OAUTH_CONFIG.GOOGLE_CLIENT_ID || OAUTH_CONFIG.LINKEDIN_CLIENT_ID) && (
              <>
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Or continue with
                  </Typography>
                </Divider>

                <Stack direction="row" spacing={2} justifyContent="center">
                  {OAUTH_CONFIG.GOOGLE_CLIENT_ID && (
                    <Button
                      variant="outlined"
                      startIcon={<GoogleIcon />}
                      onClick={() => handleOAuthLogin('google')}
                      sx={{
                        borderColor: alpha(UI_CONFIG.theme.secondary, 0.5),
                        color: UI_CONFIG.theme.primary,
                        '&:hover': {
                          borderColor: UI_CONFIG.theme.secondary,
                          backgroundColor: alpha(UI_CONFIG.theme.secondary, 0.05),
                        },
                      }}
                    >
                      Google
                    </Button>
                  )}

                  {OAUTH_CONFIG.LINKEDIN_CLIENT_ID && (
                    <Button
                      variant="outlined"
                      startIcon={<LinkedInIcon />}
                      onClick={() => handleOAuthLogin('linkedin')}
                      sx={{
                        borderColor: alpha(UI_CONFIG.theme.secondary, 0.5),
                        color: UI_CONFIG.theme.primary,
                        '&:hover': {
                          borderColor: UI_CONFIG.theme.secondary,
                          backgroundColor: alpha(UI_CONFIG.theme.secondary, 0.05),
                        },
                      }}
                    >
                      LinkedIn
                    </Button>
                  )}
                </Stack>
              </>
            )}

            {/* Sign Up Link */}
            <Box textAlign="center" mt={4}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: UI_CONFIG.theme.secondary,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>

            {/* Security Notice */}
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              mt={3}
              gap={1}
            >
              <SecurityOutlined 
                sx={{ 
                  fontSize: 16, 
                  color: 'text.secondary' 
                }} 
              />
              <Typography variant="caption" color="text.secondary">
                Your information is secure and encrypted
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default Login;
