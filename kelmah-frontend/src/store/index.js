import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../modules/auth/services/authSlice';
import jobReducer from '../modules/jobs/services/jobSlice';
import dashboardReducer from '../modules/dashboard/services/dashboardSlice';
import notificationsReducer from '../modules/notifications/services/notificationSlice';
import calendarReducer from '../modules/calendar/services/calendarSlice';
import workerReducer from '../modules/worker/services/workerSlice';
import hirerReducer from '../modules/hirer/services/hirerSlice';
import contractReducer from '../modules/contracts/services/contractSlice';
import appReducer from '../modules/common/services/appSlice';
import reviewsReducer from '../modules/reviews/services/reviewsSlice';
import settingsReducer from './slices/settingsSlice';
import { setupListeners } from '@reduxjs/toolkit/query';

const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobReducer,
    dashboard: dashboardReducer,
    notification: notificationsReducer,
    calendar: calendarReducer,
    worker: workerReducer,
    hirer: hirerReducer,
    contract: contractReducer,
    app: appReducer,
    reviews: reviewsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Setup listeners for RTK-Query
setupListeners(store.dispatch);

export default store;
