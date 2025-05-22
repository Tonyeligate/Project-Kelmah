import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondary, 
  IconButton, 
  Button, 
  Divider, 
  Alert, 
  CircularProgress, 
  Chip
} from '@mui/material';
import { 
  DevicesOther as DevicesIcon, 
  Close as CloseIcon, 
  Computer as ComputerIcon, 
  PhoneAndroid as PhoneIcon, 
  Tablet as TabletIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Session Management Page
 * Allows users to view and manage their active sessions
 */
const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { logout } = useAuth();
  
  // Fetch user sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);
  
  // Function to fetch user sessions
  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/auth/sessions');
      
      if (response.data.status === 'success') {
        setSessions(response.data.data.sessions);
      } else {
        setError('Failed to load sessions. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.response?.data?.message || 'Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to end a specific session
  const endSession = async (sessionId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.delete(`/api/auth/sessions/${sessionId}`);
      
      if (response.data.status === 'success') {
        setSuccess('Session ended successfully');
        // Update sessions list
        setSessions(prev => prev.filter(session => session.id !== sessionId));
      } else {
        setError('Failed to end session. Please try again.');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      setError(error.response?.data?.message || 'Failed to end session. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to end all other sessions
  const endAllSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.delete('/api/auth/sessions');
      
      if (response.data.status === 'success') {
        setSuccess('All other sessions ended successfully');
        // Update sessions list to only keep current session
        setSessions(prev => prev.filter(session => session.isCurrentSession));
      } else {
        setError('Failed to end sessions. Please try again.');
      }
    } catch (error) {
      console.error('Error ending all sessions:', error);
      setError(error.response?.data?.message || 'Failed to end all sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get icon based on device type
  const getDeviceIcon = (deviceName) => {
    const lowerDeviceName = deviceName.toLowerCase();
    
    if (lowerDeviceName.includes('mobile') || lowerDeviceName.includes('phone')) {
      return <PhoneIcon />;
    } else if (lowerDeviceName.includes('tablet')) {
      return <TabletIcon />;
    } else {
      return <ComputerIcon />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        exact: format(date, 'PPpp')
      };
    } catch (error) {
      return {
        relative: 'Unknown',
        exact: 'Unknown'
      };
    }
  };
  
  if (loading && sessions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DevicesIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">
          Session Management
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Active Sessions
          </Typography>
          
          <Button 
            variant="outlined" 
            color="error" 
            onClick={endAllSessions}
            disabled={loading || sessions.filter(s => !s.isCurrentSession).length === 0}
          >
            Sign Out All Other Devices
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          These are your currently active sessions. You can end any session except your current one.
        </Typography>
        
        {sessions.length === 0 ? (
          <Alert severity="info">No active sessions found.</Alert>
        ) : (
          <List sx={{ width: '100%' }}>
            {sessions.map((session, index) => (
              <React.Fragment key={session.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    session.isCurrentSession ? (
                      <Chip 
                        label="Current Session" 
                        color="primary" 
                        size="small"
                        icon={<CheckIcon />}
                      />
                    ) : (
                      <IconButton 
                        edge="end" 
                        aria-label="terminate" 
                        onClick={() => endSession(session.id)}
                        disabled={loading}
                      >
                        <CloseIcon />
                      </IconButton>
                    )
                  }
                >
                  <Box sx={{ pr: 2 }}>
                    {getDeviceIcon(session.deviceName)}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1" 
                        fontWeight={session.isCurrentSession ? 'bold' : 'normal'}
                      >
                        {session.deviceName}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          IP: {session.ip}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span">
                          Last active: {formatDate(session.lastActive).relative}
                        </Typography>
                        <br />
                        <Typography variant="body2" component="span" color="text.secondary">
                          Created: {formatDate(session.createdAt).exact}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body1" fontWeight="bold">
          Security Tip
        </Typography>
        <Typography variant="body2">
          If you notice any sessions that you don't recognize, end them immediately and change your password.
        </Typography>
      </Alert>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button 
          variant="contained" 
          color="error" 
          onClick={logout}
          sx={{ px: 4 }}
        >
          Sign Out of Current Session
        </Button>
      </Box>
    </Box>
  );
};

export default SessionManagement; 