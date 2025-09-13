// Compatibility shim: Some build or legacy code may import './NotificationProvider'.
// We re-export the actual implementation from 'NotificationContext.jsx'.
export { NotificationProvider, useNotifications, default } from './NotificationContext.jsx';
