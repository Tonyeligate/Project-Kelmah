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
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  Paper,
  Radio,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowOutward as ArrowOutwardIcon,
  BoltRounded as BoltRoundedIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Google as GoogleIcon,
  Handyman as HandymanIcon,
  LinkedIn as LinkedInIcon,
  LockOutlined as LockOutlinedIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  ScheduleRounded as ScheduleRoundedIcon,
  Search as SearchIcon,
  ShieldRounded as ShieldRoundedIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { Controller } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AUTH_CONFIG, getApiBaseUrl } from '@/config/environment';
import MobileRegister from '@/modules/auth/components/mobile/MobileRegister';
import useRegistrationForm from '@/modules/auth/hooks/useRegistrationForm';
import {
  saveRegistrationDraft,
  clearRegistrationDraft as clearDraftStorage,
} from '@/modules/auth/utils/registrationDraftStorage';
import { normalizeGhanaPhone } from '@/modules/auth/utils/registrationSchema';
import {
  register as registerAction,
  selectAuthError,
  selectAuthLoading,
} from '@/modules/auth/services/authSlice';
import { useBreakpointDown } from '@/hooks/useResponsive';
import logoIcon from '../../../../assets/images/logo.png';

const STEP_META = [
  {
    label: 'Account',
    title: 'Choose your path',
    description: 'Tell Kelmah whether you are here to find work or hire talent.',
  },
  {
    label: 'Profile',
    title: 'Set up your profile',
    description: 'Add the details we need to create a trustworthy account.',
  },
  {
    label: 'Security',
    title: 'Secure your account',
    description: 'Create a strong password and agree to the platform terms.',
  },
  {
    label: 'Review',
    title: 'Review before launch',
    description: 'Confirm your details before we create your account.',
  },
];

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

const ROLE_OPTIONS = [
  {
    value: 'worker',
    title: 'I am a skilled worker',
    description: 'Create a profile, show your trade skills, and get matched to work.',
    eyebrow: 'For artisans and professionals',
    icon: HandymanIcon,
    tags: ['Plumbing', 'Electrical', 'Carpentry', 'Masonry'],
  },
  {
    value: 'hirer',
    title: 'I need skilled workers',
    description: 'Find trusted professionals for repairs, projects, and ongoing work.',
    eyebrow: 'For homes and businesses',
    icon: SearchIcon,
    tags: ['Renovation', 'Maintenance', 'Construction', 'Repairs'],
  },
];

const TRUST_PILLS = ['4-step onboarding', 'Draft save enabled', 'Email verification'];

