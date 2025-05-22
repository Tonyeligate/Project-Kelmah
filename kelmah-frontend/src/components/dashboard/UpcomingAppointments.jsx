import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  Avatar,
  Divider,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Event as EventIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * Component to display upcoming appointments for workers
 */
const UpcomingAppointments = ({ appointments }) => {
  const navigate = useNavigate();

  // Format date and time for display
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { dateStr, timeStr };
  };

  // Handle navigation to appointment details
  const handleAppointmentClick = (appointmentId) => {
    navigate(`/appointments/${appointmentId}`);
  };
  
  if (!appointments || appointments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No upcoming appointments scheduled.
      </Typography>
    );
  }
  
  return (
    <List disablePadding>
      {appointments.map((appointment, index) => {
        const { dateStr, timeStr } = formatDateTime(appointment.startTime);
        
        return (
          <React.Fragment key={appointment.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem 
              alignItems="flex-start"
              sx={{ 
                py: 2,
                '&:hover': { 
                  bgcolor: 'action.hover',
                  cursor: 'pointer'
                }
              }}
              onClick={() => handleAppointmentClick(appointment.id)}
              secondaryAction={
                <Tooltip title="View Details">
                  <IconButton 
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppointmentClick(appointment.id);
                    }}
                  >
                    <ArrowIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'primary.main',
                  mr: 2
                }}
              >
                <EventIcon />
              </Avatar>
              
              <ListItemText
                primary={
                  <Typography variant="subtitle1" component="div" fontWeight="medium">
                    {appointment.title || 'Appointment'}
                  </Typography>
                }
                secondary={
                  <Stack spacing={1} sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {appointment.clientName}
                        </Typography>
                      </Box>
                      
                      {appointment.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {appointment.location}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          size="small" 
                          label={dateStr} 
                          variant="outlined"
                          color="primary"
                        />
                        <Chip 
                          size="small" 
                          label={timeStr} 
                          variant="outlined"
                          color="primary"
                        />
                      </Stack>
                      
                      <Chip 
                        size="small" 
                        label={appointment.status || 'Confirmed'} 
                        color={appointment.status === 'confirmed' ? 'success' : 'info'}
                      />
                    </Box>
                  </Stack>
                }
              />
            </ListItem>
          </React.Fragment>
        );
      })}
    </List>
  );
};

UpcomingAppointments.propTypes = {
  /**
   * Array of appointment objects to display
   */
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      clientName: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string,
      location: PropTypes.string,
      status: PropTypes.string
    })
  ).isRequired
};

export default UpcomingAppointments; 