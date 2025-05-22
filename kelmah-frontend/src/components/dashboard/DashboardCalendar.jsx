import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Box, CircularProgress } from '@mui/material';
import { selectCalendarState, fetchEvents } from '../../store/slices/calendarSlice';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// Format events for the calendar
const formatEvents = (events) => {
    if (!Array.isArray(events)) return [];
    
    return events.map(event => ({
        id: event.id,
        title: event.title,
        start: moment(event.start_time || event.created_at).toDate(),
        end: moment(event.end_time || event.created_at).add(1, 'hour').toDate(),
        description: event.description
    }));
};

function DashboardCalendar() {
    const dispatch = useDispatch();
    const { events, loading, error } = useSelector(selectCalendarState);

    useEffect(() => {
        dispatch(fetchEvents());
    }, [dispatch]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <div>Error loading calendar: {error}</div>
            </Box>
        );
    }

    // Format events before passing to Calendar
    const formattedEvents = formatEvents(events);

    return (
        <Box sx={{ height: 400 }}>
            <Calendar
                localizer={localizer}
                events={formattedEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                defaultView="month"
            />
        </Box>
    );
}

export default DashboardCalendar; 