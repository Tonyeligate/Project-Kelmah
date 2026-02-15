/**
 * BidNotificationListener — Global listener for real-time bid notifications
 *
 * Renders no visible UI itself. Listens for bid Socket.IO events via
 * useBidNotifications hook and fires notistack toasts with navigation links.
 *
 * Mount once inside Layout (or any permanent shell) so it survives page
 * transitions. Uses notistack via useSnackbar.
 */

import { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@mui/material';
import useBidNotifications from '../../jobs/hooks/useBidNotifications';

const BidNotificationListener = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);

  // Only enable for authenticated users
  const enabled = Boolean(isAuthenticated && user);

  const { latestNotification } = useBidNotifications({ enabled });

  // Track last-seen notification to avoid duplicate toasts
  const lastSeenId = useRef(null);

  useEffect(() => {
    if (!latestNotification) return;
    if (latestNotification.id === lastSeenId.current) return;
    lastSeenId.current = latestNotification.id;

    const severityMap = {
      success: 'success',
      warning: 'warning',
      info: 'info',
      default: 'default',
    };

    enqueueSnackbar(latestNotification.message, {
      variant: severityMap[latestNotification.severity] || 'info',
      autoHideDuration: 6000,
      anchorOrigin: { vertical: 'top', horizontal: 'right' },
      action: latestNotification.link
        ? (key) => (
            <Button
              size="small"
              sx={{ color: '#fff', fontWeight: 600, textTransform: 'none' }}
              onClick={() => {
                navigate(latestNotification.link);
              }}
            >
              View
            </Button>
          )
        : undefined,
    });
  }, [latestNotification, enqueueSnackbar, navigate]);

  // Renders nothing — purely side-effect component
  return null;
};

export default BidNotificationListener;
