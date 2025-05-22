import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import { motion } from 'framer-motion';
import api from '../../api/axios';

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

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const validateForm = () => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    } else if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setApiError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

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
                Forgot Password
              </Typography>
            </motion.div>
            
            {apiError && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {apiError}
              </Alert>
            )}
            
            {success ? (
              <>
                <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                  Password reset link has been sent to your email.
                </Alert>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                    color="secondary.main"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Back to Login
                  </Link>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>
                
                <StyledForm onSubmit={handleSubmit}>
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
                      value={email}
                      onChange={handleChange}
                      error={!!validationError}
                      helperText={validationError}
                      sx={{ mb: 2 }}
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
                      'Send Reset Link'
                    )}
                  </SubmitButton>
                  
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Link
                      component={RouterLink}
                      to="/login"
                      variant="body2"
                      color="secondary.main"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Back to Login
                    </Link>
                  </Box>
                </StyledForm>
              </>
            )}
          </StyledPaper>
        </Box>
      </Container>
    </AnimatedContainer>
  );
}

export default ForgotPassword; 