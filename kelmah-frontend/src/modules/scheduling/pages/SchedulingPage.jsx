import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Divider,
  Alert,
  Badge,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Skeleton,
  Autocomplete,
  CircularProgress,
  Link,
  Avatar,
} from '@mui/material';
import { IconButton } from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  EventBusy as EventBusyIcon,
  LocationOn as LocationIcon,
  VideoCall as VideoCallIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  format,
  isSameDay,
  parseISO,
  isAfter,
  isBefore,
  addDays,
} from 'date-fns';
import schedulingService from '../services/schedulingService';
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentForm from '../components/AppointmentForm';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import jobsService from '../../jobs/services/jobsApi';
// Import workersApi for user loading functionality
import workersApi from '../../../api/services/workersApi';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const getStatusChip = (status) => {
  const statusConfig = {
    confirmed: {
      icon: <CheckCircleIcon />,
      label: 'Confirmed',
      color: 'success',
    },
    pending: {
      icon: <HourglassEmptyIcon />,
      label: 'Pending',
      color: 'warning',
    },
    completed: { icon: <EventBusyIcon />, label: 'Completed', color: 'info' },
    cancelled: { icon: <EventBusyIcon />, label: 'Cancelled', color: 'error' },
  };
  const config = statusConfig[status] || { label: 'Unknown' };
  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 'bold' }}
    />
  );
};

const AppointmentCard = ({ appointment, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const isVirtual = appointment.appointmentType === 'virtual';

  const handleJobClick = () => {
    navigate(`/jobs/${appointment.jobId}`);
  };

  const handleUserClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${appointment.hirerId}`);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 2,
        p: 2,
        mb: 2,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' },
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={handleJobClick}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={3} sm={2} textAlign="center">
          <Typography variant="h5" fontWeight="bold" color="primary">
            {format(new Date(appointment.date), 'dd')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(appointment.date), 'MMM')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(appointment.date), 'p')}
          </Typography>
        </Grid>
        <Grid item xs={9} sm={7}>
          <Typography variant="h6" fontWeight="bold">
            {appointment.jobTitle}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Avatar
              src={appointment.hirerAvatar}
              alt={appointment.hirer}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <Link
              component="button"
              variant="body2"
              color="text.secondary"
              onClick={handleUserClick}
              underline="hover"
            >
              {appointment.hirer}
            </Link>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {isVirtual ? (
              <VideoCallIcon
                fontSize="small"
                sx={{ mr: 0.5, color: 'text.secondary' }}
              />
            ) : (
              <LocationIcon
                fontSize="small"
                sx={{ mr: 0.5, color: 'text.secondary' }}
              />
            )}
            <Typography variant="body2" color="text.secondary">
              {isVirtual
                ? 'Virtual Meeting'
                : appointment.location || 'In-person'}
            </Typography>
          </Box>
          {/* Contact/Map Actions */}
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            {isVirtual && appointment.meetingLink && (
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                startIcon={<VideoCallIcon />}
                sx={{
                  borderWidth: 2,
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(appointment.meetingLink, '_blank');
                }}
              >
                Join Meeting
              </Button>
            )}
            {!isVirtual && appointment.location && (
              <Button
                variant="outlined"
                size="small"
                color="secondary"
                startIcon={<LocationIcon />}
                sx={{
                  borderWidth: 2,
                  boxShadow: '0 2px 8px rgba(255,215,0,0.4)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.location)}`,
                    '_blank',
                  );
                }}
              >
                View on Map
              </Button>
            )}
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          sm={3}
          textAlign={{ xs: 'left', sm: 'right' }}
          sx={{ mt: { xs: 1, sm: 0 } }}
        >
          {getStatusChip(appointment.status)}
        </Grid>
      </Grid>
      <Box
        sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(appointment);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(appointment.id);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

