/**
 * Professional Mobile Registration Component
 * Clean, step-based design optimized for mobile devices
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Stack,
  Fade,
  Chip,
  Autocomplete,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControl,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  register as registerAction,
  selectAuthLoading,
  selectAuthError,
} from '../../services/authSlice';
import logoIcon from '../../../../assets/images/logo.png';

// Ghana phone validation
const validateGhanaPhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, '');
  return /^(\+233|0)[0-9]{9}$/.test(cleaned);
};

// Password strength
const checkPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

// Common trades
const COMMON_TRADES = [
  'Electrician', 'Plumber', 'Carpenter', 'Mason', 'Painter',
  'Mechanic', 'Welder', 'Tailor', 'Barber', 'Hairdresser',
  'Cook', 'Cleaner', 'Driver', 'Gardener', 'HVAC Technician',
  'Tiler', 'Roofer', 'Blacksmith', 'Electronics Repair',
];

const MobileRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  // Step state
  const [step, setStep] = useState(1); // 1: Role, 2: Info, 3: Security
  const totalSteps = 3;

  // Form state
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    trades: [],
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (authError) setSubmitError(authError);
  }, [authError]);

  // Handle input changes
  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === 'acceptTerms') value = event.target.checked;
    if (field === 'phone') value = value.replace(/[^\d+\s]/g, '');

    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (submitError) setSubmitError('');
    if (field === 'password') setPasswordStrength(checkPasswordStrength(value));
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.role) newErrors.role = 'Please select account type';
    }

    if (step === 2) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Required';
      if (!formData.email.trim()) {
        newErrors.email = 'Required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Required';
      } else if (!validateGhanaPhone(formData.phone)) {
        newErrors.phone = 'Invalid Ghana number';
      }
      if (formData.role === 'hirer' && !formData.companyName.trim()) {
        newErrors.companyName = 'Required';
      }
      if (formData.role === 'worker' && formData.trades.length === 0) {
        newErrors.trades = 'Select at least one';
      }
    }

    if (step === 3) {
      if (!formData.password) {
        newErrors.password = 'Required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Min 8 characters';
      } else if (passwordStrength < 3) {
        newErrors.password = 'Too weak';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Required';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords don\'t match';
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'Must accept terms';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    if (step === 1) navigate('/');
    else setStep((s) => Math.max(s - 1, 1));
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\s/g, ''),
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'hirer' && { companyName: formData.companyName.trim() }),
        ...(formData.role === 'worker' && { trades: formData.trades }),
        acceptTerms: formData.acceptTerms,
      };

      await dispatch(registerAction(userData)).unwrap();
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: {
            registered: true,
            message: 'Registration successful! Please verify your email.',
            redirectTo:
              location.state?.from || location.state?.redirectTo || '/dashboard',
          },
        });
      }, 1500);
    } catch (error) {
      setSubmitError(error.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input styles
  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderRadius: 2,
      minHeight: 44,
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.4)' },
      '&.Mui-focused fieldset': { borderColor: '#FFD700', borderWidth: 2 },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)', fontSize: '14px' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
    '& .MuiOutlinedInput-input': { color: 'white', fontSize: '16px' },
  };

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Box>
            <Typography sx={{ color: 'white', fontWeight: 600, mb: 2, textAlign: 'center' }}>
              I want to...
            </Typography>
            <Stack spacing={2}>
              {[
                { value: 'worker', icon: <WorkIcon />, label: 'Find Work', desc: 'I\'m a skilled tradesperson' },
                { value: 'hirer', icon: <BusinessIcon />, label: 'Hire Workers', desc: 'I need skilled professionals' },
              ].map((option) => (
                <Box
                  key={option.value}
                  onClick={() => setFormData((p) => ({ ...p, role: option.value }))}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: formData.role === option.value
                      ? '2px solid #FFD700'
                      : '2px solid rgba(255,255,255,0.15)',
                    backgroundColor: formData.role === option.value
                      ? 'rgba(255, 215, 0, 0.1)'
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'rgba(255, 215, 0, 0.5)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 45,
                        height: 45,
                        borderRadius: '50%',
                        backgroundColor: formData.role === option.value ? '#FFD700' : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: formData.role === option.value ? '#000' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {option.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 600 }}>{option.label}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{option.desc}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
            {errors.role && (
              <Typography sx={{ color: '#f44336', fontSize: '14px', mt: 1, textAlign: 'center' }}>
                {errors.role}
              </Typography>
            )}
          </Box>
        );

      case 2:
        return (
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', '@media (max-width: 360px)': { flexDirection: 'column' } }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName}
                size="small"
                inputProps={{ style: { fontSize: 16 } }}
                sx={{ ...inputStyles, flex: '1 1 140px' }}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName}
                size="small"
                inputProps={{ style: { fontSize: 16 } }}
                sx={{ ...inputStyles, flex: '1 1 140px' }}
              />
            </Box>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange('email')}
              error={Boolean(errors.email)}
              helperText={errors.email}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
            <TextField
              fullWidth
              label="Phone (Ghana)"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={Boolean(errors.phone)}
              helperText={errors.phone}
              placeholder="+233 or 0XX XXX XXXX"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
            {formData.role === 'hirer' && (
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={handleChange('companyName')}
                error={Boolean(errors.companyName)}
                helperText={errors.companyName}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputStyles}
              />
            )}
            {formData.role === 'worker' && (
              <Autocomplete
                multiple
                options={COMMON_TRADES}
                value={formData.trades}
                onChange={(_, newValue) => setFormData((p) => ({ ...p, trades: newValue }))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      sx={{ backgroundColor: 'rgba(255,215,0,0.2)', color: '#FFD700' }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Your Skills/Trades"
                    error={Boolean(errors.trades)}
                    helperText={errors.trades}
                    size="small"
                    sx={inputStyles}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-tag': { color: '#FFD700' },
                  '& .MuiAutocomplete-popupIndicator': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiAutocomplete-clearIndicator': { color: 'rgba(255,255,255,0.5)' },
                }}
              />
            )}
          </Stack>
        );

      case 3:
        return (
          <Stack spacing={1.5}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={formData.password}
              onChange={handleChange('password')}
              error={Boolean(errors.password)}
              helperText={errors.password}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'rgba(255,255,255,0.4)', minWidth: 44, minHeight: 44 }}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
            {formData.password && (
              <Box>
                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength / 5) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: passwordStrength <= 2 ? '#f44336' : passwordStrength <= 3 ? '#ff9800' : '#4caf50',
                    },
                  }}
                />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', mt: 0.5 }}>
                  Strength: {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} sx={{ color: 'rgba(255,255,255,0.4)', minWidth: 44, minHeight: 44 }}>
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.acceptTerms}
                  onChange={handleChange('acceptTerms')}
                  size="small"
                  sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#FFD700' } }}
                />
              }
              label={
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  I accept the{' '}
                  <Button component={RouterLink} to="/terms" sx={{ color: '#FFD700', fontSize: '14px', py: 0.5, px: 0.5, minWidth: 'auto', textTransform: 'none', verticalAlign: 'baseline' }}>
                    Terms
                  </Button>{' '}
                  &{' '}
                  <Button component={RouterLink} to="/privacy" sx={{ color: '#FFD700', fontSize: '14px', py: 0.5, px: 0.5, minWidth: 'auto', textTransform: 'none', verticalAlign: 'baseline' }}>
                    Privacy Policy
                  </Button>
                </Typography>
              }
            />
            {errors.acceptTerms && (
              <Typography sx={{ color: '#f44336', fontSize: '14px' }}>{errors.acceptTerms}</Typography>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', px: 3, py: 3 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box component="img" src={logoIcon} alt="Kelmah" sx={{ width: 50, height: 50, mb: 1, borderRadius: '50%' }} />
        <Typography sx={{ color: '#FFD700', fontWeight: 700, fontSize: '18px' }}>Join Kelmah</Typography>
      </Box>

      {/* Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
            Step {step} of {totalSteps}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
            {step === 1 ? 'Account Type' : step === 2 ? 'Your Info' : 'Security'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(step / totalSteps) * 100}
          sx={{
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': { backgroundColor: '#FFD700' },
          }}
        />
      </Box>

      {/* Main Card */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: 'rgba(20, 20, 20, 0.9)',
          borderRadius: 3,
          p: 2.5,
          border: '1px solid rgba(255, 215, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Success */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2, backgroundColor: 'rgba(76,175,80,0.1)', color: '#4caf50', borderRadius: 2 }}>
                Account created! Redirecting...
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <Fade in={Boolean(submitError)}>
          <Box>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(244,67,54,0.1)', color: '#f44336', borderRadius: 2 }}>
                {submitError}
              </Alert>
            )}
          </Box>
        </Fade>

        {/* Step Content */}
        <Box sx={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
          <Button
            onClick={handleBack}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{
              flex: 1,
              minHeight: 44,
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { borderColor: 'rgba(255,255,255,0.4)' },
            }}
          >
            Back
          </Button>
          <Button
            onClick={step === totalSteps ? handleSubmit : handleNext}
            variant="contained"
            endIcon={step < totalSteps ? <ArrowForwardIcon /> : null}
            disabled={isSubmitting || authLoading}
            sx={{
              flex: 2,
              minHeight: 44,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
              '&:hover': { background: 'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)' },
              '&:disabled': { background: 'rgba(255,215,0,0.3)', color: 'rgba(0,0,0,0.5)' },
            }}
          >
            {isSubmitting || authLoading ? (
              <CircularProgress size={20} sx={{ color: '#000' }} />
            ) : step === totalSteps ? (
              'Create Account'
            ) : (
              'Continue'
            )}
          </Button>
        </Box>

        {/* Login Link */}
        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, minHeight: 44 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            Already have an account?
          </Typography>
          <Button component={RouterLink} to="/login" sx={{ color: '#FFD700', fontWeight: 700, fontSize: '14px', py: 1, px: 1, minHeight: 44, minWidth: 'auto', textTransform: 'none' }}>
            Sign In
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MobileRegister;
