// IconButton focus-visible styling is enforced globally via MuiIconButton theme overrides.












const AdvancedCalendar = ({ schedule = [], onScheduleChange }) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [mode, setMode] = useState('available'); // 'available' | 'unavailable'
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // Initialize from schedule prop
  React.useEffect(() => {
    if (schedule.length > 0) {
      const dates = new Set(
        schedule
          .filter(s => s.available !== false)
          .map(s => { const d = new Date(s.date || s); return isValid(d) ? format(d, 'yyyy-MM-dd') : null; })
          .filter(Boolean)
      );
      setSelectedDates(dates);
    }
  }, [schedule]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const toggleDate = useCallback((date) => {
    if (isBefore(date, startOfDay(new Date()))) return; // Can't modify past dates
    const key = format(date, 'yyyy-MM-dd');
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (mode === 'available') {
        next.has(key) ? next.delete(key) : next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, [mode]);

  const handleSave = () => {
    const scheduleData = Array.from(selectedDates).map(dateStr => ({
      date: dateStr,
      available: true,
    }));
    if (onScheduleChange) {
      onScheduleChange(scheduleData);
    }
    setSnackbar({ open: true, message: 'Availability updated!' });
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const availableCount = selectedDates.size;
  const monthDayCount = calendarDays.filter(d => isSameMonth(d, currentMonth)).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Availability Calendar
        </Typography>
        <Button variant="contained" size="small" onClick={handleSave}>
          Save Availability
        </Button>
      </Box>

      {/* Month navigation */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton sx={{ ...iconButtonA11ySx, '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' } }} onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} aria-label="Previous month">
            <PrevIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton sx={{ ...iconButtonA11ySx, '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' } }} onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} aria-label="Next month">
            <NextIcon />
          </IconButton>
        </Box>

        {/* Selection mode */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            size="small"
          >
            <ToggleButton value="available" sx={{ textTransform: 'none' }}>
              <AvailableIcon sx={{ mr: 0.5, fontSize: 18, color: 'success.main' }} /> Mark Available
            </ToggleButton>
            <ToggleButton value="unavailable" sx={{ textTransform: 'none' }}>
              <UnavailableIcon sx={{ mr: 0.5, fontSize: 18, color: 'error.main' }} /> Mark Unavailable
            </ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={1}>
            <Chip
              icon={<AvailableIcon sx={{ fontSize: 16 }} />}
              label={`${availableCount} days available`}
              size="small"
              color="success"
              variant="outlined"
            />
          </Stack>
        </Box>

        {/* Day headers */}
        <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
          {weekDays.map(day => (
            <Grid item xs={12 / 7} key={day}>
              <Typography
                variant="caption"
                sx={{ display: 'block', textAlign: 'center', fontWeight: 'bold', color: 'text.secondary' }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar grid */}
        <Grid container spacing={0.5}>
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isAvailable = selectedDates.has(format(day, 'yyyy-MM-dd'));
            const isPast = isBefore(day, startOfDay(new Date()));
            const isCurrentDay = isToday(day);

            return (
              <Grid item xs={12 / 7} key={format(day, 'yyyy-MM-dd')}>
                <Box
                  onClick={() => !isPast && isCurrentMonth && toggleDate(day)}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    borderRadius: 1,
                    cursor: isPast || !isCurrentMonth ? 'default' : 'pointer',
                    opacity: !isCurrentMonth ? 0.3 : isPast ? 0.5 : 1,
                    bgcolor: isAvailable && isCurrentMonth
                      ? alpha(theme.palette.success.main, 0.15)
                      : 'transparent',
                    border: isCurrentDay
                      ? `2px solid ${theme.palette.primary.main}`
                      : isAvailable && isCurrentMonth
                        ? `1px solid ${alpha(theme.palette.success.main, 0.4)}`
                        : '1px solid transparent',
                    '&:hover': (!isPast && isCurrentMonth) ? {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    } : {},
                    transition: 'all 0.15s ease',
                    minHeight: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrentDay ? 'bold' : 'normal',
                      color: isAvailable && isCurrentMonth ? 'success.main' : 'text.primary',
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  {isAvailable && isCurrentMonth && (
                    <Box sx={{ position: 'absolute', bottom: 2, width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AdvancedCalendar;


