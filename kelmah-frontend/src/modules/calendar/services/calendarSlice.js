import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import eventsService from './eventsService';
import {
  createFeatureLogger,
  devError,
} from '@/modules/common/utils/devLogger';

const calendarLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_CALENDAR',
  level: 'log',
});

const initialState = {
  events: [],
  loading: false,
  error: null,
  selectedDate: new Date().toISOString(),
};

export const fetchEvents = createAsyncThunk(
  'calendar/fetchEvents',
  async (_, { rejectWithValue }) => {
    try {
      const payload = await eventsService.getEvents();
      const events = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.events)
          ? payload.events
          : [];
      calendarLog('Fetched events:', events);
      return events;
    } catch (error) {
      devError('Error in fetchEvents thunk:', error);
      return rejectWithValue({
        message: error?.message || 'Failed to fetch events',
        code: error?.code || error?.response?.data?.error?.code,
      });
    }
  },
);

export const addEvent = createAsyncThunk(
  'calendar/addEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const event = await eventsService.createEvent(eventData);
      return event;
    } catch (error) {
      return rejectWithValue({
        message: error?.message || 'Failed to create event',
        code: error?.code || error?.response?.data?.error?.code,
      });
    }
  },
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
    },
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
        state.error =
          action.payload?.message ||
          action.error?.message ||
          'Failed to fetch events';
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
        state.error =
          action.payload?.message ||
          action.error?.message ||
          'Failed to create event';
      });
  },
});

export const { setSelectedDate, clearError } = calendarSlice.actions;
export const selectCalendarState = (state) => state.calendar;
export default calendarSlice.reducer;
