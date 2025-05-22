import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Link,
  styled,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { login, selectAuthError, selectAuthLoading, clearError, setOAuthLogin } from '../../store/slices/authSlice';
import { checkApiHealth, handleApiError as getApiErrorInfo } from '../../utils/apiUtils';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import api from '../../api/axios'; // Import the API instance

const MotionButton = motion.create(Button);

const SubmitButton = styled(motion.create(Button))(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.primary.main,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 2px 8px rgba(255, 215, 0, 0.2)',
  },
}));

const AnimatedContainer = styled(motion.div)({
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8))`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'rgba(44, 44, 44, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.secondary.main}`,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(3),
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0,
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [apiStatus, setApiStatus] = useState({ isReachable: true, checking: true });
  const [showPassword, setShowPassword] = useState(false);
  const [showMfaForm, setShowMfaForm] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);

  useEffect(() => {
    // Clear any existing errors when component mounts
    dispatch(clearError());
    
    // Check if API is reachable
    const checkApiStatus = async () => {
      try {
        const isReachable = await checkApiHealth();
        setApiStatus({ isReachable, checking: false });
      } catch (error) {
        setApiStatus({ isReachable: false, checking: false });
      }
    };
    
    checkApiStatus();
  }, [dispatch]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form first
    if (!validateForm()) {
      return;
    }
    
    // Show loading state
    setIsSubmitting(true);
    setError(null);
    
    // Dispatch login action from Redux
    try {
      const result = await dispatch(login(formData)).unwrap();
      
      // Handle MFA requirement
      if (result.requireMFA) {
        setMfaEmail(formData.email);
        setShowMfaForm(true);
        return;
      }
      
      // If no MFA and login successful, navigate to dashboard
      const redirectTo = location.state?.from || '/dashboard';
      navigate(redirectTo);
    } catch (err) {
      console.error('Login error:', err);
      setError(err || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/google`;
  };

  const handleFacebookLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/facebook`;
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/api/auth/mfa/validate', {
        email: mfaEmail,
        token: mfaCode
      });
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data;
        
        // Use setOAuthLogin to update auth state
        dispatch(setOAuthLogin({
          user,
          token
        }));
        
        // Store refresh token separately
        localStorage.setItem('refreshToken', refreshToken);
    
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      setError('Invalid MFA code. Please try again.');
      console.error('MFA validation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If API is not reachable, show a message
  if (!apiStatus.isReachable && !apiStatus.checking) {
    return (
      <AnimatedContainer
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Container component="main" maxWidth="xs">
          <StyledPaper elevation={3}>
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              Cannot connect to server. Please check your internet connection or try again later.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              Retry Connection
            </Button>
          </StyledPaper>
        </Container>
      </AnimatedContainer>
    );
  }

  return (
    <AnimatedContainer
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <StyledPaper elevation={3}>
            <motion.div variants={itemVariants}>
              <Typography 
                component="h1" 
                variant="h4" 
                color="secondary.main" 
                gutterBottom
                sx={{ 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Sign In to KELMAH
              </Typography>
            </motion.div>
            
            {(error || validationErrors.form) && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error || validationErrors.form}
              </Alert>
            )}

            {!showMfaForm ? (
              <StyledForm onSubmit={handleLoginSubmit}>
              <motion.div variants={itemVariants}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  sx={{ mb: 2 }}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </motion.div>
              
              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </SubmitButton>
                
                <Divider sx={{ my: 2 }}>OR</Divider>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleLogin}
                  sx={{ mb: 1 }}
                >
                  Sign in with Google
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FacebookIcon />}
                  onClick={handleFacebookLogin}
                >
                  Sign in with Facebook
                </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  color="secondary.main"
                  sx={{
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Don't have an account? Sign Up
                </Link>
              </Box>
              
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  color="secondary.main"
                  sx={{
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
            </StyledForm>
            ) : (
              <form onSubmit={handleMfaSubmit}>
                <Typography variant="h6" gutterBottom>
                  Two-Factor Authentication
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Please enter the 6-digit code from your authenticator app.
                </Typography>
                
                <TextField
                  fullWidth
                  label="Authentication Code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="123456"
                  inputProps={{ maxLength: 6 }}
                  required
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  sx={{ mt: 2 }}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Verify'}
                </Button>
                
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => setShowMfaForm(false)}
                  sx={{ mt: 1 }}
                >
                  Back to Login
                </Button>
              </form>
            )}
          </StyledPaper>
        </Box>
      </Container>
    </AnimatedContainer>
  );
}

export default Login;