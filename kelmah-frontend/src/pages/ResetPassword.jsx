import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import authService from '../modules/auth/services/authService';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '../modules/common/components/PageCanvas';
import AuthWrapper from '../modules/auth/components/common/AuthWrapper';
import { withSafeAreaBottom } from '@/utils/safeArea';

const ResetPassword = () => {
  const isMobile = useBreakpointDown('md');
  const navigate = useNavigate();

  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();

  const token = useMemo(
    () => paramToken || searchParams.get('token'),
    [paramToken, searchParams],
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');

    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password.length > 128) {
      setError('Password must not exceed 128 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword(token, password);
      setStatus(
        res?.message || 'Password reset successful. You can now sign in.',
      );
      setPassword('');
      setConfirmPassword('');
    } catch {
      setError('Password reset failed. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const accentColor = theme.palette.primary.main || '#FFD34D';
  const panelText = isDarkMode ? '#FFFFFF' : '#171A1F';
  const panelMuted = isDarkMode ? alpha('#FFFFFF', 0.8) : alpha('#171A1F', 0.7);
  const panelSoft = isDarkMode
    ? alpha('#FFFFFF', 0.74)
    : alpha('#171A1F', 0.64);
  const inputBackground = isDarkMode
    ? alpha('#FFFFFF', 0.08)
    : alpha('#FFFFFF', 0.9);
  const inputBorder = isDarkMode
    ? alpha(accentColor, 0.5)
    : alpha('#171A1F', 0.14);
  const inputBorderHover = isDarkMode
    ? alpha(accentColor, 0.7)
    : alpha(accentColor, 0.38);
  const inputPlaceholder = isDarkMode
    ? alpha('#FFFFFF', 0.76)
    : alpha('#171A1F', 0.58);

  const content = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 380, mx: 'auto' }}
    >
      <Helmet>
        <title>Reset Password | Kelmah</title>
      </Helmet>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 800,
          color: accentColor,
          fontSize: '1.6rem',
          textAlign: 'center',
          mb: 1.5,
          textShadow: `0 2px 10px ${alpha(accentColor, 0.24)}`
        }}
      >
        Reset Password
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: panelMuted,
          textAlign: 'center',
          mb: 3,
          lineHeight: 1.5
        }}
      >
        Choose a new secure password you can remember. You can sign in right after saving.
      </Typography>

      {status && (
        <Alert
          severity="success"
          sx={{
            mb: 2.5,
            borderRadius: 1.5,
            fontSize: '0.85rem'
          }}
        >
          {status}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2.5,
            borderRadius: 1.5,
            fontSize: '0.85rem'
          }}
        >
          {error}
        </Alert>
      )}

      <TextField
        label="New Password"
        type={showPassword ? 'text' : 'password'}
        fullWidth
        required
        disabled={loading}
        placeholder="Enter your new password"
        helperText="Use at least 8 characters."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        inputProps={{
          autoComplete: 'new-password',
          'aria-label': 'New password',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined
                sx={{
                  color: accentColor,
                  fontSize: 20,
                }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
                sx={{ minWidth: 44, minHeight: 44 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            fontSize: '1rem',
            fontWeight: 500,
            color: panelText,
            background: inputBackground,
            borderRadius: 1.5,
            minHeight: '48px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorder,
              borderWidth: 2,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorderHover,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: accentColor,
              boxShadow: `0 0 0 2px ${alpha(accentColor, 0.2)}`,
            },
            '& .MuiInputBase-input::placeholder': {
              color: inputPlaceholder,
              opacity: 1,
            },
          },
        }}
        InputLabelProps={{
          sx: {
            color: panelSoft,
            fontWeight: 600,
            '&.Mui-focused': {
              color: accentColor,
            },
          },
        }}
        FormHelperTextProps={{
          sx: {
            fontSize: '0.78rem',
            mt: 0.5
          }
        }}
        sx={{ mb: 2.5 }}
      />

      <TextField
        label="Confirm Password"
        type={showConfirm ? 'text' : 'password'}
        fullWidth
        required
        disabled={loading}
        placeholder="Confirm your new password"
        helperText="Type the same password again."
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        inputProps={{
          autoComplete: 'new-password',
          'aria-label': 'Confirm new password',
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined
                sx={{
                  color: accentColor,
                  fontSize: 20,
                }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowConfirm((prev) => !prev)}
                edge="end"
                sx={{ minWidth: 44, minHeight: 44 }}
                aria-label={
                  showConfirm
                    ? 'Hide password confirmation'
                    : 'Show password confirmation'
                }
              >
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            fontSize: '1rem',
            fontWeight: 500,
            color: panelText,
            background: inputBackground,
            borderRadius: 1.5,
            minHeight: '48px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorder,
              borderWidth: 2,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: inputBorderHover,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: accentColor,
              boxShadow: `0 0 0 2px ${alpha(accentColor, 0.2)}`,
            },
            '& .MuiInputBase-input::placeholder': {
              color: inputPlaceholder,
              opacity: 1,
            },
          },
        }}
        InputLabelProps={{
          sx: {
            color: panelSoft,
            fontWeight: 600,
            '&.Mui-focused': {
              color: accentColor,
            },
          },
        }}
        FormHelperTextProps={{
          sx: {
            fontSize: '0.78rem',
            mt: 0.5
          }
        }}
        sx={{ mb: 3.5 }}
      />

      <Button
        type="submit"
        fullWidth
        disabled={loading}
        aria-label="Save new password"
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          height: '48px',
          borderRadius: '24px',
          fontSize: '16px',
          fontWeight: 'bold',
          textTransform: 'none',
          mb: 2.5,
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          'Save New Password'
        )}
      </Button>

      {status && (
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/login')}
          sx={{
            borderColor: accentColor,
            color: accentColor,
            height: '48px',
            borderRadius: '24px',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'none',
            mb: 2.5,
            '&:hover': {
              borderColor: 'primary.dark',
              background: alpha(accentColor, 0.08)
            },
          }}
        >
          Go to Sign in
        </Button>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ color: panelMuted }}>
          Remember your password now?{' '}
          <Link
            to="/login"
            style={{
              color: accentColor,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <PageCanvas
        disableContainer
        sx={{
          pt: { xs: 2, md: 4 },
          pb: { xs: withSafeAreaBottom(20), md: 6 },
        }}
      >
        <Box
          sx={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 2,
            py: 3,
          }}
        >
          {content}
        </Box>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 4, md: 6 } }}
    >
      <AuthWrapper>
        {content}
      </AuthWrapper>
    </PageCanvas>
  );
};

export default ResetPassword;
