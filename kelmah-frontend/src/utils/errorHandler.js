import { LoggerService } from '../services/LoggerService';
import { useToast } from '../components/common/Toast';

const logger = new LoggerService();

export const handleError = (error, context = '') => {
    const showToast = useToast();

    // Log the error
    logger.logError(error, context);

    // Show user-friendly message
    if (error.response) {
        showToast(error.response.data.message || 'Server error occurred', 'error');
    } else if (error.request) {
        showToast('Network error occurred', 'error');
    } else {
        showToast('An unexpected error occurred', 'error');
    }

    // Track error for analytics
    if (process.env.NODE_ENV === 'production') {
        // Add error tracking service here if needed
    }
}; 