import React from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Paper, 
  Typography, 
  Badge,
  Tooltip,
  useTheme
} from '@mui/material';
import { LocalizationProvider, DateCalendar, PickersDay } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isSameDay } from 'date-fns';

/**
 * A reusable calendar component for displaying appointments
 */
const AppointmentCalendar = ({ 
  appointments, 
  selectedDate, 
  onDateChange,
  highlightToday = true,
  showAppointmentCount = true
}) => {
  const theme = useTheme();
  
  // Group appointments by date for easy lookup
  const appointmentsByDate = appointments.reduce((acc, app) => {
    const dateKey = format(new Date(app.date), 'yyyy-MM-dd');
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(app);
    return acc;
  }, {});

  // Custom day rendering with appointment indicators
  const renderDay = (day, _value, DayComponentProps) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const hasAppointment = Object.keys(appointmentsByDate).includes(dayStr);
    const appointmentCount = hasAppointment ? appointmentsByDate[dayStr].length : 0;
    const isToday = isSameDay(day, new Date());
    const isSelected = isSameDay(day, selectedDate);
    
    return (
      <Box 
        key={dayStr} 
        sx={{ 
          position: 'relative',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Tooltip title={hasAppointment ? `${appointmentCount} appointment${appointmentCount > 1 ? 's' : ''}` : ''}>
          <Badge
            overlap="circular"
            variant={showAppointmentCount && appointmentCount > 0 ? "standard" : "dot"}
            badgeContent={showAppointmentCount && appointmentCount > 0 ? appointmentCount : null}
            color="secondary"
            invisible={!hasAppointment}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: '18px',
                minWidth: '18px',
                padding: '0 4px',
                fontWeight: 'bold'
              }
            }}
          >
            <PickersDay 
              {...DayComponentProps} 
              selected={isSelected}
              sx={{
                ...(isToday && highlightToday && {
                  border: `2px solid ${theme.palette.primary.main}`,
                }),
                ...(hasAppointment && {
                  fontWeight: 'bold',
                }),
              }}
            />
          </Badge>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper 
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Appointment Calendar
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateCalendar
          value={selectedDate}
          onChange={onDateChange}
          renderDay={renderDay}
          sx={{ 
            width: '100%',
            '& .MuiPickersCalendarHeader-root': {
              paddingLeft: 2,
              paddingRight: 2,
            },
            '& .MuiDayCalendar-header': {
              justifyContent: 'space-around',
            },
            '& .MuiDayCalendar-weekContainer': {
              justifyContent: 'space-around',
            }
          }}
        />
      </LocalizationProvider>
    </Paper>
  );
};

AppointmentCalendar.propTypes = {
  appointments: PropTypes.array.isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  onDateChange: PropTypes.func.isRequired,
  highlightToday: PropTypes.bool,
  showAppointmentCount: PropTypes.bool
};

export default AppointmentCalendar;
 