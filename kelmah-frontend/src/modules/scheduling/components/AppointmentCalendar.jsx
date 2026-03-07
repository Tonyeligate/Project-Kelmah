import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Badge,
  Tooltip,
  useTheme,
  Stack,
  Chip,
  alpha,
} from '@mui/material';
import {
  LocalizationProvider,
  DateCalendar,
  PickersDay,
} from '@mui/x-date-pickers';
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
  showAppointmentCount = true,
}) => {
  const theme = useTheme();

  // Group appointments by date for easy lookup
  const appointmentsByDate = appointments.reduce((acc, app) => {
    try {
      const appointmentDate = new Date(app.date);
      if (isNaN(appointmentDate.getTime())) {
        if (import.meta.env.DEV) console.warn('Invalid appointment date in calendar:', app.date);
        return acc;
      }
      const dateKey = format(appointmentDate, 'yyyy-MM-dd');
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(app);
      return acc;
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        'Error processing appointment date in calendar:',
        app.date,
        error,
      );
      return acc;
    }
  }, {});

  // Custom day rendering with appointment indicators
  const renderDay = (day, _value, DayComponentProps) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const hasAppointment = Object.keys(appointmentsByDate).includes(dayStr);
    const appointmentCount = hasAppointment
      ? appointmentsByDate[dayStr].length
      : 0;
    const isToday = isSameDay(day, new Date());
    const isSelected = isSameDay(day, selectedDate);

    return (
      <Box
        key={dayStr}
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Tooltip
          title={
            hasAppointment
              ? `${appointmentCount} appointment${appointmentCount > 1 ? 's' : ''}`
              : ''
          }
        >
          <Badge
            overlap="circular"
            variant={
              showAppointmentCount && appointmentCount > 0 ? 'standard' : 'dot'
            }
            badgeContent={
              showAppointmentCount && appointmentCount > 0
                ? appointmentCount
                : null
            }
            color="secondary"
            invisible={!hasAppointment}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: '18px',
                minWidth: '18px',
                padding: '0 4px',
                fontWeight: 'bold',
              },
            }}
          >
            <PickersDay
              {...DayComponentProps}
              selected={isSelected}
              sx={{
                borderRadius: 2.5,
                fontWeight: hasAppointment ? 700 : 500,
                ...(isToday &&
                  highlightToday && {
                    border: `2px solid ${theme.palette.primary.main}`,
                  }),
                ...(hasAppointment && {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                }),
              }}
            />
          </Badge>
        </Tooltip>
      </Box>
    );
  };

  const appointmentCount = appointments.length;
  const upcomingLabel = appointmentCount === 1 ? '1 appointment scheduled' : `${appointmentCount} appointments scheduled`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Appointment Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pick a day to review site visits, calls, and interviews.
          </Typography>
        </Box>
        <Chip
          size="small"
          label={upcomingLabel}
          variant="outlined"
          sx={{ fontWeight: 700, maxWidth: 150 }}
        />
      </Stack>
      {appointmentCount === 0 && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            border: '1px dashed',
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No dates are marked yet. Create your first appointment to see it appear on the calendar.
          </Typography>
        </Box>
      )}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateCalendar
          value={selectedDate}
          onChange={onDateChange}
          slots={{
            day: (props) => renderDay(props.day, null, props),
          }}
          sx={{
            width: '100%',
            bgcolor: 'background.default',
            borderRadius: 3,
            '& .MuiPickersCalendarHeader-root': {
              paddingLeft: 2,
              paddingRight: 2,
            },
            '& .MuiPickersCalendarHeader-label': {
              fontWeight: 700,
            },
            '& .MuiDayCalendar-header': {
              justifyContent: 'space-around',
            },
            '& .MuiDayCalendar-weekContainer': {
              justifyContent: 'space-around',
            },
            '& .MuiDayCalendar-weekDayLabel': {
              color: 'text.secondary',
              fontWeight: 700,
            },
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
  showAppointmentCount: PropTypes.bool,
};

export default AppointmentCalendar;
