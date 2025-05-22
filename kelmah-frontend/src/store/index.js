import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobReducer from './slices/jobSlice';
import dashboardReducer from './slices/dashboardSlice';
import notificationsReducer from './slices/notificationsSlice';
import calendarReducer from './slices/calendarSlice';
import workerReducer from './slices/workerSlice';
import hirerReducer from './slices/hirerSlice';
import contractReducer from './slices/contractSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        jobs: jobReducer,
        dashboard: dashboardReducer,
        notifications: notificationsReducer,
        calendar: calendarReducer,
        worker: workerReducer,
        hirer: hirerReducer,
        contracts: contractReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
});

export default store; 