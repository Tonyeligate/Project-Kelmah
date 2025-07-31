/**
 * Test User Login Component
 * Quick test interface for real test user accounts
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import { getAllTestUsers, TEST_USER_PASSWORD } from '../data/realTestUsers';
import authService from '../modules/auth/services/authService';

const TestUserLogin = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const testUsers = getAllTestUsers();
  
  const handleQuickLogin = async (userEmail) => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await authService.login({
        email: userEmail,
        password: TEST_USER_PASSWORD
      });
      
      setResult({
        success: true,
        message: `✅ Successfully logged in as ${response.user.fullName}`,
        user: response.user
      });
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Login failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedUsers = testUsers.reduce((acc, user) => {
    const region = user.location.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(user);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#D4AF37', textAlign: 'center' }}>
        🧪 Test User Login Panel
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>
        Click any user below to test login with real user data. Password: <strong>{TEST_USER_PASSWORD}</strong>
      </Typography>

      {result && (
        <Alert 
          severity={result.success ? 'success' : 'error'} 
          sx={{ mb: 3 }}
        >
          {result.message}
          {result.user && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">
                Role: {result.user.role} | Profession: {result.user.profession} | 
                Rating: {result.user.rating}⭐ | Location: {result.user.location.city}
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      {Object.entries(groupedUsers).map(([region, users]) => (
        <Card key={region} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#D4AF37', mb: 2 }}>
              {region} ({users.length} users)
            </Typography>
            
            <Grid container spacing={2}>
              {users.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Card 
                    sx={{ 
                      bgcolor: 'rgba(0,0,0,0.3)', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(212,175,55,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => handleQuickLogin(user.email)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {user.fullName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {user.email}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={user.profession} 
                          size="small" 
                          sx={{ bgcolor: '#D4AF37', color: '#000' }}
                        />
                        <Chip 
                          label={`${user.rating}⭐`} 
                          size="small" 
                          variant="outlined"
                          sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>
                        GHS {user.hourlyRate}/hr • {user.completedJobs} jobs • {user.experience}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#D4AF37', mb: 2 }}>
          Quick Manual Login
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, maxWidth: 400, mx: 'auto' }}>
          <TextField
            fullWidth
            label="Email"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            placeholder="e.g., kwame.asante1@kelmah.test"
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': { color: '#fff' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleQuickLogin(selectedUser)}
            disabled={!selectedUser || loading}
            sx={{
              bgcolor: '#D4AF37',
              color: '#000',
              '&:hover': { bgcolor: '#B8941F' }
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          💡 This component is for development testing only. Real users are loaded automatically in the login form.
        </Typography>
      </Box>
    </Box>
  );
};

export default TestUserLogin;