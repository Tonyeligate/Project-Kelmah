import React, { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined, 
  EmailOutlined,
  Google as GoogleIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../auth/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    setLoginError('');
    
    // Validate form
    let valid = true;
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      valid = false;
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }
    
    if (!valid) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    setSubmitting(true);
    
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Paper elevation={6} sx={{
      p: { xs: 2, sm: 4 },
      maxWidth: 480,
      mx: 'auto',
      borderRadius: 4,
      background: 'rgba(38, 38, 38, 0.98)',
      boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
      border: '2px solid #FFD700',
      backdropFilter: 'blur(10px)',
    }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#FFD700', fontWeight: 800, fontSize: { xs: '2rem', sm: '2.2rem' }, letterSpacing: 1, textShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
          Welcome Back
        </Typography>
        <Typography variant="h6" color="#fff" sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
          Sign in to continue to Kelmah
        </Typography>
      </Box>
      
      {loginError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {loginError}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          label="Email Address"
          variant="outlined"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{
            sx: {
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#FFD700',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              border: '2px solid #FFD700',
              '&.Mui-focused': {
                borderColor: '#FFD700',
                boxShadow: '0 0 0 2px #FFD70044',
              },
            },
          }}
          sx={{ mb: 3 }}
        />
        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          required
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#FFD700',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              border: '2px solid #FFD700',
              '&.Mui-focused': {
                borderColor: '#FFD700',
                boxShadow: '0 0 0 2px #FFD70044',
              },
            },
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
                sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
              />
            }
            label={<span style={{ color: '#FFD700', fontWeight: 600 }}>Remember me</span>}
          />
          <Link 
            component={RouterLink} 
            to="/forgot-password"
            variant="body2"
            sx={{
              color: '#FFD700',
              fontWeight: 700,
              textDecoration: 'underline',
              ml: 2,
              '&:hover': {
                color: '#FFC000',
                textDecoration: 'underline',
              },
            }}
          >
            Forgot password?
          </Link>
        </Box>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            mb: 3,
            fontWeight: 800,
            fontSize: '1.2rem',
            py: 1.5,
            background: 'linear-gradient(90deg, #FFD700 60%, #FFC000 100%)',
            color: '#222',
            boxShadow: '0 4px 16px 0 rgba(255,215,0,0.18)',
            border: '2px solid #FFD700',
            borderRadius: 2,
            '&:hover': {
              background: 'linear-gradient(90deg, #FFC000 60%, #FFD700 100%)',
              color: '#111',
            },
          }}
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        <Typography variant="body1" sx={{ mt: 3, color: '#fff', textAlign: 'center', fontSize: '1.1rem' }}>
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/register"
            variant="body1"
            sx={{
              color: '#FFD700',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              '&:hover': {
                color: '#FFC000',
                textDecoration: 'underline',
              },
            }}
          >
            Sign up now
          </Link>
        </Typography>
        <Divider sx={{ my: 3, borderColor: '#FFD700' }}>
          <Typography variant="body2" color="#FFD700" sx={{ fontWeight: 700 }}>
            OR
          </Typography>
        </Divider>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: '1.1rem',
                background: '#fff',
                color: '#4285F4',
                borderColor: '#4285F4',
                boxShadow: '0 2px 8px 0 rgba(66,133,244,0.08)',
                '&:hover': {
                  background: '#4285F4',
                  color: '#fff',
                  borderColor: '#4285F4',
                },
              }}
            >
              Google
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LinkedInIcon />}
              sx={{
                py: 1.5,
                fontWeight: 700,
                fontSize: '1.1rem',
                background: '#fff',
                color: '#0077B5',
                borderColor: '#0077B5',
                boxShadow: '0 2px 8px 0 rgba(0,119,181,0.08)',
                '&:hover': {
                  background: '#0077B5',
                  color: '#fff',
                  borderColor: '#0077B5',
                },
              }}
            >
              LinkedIn
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default Login; 
