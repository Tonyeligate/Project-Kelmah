import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { INACTIVITY_TIMEOUT } from '../../utils/tokenUtils';
import { store } from '../../app/configureStore';

function ActivityTracker() {
  const dispatch = useDispatch();
  let inactivityTimer;

  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      dispatch(logout());
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null;
}

export default ActivityTracker; 