const PLATFORM_BENEFITS = [
  {
    title: 'Focused onboarding',
    description: 'One clear path from account type to review, without marketing clutter.',
    icon: BoltRoundedIcon,
  },
  {
    title: 'Trust-first setup',
    description: 'Structured contact and trade details help improve matching and hiring confidence.',
    icon: ShieldRoundedIcon,
  },
  {
    title: 'Progress you can resume',
    description: 'Kelmah keeps a draft locally so users can pause and return later.',
    icon: ScheduleRoundedIcon,
  },
];

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isCompactViewport = useBreakpointDown('md');

  const {
    control,
    register: formRegister,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
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

  const brandColor = theme.palette.primary.main;
  const brandStrong = theme.palette.primary.dark || '#D39D00';
  const brandInk = '#101113';
  const isDarkMode = theme.palette.mode === 'dark';
  const shellBg = isDarkMode
    ? 'linear-gradient(180deg, #090B0F 0%, #11161D 55%, #0A0E13 100%)'
    : 'linear-gradient(180deg, #FCFCFA 0%, #F7F6F1 55%, #F2F0EA 100%)';
  const shellAccent = isDarkMode
    ? `radial-gradient(circle at top left, ${alpha(brandColor, 0.18)} 0%, transparent 34%), radial-gradient(circle at bottom right, ${alpha(brandColor, 0.14)} 0%, transparent 28%)`
    : `radial-gradient(circle at top left, ${alpha(brandColor, 0.12)} 0%, transparent 30%), radial-gradient(circle at bottom right, ${alpha('#FFFFFF', 0.68)} 0%, transparent 34%)`;
  const supportingPanelBg = isDarkMode
    ? `linear-gradient(160deg, ${alpha('#121720', 0.96)} 0%, ${alpha('#0A0E14', 0.98)} 100%)`
    : `linear-gradient(160deg, ${alpha('#FFFFFF', 0.99)} 0%, ${alpha('#F7F5EE', 0.99)} 100%)`;
  const supportingPanelText = isDarkMode ? '#F7F7F3' : '#171A1F';
  const supportingPanelMuted = isDarkMode ? alpha('#FFFFFF', 0.76) : alpha('#171A1F', 0.76);
  const supportingPanelSoft = isDarkMode ? alpha('#FFFFFF', 0.6) : alpha('#171A1F', 0.6);
  const supportingPanelBorder = isDarkMode ? alpha('#FFFFFF', 0.08) : alpha(brandInk, 0.1);
  const supportingPanelSurface = isDarkMode ? alpha('#FFFFFF', 0.04) : alpha('#FFFFFF', 0.88);
  const supportingPanelSurfaceBorder = isDarkMode ? alpha('#FFFFFF', 0.08) : alpha(brandInk, 0.08);
  const supportingPanelShadow = isDarkMode
    ? '0 24px 80px rgba(0, 0, 0, 0.28)'
    : '0 24px 56px rgba(16, 17, 19, 0.12)';
  const formPanelBg = isDarkMode
    ? `linear-gradient(180deg, ${alpha('#121720', 0.98)} 0%, ${alpha('#0B1016', 0.98)} 100%)`
    : `linear-gradient(180deg, ${alpha('#FFFFFF', 0.99)} 0%, ${alpha('#F8F7F2', 0.99)} 100%)`;
  const formPanelText = isDarkMode ? '#F7F7F3' : '#171A1F';
  const formPanelMuted = isDarkMode ? alpha('#FFFFFF', 0.72) : alpha('#171A1F', 0.74);
  const formPanelSoft = isDarkMode ? alpha('#FFFFFF', 0.56) : alpha('#171A1F', 0.58);
  const formPanelBorder = isDarkMode ? alpha('#FFFFFF', 0.08) : alpha(brandInk, 0.1);
  const formPanelDivider = isDarkMode ? alpha('#FFFFFF', 0.08) : alpha(brandInk, 0.08);
  const formPanelSurface = isDarkMode ? alpha('#FFFFFF', 0.04) : alpha('#FFFFFF', 0.94);
  const formPanelSurfaceAlt = isDarkMode
    ? `linear-gradient(145deg, ${alpha('#11161D', 0.95)} 0%, ${alpha('#0D1117', 0.96)} 100%)`
    : `linear-gradient(145deg, ${alpha('#FFFFFF', 0.99)} 0%, ${alpha('#F7F6F0', 0.99)} 100%)`;
  const formPanelShadow = isDarkMode
    ? '0 32px 100px rgba(0, 0, 0, 0.28)'
    : '0 28px 56px rgba(16, 17, 19, 0.12)';
  const progressValue = ((activeStep + 1) / STEP_META.length) * 100;
  const currentStep = STEP_META[activeStep];

  if (isCompactViewport) {
    return <MobileRegister />;
  }

  const fieldSx = useMemo(
    () => ({
      '& .MuiOutlinedInput-root': {
        minHeight: 56,
        borderRadius: 3,
        backgroundColor: isDarkMode ? alpha('#0B1016', 0.72) : alpha('#FFFFFF', 0.9),
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '& fieldset': {
          borderColor: isDarkMode ? alpha('#FFFFFF', 0.1) : alpha('#171A1F', 0.12),
        },
        '&:hover fieldset': {
          borderColor: alpha(brandColor, 0.45),
        },
        '&.Mui-focused': {
          boxShadow: `0 0 0 4px ${alpha(brandColor, 0.12)}`,
          transform: 'translateY(-1px)',
        },
        '&.Mui-focused fieldset': {
          borderColor: brandColor,
          borderWidth: 1,
        },
      },
      '& .MuiInputLabel-root': {
        color: formPanelMuted,
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: brandColor,
      },
      '& .MuiFormHelperText-root': {
        ml: 0,
      },
      '& .MuiOutlinedInput-input': {
        color: formPanelText,
      },
      '& .MuiSvgIcon-root': {
        color: alpha(brandColor, 0.88),
      },
    }),
    [brandColor, formPanelMuted, formPanelText, isDarkMode],
  );

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
  }, [draftLoaded, getValues]);

  useEffect(() => {
    if (authError) {
      setFormError(
        typeof authError === 'string' ? authError : authError?.message || '',
      );
    }
  }, [authError]);

  useEffect(() => {
    setFormError('');
  }, [activeStep]);

  const handleRoleSelect = useCallback(
    (value) => {
      setValue('role', value, { shouldDirty: true, shouldValidate: true });
      setFormError('');
    },
    [setValue],
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    if (roleParam === 'worker' || roleParam === 'hirer') {
      handleRoleSelect(roleParam);
    }
  }, [handleRoleSelect, location.search]);

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
          ...(role === 'worker' ? ['trades', 'experienceYears'] : []),
          ...(role === 'hirer' ? ['companyName'] : []),
        ];
      case 2:
        return ['password', 'confirmPassword', 'acceptTerms'];
      case 3:
        return [
          'role',
          'firstName',
          'lastName',
          'email',
          'phone',
          'password',
          'confirmPassword',
          'acceptTerms',
          ...(role === 'worker' ? ['trades', 'experienceYears'] : []),
          ...(role === 'hirer' ? ['companyName'] : []),
        ];
      default:
        return [];
    }
  }, [activeStep, role]);

  const passwordChipColor = useMemo(() => {
    if (passwordStrength.score >= 4) return 'success';
    if (passwordStrength.score >= 3) return 'warning';
    return 'error';
  }, [passwordStrength.score]);
  const socialProviders = useMemo(
    () => [
      {
        key: 'google',
        label: 'Continue with Google',
        authPath: '/auth/google',
        enabled: Boolean(AUTH_CONFIG.googleClientId),
        icon: GoogleIcon,
      },
      {
        key: 'linkedin',
        label: 'Continue with LinkedIn',
        authPath: '/auth/linkedin',
        enabled: Boolean(AUTH_CONFIG.linkedinClientId),
        icon: LinkedInIcon,
      },
    ].filter((provider) => provider.enabled),
    [],
  );

  const handleSocialLogin = useCallback((authPath) => {
    window.location.assign(`${getApiBaseUrl()}${authPath}`);
  }, []);

  const handleManualDraftSave = useCallback(() => {
    const payload = { ...getValues(), step: activeStep };
    saveRegistrationDraft(payload);
    setDraftStatus('Progress saved. You can return anytime.');
    setTimeout(() => setDraftStatus(''), 3000);
  }, [activeStep, getValues]);

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/');
      return;
    }

    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (values) => {
    setFormError('');

    try {
      const payload = {
        ...values,
        phone: normalizeGhanaPhone(values.phone) ?? '',
        trades: values.trades || [],
      };

      await dispatch(registerAction(payload)).unwrap();
      clearDraft();
      clearDraftStorage();
      setDraftStatus('Account created. Redirecting to sign in...');

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
      setFormError(
        error?.message || error || 'Registration failed. Please try again.',
      );
    }
  };

  const handleNext = async () => {
    const fields = getFieldsForStep();
    const isValid = await trigger(fields, { shouldFocus: true });

    if (!isValid) {
      setFormError('Please complete the required fields before continuing.');
      return;
    }

    if (activeStep === STEP_META.length - 1) {
      handleSubmit(onSubmit)();
      return;
    }

    setFormError('');
    setActiveStep((prev) => prev + 1);
  };

  const renderRoleCard = ({ value, title, description, eyebrow, icon: Icon, tags }) => {
    const isSelected = role === value;

    return (
      <Grid item xs={12} md={6} key={value}>
        <Card
          onClick={() => handleRoleSelect(value)}
          sx={{
            height: '100%',
            p: 3,
            borderRadius: 4,
            cursor: 'pointer',
            border: isSelected
              ? `1px solid ${alpha(brandColor, 0.7)}`
              : `1px solid ${formPanelBorder}`,
            background: isSelected
              ? `linear-gradient(145deg, ${alpha(brandColor, 0.14)} 0%, ${alpha(brandStrong, 0.08)} 100%)`
              : formPanelSurfaceAlt,
            boxShadow: isSelected
              ? `0 18px 50px ${alpha(brandColor, 0.16)}`
              : isDarkMode
              ? '0 10px 28px rgba(0, 0, 0, 0.22)'
              : '0 10px 28px rgba(23, 26, 31, 0.08)',
            transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              borderColor: alpha(brandColor, 0.65),
              boxShadow: isDarkMode
                ? `0 18px 50px ${alpha(brandColor, 0.14)}`
                : '0 16px 32px rgba(16, 17, 19, 0.08)',
            },
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: alpha(brandColor, 0.88),
                    letterSpacing: '0.12em',
                    fontWeight: 800,
                  }}
                >
                  {eyebrow}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      backgroundColor: isSelected
                        ? brandColor
                        : alpha(brandColor, 0.12),
                      color: isSelected ? brandInk : brandColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: formPanelText, fontWeight: 800 }}>
                      {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: formPanelMuted, lineHeight: 1.6 }}>
                      {description}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
              <Radio
                checked={isSelected}
                value={value}
                onChange={() => handleRoleSelect(value)}
                color="warning"
              />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: alpha(brandColor, 0.12),
                    color: formPanelText,
                    borderRadius: 999,
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Card>
      </Grid>
    );
  };

  const renderProfileStep = () => (
    <Stack spacing={2.5}>
      <Typography variant="body2" sx={{ color: formPanelMuted, lineHeight: 1.7 }}>
        These details help Kelmah set up your account correctly and improve matching quality after sign-up.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="First name"
            fullWidth
            required
            placeholder="e.g. Kwame"
            {...formRegister('firstName')}
            error={Boolean(errors.firstName)}
            helperText={errors.firstName?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: alpha(brandColor, 0.9) }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Last name"
            fullWidth
            required
            placeholder="e.g. Asante"
            {...formRegister('lastName')}
            error={Boolean(errors.lastName)}
            helperText={errors.lastName?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: alpha(brandColor, 0.9) }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Email address"
            fullWidth
            required
            type="email"
            placeholder="e.g. kwame@email.com"
            {...formRegister('email')}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: alpha(brandColor, 0.9) }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Phone number"
            fullWidth
            required
            placeholder="e.g. +233 24 123 4567"
            inputProps={{ inputMode: 'tel' }}
            {...formRegister('phone')}
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: alpha(brandColor, 0.9) }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
        </Grid>

        {role === 'hirer' && (
          <Grid item xs={12}>
            <TextField
              label="Company or organization"
              fullWidth
              required
              placeholder="e.g. Asante Construction"
              {...formRegister('companyName')}
              error={Boolean(errors.companyName)}
              helperText={errors.companyName?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon sx={{ color: alpha(brandColor, 0.9) }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Grid>
        )}

        {role === 'worker' && (
          <>
            <Grid item xs={12}>
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
                            backgroundColor: alpha(brandColor, 0.14),
                            color: formPanelText,
                            borderRadius: 999,
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Trades or skills"
                        placeholder="Add your primary skills"
                        error={Boolean(errors.trades)}
                        helperText={errors.trades?.message}
                        sx={fieldSx}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Years of experience"
                fullWidth
                type="number"
                inputProps={{ min: 0, max: 60, inputMode: 'numeric' }}
                placeholder="How long have you worked in this trade?"
                {...formRegister('experienceYears')}
                error={Boolean(errors.experienceYears)}
                helperText={errors.experienceYears?.message}
                sx={fieldSx}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Stack>
  );

  const renderSecurityStep = () => (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${alpha(brandColor, 0.22)}`,
          backgroundColor: alpha(brandColor, 0.08),
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              backgroundColor: alpha(brandColor, 0.18),
              color: brandColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldRoundedIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: formPanelText, fontWeight: 700 }}>
              Keep the account secure
            </Typography>
            <Typography variant="body2" sx={{ color: formPanelMuted, lineHeight: 1.6 }}>
              Use a strong password with a mix of letters, numbers, and symbols.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <TextField
        label="Password"
        fullWidth
        required
        type={showPassword ? 'text' : 'password'}
        placeholder="Create a strong password"
        {...formRegister('password')}
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlinedIcon sx={{ color: alpha(brandColor, 0.9) }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                sx={{ color: formPanelSoft }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={fieldSx}
      />

      {password && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: formPanelSoft, letterSpacing: '0.06em' }}>
              PASSWORD STRENGTH
            </Typography>
            <Chip label={passwordStrength.label} size="small" color={passwordChipColor} />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(passwordStrength.score / 5) * 100}
            color={passwordChipColor}
            sx={{
              height: 8,
              borderRadius: 999,
              backgroundColor: isDarkMode ? alpha('#FFFFFF', 0.08) : alpha('#171A1F', 0.08),
            }}
          />
        </Box>
      )}

      <TextField
        label="Confirm password"
        fullWidth
        required
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Re-enter your password"
        {...formRegister('confirmPassword')}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword?.message}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlinedIcon sx={{ color: alpha(brandColor, 0.9) }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                edge="end"
                sx={{ color: formPanelSoft }}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={fieldSx}
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
            sx={{
              color: alpha(brandColor, 0.8),
              '&.Mui-checked': { color: brandColor },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: formPanelMuted, lineHeight: 1.7 }}>
            I agree to the{' '}
            <Link component={RouterLink} to="/terms" underline="hover" sx={{ color: brandColor, fontWeight: 700 }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link component={RouterLink} to="/privacy" underline="hover" sx={{ color: brandColor, fontWeight: 700 }}>
              Privacy Policy
            </Link>
          </Typography>
        }
        sx={{ alignItems: 'flex-start', m: 0 }}
      />
    </Stack>
  );

  const renderSummaryField = (label, value) => (
    <Box>
      <Typography variant="caption" sx={{ color: formPanelSoft, letterSpacing: '0.08em' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: formPanelText, fontWeight: 600, mt: 0.5 }}>
        {value || '-'}
      </Typography>
    </Box>
  );

  const renderReviewStep = () => (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          background: formPanelSurfaceAlt,
          border: `1px solid ${formPanelBorder}`,
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 3,
                backgroundColor: alpha(brandColor, 0.16),
                color: brandColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircleIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: formPanelText, fontWeight: 800 }}>
                Review your account details
              </Typography>
              <Typography variant="body2" sx={{ color: formPanelMuted, lineHeight: 1.6 }}>
                Everything looks ready. Confirm the details below before you create the account.
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              {renderSummaryField('Account type', role === 'worker' ? 'Skilled worker' : 'Hirer')}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderSummaryField('Full name', `${firstName || ''} ${lastName || ''}`.trim())}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderSummaryField('Email', email)}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderSummaryField('Phone', phone)}
            </Grid>
            {role === 'hirer' && (
              <Grid item xs={12}>
                {renderSummaryField('Company', companyName)}
              </Grid>
            )}
            {role === 'worker' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: formPanelSoft, letterSpacing: '0.08em' }}>
                    Trades or skills
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {(trades || []).length > 0 ? (
                      (trades || []).map((trade) => (
                        <Chip
                          key={trade}
                          label={trade}
                          size="small"
                          sx={{
                            backgroundColor: alpha(brandColor, 0.14),
                            color: formPanelText,
                            borderRadius: 999,
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: formPanelText, fontWeight: 600 }}>
                        -
                      </Typography>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  {renderSummaryField(
                    'Experience',
                    experienceYears
                      ? `${experienceYears} ${experienceYears === 1 ? 'year' : 'years'}`
                      : '-',
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: `1px solid ${alpha(brandColor, 0.2)}`,
          backgroundColor: alpha(brandColor, 0.06),
        }}
      >
        <Typography variant="body2" sx={{ color: formPanelMuted, lineHeight: 1.7 }}>
          After sign-up, we will send a verification email and take you to sign in. Completing your profile well improves trust and matching quality across the platform.
        </Typography>
      </Paper>
    </Stack>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={2.5}>
            {ROLE_OPTIONS.map(renderRoleCard)}
          </Grid>
        );
      case 1:
        return renderProfileStep();
      case 2:
        return renderSecurityStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        background: shellBg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: shellAccent,
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1320,
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          py: { xs: 2, sm: 3, md: 4, lg: 5 },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Button
            component={RouterLink}
            to="/"
            startIcon={
              <Box
                component="img"
                src={logoIcon}
                alt="Kelmah"
                sx={{ width: 28, height: 28, borderRadius: '50%' }}
              />
            }
            sx={{
              color: isDarkMode ? '#F7F7F3' : '#171A1F',
              px: 0,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '1rem',
              '&:hover': { backgroundColor: 'transparent', color: brandColor },
            }}
          >
            Kelmah
          </Button>

          <Typography variant="body2" sx={{ color: isDarkMode ? alpha('#FFFFFF', 0.74) : alpha('#171A1F', 0.68) }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover" sx={{ color: brandColor, fontWeight: 800 }}>
              Sign in
            </Link>
          </Typography>
        </Stack>

        <Grid container spacing={3.5} alignItems="stretch">
          <Grid item xs={12} lg={5}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                minHeight: { xs: 'auto', md: 760 },
                p: { xs: 2.5, sm: 3, md: 4, lg: 4.5 },
                borderRadius: { xs: 4, md: 6 },
                color: supportingPanelText,
                background: supportingPanelBg,
                border: `1px solid ${supportingPanelBorder}`,
                boxShadow: supportingPanelShadow,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <Stack spacing={3}>
                <Chip
                  label="Create your account"
                  sx={{
                    alignSelf: 'flex-start',
                    px: 0.5,
                    backgroundColor: alpha(brandColor, 0.14),
                    color: brandColor,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                />

                <Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { md: '2.7rem', lg: '3.1rem' },
                      fontWeight: 900,
                      lineHeight: 1.06,
                      letterSpacing: '-0.03em',
                      maxWidth: 540,
                      color: supportingPanelText,
                    }}
                  >
                    Skilled work deserves a clean way in.
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mt: 2,
                      maxWidth: 520,
                      color: supportingPanelMuted,
                      lineHeight: 1.75,
                      fontSize: '1rem',
                    }}
                  >
                    This desktop flow is designed to feel focused, trustworthy, and easy to complete. No crowded hero blocks. No mixed navigation. Just a clear onboarding path.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {TRUST_PILLS.map((pill) => (
                    <Chip
                      key={pill}
                      label={pill}
                      icon={<CheckCircleIcon sx={{ color: `${brandColor} !important` }} />}
                      sx={{
                        backgroundColor: supportingPanelSurface,
                        color: supportingPanelText,
                        border: `1px solid ${supportingPanelSurfaceBorder}`,
                        borderRadius: 999,
                        '& .MuiChip-icon': { color: brandColor },
                      }}
                    />
                  ))}
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: supportingPanelSurface,
                        border: `1px solid ${supportingPanelSurfaceBorder}`,
                      }}
                    >
                      <Typography variant="overline" sx={{ color: supportingPanelSoft, letterSpacing: '0.1em' }}>
                        BUILT FOR
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 800, color: supportingPanelText }}>
                        Ghana
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75, color: supportingPanelMuted, lineHeight: 1.6 }}>
                        Local trades, local work, clearer trust signals.
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: supportingPanelSurface,
                        border: `1px solid ${supportingPanelSurfaceBorder}`,
                      }}
                    >
                      <Typography variant="overline" sx={{ color: supportingPanelSoft, letterSpacing: '0.1em' }}>
                        FLOW
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 800, color: supportingPanelText }}>
                        4 steps
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75, color: supportingPanelMuted, lineHeight: 1.6 }}>
                        Account, profile, security, then review.
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: supportingPanelSurface,
                        border: `1px solid ${supportingPanelSurfaceBorder}`,
                      }}
                    >
                      <Typography variant="overline" sx={{ color: supportingPanelSoft, letterSpacing: '0.1em' }}>
                        RESUME
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 800, color: supportingPanelText }}>
                        Draft save
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75, color: supportingPanelMuted, lineHeight: 1.6 }}>
                        Users can pause without losing progress.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>

              <Stack spacing={2}>
                {PLATFORM_BENEFITS.map(({ title, description, icon: Icon }) => (
                  <Box
                    key={title}
                    sx={{
                      display: 'flex',
                      gap: 1.75,
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: supportingPanelSurface,
                      border: `1px solid ${supportingPanelSurfaceBorder}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        backgroundColor: alpha(brandColor, 0.15),
                        color: brandColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: supportingPanelText }}>
                        {title}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: supportingPanelMuted, lineHeight: 1.65 }}>
                        {description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Paper
              elevation={0}
              sx={{
                minHeight: { xs: 'auto', md: 760 },
                p: { xs: 2.5, sm: 3, md: 3.5, lg: 4 },
                borderRadius: { xs: 4, md: 6 },
                background: formPanelBg,
                color: formPanelText,
                boxShadow: formPanelShadow,
                border: `1px solid ${isDarkMode ? alpha('#FFFFFF', 0.08) : formPanelBorder}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: formPanelSoft, letterSpacing: '0.12em', fontWeight: 800 }}>
                      REGISTER
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: '-0.03em' }}>
                      {currentStep.title}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, maxWidth: 560, color: formPanelMuted, lineHeight: 1.7 }}>
                      {currentStep.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={`Step ${activeStep + 1} of ${STEP_META.length}`}
                    sx={{
                      backgroundColor: alpha(brandColor, 0.12),
                      color: formPanelText,
                      fontWeight: 800,
                    }}
                  />
                </Stack>

                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: isDarkMode ? alpha('#FFFFFF', 0.08) : alpha('#171A1F', 0.08),
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${brandColor} 0%, ${brandStrong} 100%)`,
                        borderRadius: 999,
                      },
                    }}
                  />
                  <Grid container spacing={1.25} sx={{ mt: 1.5 }}>
                    {STEP_META.map((step, index) => {
                      const isCurrent = index === activeStep;
                      const isComplete = index < activeStep;

                      return (
                        <Grid item xs={3} key={step.label}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 3,
                              border: `1px solid ${
                                isCurrent || isComplete
                                  ? alpha(brandColor, 0.36)
                                  : formPanelBorder
                              }`,
                              backgroundColor: isCurrent
                                ? alpha(brandColor, 0.12)
                                : isComplete
                                ? alpha(brandColor, 0.08)
                                : formPanelSurface,
                              boxShadow: !isDarkMode && !isCurrent && !isComplete
                                ? 'inset 0 0 0 1px rgba(23, 26, 31, 0.02)'
                                : 'none',
                              minHeight: 88,
                            }}
                          >
                            <Stack spacing={0.75}>
                              <Box
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '50%',
                                  backgroundColor: isCurrent || isComplete ? brandColor : (isDarkMode ? alpha('#FFFFFF', 0.08) : alpha('#171A1F', 0.08)),
                                  color: isCurrent || isComplete ? brandInk : formPanelSoft,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900,
                                  fontSize: '0.86rem',
                                }}
                              >
                                {index + 1}
                              </Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.35 }}>
                                {step.label}
                              </Typography>
                            </Stack>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>

                {formError && (
                  <Alert severity="error" sx={{ borderRadius: 3 }}>
                    {formError}
                  </Alert>
                )}

                {draftStatus && (
                  <Alert severity="success" sx={{ borderRadius: 3 }}>
                    {draftStatus}
                  </Alert>
                )}

                <Box sx={{ flex: 1, py: 1, minHeight: 420 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </Box>

                <Divider sx={{ borderColor: formPanelDivider }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Button
                    variant="text"
                    onClick={handleManualDraftSave}
                    sx={{
                      color: formPanelMuted,
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    Save and continue later
                  </Button>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{
                        minWidth: 120,
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 800,
                        borderColor: isDarkMode ? alpha('#FFFFFF', 0.16) : alpha('#171A1F', 0.16),
                        color: formPanelText,
                      }}
                    >
                      {activeStep === 0 ? 'Back home' : 'Back'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={authLoading}
                      endIcon={!authLoading ? <ArrowOutwardIcon /> : null}
                      sx={{
                        minWidth: 160,
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 900,
                        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandStrong} 100%)`,
                        color: brandInk,
                        boxShadow: `0 14px 30px ${alpha(brandColor, 0.22)}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${brandStrong} 0%, ${brandColor} 100%)`,
                        },
                        '&:disabled': {
                          background: alpha(brandColor, 0.36),
                          color: alpha(brandInk, 0.5),
                        },
                      }}
                    >
                      {authLoading ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} sx={{ color: brandInk }} />
                          <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                            Creating...
                          </Typography>
                        </Stack>
                      ) : activeStep === STEP_META.length - 1 ? (
                        'Create account'
                      ) : (
                        'Continue'
                      )}
                    </Button>
                  </Stack>
                </Stack>

                <Divider sx={{ borderColor: formPanelDivider }} />

                {socialProviders.length > 0 && (
                  <Stack spacing={2.25}>
                    <Typography variant="body2" sx={{ color: formPanelMuted }}>
                      Prefer a social sign-up? Choose a configured provider below.
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                      {socialProviders.map((provider) => {
                        const ProviderIcon = provider.icon;

                        return (
                          <Button
                            key={provider.key}
                            variant="outlined"
                            fullWidth
                            startIcon={<ProviderIcon />}
                            onClick={() => handleSocialLogin(provider.authPath)}
                            sx={{
                              borderRadius: 999,
                              textTransform: 'none',
                              fontWeight: 800,
                              backgroundColor: !isDarkMode ? alpha('#FFFFFF', 0.52) : 'transparent',
                              borderColor: isDarkMode ? alpha('#FFFFFF', 0.14) : alpha('#171A1F', 0.14),
                              color: formPanelText,
                              '&:hover': {
                                borderColor: alpha(brandColor, 0.45),
                                backgroundColor: !isDarkMode ? alpha('#FFFFFF', 0.74) : alpha('#FFFFFF', 0.04),
                              },
                            }}
                          >
                            {provider.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Register;