const AppointmentSkeleton = () => (
  <Paper elevation={2} sx={{ borderRadius: 2, p: 2, mb: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={3} sm={2} textAlign="center">
        <Skeleton variant="text" width={40} height={32} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width={30} height={20} sx={{ mx: 'auto' }} />
      </Grid>
      <Grid item xs={9} sm={7}>
        <Skeleton variant="text" width="80%" height={28} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={20} />
      </Grid>
      <Grid item xs={12} sm={3} textAlign={{ xs: 'left', sm: 'right' }}>
        <Skeleton
          variant="rounded"
          width={80}
          height={24}
          sx={{ ml: { xs: 0, sm: 'auto' } }}
        />
      </Grid>
    </Grid>
  </Paper>
);

const SchedulingPage = () => {
  // Appointments state and loading
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'agenda' or 'upcoming' or 'map'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [formData, setFormData] = useState({
    jobId: '',
    jobTitle: '',
    hirerId: '',
    hirer: '',
    date: new Date(),
    status: 'pending',
    appointmentType: 'in-person',
    location: '',
    meetingLink: '',
    notes: '',
  });

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Extract dates with appointments for calendar badges
  const appointmentDays = appointments
    .map((a) => {
      const appointmentDate = a.startTime || a.date;
      if (!appointmentDate) return null;

      try {
        const dateObj = new Date(appointmentDate);
        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn('Invalid appointment date:', appointmentDate);
          return null;
        }
        return format(dateObj, 'yyyy-MM-dd');
      } catch (error) {
        console.warn('Invalid appointment date:', appointmentDate, error);
        return null;
      }
    })
    .filter((date) => date !== null);

  // Load appointments helper
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await schedulingService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments');
      enqueueSnackbar('Failed to load appointments', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Load jobs for autocomplete
  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await jobsService.getJobs({ limit: 100 });
      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Load users for autocomplete
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Use mock data since workersApi.searchWorkers is not implemented
      const mockUsers = [
        { id: 1, name: 'John Carpenter', email: 'john@example.com', skills: ['Carpentry', 'Furniture'] },
        { id: 2, name: 'Sarah Plumber', email: 'sarah@example.com', skills: ['Plumbing', 'Repairs'] },
        { id: 3, name: 'Mike Electrician', email: 'mike@example.com', skills: ['Electrical', 'Wiring'] },
        { id: 4, name: 'Anna Mason', email: 'anna@example.com', skills: ['Masonry', 'Concrete'] },
        { id: 5, name: 'David Painter', email: 'david@example.com', skills: ['Painting', 'Decoration'] }
      ];
      setUsers(mockUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      // Set empty array as fallback
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadJobs();
    loadUsers();
  }, []);

  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setFormData({
      jobId: '',
      jobTitle: '',
      hirerId: '',
      hirer: '',
      date: selectedDate,
      status: 'pending',
      appointmentType: 'in-person',
      location: '',
      meetingLink: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (app) => {
    setDialogMode('edit');
    setCurrentAppointment(app);
    setFormData({
      jobId: app.jobId || '',
      jobTitle: app.jobTitle || '',
      hirerId: app.hirerId || '',
      hirer: app.hirer || '',
      date: new Date(app.date),
      status: app.status || 'pending',
      appointmentType: app.appointmentType || 'in-person',
      location: app.location || '',
      meetingLink: app.meetingLink || '',
      notes: app.notes || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentAppointment(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJobChange = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        jobId: newValue.id,
        jobTitle: newValue.title,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        jobId: '',
        jobTitle: '',
      }));
    }
  };

  const handleHirerChange = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        hirerId: newValue.id,
        hirer: newValue.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        hirerId: '',
        hirer: '',
      }));
    }
  };

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, date: newDate }));
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await schedulingService.createAppointment(formData);
        enqueueSnackbar('Appointment created successfully', {
          variant: 'success',
        });
      } else {
        await schedulingService.updateAppointment(
          currentAppointment.id,
          formData,
        );
        enqueueSnackbar('Appointment updated successfully', {
          variant: 'success',
        });
      }
      handleCloseDialog();
      loadAppointments();
    } catch (err) {
      console.error('Error saving appointment:', err);
      enqueueSnackbar('Error saving appointment', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this appointment?')) {
      try {
        await schedulingService.deleteAppointment(id);
        enqueueSnackbar('Appointment deleted successfully', {
          variant: 'success',
        });
        loadAppointments();
      } catch (err) {
        console.error('Error deleting appointment:', err);
        enqueueSnackbar('Error deleting appointment', { variant: 'error' });
      }
    }
  };

  // Filter appointments based on status and search query
  const filteredAppointments = appointments.filter((app) => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.hirer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filter for selected day's appointments
  const dailyAppointments = filteredAppointments.filter((a) => {
    try {
      const appointmentDate = new Date(a.date);
      if (isNaN(appointmentDate.getTime())) return false;
      return isSameDay(appointmentDate, selectedDate);
    } catch (error) {
      console.warn('Invalid appointment date in dailyAppointments filter:', a.date);
      return false;
    }
  });

  // Group appointments by date string for agenda view
  const appointmentsByDate = filteredAppointments.reduce((acc, app) => {
    try {
      const appointmentDate = new Date(app.date);
      if (isNaN(appointmentDate.getTime())) {
        console.warn('Invalid appointment date in reduce:', app.date);
        return acc;
      }
      const dateKey = format(appointmentDate, 'yyyy-MM-dd');
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(app);
      return acc;
    } catch (error) {
      console.warn('Error processing appointment date in reduce:', app.date, error);
      return acc;
    }
  }, {});

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = filteredAppointments
    .filter(
      (a) =>
        isAfter(new Date(a.date), new Date()) &&
        isBefore(new Date(a.date), addDays(new Date(), 7)),
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarTodayIcon
            sx={{ fontSize: 36, mr: 1.5, color: 'primary.main' }}
          />
          <Typography variant="h4" fontWeight="bold">
            My Schedule
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreateDialog}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' },
            fontWeight: 'bold',
          }}
        >
          New Appointment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search appointments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={<FilterIcon color="action" sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, mode) => mode && setViewMode(mode)}
              size="small"
              fullWidth
            >
              <ToggleButton value="calendar">Calendar</ToggleButton>
              <ToggleButton value="agenda">Agenda</ToggleButton>
              <ToggleButton value="upcoming">Upcoming</ToggleButton>
              <ToggleButton value="map">Map</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {viewMode === 'calendar' && (
        <>
          {/* Calendar View */}
          <AppointmentCalendar
            appointments={filteredAppointments}
            selectedDate={selectedDate}
            onDateChange={(newDate) => setSelectedDate(newDate)}
          />

          {/* Appointments for selected date */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
              Appointments for {format(selectedDate, 'PPP')}
            </Typography>
            {loading ? (
              Array.from(new Array(3)).map((_, idx) => (
                <AppointmentSkeleton key={idx} />
              ))
            ) : dailyAppointments.length > 0 ? (
              dailyAppointments.map((app) => (
                <AppointmentCard
                  key={app.id}
                  appointment={app}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: 'background.default',
                }}
                elevation={0}
              >
                <Typography>No appointments for this date.</Typography>
              </Paper>
            )}
          </Box>
        </>
      )}
      {viewMode === 'agenda' && (
        /* Agenda View */
        <Box sx={{ mb: 4 }}>
          {loading ? (
            Array.from(new Array(3)).map((_, idx) => (
              <AppointmentSkeleton key={idx} />
            ))
          ) : Object.keys(appointmentsByDate).length > 0 ? (
            Object.keys(appointmentsByDate)
              .sort((a, b) => new Date(a) - new Date(b))
              .map((dateKey) => (
                <Box key={dateKey} sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    {format(parseISO(dateKey), 'PPP')}
                  </Typography>
                  {appointmentsByDate[dateKey].map((app) => (
                    <AppointmentCard
                      key={app.id}
                      appointment={app}
                      onEdit={handleOpenEditDialog}
                      onDelete={handleDelete}
                    />
                  ))}
                </Box>
              ))
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: 'background.default',
              }}
              elevation={0}
            >
              <Typography>
                No appointments found matching your criteria.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
      {viewMode === 'upcoming' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Upcoming Appointments (Next 7 Days)
          </Typography>
          {loading ? (
            Array.from(new Array(3)).map((_, idx) => (
              <AppointmentSkeleton key={idx} />
            ))
          ) : upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((app) => (
              <AppointmentCard
                key={app.id}
                appointment={app}
                onEdit={handleOpenEditDialog}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: 'background.default',
              }}
              elevation={0}
            >
              <Typography>
                No upcoming appointments in the next 7 days.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
      {viewMode === 'map' && (
        <Box sx={{ height: 500, mb: 4 }}>
          <MapContainer
            center={[0, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {appointments
              .filter((a) => a.coordinates)
              .map((app) => (
                <Marker
                  key={app.id}
                  position={[app.coordinates.lat, app.coordinates.lng]}
                >
                  <Popup>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {app.jobTitle}
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(app.date), 'PPP p')}
                    </Typography>
                    <Typography variant="body2">{app.location}</Typography>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </Box>
      )}

      {/* Appointment Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'New Appointment' : 'Edit Appointment'}
        </DialogTitle>
        <DialogContent>
          <AppointmentForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            jobs={jobs}
            users={users}
            loadingJobs={loadingJobs}
            loadingUsers={loadingUsers}
            mode={dialogMode}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default SchedulingPage;
