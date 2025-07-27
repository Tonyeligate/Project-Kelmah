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
  Container,
  Stack,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !email.trim() ||
        !phone.trim()
      ) {
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
        setError(
          'Please choose a stronger password with uppercase, lowercase, numbers, and symbols',
        );
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
          message: `Welcome to Kelmah! Please check your email to verify your account and start ${accountType === 'worker' ? 'finding work' : 'hiring skilled workers'}.`,
        },
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
            <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
              <Stack spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    color: '#FFD700',
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    mb: { xs: 1, sm: 1.5 },
                  }}
                >
                  What brings you to Kelmah?
                </Typography>

                <Grid
                  container
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{ maxWidth: { xs: '100%', sm: 500 } }}
                >
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      whileHover={{ scale: isMobile ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        elevation={accountType === 'worker' ? 12 : 4}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: { xs: 2, sm: 3 },
                          border:
                            accountType === 'worker'
                              ? '2px solid #FFD700'
                              : '1px solid rgba(255,215,0,0.3)',
                          background:
                            accountType === 'worker'
                              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)'
                              : 'rgba(38,38,38,0.8)',
                          boxShadow:
                            accountType === 'worker'
                              ? '0 8px 32px rgba(255,215,0,0.25)'
                              : '0 4px 16px rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backdropFilter: 'blur(10px)',
                          position: 'relative',
                          overflow: 'hidden',
                          minHeight: { xs: 'auto', sm: '280px' },
                          '&:hover': {
                            border: '3px solid #FFD700',
                            boxShadow: '0 12px 40px rgba(255,215,0,0.3)',
                          },
                          '&::before':
                            accountType === 'worker'
                              ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '4px',
                                  background:
                                    'linear-gradient(90deg, #FFD700, #FFC000)',
                                }
                              : {},
                        }}
                        onClick={() => setAccountType('worker')}
                      >
                        <Stack
                          spacing={{ xs: 2, sm: 3 }}
                          alignItems="center"
                          sx={{ textAlign: 'center' }}
                        >
                          <Box
                            sx={{
                              width: { xs: 60, sm: 80 },
                              height: { xs: 60, sm: 80 },
                              borderRadius: '50%',
                              background:
                                'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
                            }}
                          >
                            <HandymanIcon
                              sx={{
                                fontSize: { xs: 30, sm: 40 },
                                color: '#000',
                              }}
                            />
                          </Box>

                          <Stack spacing={1} alignItems="center">
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                color: '#FFD700',
                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                              }}
                            >
                              I'm a Skilled Worker
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                lineHeight: 1.4,
                              }}
                            >
                              I'm a tradesperson looking for work opportunities
                            </Typography>
                          </Stack>

                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                              justifyContent: 'center',
                            }}
                          >
                            {[
                              'Plumber',
                              'Electrician',
                              'Carpenter',
                              'Mason',
                            ].map((skill) => (
                              <Chip
                                key={skill}
                                label={skill}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255,215,0,0.2)',
                                  color: '#FFD700',
                                  fontWeight: 600,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                }}
                              />
                            ))}
                          </Box>

                          <FormControlLabel
                            value="worker"
                            control={
                              <Radio
                                checked={accountType === 'worker'}
                                sx={{
                                  color: '#FFD700',
                                  '&.Mui-checked': { color: '#FFD700' },
                                }}
                              />
                            }
                            label=""
                            sx={{ mt: 1 }}
                          />
                        </Stack>
                      </Card>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <motion.div
                      whileHover={{ scale: isMobile ? 1 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        elevation={accountType === 'hirer' ? 12 : 4}
                        sx={{
                          p: { xs: 2, sm: 3 },
                          borderRadius: { xs: 3, sm: 4 },
                          border:
                            accountType === 'hirer'
                              ? '3px solid #FFD700'
                              : '2px solid rgba(255,215,0,0.3)',
                          background:
                            accountType === 'hirer'
                              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)'
                              : 'rgba(38,38,38,0.8)',
                          boxShadow:
                            accountType === 'hirer'
                              ? '0 8px 32px rgba(255,215,0,0.25)'
                              : '0 4px 16px rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backdropFilter: 'blur(10px)',
                          position: 'relative',
                          overflow: 'hidden',
                          minHeight: { xs: 'auto', sm: '280px' },
                          '&:hover': {
                            border: '3px solid #FFD700',
                            boxShadow: '0 12px 40px rgba(255,215,0,0.3)',
                          },
                          '&::before':
                            accountType === 'hirer'
                              ? {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '4px',
                                  background:
                                    'linear-gradient(90deg, #FFD700, #FFC000)',
                                }
                              : {},
                        }}
                        onClick={() => setAccountType('hirer')}
                      >
                        <Stack
                          spacing={{ xs: 2, sm: 3 }}
                          alignItems="center"
                          sx={{ textAlign: 'center' }}
                        >
                          <Box
                            sx={{
                              width: { xs: 60, sm: 80 },
                              height: { xs: 60, sm: 80 },
                              borderRadius: '50%',
                              background:
                                'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 8px 25px rgba(255,215,0,0.3)',
                            }}
                          >
                            <SearchIcon
                              sx={{
                                fontSize: { xs: 30, sm: 40 },
                                color: '#000',
                              }}
                            />
                          </Box>

                          <Stack spacing={1} alignItems="center">
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                color: '#FFD700',
                                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                              }}
                            >
                              I Need Skilled Workers
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: { xs: '0.9rem', sm: '1rem' },
                                lineHeight: 1.4,
                              }}
                            >
                              I want to hire qualified professionals for my
                              projects
                            </Typography>
                          </Stack>

                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                              justifyContent: 'center',
                            }}
                          >
                            {[
                              'Home Repairs',
                              'Construction',
                              'Maintenance',
                              'Renovation',
                            ].map((service) => (
                              <Chip
                                key={service}
                                label={service}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255,215,0,0.2)',
                                  color: '#FFD700',
                                  fontWeight: 600,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                }}
                              />
                            ))}
                          </Box>

                          <FormControlLabel
                            value="hirer"
                            control={
                              <Radio
                                checked={accountType === 'hirer'}
                                sx={{
                                  color: '#FFD700',
                                  '&.Mui-checked': { color: '#FFD700' },
                                }}
                              />
                            }
                            label=""
                            sx={{ mt: 1 }}
                          />
                        </Stack>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>
              </Stack>
            </Container>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
              <Stack spacing={3} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    color: '#FFD700',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  }}
                >
                  Tell us about yourself
                </Typography>

                <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%' }}>
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        variant="outlined"
                        fullWidth
                        required
                        size="small"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon
                                sx={{
                                  color: 'rgba(255,215,0,0.7)',
                                  fontSize: { xs: 16, sm: 18 },
                                }}
                              />
                            </InputAdornment>
                          ),
                          sx: {
                            color: 'white',
                            fontSize: { xs: '0.85rem', sm: '0.9rem' },
                            minHeight: { xs: '38px', sm: '42px' },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,215,0,0.3)',
                              borderWidth: { xs: 1.5, sm: 2 },
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
                          sx: {
                            color: 'rgba(255,215,0,0.8)',
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                          },
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
                              <PersonIcon
                                sx={{
                                  color: 'rgba(255,215,0,0.7)',
                                  fontSize: { xs: 20, sm: 24 },
                                }}
                              />
                            </InputAdornment>
                          ),
                          sx: {
                            color: 'white',
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            minHeight: { xs: '52px', sm: '56px' },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,215,0,0.3)',
                              borderWidth: { xs: 1.5, sm: 2 },
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
                          sx: {
                            color: 'rgba(255,215,0,0.8)',
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

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
                          <EmailIcon
                            sx={{
                              color: 'rgba(255,215,0,0.7)',
                              fontSize: { xs: 20, sm: 24 },
                            }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        minHeight: { xs: '52px', sm: '56px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                          borderWidth: { xs: 1.5, sm: 2 },
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
                      sx: {
                        color: 'rgba(255,215,0,0.8)',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      },
                    }}
                  />

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
                          <PhoneIcon
                            sx={{
                              color: 'rgba(255,215,0,0.7)',
                              fontSize: { xs: 20, sm: 24 },
                            }}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        minHeight: { xs: '52px', sm: '56px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                          borderWidth: { xs: 1.5, sm: 2 },
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
                      sx: {
                        color: 'rgba(255,215,0,0.8)',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      },
                    }}
                  />
                </Stack>
              </Stack>
            </Container>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
              <Stack spacing={3} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    color: '#FFD700',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  }}
                >
                  Secure your account
                </Typography>

                <Stack spacing={{ xs: 2.5, sm: 3 }} sx={{ width: '100%' }}>
                  {accountType === 'hirer' && (
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
                            <BusinessIcon
                              sx={{
                                color: 'rgba(255,215,0,0.7)',
                                fontSize: { xs: 20, sm: 24 },
                              }}
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          color: 'white',
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          minHeight: { xs: '52px', sm: '56px' },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,215,0,0.3)',
                            borderWidth: { xs: 1.5, sm: 2 },
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
                        sx: {
                          color: 'rgba(255,215,0,0.8)',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        },
                      }}
                    />
                  )}

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
                            size={isMobile ? 'small' : 'medium'}
                            sx={{
                              color: 'rgba(255,215,0,0.7)',
                              minWidth: { xs: '40px', sm: '48px' },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        minHeight: { xs: '52px', sm: '56px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                          borderWidth: { xs: 1.5, sm: 2 },
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
                      sx: {
                        color: 'rgba(255,215,0,0.8)',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      },
                    }}
                  />

                  {password && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        }}
                      >
                        Strength:
                      </Typography>
                      <Chip
                        label={getPasswordStrengthText()}
                        size="small"
                        color={getPasswordStrengthColor()}
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                      />
                    </Box>
                  )}

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
                            size={isMobile ? 'small' : 'medium'}
                            sx={{
                              color: 'rgba(255,215,0,0.7)',
                              minWidth: { xs: '40px', sm: '48px' },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: 'white',
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        minHeight: { xs: '52px', sm: '56px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,215,0,0.3)',
                          borderWidth: { xs: 1.5, sm: 2 },
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
                      sx: {
                        color: 'rgba(255,215,0,0.8)',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      },
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{
                          color: '#FFD700',
                          '&.Mui-checked': { color: '#FFD700' },
                          alignSelf: 'flex-start',
                          mt: 0.5,
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: { xs: '0.85rem', sm: '0.9rem' },
                          lineHeight: 1.4,
                        }}
                      >
                        I agree to the{' '}
                        <Link
                          href="/terms"
                          sx={{
                            color: '#FFD700',
                            fontWeight: 600,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="/privacy"
                          sx={{
                            color: '#FFD700',
                            fontWeight: 600,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          Privacy Policy
                        </Link>
                      </Typography>
                    }
                    sx={{ alignItems: 'flex-start', mt: 1 }}
                  />
                </Stack>
              </Stack>
            </Container>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
              <Stack
                spacing={3}
                alignItems="center"
                sx={{ textAlign: 'center' }}
              >
                <CheckCircleIcon
                  sx={{ fontSize: { xs: 60, sm: 80 }, color: '#FFD700' }}
                />

                <Stack spacing={2} alignItems="center">
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#FFD700',
                      fontWeight: 700,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                  >
                    Ready to Join Kelmah!
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      maxWidth: 400,
                    }}
                  >
                    Please review your information before creating your account
                  </Typography>
                </Stack>

                <Card
                  sx={{
                    background: 'rgba(50,50,50,0.8)',
                    borderRadius: { xs: 2, sm: 3 },
                    p: { xs: 2, sm: 3 },
                    width: '100%',
                    maxWidth: 500,
                  }}
                >
                  <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: '#FFD700',
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.85rem' },
                        }}
                      >
                        Account Type:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'white',
                          mb: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }}
                      >
                        {accountType === 'worker'
                          ? '🔨 Skilled Worker'
                          : '🏢 Service Hirer'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: '#FFD700',
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.85rem' },
                        }}
                      >
                        Name:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'white',
                          mb: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }}
                      >
                        {firstName} {lastName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: '#FFD700',
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.85rem' },
                        }}
                      >
                        Email:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'white',
                          mb: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          wordBreak: 'break-word',
                        }}
                      >
                        {email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: '#FFD700',
                          fontWeight: 600,
                          fontSize: { xs: '0.8rem', sm: '0.85rem' },
                        }}
                      >
                        Phone:
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'white',
                          mb: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }}
                      >
                        {phone}
                      </Typography>
                    </Grid>
                    {accountType === 'hirer' && (
                      <Grid item xs={12}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#FFD700',
                            fontWeight: 600,
                            fontSize: { xs: '0.8rem', sm: '0.85rem' },
                          }}
                        >
                          Company:
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'white',
                            mb: 2,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                          }}
                        >
                          {companyName}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Card>

                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                    borderRadius: { xs: 1.5, sm: 2 },
                    p: { xs: 2, sm: 2.5 },
                    border: '1px solid rgba(255,215,0,0.2)',
                    width: '100%',
                    maxWidth: 500,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      lineHeight: 1.5,
                    }}
                  >
                    By creating your account, you're joining Ghana's most
                    trusted platform for skilled trades and professional
                    services.
                  </Typography>
                </Box>
              </Stack>
            </Container>
          </motion.div>
        );
      default:
        return 'Unknown step';
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
        px: { xs: 0.5, sm: 2 },
        py: { xs: 0.5, sm: 2 },
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          px: { xs: 0.5, sm: 2 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%' }}
        >
          <Paper
            elevation={12}
            sx={{
              p: { xs: 1.5, sm: 2.5, md: 3 },
              width: '100%',
              maxWidth: { xs: '100%', sm: 500, md: 700 },
              mx: 'auto',
              borderRadius: { xs: 2, sm: 3 },
              background:
                'linear-gradient(145deg, rgba(38, 38, 38, 0.95) 0%, rgba(28, 28, 28, 0.98) 100%)',
              boxShadow: {
                xs: '0 4px 20px 0 rgba(0,0,0,0.25)',
                sm: '0 6px 24px 0 rgba(0,0,0,0.3)',
              },
              border: {
                xs: '1px solid rgba(255,215,0,0.2)',
                sm: '2px solid rgba(255,215,0,0.3)',
              },
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
              maxHeight: { xs: '98vh', sm: 'auto' },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: { xs: '2px', sm: '3px' },
                background:
                  'linear-gradient(90deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
              },
            }}
          >
            {/* Compact Header */}
            <Stack
              spacing={{ xs: 1, sm: 1.5 }}
              alignItems="center"
              sx={{ mb: { xs: 1.5, sm: 2 } }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Box
                  sx={{
                    width: { xs: 35, sm: 45 },
                    height: { xs: 35, sm: 45 },
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(255,215,0,0.3)',
                  }}
                >
                  <WorkIcon
                    sx={{ fontSize: { xs: 18, sm: 24 }, color: '#000' }}
                  />
                </Box>
              </motion.div>

              <Stack
                spacing={0.5}
                alignItems="center"
                sx={{ textAlign: 'center' }}
              >
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', sm: '1.4rem' },
                    letterSpacing: 0.3,
                    textShadow: '0 2px 10px rgba(255,215,0,0.3)',
                    lineHeight: 1.1,
                  }}
                >
                  Join Kelmah
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  }}
                >
                  Connect with Ghana's skilled trade professionals
                </Typography>
              </Stack>
            </Stack>

            {/* Compact Stepper */}
            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? 'horizontal' : 'horizontal'}
              sx={{
                mb: { xs: 1.5, sm: 2 },
                '& .MuiStepLabel-label': {
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
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
                  fontSize: { xs: '1rem', sm: '1.2rem' },
                  '&.Mui-active': {
                    color: '#FFD700',
                  },
                  '&.Mui-completed': {
                    color: '#FFD700',
                  },
                },
                '& .MuiStepConnector-line': {
                  borderColor: 'rgba(255,215,0,0.3)',
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{isMobile ? '' : label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Compact Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Alert
                  severity="error"
                  sx={{
                    mb: { xs: 1, sm: 1.5 },
                    borderRadius: 1.5,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    py: { xs: 0.5, sm: 0.75 },
                    '& .MuiAlert-message': {
                      fontWeight: 500,
                      color: '#ff6b6b',
                    },
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            {/* Compact Step Content */}
            <Box
              sx={{
                minHeight: { xs: '45vh', sm: '300px' },
                maxHeight: { xs: '50vh', sm: 'auto' },
                overflow: 'auto',
                mb: { xs: 1, sm: 2 },
              }}
            >
              {getStepContent(activeStep)}
            </Box>

            {/* Compact Navigation Buttons */}
            <Stack
              direction="row"
              justifyContent="space-between"
              spacing={1.5}
              sx={{ mt: { xs: 1, sm: 2 } }}
            >
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.85rem' },
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1, sm: 1.2 },
                  minHeight: { xs: '36px', sm: '40px' },
                  borderColor:
                    activeStep === 0 ? 'rgba(255,215,0,0.3)' : '#FFD700',
                  color: activeStep === 0 ? 'rgba(255,215,0,0.5)' : '#FFD700',
                  borderWidth: 1.5,
                  borderRadius: 1.5,
                  '&:hover': {
                    background:
                      activeStep === 0 ? 'transparent' : 'rgba(255,215,0,0.1)',
                    borderColor:
                      activeStep === 0 ? 'rgba(255,215,0,0.3)' : '#FFD700',
                    borderWidth: 1.5,
                  },
                  '&:disabled': {
                    borderColor: 'rgba(255,215,0,0.2)',
                    color: 'rgba(255,215,0,0.4)',
                  },
                }}
              >
                Back
              </Button>

              <motion.div
                whileHover={{ scale: isMobile ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1, sm: 1.2 },
                    minHeight: { xs: '36px', sm: '40px' },
                    background:
                      'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                    color: '#000',
                    borderRadius: 1.5,
                    boxShadow: '0 3px 12px rgba(255,215,0,0.2)',
                    textTransform: 'none',
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                      boxShadow: '0 4px 16px rgba(255,215,0,0.3)',
                    },
                    '&:disabled': {
                      background: 'rgba(255,215,0,0.3)',
                      color: 'rgba(0,0,0,0.5)',
                    },
                  }}
                >
                  {loading ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <CircularProgress size={14} sx={{ color: '#000' }} />
                      <Typography
                        sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                      >
                        Creating...
                      </Typography>
                    </Stack>
                  ) : activeStep === steps.length - 1 ? (
                    'Create Account'
                  ) : (
                    'Continue'
                  )}
                </Button>
              </motion.div>
            </Stack>

            {/* Compact Footer */}
            <Stack
              spacing={{ xs: 1.5, sm: 2 }}
              alignItems="center"
              sx={{ mt: { xs: 2, sm: 2.5 } }}
            >
              {/* Sign In Link */}
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: 'center',
                }}
              >
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
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
                  Sign in
                </Link>
              </Typography>

              {/* Compact Social Login */}
              <Divider
                sx={{
                  width: '100%',
                  borderColor: 'rgba(255,215,0,0.25)',
                  '& .MuiDivider-wrapper': {
                    px: 1,
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 600,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    letterSpacing: 0.3,
                  }}
                >
                  OR SIGN UP WITH
                </Typography>
              </Divider>

              <Grid container spacing={1} sx={{ maxWidth: 300 }}>
                <Grid item xs={6}>
                  <motion.div
                    whileHover={{ scale: isMobile ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={
                        <GoogleIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                      }
                      size="small"
                      sx={{
                        py: { xs: 0.8, sm: 1 },
                        minHeight: { xs: '32px', sm: '36px' },
                        fontWeight: 600,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
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
                    whileHover={{ scale: isMobile ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={
                        <LinkedInIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
                      }
                      size="small"
                      sx={{
                        py: { xs: 0.8, sm: 1 },
                        minHeight: { xs: '32px', sm: '36px' },
                        fontWeight: 600,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
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
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register;
