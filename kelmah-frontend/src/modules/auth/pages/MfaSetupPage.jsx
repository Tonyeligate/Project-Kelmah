import React, { useState, useEffect } from 'react';
import AuthWrapper from '../components/common/AuthWrapper';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';
import PageCanvas from '@/modules/common/components/PageCanvas';
import { withSafeAreaBottom } from '@/utils/safeArea';

const MfaSetupPage = () => {
  const isMobile = useBreakpointDown('md');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { setupMFA, verifyMFA } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const data = await setupMFA();
        if (!cancelled) {
          if (data?.qrCode) {
            setQrCode(data.qrCode);
          } else {
            setError(
              'Failed to set up two-factor authentication. Please refresh and try again.',
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            'Failed to set up two-factor authentication. Please refresh and try again.',
          );
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [setupMFA]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setVerifying(true);
    try {
      await verifyMFA(token);
      setStatus('Two-factor authentication enabled successfully.');
    } catch (err) {
      setError('Verification failed. Please check the code and try again.');
    } finally {
      setVerifying(false);
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

  const mfaContent = (
    <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', textAlign: 'center' }}>
      <Helmet>
        <title>Two-Factor Authentication | Kelmah</title>
      </Helmet>
      <Typography
        variant="h5"
        gutterBottom
        sx={{
          fontWeight: 800,
          color: accentColor,
          fontSize: '1.5rem',
          textAlign: 'center',
          mb: 1.5,
          textShadow: `0 2px 10px ${alpha(accentColor, 0.24)}`
        }}
      >
        Setup Two-Factor Authentication
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: panelMuted,
          textAlign: 'center',
          mb: 3.5,
          lineHeight: 1.55
        }}
      >
        Scan the QR code in your authenticator app, then enter the 6-digit verification code below to enable 2-step login.
      </Typography>

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

      {qrCode ? (
        <>
          <Box
            sx={{
              display: 'inline-block',
              p: 2,
              mb: 3,
              borderRadius: 3,
              bgcolor: isDarkMode ? 'rgba(26,29,38,0.8)' : '#FFFFFF',
              border: `2px solid ${alpha(accentColor, 0.35)}`,
              boxShadow: `0 8px 32px ${alpha(accentColor, 0.15)}`,
            }}
          >
            <Box
              component="img"
              src={qrCode}
              alt="2FA QR Code"
              sx={{
                display: 'block',
                maxWidth: '180px',
                mx: 'auto',
                borderRadius: 1
              }}
            />
          </Box>

          <Typography
            variant="body2"
            gutterBottom
            sx={{
              color: panelMuted,
              fontSize: '0.88rem',
              mb: 3,
              lineHeight: 1.5
            }}
          >
            Open Google Authenticator, Authy, or your browser's authenticator tool, scan the QR code above, then type the generated 6-digit code.
          </Typography>

          <Box component="form" onSubmit={handleVerify} sx={{ mt: 2 }}>
            <TextField
              label="Authentication Code"
              fullWidth
              required
              placeholder="0 0 0 0 0 0"
              helperText="Use the latest 6-digit code from your authenticator app."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 6,
                style: {
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.25rem'
                },
                'aria-label': 'Two-factor authentication code',
              }}
              InputProps={{
                sx: {
                  color: panelText,
                  background: inputBackground,
                  borderRadius: 1.5,
                  minHeight: '52px',
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
                  textAlign: 'center',
                  mt: 0.75,
                  fontSize: '0.78rem'
                }
              }}
              sx={{ mb: 3.5 }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={verifying}
              aria-label="Turn on two-step login"
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
              {verifying ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Enable 2-Step Login'
              )}
            </Button>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: 'center',
            py: 6
          }}
        >
          <CircularProgress size={28} sx={{ color: accentColor }} />
          <Typography sx={{ color: panelMuted, fontWeight: 500 }}>
            Preparing your secure QR code...
          </Typography>
        </Box>
      )}
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
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 2,
            py: 3,
          }}
        >
          {mfaContent}
        </Box>
      </PageCanvas>
    );
  }

  return <AuthWrapper>{mfaContent}</AuthWrapper>;
};

export default MfaSetupPage;
