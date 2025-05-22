import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import eventsApi from '../../api/eventsApi';

const initialState = {
    events: [],
    loading: false,
    error: null,
    selectedDate: new Date()
};

export const fetchEvents = createAsyncThunk(
    'calendar/fetchEvents',
    async (_, { rejectWithValue }) => {
        try {
            const events = await eventsApi.getEvents();
            console.log('Fetched events:', events);
            return events;
        } catch (error) {
            console.error('Error in fetchEvents thunk:', error);
            return rejectWithValue(error.message || 'Failed to fetch events');
        }
    }
);

export const addEvent = createAsyncThunk(
    'calendar/addEvent',
    async (eventData, { rejectWithValue }) => {
        try {
            const event = await eventsApi.createEvent(eventData);
            return event;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setSelectedDate: (state, action) => {
            state.selectedDate = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch events
            .addCase(fetchEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.events = action.payload;
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Add event
            .addCase(addEvent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addEvent.fulfilled, (state, action) => {
                state.loading = false;
                state.events.push(action.payload);
            })
            .addCase(addEvent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { setSelectedDate, clearError } = calendarSlice.actions;
export const selectCalendarState = (state) => state.calendar;
export default calendarSlice.reducer; 