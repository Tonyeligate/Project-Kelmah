import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  IconButton,
  Chip,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Event as EventIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationIcon,
  Work as WorkIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardCard from '../common/DashboardCard';
import { useAuth } from '../../../auth/contexts/AuthContext';

const EnhancedUpcomingAppointments = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedForMenu, setSelectedForMenu] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Generate mock appointment data
  const generateAppointments = () => {
    const appointmentTypes = ['Client Meeting', 'Project Start', 'Inspection', 'Consultation', 'Material Delivery'];
    const locations = ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Tema'];
    const clients = ['Johnson Residence', 'Miller Office', 'Smith Home', 'Brown Construction', 'Davis Renovation'];
    
    return Array.from({ length: 6 }, (_, index) => {
      const baseDate = new Date();
      const daysAhead = index === 0 ? 0 : Math.floor(Math.random() * 7) + 1;
      const appointmentDate = new Date(baseDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      const hour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
      appointmentDate.setHours(hour, index % 2 === 0 ? 0 : 30, 0, 0);
      
      const type = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      return {
        id: `apt_${index + 1}`,
        title: `${type}: ${client}`,
        type: type.toLowerCase().replace(' ', '_'),
        client: client,
        datetime: appointmentDate,
        location: location,
        duration: Math.floor(Math.random() * 3) + 1, // 1-3 hours
        status: index === 0 ? 'upcoming' : Math.random() > 0.8 ? 'confirmed' : 'pending',
        priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        description: `${type} scheduled with ${client} in ${location}. Please arrive 15 minutes early.`,
        clientContact: {
          phone: '+233 20 123 4567',
          email: 'client@example.com'
        },
        reminders: ['1 hour before', '15 minutes before'],
        canReschedule: true,
        canCancel: true,
      };
    }).sort((a, b) => a.datetime - b.datetime);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        const appointmentsData = generateAppointments();
        setAppointments(appointmentsData);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const appointmentsData = generateAppointments();
      setAppointments(appointmentsData);
    } catch (err) {
      setError('Failed to refresh appointments');
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleMarkComplete = (appointmentId) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'completed' } : apt
    ));
  };

  const handleCancelAppointment = (appointmentId) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'upcoming': return '#2196F3';
      case 'completed': return '#9C27B0';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatDateTime = (datetime) => {
    const now = new Date();
    const diff = datetime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Today, ${datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Tomorrow, ${datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${datetime.toLocaleDateString([], { weekday: 'long' })}, ${datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return datetime.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getAppointmentIcon = (type) => {
    switch (type) {
      case 'client_meeting': return <PersonIcon />;
      case 'project_start': return <WorkIcon />;
      case 'inspection': return <EventIcon />;
      case 'consultation': return <PersonIcon />;
      case 'material_delivery': return <WorkIcon />;
      default: return <EventIcon />;
    }
  };

  if (loading) {
    return (
      <DashboardCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Upcoming Appointments
            </Typography>
            <ScheduleIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
          </Stack>
        }
      >
        <Box sx={{ p: 2 }}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Upcoming Appointments">
        <Box sx={{ p: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
            Try Again
          </Button>
        </Box>
      </DashboardCard>
    );
  }

  return (
    <>
      <DashboardCard
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
          Upcoming Appointments
        </Typography>
            <ScheduleIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
          </Stack>
        }
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Add appointment">
              <IconButton sx={{ color: '#FFD700' }}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={{ color: '#FFD700' }}
              >
                <RefreshIcon 
                  sx={{
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      >
        {appointments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ScheduleIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              No upcoming appointments
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Your schedule is clear!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            <AnimatePresence>
              {appointments.slice(0, 5).map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,215,0,0.05)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => handleViewDetails(appointment)}
                  >
                <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: alpha(getStatusColor(appointment.status), 0.2),
                          color: getStatusColor(appointment.status),
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getAppointmentIcon(appointment.type)}
                  </Avatar>
                </ListItemAvatar>
                    
                <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                            {appointment.title}
                          </Typography>
                          <Chip
                            label={appointment.status}
                            size="small"
                            sx={{
                              backgroundColor: alpha(getStatusColor(appointment.status), 0.2),
                              color: getStatusColor(appointment.status),
                              fontSize: '0.7rem',
                              height: '20px',
                            }}
                          />
                          {appointment.priority === 'high' && (
                            <Chip
                              label="HIGH"
                              size="small"
                              sx={{
                                backgroundColor: alpha('#F44336', 0.2),
                                color: '#F44336',
                                fontSize: '0.7rem',
                                height: '20px',
                                fontWeight: 700,
                              }}
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TimeIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {formatDateTime(appointment.datetime)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocationIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {appointment.location}
                            </Typography>
                          </Stack>
                        </Stack>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForMenu(appointment);
                          setMenuAnchor(e.currentTarget);
                        }}
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < Math.min(appointments.length - 1, 4) && (
                    <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {appointments.length > 5 && (
              <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                <Button
                  variant="outlined"
                  sx={{
                    color: '#FFD700',
                    borderColor: 'rgba(255,215,0,0.3)',
                    '&:hover': {
                      borderColor: '#FFD700',
                      backgroundColor: alpha('#FFD700', 0.1),
                    },
                  }}
                >
                  View All {appointments.length} Appointments
                </Button>
              </ListItem>
            )}
          </List>
        )}
      </DashboardCard>

      {/* Appointment Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        {selectedAppointment && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="start" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
                    {selectedAppointment.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={selectedAppointment.status}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getStatusColor(selectedAppointment.status), 0.2),
                        color: getStatusColor(selectedAppointment.status),
                        fontSize: '0.7rem',
                      }}
                    />
                    <Chip
                      label={selectedAppointment.priority.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: alpha(getPriorityColor(selectedAppointment.priority), 0.2),
                        color: getPriorityColor(selectedAppointment.priority),
                        fontSize: '0.7rem',
                      }}
                    />
                  </Stack>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <CancelIcon />
                </IconButton>
              </Stack>
            </DialogTitle>
            
            <DialogContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                    Schedule
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ScheduleIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    <Typography sx={{ color: '#fff' }}>
                      {formatDateTime(selectedAppointment.datetime)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <TimeIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    <Typography sx={{ color: '#fff' }}>
                      Duration: {selectedAppointment.duration} hour{selectedAppointment.duration > 1 ? 's' : ''}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                    Location
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                    <Typography sx={{ color: '#fff' }}>
                      {selectedAppointment.location}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                    Client Contact
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PhoneIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      <Typography sx={{ color: '#fff' }}>
                        {selectedAppointment.clientContact.phone}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EmailIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                      <Typography sx={{ color: '#fff' }}>
                        {selectedAppointment.clientContact.email}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>
                    Description
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {selectedAppointment.description}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                Close
              </Button>
              {selectedAppointment.canReschedule && (
                <Button startIcon={<EditIcon />} sx={{ color: '#FFD700' }}>
                  Reschedule
                </Button>
              )}
              {selectedAppointment.status !== 'completed' && (
                <Button 
                  startIcon={<CompleteIcon />} 
                  sx={{ color: '#4CAF50' }}
                  onClick={() => {
                    handleMarkComplete(selectedAppointment.id);
                    setDialogOpen(false);
                  }}
                >
                  Mark Complete
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setSelectedForMenu(null);
        }}
      >
        <MenuItem onClick={() => {
          if (selectedForMenu) handleViewDetails(selectedForMenu);
          setMenuAnchor(null);
          setSelectedForMenu(null);
        }}>
          <EventIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        {selectedForMenu?.canReschedule && (
          <MenuItem onClick={() => {
            setMenuAnchor(null);
            setSelectedForMenu(null);
          }}>
            <EditIcon sx={{ mr: 1 }} /> Reschedule
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          if (selectedForMenu) handleMarkComplete(selectedForMenu.id);
          setMenuAnchor(null);
          setSelectedForMenu(null);
        }}>
          <CompleteIcon sx={{ mr: 1 }} /> Mark Complete
        </MenuItem>
        {selectedForMenu?.canCancel && (
          <MenuItem onClick={() => {
            if (selectedForMenu) handleCancelAppointment(selectedForMenu.id);
            setMenuAnchor(null);
            setSelectedForMenu(null);
          }}>
            <DeleteIcon sx={{ mr: 1 }} /> Cancel
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default EnhancedUpcomingAppointments;
