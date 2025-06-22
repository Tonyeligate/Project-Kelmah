import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const statusConfig = {
  pending: {
    label: 'Pending Confirmation',
    color: 'warning',
    icon: <HourglassEmptyIcon />,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'success',
    icon: <CheckCircleIcon />,
  },
  completed: {
    label: 'Completed',
    color: 'default',
    icon: <CheckCircleIcon sx={{ color: 'grey' }} />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    icon: <CancelIcon />,
  },
};

const AppointmentCard = ({ appointment, onUpdate }) => {
  const { id, jobTitle, hirerName, date, status, location } = appointment;
  const [loading, setLoading] = React.useState(null); // 'accept' | 'decline' | null

  const handleAction = async (action) => {
    if (!onUpdate) return;
    setLoading(action);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    onUpdate(id, action === 'accept' ? 'confirmed' : 'cancelled');
    setLoading(null);
  };

  const currentStatus = statusConfig[status];

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: 'background.paper',
        borderLeft: `5px solid`,
        borderColor: `${currentStatus.color}.main`,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h6" fontWeight="bold">{jobTitle}</Typography>
          <Box display="flex" alignItems="center" mt={1} color="text.secondary">
            <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2">{hirerName}</Typography>
          </Box>
          <Box display="flex" alignItems="center" mt={0.5} color="text.secondary">
            <LocationOnIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2">{location}</Typography>
          </Box>
        </Box>
        <Chip
          icon={currentStatus.icon}
          label={currentStatus.label}
          color={currentStatus.color}
          size="small"
        />
      </Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
      >
        <Box display="flex" alignItems="center" color="text.primary">
          <EventIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          <Typography variant="body1" fontWeight="500">
            {format(new Date(date), "EEE, MMM d, yyyy 'at' h:mm a")}
          </Typography>
        </Box>
        {status === 'pending' && onUpdate && (
          <Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              sx={{ mr: 1 }}
              onClick={() => handleAction('decline')}
              disabled={!!loading}
            >
              {loading === 'decline' ? <CircularProgress size={20} /> : 'Decline'}
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleAction('accept')}
              disabled={!!loading}
            >
             {loading === 'accept' ? <CircularProgress size={20} /> : 'Accept'}
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

AppointmentCard.propTypes = {
  appointment: PropTypes.shape({
    id: PropTypes.any.isRequired,
    jobTitle: PropTypes.string.isRequired,
    hirerName: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['pending', 'confirmed', 'completed', 'cancelled']).isRequired,
    location: PropTypes.string.isRequired,
  }).isRequired,
  onUpdate: PropTypes.func,
};

export default AppointmentCard; 