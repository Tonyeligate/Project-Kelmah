import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  settings: null,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setSettings(state, action) {
      state.settings = action.payload;
      state.error = null;
    }
  }
});

export const { setLoading, setError, setSettings } = settingsSlice.actions;

export const selectSettings = (state) => state.settings.settings;
export const selectSettingsLoading = (state) => state.settings.loading;
export const selectSettingsError = (state) => state.settings.error;

export default settingsSlice.reducer;
