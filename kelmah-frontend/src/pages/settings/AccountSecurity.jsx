import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Divider, 
  Alert, 
  CircularProgress, 
  Switch, 
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  Security as SecurityIcon, 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Account Security Page
 * Allows users to manage security settings
 */
const AccountSecurity = () => {
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { getCurrentUser } = useAuth();
  
  // Fetch user information on mount
  useEffect(() => {
    fetchUserInfo();
  }, []);
  
  // Function to fetch user information
  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setUserInfo(user);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password form input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password change submission
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validate form data
    if (!passwordFormData.currentPassword) {
      setError('Current password is required');
      setLoading(false);
      return;
    }
    
    if (!passwordFormData.newPassword) {
      setError('New password is required');
      setLoading(false);
      return;
    }
    
    if (passwordFormData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    
    if (!/[A-Z]/.test(passwordFormData.newPassword)) {
      setError('New password must contain at least one uppercase letter');
      setLoading(false);
      return;
    }
    
    if (!/[0-9]/.test(passwordFormData.newPassword)) {
      setError('New password must contain at least one number');
      setLoading(false);
      return;
    }
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword
      });
      
      if (response.data.status === 'success') {
        setSuccess('Password changed successfully');
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError('Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to calculate password strength
  const getPasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(5, strength);
  };
  
  // Function to get password strength label and color
  const getPasswordStrengthInfo = (password) => {
    const strength = getPasswordStrength(password);
    
    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
    const colors = ['#e53935', '#ef6c00', '#fbc02d', '#7cb342', '#4caf50', '#2e7d32'];
    
    return {
      label: labels[strength],
      color: colors[strength]
    };
  };
  
  const passwordStrength = getPasswordStrengthInfo(passwordFormData.newPassword);
  
  if (loading && !userInfo) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">
          Account Security
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Change Password
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your password should be at least 8 characters long and include uppercase letters, 
          lowercase letters, and numbers for maximum security.
        </Typography>
        
        <Box component="form" onSubmit={handleChangePassword} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordFormData.currentPassword}
            onChange={handlePasswordChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordFormData.newPassword}
            onChange={handlePasswordChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {passwordFormData.newPassword && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Password strength: <span style={{ color: passwordStrength.color, fontWeight: 'bold' }}>{passwordStrength.label}</span>
              </Typography>
              <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.300', borderRadius: 2 }}>
                <Box 
                  sx={{ 
                    height: '100%', 
                    width: `${(getPasswordStrength(passwordFormData.newPassword) / 5) * 100}%`, 
                    bgcolor: passwordStrength.color,
                    borderRadius: 2
                  }} 
                />
              </Box>
            </Box>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={passwordFormData.confirmPassword}
            onChange={handlePasswordChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {passwordFormData.newPassword && passwordFormData.confirmPassword && 
           passwordFormData.newPassword !== passwordFormData.confirmPassword && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Passwords do not match
            </Typography>
          )}
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Typography variant="h6">
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              color="primary"
              component={RouterLink}
              to="/settings/mfa-setup"
              startIcon={<LockIcon />}
            >
              {userInfo?.isTwoFactorEnabled ? 'Manage 2FA' : 'Setup 2FA'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Typography variant="h6">
              Session Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage your active sessions across different devices.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              color="primary"
              component={RouterLink}
              to="/settings/sessions"
              startIcon={<SecurityIcon />}
            >
              Manage Sessions
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Security tip:</strong> Make sure to use a unique, strong password and enable two-factor authentication for maximum security.
        </Typography>
      </Alert>
    </Box>
  );
};

export default AccountSecurity; 