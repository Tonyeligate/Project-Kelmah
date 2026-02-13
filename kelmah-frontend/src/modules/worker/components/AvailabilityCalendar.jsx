import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import { format, parseISO, isSameDay } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

const AvailabilityCalendar = () => {
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    startTime: null,
    endTime: null,
    status: 'available',
  });

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      if (!userId) {
        setAvailability([]);
        setError('User context is missing. Please log in again.');
        return;
      }

      const response = await fetch(
        `/api/availability/${userId}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load availability (${response.status})`);
      }
      const data = await response.json();

      // Backend returns { success, data: { daySlots: [...] } }
      const normalizedSlots = Array.isArray(data?.data?.daySlots)
        ? data.data.daySlots.flatMap((day) => {
          const daySlots = Array.isArray(day?.slots) ? day.slots : [];
          const currentDate = format(selectedDate, 'yyyy-MM-dd');
          return daySlots.map((slot, index) => ({
            id: `${day.dayOfWeek}-${index}`,
            startTime: `${currentDate}T${slot.start || '09:00'}:00`,
            endTime: `${currentDate}T${slot.end || '17:00'}:00`,
            status: data?.data?.isAvailable ? 'available' : 'unavailable',
          }));
        })
        : [];

      setAvailability(normalizedSlots);
      setError(null);
    } catch (err) {
      setError('Failed to load availability');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleDialogOpen = (slot = null) => {
    setEditingSlot(slot);
    if (slot) {
      setFormData({
        startTime: parseISO(slot.startTime),
        endTime: parseISO(slot.endTime),
        status: slot.status,
      });
    } else {
      setFormData({
        startTime: null,
        endTime: null,
        status: 'available',
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingSlot(null);
    setFormData({
      startTime: null,
      endTime: null,
      status: 'available',
    });
  };

  const handleInputChange = (field) => (value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      if (!userId) {
        throw new Error('Missing user id');
      }

      const dayOfWeek = selectedDate.getDay();
      const nextSlot = {
        start: formData?.startTime ? format(formData.startTime, 'HH:mm') : '09:00',
        end: formData?.endTime ? format(formData.endTime, 'HH:mm') : '17:00',
      };

      // Backend supports upsert via PUT /api/availability/:userId
      const payload = {
        timezone: 'Africa/Accra',
        isAvailable: formData.status !== 'unavailable',
        daySlots: [
          {
            dayOfWeek,
            slots: [nextSlot],
          },
        ],
      };

      const response = await fetch(`/api/availability/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save availability');
      }

      handleDialogClose();
      fetchAvailability();
    } catch (err) {
      setError('Failed to save availability');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId) => {
    try {
      // Current backend exposes delete for holidays, not per-slot delete.
      // Keep UX stable by showing guidance instead of calling a non-existent endpoint.
      setError('Direct slot delete is not supported yet. Edit the slot and set unavailable instead.');
    } catch (err) {
      setError('Failed to delete availability slot');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'unavailable':
        return 'error';
      case 'booked':
        return 'warning';
      default:
        return 'default';
    }
  };

  const renderTimeSlot = (slot) => (
    <Paper
      key={slot.id}
      sx={{
        p: 2,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AccessTimeIcon color="action" />
        <Box>
          <Typography variant="body1">
            {format(parseISO(slot.startTime), 'h:mm a')} -{' '}
            {format(parseISO(slot.endTime), 'h:mm a')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
          </Typography>
        </Box>
      </Box>
      <Box>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={() => handleDialogOpen(slot)}
            disabled={slot.status === 'booked'}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => handleDelete(slot.id)}
            disabled={slot.status === 'booked'}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5">Availability Calendar</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add Time Slot
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectedDate}
                onChange={handleDateChange}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {format(selectedDate, 'MMMM d, yyyy')}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : availability.length === 0 ? (
              <Typography color="text.secondary" align="center">
                No time slots scheduled
              </Typography>
            ) : (
              <Box>{availability.map(renderTimeSlot)}</Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={handleInputChange('startTime')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={handleInputChange('endTime')}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) =>
                      handleInputChange('status')(e.target.value)
                    }
                  >
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="unavailable">Unavailable</MenuItem>
                    <MenuItem value="booked">Booked</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.startTime || !formData.endTime}
          >
            {editingSlot ? 'Update' : 'Add'} Time Slot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AvailabilityCalendar;
