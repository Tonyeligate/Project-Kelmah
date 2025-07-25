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
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Google as GoogleIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../auth/contexts/AuthContext';

const Register = () => {
  const steps = [
    'Account Type',
    'Personal Information',
    'Account Details',
    'Review',
  ];
  const [activeStep, setActiveStep] = useState(0);
  const [accountType, setAccountType] = useState('worker');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (name === 'acceptTerms') {
      setAcceptTerms(checked);
    } else {
      if (name === 'firstName') setFirstName(value);
      if (name === 'lastName') setLastName(value);
      if (name === 'email') setEmail(value);
      if (name === 'phone') setPhone(value);
      if (name === 'password') setPassword(value);
      if (name === 'confirmPassword') setConfirmPassword(value);
      if (name === 'role') setAccountType(value);
      if (name === 'companyName') setCompanyName(value);
    }

    // Clear error when field is modified
    if (error) {
      setError('');
    }
  };

  const validateStep = () => {
    let isValid = true;

    if (activeStep === 0) {
      if (!firstName || !lastName || !email || !phone) {
        setError('Please fill out all required fields');
        isValid = false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        isValid = false;
      }
    } else if (activeStep === 1) {
      if (!password || !confirmPassword) {
        setError('Please fill out all required fields');
        isValid = false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        isValid = false;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        isValid = false;
      }
      if (accountType === 'hirer' && !companyName) {
        setError('Please enter your company name');
        isValid = false;
      }
      if (!acceptTerms) {
        setError('You must accept the terms and conditions');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);
      const userData = {
        firstName,
        lastName,
        email,
        phone,
        password,
        role: accountType,
        ...(accountType === 'hirer' && { companyName }),
        acceptTerms,
      };

      await register(userData);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render step content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 2 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6" gutterBottom>
                  I want to:
                </Typography>
              </FormLabel>
              <RadioGroup
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={accountType === 'worker' ? 8 : 2}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border:
                          accountType === 'worker'
                            ? '3px solid #FFD700'
                            : '2px solid #444',
                        background:
                          accountType === 'worker'
                            ? 'rgba(255, 215, 0, 0.13)'
                            : 'rgba(38,38,38,0.85)',
                        boxShadow:
                          accountType === 'worker'
                            ? '0 4px 24px 0 rgba(255,215,0,0.13)'
                            : '0 2px 8px 0 rgba(0,0,0,0.10)',
                        color: accountType === 'worker' ? '#FFD700' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        backdropFilter: 'blur(8px)',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        '&:hover, &:focus': {
                          border: '3px solid #FFD700',
                          background: 'rgba(255, 215, 0, 0.18)',
                          color: '#FFD700',
                          boxShadow: '0 6px 32px 0 rgba(255,215,0,0.18)',
                        },
                      }}
                      onClick={() => setAccountType('worker')}
                    >
                      <FormControlLabel
                        value="worker"
                        control={<Radio />}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              ml: 1,
                            }}
                          >
                            <Typography variant="h6">Find Work</Typography>
                            <Typography variant="body2" color="text.secondary">
                              I'm looking for work and want to bid on jobs
                            </Typography>
                          </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={accountType === 'hirer' ? 8 : 2}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border:
                          accountType === 'hirer'
                            ? '3px solid #FFD700'
                            : '2px solid #444',
                        background:
                          accountType === 'hirer'
                            ? 'rgba(255, 215, 0, 0.13)'
                            : 'rgba(38,38,38,0.85)',
                        boxShadow:
                          accountType === 'hirer'
                            ? '0 4px 24px 0 rgba(255,215,0,0.13)'
                            : '0 2px 8px 0 rgba(0,0,0,0.10)',
                        color: accountType === 'hirer' ? '#FFD700' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        backdropFilter: 'blur(8px)',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        '&:hover, &:focus': {
                          border: '3px solid #FFD700',
                          background: 'rgba(255, 215, 0, 0.18)',
                          color: '#FFD700',
                          boxShadow: '0 6px 32px 0 rgba(255,215,0,0.18)',
                        },
                      }}
                      onClick={() => setAccountType('hirer')}
                    >
                      <FormControlLabel
                        value="hirer"
                        control={<Radio />}
                        label={
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              ml: 1,
                            }}
                          >
                            <Typography variant="h6">Hire Talent</Typography>
                            <Typography variant="body2" color="text.secondary">
                              I want to hire skilled professionals
                            </Typography>
                          </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </RadioGroup>
            </FormControl>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  variant="outlined"
                  fullWidth
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone Number"
                  variant="outlined"
                  fullWidth
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {accountType === 'hirer' && (
                <Grid item xs={12}>
                  <TextField
                    label="Company Name"
                    variant="outlined"
                    fullWidth
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
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
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Confirm Password"
                  variant="outlined"
                  fullWidth
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Account Type:</Typography>
                <Typography variant="body1" gutterBottom>
                  {accountType === 'worker'
                    ? 'Worker (Find Work)'
                    : 'Hirer (Hire Talent)'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Name:</Typography>
                <Typography variant="body1" gutterBottom>
                  {firstName} {lastName}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Email:</Typography>
                <Typography variant="body1" gutterBottom>
                  {email}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Phone:</Typography>
                <Typography variant="body1" gutterBottom>
                  {phone}
                </Typography>
              </Grid>

              {accountType === 'hirer' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Company:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {companyName}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              By clicking "Register", you agree to our Terms of Service and
              Privacy Policy.
            </Typography>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Paper
      elevation={6}
      sx={{
        p: { xs: 2, sm: 4 },
        maxWidth: 700,
        mx: 'auto',
        borderRadius: 4,
        background: 'rgba(38, 38, 38, 0.98)',
        boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
        border: '2px solid #FFD700',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            color: '#FFD700',
            fontWeight: 800,
            fontSize: { xs: '2rem', sm: '2.5rem' },
            letterSpacing: 1,
            textShadow: '0 2px 12px rgba(0,0,0,0.25)',
          }}
        >
          Create Your Account
        </Typography>
        <Typography
          variant="h6"
          color="#fff"
          sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.2rem' } }}
        >
          Join Kelmah to find work or hire talent
        </Typography>
      </Box>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 4,
          '& .MuiStepLabel-label': {
            color: '#FFD700',
            fontWeight: 700,
            fontSize: '1.1rem',
          },
          '& .MuiStepIcon-root': { color: '#FFD700 !important' },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {error && (
        <Alert severity="error" sx={{ mb: 3, fontSize: '1.1rem' }}>
          {error}
        </Alert>
      )}
      {getStepContent(activeStep)}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            px: 4,
            py: 1.5,
            borderColor: '#FFD700',
            color: activeStep === 0 ? '#FFD70099' : '#FFD700',
            background:
              activeStep === 0
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.04)',
            boxShadow: '0 2px 8px 0 rgba(255,215,0,0.08)',
            opacity: activeStep === 0 ? 0.7 : 1,
            cursor: activeStep === 0 ? 'not-allowed' : 'pointer',
            borderWidth: 2,
            '&:hover': {
              background: '#FFD700',
              color: '#222',
              borderColor: '#FFD700',
            },
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={loading}
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            px: 4,
            py: 1.5,
            background: 'linear-gradient(90deg, #FFD700 60%, #FFC000 100%)',
            color: '#222',
            boxShadow: '0 4px 16px 0 rgba(255,215,0,0.18)',
            border: '2px solid #FFD700',
            '&:hover': {
              background: 'linear-gradient(90deg, #FFC000 60%, #FFD700 100%)',
              color: '#111',
            },
          }}
        >
          {activeStep === steps.length - 1 ? 'Register' : 'Next'}
        </Button>
      </Box>
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#fff' }}>
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
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
            Sign in
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

export default Register;
