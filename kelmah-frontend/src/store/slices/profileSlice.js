import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setProfile(state, action) {
      state.profile = action.payload;
      state.error = null;
    },
  },
});

export const { setLoading, setError, setProfile } = profileSlice.actions;

export const selectProfile = (state) => state.profile?.profile || null;
export const selectProfileLoading = (state) => state.profile?.loading || false;
export const selectProfileError = (state) => state.profile?.error || null;

export default profileSlice.reducer;
