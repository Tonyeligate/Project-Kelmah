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
  Card,
  CardContent,
  Chip,
  Fade,
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
  Build as BuildIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Construction as ConstructionIcon,
  Handyman as HandymanIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../auth/contexts/AuthContext';

const Register = () => {
  const steps = [
    'Choose Your Path',
    'Personal Details',
    'Account Security',
    'Confirmation',
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const validateStep = () => {
    let isValid = true;
    setError('');

    if (activeStep === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
        setError('Please fill out all required fields');
        isValid = false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        isValid = false;
      }
      if (!/^(\+233|0)[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
        setError('Please enter a valid Ghana phone number');
        isValid = false;
      }
    } else if (activeStep === 2) {
      if (!password || !confirmPassword) {
        setError('Please fill out all password fields');
        isValid = false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        isValid = false;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        isValid = false;
      }
      if (passwordStrength < 3) {
        setError('Please choose a stronger password with uppercase, lowercase, numbers, and symbols');
        isValid = false;
      }
      if (accountType === 'hirer' && !companyName.trim()) {
        setError('Please enter your company name');
        isValid = false;
      }
      if (!acceptTerms) {
        setError('You must accept the terms and conditions to continue');
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\s/g, ''),
        password,
        role: accountType,
        ...(accountType === 'hirer' && { companyName: companyName.trim() }),
        acceptTerms,
      };

      await register(userData);
      navigate('/login', { 
        state: { 
          registered: true,
          message: `Welcome to Kelmah! Please check your email to verify your account and start ${accountType === 'worker' ? 'finding work' : 'hiring skilled workers'}.`
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'error';
    if (passwordStrength <= 3) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  // Render step content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ p: 2 }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  textAlign: 'center', 
                  color: '#FFD700', 
                  fontWeight: 700, 
                  mb: 4 
                }}
              >
                What brings you to Kelmah?
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      elevation={accountType === 'worker' ? 12 : 4}
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        border: accountType === 'worker'
                          ? '3px solid #FFD700'
                          : '2px solid rgba(255,215,0,0.3)',
                        background: accountType === 'worker'
                          ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)'
                          : 'rgba(38,38,38,0.8)',
                        boxShadow: accountType === 'worker'
                          ? '0 8px 32px rgba(255,215,0,0.25)'
                          : '0 4px 16px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          border: '3px solid #FFD700',
                          boxShadow: '0 12px 40px rgba(255,215,0,0.3)',
                        },
                        '&::before': accountType === 'worker' ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #FFD700, #FFC000)',
                        } : {},
                      }}
                      onClick={() => setAccountType('worker')}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
                          }}
                        >
                          <HandymanIcon sx={{ fontSize: 40, color: '#000' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFD700', mb: 2 }}>
                          I'm a Skilled Worker
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                          I'm a tradesperson looking for work opportunities
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          {['Plumber', 'Electrician', 'Carpenter', 'Mason'].map((skill) => (
                            <Chip
                              key={skill}
                              label={skill}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255,215,0,0.2)',
                                color: '#FFD700',
                                fontWeight: 600,
                              }}
                            />
                          ))}
                        </Box>
                        <FormControlLabel
                          value="worker"
                          control={
                            <Radio 
                              checked={accountType === 'worker'}
                              sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                            />
                          }
                          label=""
                          sx={{ mt: 2 }}
                        />
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      elevation={accountType === 'hirer' ? 12 : 4}
                      sx={{
                        p: 3,
                        borderRadius: 4,
                        border: accountType === 'hirer'
                          ? '3px solid #FFD700'
                          : '2px solid rgba(255,215,0,0.3)',
                        background: accountType === 'hirer'
                          ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)'
                          : 'rgba(38,38,38,0.8)',
                        boxShadow: accountType === 'hirer'
                          ? '0 8px 32px rgba(255,215,0,0.25)'
                          : '0 4px 16px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          border: '3px solid #FFD700',
                          boxShadow: '0 12px 40px rgba(255,215,0,0.3)',
                        },
                        '&::before': accountType === 'hirer' ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: 'linear-gradient(90deg, #FFD700, #FFC000)',
                        } : {},
                      }}
                      onClick={() => setAccountType('hirer')}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 40, color: '#000' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFD700', mb: 2 }}>
                          I Need Skilled Workers
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                          I want to hire qualified professionals for my projects
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                          {['Home Repairs', 'Construction', 'Maintenance', 'Renovation'].map((service) => (
                            <Chip
                              key={service}
                              label={service}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255,215,0,0.2)',
                                color: '#FFD700',
                                fontWeight: 600,
                              }}
                            />
                          ))}
                        </Box>
                        <FormControlLabel
                          value="hirer"
                          control={
                            <Radio 
                              checked={accountType === 'hirer'}
                              sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                            />
                          }
                          label=""
                          sx={{ mt: 2 }}
                        />
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ p: 2 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ textAlign: 'center', color: '#FFD700', fontWeight: 600, mb: 3 }}
              >
                Tell us about yourself
              </Typography>
              <Grid container spacing={3}>
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
                          <PersonIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: 'rgba(255,215,0,0.8)' },
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
                          <PersonIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: 'rgba(255,215,0,0.8)' },
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
                          <EmailIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: 'rgba(255,215,0,0.8)' },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Phone Number (+233 or 0)"
                    variant="outlined"
                    fullWidth
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +233 24 123 4567 or 024 123 4567"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: 'rgba(255,215,0,0.8)' },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ p: 2 }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ textAlign: 'center', color: '#FFD700', fontWeight: 600, mb: 3 }}
              >
                Secure your account
              </Typography>
              <Grid container spacing={3}>
                {accountType === 'hirer' && (
                  <Grid item xs={12}>
                    <TextField
                      label="Company/Organization Name"
                      variant="outlined"
                      fullWidth
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,215,0,0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,215,0,0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFD700',
                          },
                        },
                      }}
                      InputLabelProps={{
                        sx: { color: 'rgba(255,215,0,0.8)' },
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
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: 'rgba(255,215,0,0.7)' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: 'rgba(255,215,0,0.8)' },
                    }}
                  />
                  {password && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Strength:
                      </Typography>
                      <Chip
                        label={getPasswordStrengthText()}
                        size="small"
                        color={getPasswordStrengthColor()}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  )}
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
                            sx={{ color: 'rgba(255,215,0,0.7)' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#FFD700',
                        },
                      },
                    }}
                    InputLabelProps={{
                      sx: { color: 'rgba(255,215,0,0.8)' },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        I agree to the{' '}
                        <Link href="/terms" sx={{ color: '#FFD700', fontWeight: 600 }}>
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" sx={{ color: '#FFD700', fontWeight: 600 }}>
                          Privacy Policy
                        </Link>
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: '#FFD700', mb: 3 }} />
              <Typography variant="h5" gutterBottom sx={{ color: '#FFD700', fontWeight: 700 }}>
                Ready to Join Kelmah!
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}>
                Please review your information before creating your account
              </Typography>

              <Card sx={{ background: 'rgba(50,50,50,0.8)', borderRadius: 3, p: 3, mb: 3 }}>
                <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      Account Type:
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                      {accountType === 'worker' ? '🔨 Skilled Worker' : '🏢 Service Hirer'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      Name:
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                      {firstName} {lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      Email:
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                      {email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                      Phone:
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                      {phone}
                    </Typography>
                  </Grid>
                  {accountType === 'hirer' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                        Company:
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                        {companyName}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Card>

              <Box sx={{ 
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                borderRadius: 2,
                p: 2,
                border: '1px solid rgba(255,215,0,0.2)',
              }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  By creating your account, you're joining Ghana's most trusted platform 
                  for skilled trades and professional services.
                </Typography>
              </Box>
            </Box>
          </motion.div>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Paper
        elevation={12}
        sx={{
          p: { xs: 3, sm: 5 },
          maxWidth: 800,
          mx: 'auto',
          borderRadius: 5,
          background: 'linear-gradient(145deg, rgba(38, 38, 38, 0.95) 0%, rgba(28, 28, 28, 0.98) 100%)',
          boxShadow: '0 12px 50px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(255,215,0,0.1)',
          border: '2px solid rgba(255,215,0,0.3)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
              }}
            >
              <WorkIcon sx={{ fontSize: 35, color: '#000' }} />
            </Box>
          </motion.div>
          
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              color: '#FFD700',
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.5rem' },
              letterSpacing: 0.5,
              textShadow: '0 2px 15px rgba(255,215,0,0.3)',
              mb: 1,
            }}
          >
            Join Kelmah Today
          </Typography>
          <Typography
            variant="h6"
            color="rgba(255,255,255,0.9)"
            sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.1rem' } }}
          >
            Connect with Ghana's skilled trade professionals
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 5,
            '& .MuiStepLabel-label': {
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              fontSize: '0.9rem',
              '&.Mui-active': {
                color: '#FFD700',
                fontWeight: 700,
              },
              '&.Mui-completed': {
                color: '#FFD700',
              },
            },
            '& .MuiStepIcon-root': {
              color: 'rgba(255,255,255,0.3)',
              '&.Mui-active': {
                color: '#FFD700',
              },
              '&.Mui-completed': {
                color: '#FFD700',
              },
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                '& .MuiAlert-message': { fontWeight: 500, color: '#ff6b6b' }
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              px: 4,
              py: 1.5,
              borderColor: activeStep === 0 ? 'rgba(255,215,0,0.3)' : '#FFD700',
              color: activeStep === 0 ? 'rgba(255,215,0,0.5)' : '#FFD700',
              borderWidth: 2,
              borderRadius: 2,
              '&:hover': {
                background: activeStep === 0 ? 'transparent' : 'rgba(255,215,0,0.1)',
                borderColor: activeStep === 0 ? 'rgba(255,215,0,0.3)' : '#FFD700',
                borderWidth: 2,
              },
              '&:disabled': {
                borderColor: 'rgba(255,215,0,0.2)',
                color: 'rgba(255,215,0,0.4)',
              },
            }}
          >
            Back
          </Button>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(255,215,0,0.25)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                  boxShadow: '0 6px 20px rgba(255,215,0,0.35)',
                },
                '&:disabled': {
                  background: 'rgba(255,215,0,0.3)',
                  color: 'rgba(0,0,0,0.5)',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#000' }} />
                  Creating Account...
                </Box>
              ) : activeStep === steps.length - 1 ? (
                'Create Account'
              ) : (
                'Continue'
              )}
            </Button>
          </motion.div>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body1" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)' }}>
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              variant="body1"
              sx={{
                color: '#FFD700',
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': {
                  color: '#FFC000',
                  textDecoration: 'underline',
                },
              }}
            >
              Sign in here
            </Link>
          </Typography>
          
          <Divider sx={{ my: 4, borderColor: 'rgba(255,215,0,0.3)' }}>
            <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600, px: 2 }}>
              OR SIGN UP WITH
            </Typography>
          </Divider>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#4285F4',
                    borderColor: '#4285F4',
                    borderWidth: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                      background: '#4285F4',
                      color: '#fff',
                      borderColor: '#4285F4',
                      borderWidth: 2,
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
                  startIcon={<LinkedInIcon />}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#0077B5',
                    borderColor: '#0077B5',
                    borderWidth: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': {
                      background: '#0077B5',
                      color: '#fff',
                      borderColor: '#0077B5',
                      borderWidth: 2,
                    },
                  }}
                >
                  LinkedIn
                </Button>
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default Register;
