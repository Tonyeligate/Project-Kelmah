import React from 'react';
import { Box, Tooltip, Typography, Avatar, AvatarGroup } from '@mui/material';
import { 
  CheckCircleOutline, 
  Check, 
  CheckCircle, 
  AccessTime 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StatusContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginLeft: theme.spacing(0.5),
}));

const TimeStamp = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: 'rgba(255, 255, 255, 0.5)',
  marginRight: theme.spacing(0.5),
}));

const StyledAvatarGroup = styled(AvatarGroup)(({ theme }) => ({
  '& .MuiAvatar-root': {
    width: 16,
    height: 16,
    fontSize: '0.5rem',
    border: `1px solid ${theme.palette.background.paper}`,
  },
}));

/**
 * Component to display message status indicators
 * @param {Object} props
 * @param {string} props.status - Message status: 'sent', 'delivered', 'read'
 * @param {string} props.timestamp - Message timestamp
 * @param {Array} props.readBy - Array of users who have read the message (for group chats)
 * @param {boolean} props.isGroupChat - Whether this is a group chat
 */
const MessageStatus = ({ 
  status = 'sent', 
  timestamp, 
  readBy = [], 
  isGroupChat = false 
}) => {
  // Get status icon based on message status
  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return <CheckCircle fontSize="small" sx={{ color: '#4CAF50', width: 14, height: 14 }} />;
      case 'delivered':
        return <CheckCircle fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.5)', width: 14, height: 14 }} />;
      case 'sent':
        return <Check fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.5)', width: 14, height: 14 }} />;
      case 'pending':
        return <AccessTime fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.3)', width: 14, height: 14 }} />;
      default:
        return null;
    }
  };
  
  // Get tooltip text based on status
  const getTooltipText = () => {
    switch (status) {
      case 'read':
        return isGroupChat 
          ? `Read by ${readBy.length} ${readBy.length === 1 ? 'person' : 'people'}`
          : 'Read';
      case 'delivered':
        return 'Delivered';
      case 'sent':
        return 'Sent';
      case 'pending':
        return 'Sending...';
      default:
        return '';
    }
  };
  
  return (
    <StatusContainer>
      {timestamp && <TimeStamp>{timestamp}</TimeStamp>}
      
      <Tooltip title={getTooltipText()} placement="top">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getStatusIcon()}
          
          {/* For group chats, show avatars of users who read the message */}
          {isGroupChat && status === 'read' && readBy.length > 0 && (
            <StyledAvatarGroup max={3} sx={{ ml: 0.5 }}>
              {readBy.map(user => (
                <Tooltip key={user.id} title={`Read by ${user.name}`}>
                  <Avatar alt={user.name} src={user.avatar} />
                </Tooltip>
              ))}
            </StyledAvatarGroup>
          )}
        </Box>
      </Tooltip>
    </StatusContainer>
  );
};

export default MessageStatus; 