import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import authService from '../../api/authService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Verification token is missing');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authService.verifyEmail(token);
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleRedirect = () => {
    navigate(success ? '/login' : '/register');
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Container maxWidth="sm">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '70vh' 
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              width: '100%', 
              borderRadius: 2,
              bgcolor: 'background.paper',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: 'secondary.main'
            }}
          >
            <Typography 
              component="h1" 
              variant="h4" 
              align="center" 
              color="secondary.main"
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Email Verification
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress color="secondary" />
              </Box>
            ) : success ? (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Your email has been successfully verified!
                </Alert>
                <Typography paragraph>
                  Thank you for verifying your email address. You can now log in to your account.
                </Typography>
                <Button 
                  variant="contained" 
                  color="secondary"
                  fullWidth 
                  onClick={handleRedirect}
                  sx={{ mt: 2 }}
                >
                  Go to Login
                </Button>
              </>
            ) : (
              <>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
                <Typography paragraph>
                  There was an issue verifying your email. The verification link may have expired or is invalid.
                </Typography>
                <Button 
                  variant="contained" 
                  color="secondary"
                  fullWidth 
                  onClick={handleRedirect}
                  sx={{ mt: 2 }}
                >
                  Return to Registration
                </Button>
              </>
            )}
          </Paper>
        </Box>
      </Container>
    </motion.div>
  );
};

export default VerifyEmail;
