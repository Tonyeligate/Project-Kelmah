import React from 'react';
import PropTypes from 'prop-types';
import { 
  alpha,
  Box, 
  IconButton, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  Typography, 
  useTheme 
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  Description as ContractIcon,
  Announcement as AnnouncementIcon,
  ErrorOutline as SecurityIcon,
  MoreVert as MoreVertIcon,
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const NotificationListItem = ({ notification, onClick, onActionClick, onMarkAsRead }) => {
  const theme = useTheme();
  
  // Icon map for notification types
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageIcon />;
      case 'job_update':
        return <WorkIcon />;
      case 'payment':
        return <PaymentIcon />;
      case 'review':
        return <StarIcon />;
      case 'proposal':
        return <WorkIcon />;
      case 'contract':
        return <ContractIcon />;
      case 'system':
        return <AnnouncementIcon />;
      case 'security':
        return <SecurityIcon />;
      default:
        return <NotificationsIcon />;
    }
  };
  
  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        cursor: 'pointer',
        py: 1.5,
        px: 2,
        bgcolor: notification.isRead 
          ? 'transparent' 
          : alpha(theme.palette.primary.main, 0.08),
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        },
      }}
      onClick={onClick}
      secondaryAction={
        <Box>
          {!notification.isRead && (
            <IconButton 
              edge="end" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (onMarkAsRead) onMarkAsRead(e);
              }}
              sx={{ mr: 1 }}
            >
              <MarkReadIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton 
            edge="end" 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (onActionClick) onActionClick(e);
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      <ListItemAvatar>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.palette.primary.main,
          }}
        >
          {getNotificationIcon(notification.type)}
        </Box>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography 
            variant="subtitle2"
            sx={{ 
              fontWeight: notification.isRead ? 400 : 600,
              display: 'block',
              mb: 0.5
            }}
          >
            {notification.title}
          </Typography>
        }
        secondary={
          <React.Fragment>
            <Typography
              component="span"
              variant="body2"
              color="text.primary"
              sx={{ 
                display: 'block', 
                mb: 0.5,
                fontWeight: notification.isRead ? 400 : 500,
              }}
            >
              {notification.content}
            </Typography>
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
            >
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </Typography>
          </React.Fragment>
        }
      />
    </ListItem>
  );
};

NotificationListItem.propTypes = {
  notification: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    isRead: PropTypes.bool.isRequired,
    createdAt: PropTypes.string.isRequired,
    metadata: PropTypes.object
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onActionClick: PropTypes.func,
  onMarkAsRead: PropTypes.func
};

export default NotificationListItem; 