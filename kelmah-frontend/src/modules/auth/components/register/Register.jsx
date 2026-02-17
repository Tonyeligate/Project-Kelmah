import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MobileStepper,
  Paper,
  Radio,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import {
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Google as GoogleIcon,
  Handyman as HandymanIcon,
  LinkedIn as LinkedInIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Visibility,
  VisibilityOff,
  Work as WorkIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Controller } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FEATURES } from '@/config/environment';
import MobileRegister from '@/modules/auth/components/mobile/MobileRegister';
import useRegistrationForm from '@/modules/auth/hooks/useRegistrationForm';
import {
  saveRegistrationDraft,
  clearRegistrationDraft as clearDraftStorage,
} from '@/modules/auth/utils/registrationDraftStorage';
import {
  register as registerAction,
  selectAuthError,
  selectAuthLoading,
} from '@/modules/auth/services/authSlice';

const STEPS = ['Account Type', 'Personal Details', 'Security', 'Review'];

const COMMON_TRADES = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Mason',
  'Painter',
  'Mechanic',
  'Welder',
  'Tailor',
  'Barber',
  'Hairdresser',
  'Cook',
  'Cleaner',
  'Driver',
  'Gardener',
  'HVAC Technician',
  'Tiler',
  'Roofer',
  'Blacksmith',
  'Electronics Repair',
];

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const prefersDedicatedMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isCompactLayout = useMediaQuery(theme.breakpoints.down('md'));

  const {
    control,
    register: formRegister,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
    draftLoaded,
    clearDraft,
    passwordStrength,
  } = useRegistrationForm();

  const authLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [activeStep, setActiveStep] = useState(0);
  const [formError, setFormError] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get values for display only - don't use watch() to avoid re-renders
  const role = watch('role');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');
  const phone = watch('phone');
  const companyName = watch('companyName');
  const trades = watch('trades');
  const acceptTerms = watch('acceptTerms');
  const experienceYears = watch('experienceYears');
  const password = watch('password');

  // Restore step from draft on initial load only
  useEffect(() => {
    if (draftLoaded) {
      const savedStep = getValues('step');
      if (typeof savedStep === 'number' && savedStep > 0) {
        setActiveStep(savedStep);
      }
      setDraftStatus('Draft restored from your last session.');
      const timer = setTimeout(() => setDraftStatus(''), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftLoaded]);

  useEffect(() => {
    if (authError) {
      setFormError(authError);
    }
  }, [authError]);

  // Only clear form error on step change, not validation errors
  useEffect(() => {
    setFormError('');
  }, [activeStep]);

  const getFieldsForStep = useCallback(() => {
    switch (activeStep) {
      case 0:
        return ['role'];
      case 1:
        return [
          'firstName',
          'lastName',
          'email',
          'phone',
          ...(role === 'worker' ? ['trades'] : []),
        ];
      case 2:
        return [
          ...(role === 'hirer' ? ['companyName'] : []),
          'password',
          'confirmPassword',
          'acceptTerms',
        ];
      case 3:
        return [
          'role',
          'firstName',
          'lastName',
          'email',
          'phone',
          ...(role === 'hirer' ? ['companyName'] : []),
          ...(role === 'worker' ? ['trades'] : []),
          'acceptTerms',
        ];
      default:
        return [];
    }
  }, [activeStep, role]);

  const handleRoleSelect = useCallback(
    (value) => {
      setValue('role', value, { shouldDirty: true, shouldValidate: true });
      setFormError('');
    },
    [setValue],
  );

  const passwordChipColor = useMemo(() => {
    if (passwordStrength.score >= 4) return 'success';
    if (passwordStrength.score >= 3) return 'warning';
    return 'error';
  }, [passwordStrength.score]);

  const handleManualDraftSave = useCallback(() => {
    const payload = { ...getValues(), step: activeStep };
    saveRegistrationDraft(payload);
    setDraftStatus('Progress saved. You can return anytime.');
    const timer = setTimeout(() => setDraftStatus(''), 3000);
    return () => clearTimeout(timer);
  }, [activeStep, getValues]);

  const handleBack = () => {
    if (activeStep === 0) return;
    setActiveStep((prev) => prev - 1);
  };

  const handleNext = async () => {
    const fields = getFieldsForStep();
    const isValid = await trigger(fields, { shouldFocus: true });

    if (!isValid) {
      setFormError('Please complete the required fields before continuing.');
      return;
    }

    if (activeStep === STEPS.length - 1) {
      handleSubmit(onSubmit)();
      return;
    }

    setFormError('');
    setActiveStep((prev) => prev + 1);
  };

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const payload = {
        ...values,
        phone: values.phone?.replace(/\s+/g, '') ?? '',
        trades: values.trades || [],
      };

      await dispatch(registerAction(payload)).unwrap();
      clearDraft();
      clearDraftStorage();
      setDraftStatus('Account created! Redirecting to login...');

      setTimeout(() => {
        navigate('/login', {
          state: {
            registered: true,
            message: 'Registration successful! Please verify your email.',
            redirectTo:
              location.state?.from || location.state?.redirectTo || '/dashboard',
          },
        });
      }, 1200);
    } catch (error) {
      setFormError(error?.message || 'Registration failed. Please try again.');
    }
  };

  const renderRoleCard = (value, title, description, icon, tags) => (
    <Grid item xs={12} sm={6} key={value}>
      <Card
        onClick={() => handleRoleSelect(value)}
        sx={{
          cursor: 'pointer',
          p: 2.5,
          height: '100%',
          borderRadius: 3,
          border:
            role === value
              ? '2px solid #FFD700'
              : '1px solid rgba(255,215,0,0.2)',
          background:
            role === value
              ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))'
              : 'rgba(18,18,18,0.85)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#FFD700',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Stack spacing={1.5} alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(255,215,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
            <Stack spacing={0.25}>
              <Typography
                variant="subtitle1"
                sx={{ color: '#FFD700', fontWeight: 700 }}
              >
                {title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.85)' }}
              >
                {description}
              </Typography>
            </Stack>
            <Radio
              checked={role === value}
              value={value}
              color="warning"
              onChange={() => handleRoleSelect(value)}
            />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}
              />
            ))}
          </Stack>
        </Stack>
      </Card>
    </Grid>
  );

  const renderPersonalDetails = () => (
    <Stack spacing={2.5} sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="First Name"
            variant="outlined"
            fullWidth
            required
            placeholder="Enter your first name"
            {...formRegister('firstName')}
            error={Boolean(errors.firstName)}
            helperText={errors.firstName?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#FFD700' }} />
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
            placeholder="Enter your last name"
            {...formRegister('lastName')}
            error={Boolean(errors.lastName)}
            helperText={errors.lastName?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: 'rgba(255,215,0,0.8)' }} />
                </InputAdornment>
              ),
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
        placeholder="Enter your email"
        {...formRegister('email')}
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        label="Phone Number (+233 or 0)"
        variant="outlined"
        fullWidth
        required
        placeholder="e.g., +233 24 123 4567"
        {...formRegister('phone')}
        error={Boolean(errors.phone)}
        helperText={errors.phone?.message}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
            </InputAdornment>
          ),
        }}
      />

      {role === 'worker' && (
        <Controller
          name="trades"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={COMMON_TRADES}
              value={field.value || []}
              onChange={(_, newValue) => field.onChange(newValue)}
              filterSelectedOptions
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    sx={{
                      background: 'rgba(255,215,0,0.12)',
                      color: '#FFD700',
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Trades / Skills"
                  placeholder="Add your primary skills"
                  error={Boolean(errors.trades)}
                  helperText={errors.trades?.message}
                />
              )}
            />
          )}
        />
      )}

      {role === 'worker' && (
        <TextField
          label="Years of Experience"
          variant="outlined"
          fullWidth
          type="number"
          inputProps={{ min: 0, max: 60 }}
          placeholder="How long have you worked in your trade?"
          {...formRegister('experienceYears')}
          error={Boolean(errors.experienceYears)}
          helperText={errors.experienceYears?.message}
        />
      )}
    </Stack>
  );

  const renderSecurityStep = () => (
    <Stack spacing={2.5} sx={{ width: '100%' }}>
      {role === 'hirer' && (
        <TextField
          label="Company / Organization Name"
          variant="outlined"
          fullWidth
          required
          placeholder="Enter company name"
          {...formRegister('companyName')}
          error={Boolean(errors.companyName)}
          helperText={errors.companyName?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BusinessIcon sx={{ color: 'rgba(255,215,0,0.7)' }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      <TextField
        label="Password"
        variant="outlined"
        fullWidth
        required
        type={showPassword ? 'text' : 'password'}
        placeholder="Create a strong password"
        {...formRegister('password')}
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                sx={{ color: '#FFD700' }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {password && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Strength:
          </Typography>
          <Chip
            label={passwordStrength.label}
            size="small"
            color={passwordChipColor}
          />
        </Stack>
      )}

      <TextField
        label="Confirm Password"
        variant="outlined"
        fullWidth
        required
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Confirm your password"
        {...formRegister('confirmPassword')}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword?.message}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                edge="end"
                sx={{ color: '#FFD700' }}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(acceptTerms)}
            onChange={(event) =>
              setValue('acceptTerms', event.target.checked, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
          />
        }
        label={
          <Typography
            variant="body2"
            sx={{ color: '#FFFFFF', lineHeight: 1.4 }}
          >
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
        sx={{ alignItems: 'flex-start', mt: 1 }}
      />
    </Stack>
  );

  const renderConfirmation = () => (
    <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
      <CheckCircleIcon
        sx={{ fontSize: { xs: 60, sm: 80 }, color: '#FFD700' }}
      />

      <Stack spacing={2} alignItems="center">
        <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 700 }}>
          Ready to Join Kelmah!
        </Typography>
        <Typography variant="body1" sx={{ color: '#FFFFFF', maxWidth: 420 }}>
          Please review your information before creating your account.
        </Typography>
      </Stack>

      <Card
        sx={{
          background: 'rgba(50,50,50,0.85)',
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          width: '100%',
          maxWidth: 500,
        }}
      >
        <Grid container spacing={2} sx={{ textAlign: 'left' }}>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              sx={{ color: '#FFD700', fontWeight: 600 }}
            >
              Account Type
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {role === 'worker' ? 'Skilled Worker' : 'Service Hirer'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              sx={{ color: '#FFD700', fontWeight: 600 }}
            >
              Name
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {firstName} {lastName}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              sx={{ color: '#FFD700', fontWeight: 600 }}
            >
              Email
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {email}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              sx={{ color: '#FFD700', fontWeight: 600 }}
            >
              Phone
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {phone}
            </Typography>
          </Grid>
          {role === 'hirer' && (
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#FFD700', fontWeight: 600 }}
              >
                Company
              </Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>
                {companyName}
              </Typography>
            </Grid>
          )}
          {role === 'worker' && trades?.length > 0 && (
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#FFD700', fontWeight: 600 }}
              >
                Trades
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {trades.map((trade) => (
                  <Chip
                    key={trade}
                    label={trade}
                    size="small"
                    sx={{
                      background: 'rgba(255,215,0,0.15)',
                      color: '#FFD700',
                    }}
                  />
                ))}
              </Stack>
            </Grid>
          )}
          {role === 'worker' && experienceYears && (
            <Grid item xs={12}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#FFD700', fontWeight: 600 }}
              >
                Experience
              </Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>
                {experienceYears} {experienceYears === 1 ? 'year' : 'years'}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Card>

      <Box
        sx={{
          background:
            'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
          borderRadius: 2,
          p: { xs: 2, sm: 2.5 },
          border: '1px solid rgba(255,215,0,0.2)',
          width: '100%',
          maxWidth: 500,
        }}
      >
        <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
          By creating your account, you're joining Ghana's most
          trusted platform for skilled trades and professional services.
        </Typography>
      </Box>
    </Stack>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <motion.div
            key="step-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2 } }}>
              <Stack spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    color: '#FFD700',
                    fontWeight: 700,
                  }}
                >
                  What brings you to Kelmah?
                </Typography>
                <Grid
                  container
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{ maxWidth: { xs: '100%', sm: 520 } }}
                >
                  {renderRoleCard(
                    'worker',
                    "I'm a Skilled Worker",
                    "I'm a tradesperson looking for work opportunities",
                    <HandymanIcon
                      sx={{ fontSize: { xs: 30, sm: 40 }, color: '#000' }}
                    />,
                    ['Plumber', 'Electrician', 'Carpenter', 'Mason'],
                  )}
                  {renderRoleCard(
                    'hirer',
                    'I Need Skilled Workers',
                    'I want to hire qualified professionals for my projects',
                    <SearchIcon
                      sx={{ fontSize: { xs: 30, sm: 40 }, color: '#000' }}
                    />,
                    [
                      'Home Repairs',
                      'Construction',
                      'Maintenance',
                      'Renovation',
                    ],
                  )}
                </Grid>
              </Stack>
            </Container>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
              <Stack spacing={3} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    color: '#FFD700',
                    fontWeight: 600,
                  }}
                >
                  Tell us about yourself
                </Typography>
                {renderPersonalDetails()}
              </Stack>
            </Container>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
              <Stack spacing={3} alignItems="center">
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: 'center',
                    color: '#FFD700',
                    fontWeight: 600,
                  }}
                >
                  Secure your account
                </Typography>
                {renderSecurityStep()}
              </Stack>
            </Container>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2 } }}>
              {renderConfirmation()}
            </Container>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Mobile detection now handled by RegisterPage
  // Desktop Register form
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        px: { xs: 1, sm: 2 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 540, md: 680 },
          mx: 'auto',
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
              p: { xs: 2, sm: 3, md: 4 },
              width: '100%',
              mx: 'auto',
              borderRadius: { xs: 3, sm: 4 },
              background:
                'linear-gradient(145deg, rgba(38,38,38,0.98) 0%, rgba(28,28,28,0.99) 100%)',
              border: '1px solid rgba(255,215,0,0.25)',
              position: 'relative',
              overflow: 'visible',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background:
                  'linear-gradient(90deg, #FFD700 0%, #FFC000 50%, #FFD700 100%)',
                borderRadius: '4px 4px 0 0',
              },
            }}
          >
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
                  sx={{ color: '#FFD700', fontWeight: 800 }}
                >
                  Join Kelmah
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#FFFFFF', fontWeight: 500 }}
                >
                  Connect with Ghana's skilled trade professionals
                </Typography>
              </Stack>
            </Stack>

            {isCompactLayout ? (
              <MobileStepper
                variant="progress"
                steps={STEPS.length}
                position="static"
                activeStep={activeStep}
                sx={{
                  mb: 2,
                  background: 'rgba(255,215,0,0.1)',
                  borderRadius: 2,
                  '& .MuiMobileStepper-progress': {
                    width: '100%',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#FFD700',
                    },
                  },
                }}
                nextButton={<div />}
                backButton={<div />}
              />
            ) : (
              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  mb: 2,
                  '& .MuiStepLabel-label': {
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
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
                  '& .MuiStepConnector-line': {
                    borderColor: 'rgba(255,215,0,0.3)',
                  },
                }}
              >
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            {isCompactLayout && (
              <Stack
                direction="row"
                justifyContent="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Typography variant="caption" color="#FFD700" fontWeight={600}>
                  Step {activeStep + 1} of {STEPS.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {STEPS[activeStep]}
                </Typography>
              </Stack>
            )}

            {formError && (
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
                  }}
                >
                  {formError}
                </Alert>
              </motion.div>
            )}

            {draftStatus && (
              <Alert severity="success" sx={{ mb: 1, borderRadius: 1.5 }}>
                {draftStatus}
              </Alert>
            )}

            <Box
              sx={{
                minHeight: { xs: 'auto', sm: '280px' },
                mb: { xs: 2, sm: 3 },
              }}
            >
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </Box>

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
                size={isCompactLayout ? 'medium' : 'small'}
                sx={{
                  fontWeight: 600,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 1, sm: 1.2 },
                  borderColor:
                    activeStep === 0 ? 'rgba(255,215,0,0.3)' : '#FFD700',
                  color: activeStep === 0 ? 'rgba(255,215,0,0.5)' : '#FFD700',
                }}
              >
                Back
              </Button>

              <motion.div
                whileHover={{ scale: isCompactLayout ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={authLoading}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1, sm: 1.2 },
                    background:
                      'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                    color: '#000',
                    borderRadius: 1.5,
                    boxShadow: '0 3px 12px rgba(255,215,0,0.2)',
                    textTransform: 'none',
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #FFC000 0%, #FFB000 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(255,215,0,0.3)',
                      color: 'rgba(0,0,0,0.5)',
                    },
                  }}
                >
                  {authLoading ? (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <CircularProgress size={14} sx={{ color: '#000' }} />
                      <Typography
                        sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}
                      >
                        Creating...
                      </Typography>
                    </Stack>
                  ) : activeStep === STEPS.length - 1 ? (
                    'Create Account'
                  ) : (
                    'Continue'
                  )}
                </Button>
              </motion.div>
            </Stack>

            <Box sx={{ mt: { xs: 1, sm: 1.5 }, textAlign: 'right' }}>
              <Button
                onClick={handleManualDraftSave}
                size="small"
                variant="text"
                sx={{ color: '#FFD700', textTransform: 'none' }}
              >
                Save and continue later
              </Button>
            </Box>

            <Stack
              spacing={{ xs: 1.5, sm: 2 }}
              alignItems="center"
              sx={{ mt: { xs: 2, sm: 2.5 } }}
            >
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}
              >
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
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
                  Sign in
                </Link>
              </Typography>

              <Divider
                sx={{ width: '100%', borderColor: 'rgba(255,215,0,0.25)' }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#FFD700', fontWeight: 600 }}
                >
                  OR CONTINUE WITH
                </Typography>
              </Divider>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ width: '100%' }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<GoogleIcon />}
                  disabled={!FEATURES?.socialGoogle}
                  sx={{
                    color: '#FFD700',
                    borderColor: 'rgba(255,215,0,0.4)',
                    '&:hover': { borderColor: '#FFD700' },
                  }}
                >
                  Google
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<LinkedInIcon />}
                  disabled={!FEATURES?.socialLinkedIn}
                  sx={{
                    color: '#FFD700',
                    borderColor: 'rgba(255,215,0,0.4)',
                    '&:hover': { borderColor: '#FFD700' },
                  }}
                >
                  LinkedIn
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Register;
