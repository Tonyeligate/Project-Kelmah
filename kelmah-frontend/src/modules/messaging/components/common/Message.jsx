import React, { useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Paper,
  Fade,
  Chip,
  Badge,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { format } from 'date-fns';
import useLongPress from '../../../../hooks/useLongPress';
import {
  MoreVert as MoreIcon,
  ContentCopy as CopyIcon,
  Reply as ReplyIcon,
  DeleteOutline as DeleteIcon,
  CheckCircleOutline as ReadIcon,
  AccessTime as PendingIcon,
  ErrorOutline as ErrorIcon,
  Check as SentIcon,
  LockOutlined as LockIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Videocam as VideoIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import { useInView } from 'react-intersection-observer';
import MessageAttachments from './MessageAttachments';

// Styled components
const MessageBubble = styled(Paper)(({ theme, isOwn }) => ({
  position: 'relative',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  maxWidth: '80%',
  width: 'auto',
  wordBreak: 'break-word',
  backgroundColor: isOwn
    ? alpha(theme.palette.primary.main, 0.15)
    : alpha(theme.palette.background.paper, 0.7),
  color: theme.palette.text.primary,
  borderBottomLeftRadius: !isOwn ? 4 : undefined,
  borderBottomRightRadius: isOwn ? 4 : undefined,
  boxShadow: theme.shadows[1],
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isOwn ? 'right' : 'left']: -8,
    width: 12,
    height: 12,
    backgroundColor: isOwn
      ? alpha(theme.palette.primary.main, 0.15)
      : alpha(theme.palette.background.paper, 0.7),
    clipPath: isOwn
      ? 'polygon(0 0, 100% 100%, 100% 0)'
      : 'polygon(0 100%, 100% 0, 0 0)',
  },
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  textAlign: 'right',
}));

const MessageStatus = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(0.5),
}));

const Message = ({
  message,
  isOwn,
  showAvatar,
  onReply,
  onDelete,
  onCopy,
  onVisibilityChange,
  onResend,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Long-press handler for mobile: opens context menu at touch coordinates
  const handleLongPress = useCallback((e) => {
    const touch = e.touches?.[0];
    if (touch) {
      setMenuPosition({ top: touch.clientY, left: touch.clientX });
      setMenuAnchorEl(null); // use anchorPosition mode
    }
  }, []);

  const longPressHandlers = useLongPress(handleLongPress, { delay: 500 });

  // Setup intersection observer to track when message is visible
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: !message.isRead && !isOwn, // Only trigger once for unread messages
  });

  // Combine refs
  const setRefs = (element) => {
    messageRef.current = element;
    ref(element);
  };

  // Call visibility change handler when message becomes visible
  useEffect(() => {
    if (inView && !isOwn && !message.isRead) {
      onVisibilityChange && onVisibilityChange(true);
    }
  }, [inView, message.isRead, isOwn, onVisibilityChange]);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuPosition(null);
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message);
    } else {
      navigator.clipboard.writeText(message.content);
    }
    handleMenuClose();
  };

  const handleReply = () => {
    onReply && onReply(message);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete && onDelete(message);
    handleMenuClose();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return format(new Date(timestamp), 'p'); // 'p' = time format like '8:00 PM'
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {message.content}
            </Typography>
            <Box
              component="img"
              src={message.imageUrl}
              alt="Shared image"
              sx={{ maxWidth: '100%', borderRadius: 1 }}
            />
          </Box>
        );

      case 'file':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {message.content}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
              }}
            >
              <FileIcon sx={{ mr: 1 }} />
              <Typography variant="body2" noWrap>
                {message.fileName}
              </Typography>
            </Box>
          </Box>
        );

      case 'system':
        return (
          <Box sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {message.content}
          </Box>
        );

      default:
        return <Typography variant="body2">{message.content}</Typography>;
    }
  };

  return (
    <Box
      ref={setRefs}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(isMobile ? longPressHandlers : {})}
      sx={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        mb: 1,
        position: 'relative',
        userSelect: isMobile ? 'none' : undefined, // prevent text-select during long press
        WebkitUserSelect: isMobile ? 'none' : undefined,
      }}
    >
      {showAvatar && !isOwn && (
        <Avatar
          src={message.sender?.avatar}
          alt={message.sender?.name || 'User'}
          sx={{
            width: 32,
            height: 32,
            mr: 1,
            ml: isOwn ? 1 : 0,
          }}
        />
      )}

      {!showAvatar && !isOwn && (
        <Box sx={{ width: 40 }} /> // Spacer when avatar is not shown
      )}

      <Box sx={{ maxWidth: '80%' }}>
        {/* Sender name (for group chats) */}
        {!isOwn && message.sender && message.conversation?.type === 'group' && (
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              mb: 0.5,
              display: 'block',
              color: 'primary.main',
              fontWeight: 500,
            }}
          >
            {message.sender.name}
          </Typography>
        )}

        {/* Reply reference */}
        {message.replyTo && (
          <Box
            sx={{
              ml: isOwn ? 0 : 1,
              mr: isOwn ? 1 : 0,
              mb: 0.5,
              pl: 1,
              borderLeft: '2px solid',
              borderColor: 'primary.main',
              opacity: 0.7,
            }}
          >
            <Typography
              variant="caption"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <ReplyIcon fontSize="inherit" sx={{ mr: 0.5 }} />
              Replying to {message.replyTo.sender?.name || 'User'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                display: 'block',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {message.replyTo.content}
            </Typography>
          </Box>
        )}

        <MessageBubble isOwn={isOwn} elevation={0}>
          {renderMessageContent()}

          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <MessageAttachments attachments={message.attachments} readonly />
          )}

          {/* Encrypted message indicator */}
          {message.encrypted && (
            <Tooltip title="This message is encrypted end-to-end">
              <Chip
                icon={<LockIcon fontSize="small" />}
                label="Encrypted"
                variant="outlined"
                size="small"
                sx={{
                  mt: 1,
                  height: 20,
                  '& .MuiChip-label': { fontSize: '0.6rem' },
                }}
              />
            </Tooltip>
          )}

          {/* Message menu button (visible on hover) */}
          <Fade in={isHovered}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                position: 'absolute',
                top: 0,
                [isOwn ? 'left' : 'right']: -8,
                width: 24,
                height: 24,
                backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'action.hover' },
                boxShadow: 1,
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Fade>
        </MessageBubble>

        {/* Message timestamp and read status */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOwn ? 'flex-end' : 'flex-start',
            mt: 0.5,
          }}
        >
          <MessageTime>{formatTime(message.createdAt)}</MessageTime>

          {isOwn && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
              {message.status === 'sending' && (
                <Tooltip title="Sending...">
                  <PendingIcon color="action" sx={{ fontSize: '0.9rem' }} />
                </Tooltip>
              )}
              {message.status === 'failed' && (
                <Tooltip title="Failed to send. Click to resend.">
                  <IconButton
                    size="small"
                    onClick={() => onResend && onResend(message)}
                  >
                    <ErrorIcon color="error" sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              )}
              {!message.status && (
                <Tooltip title={message.isRead ? 'Read' : 'Sent'}>
                  {message.isRead ? (
                    <ReadIcon color="primary" sx={{ fontSize: '0.9rem' }} />
                  ) : (
                    <SentIcon color="action" sx={{ fontSize: '0.9rem' }} />
                  )}
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Message menu */}
      <Menu
        anchorReference={menuPosition ? 'anchorPosition' : 'anchorEl'}
        anchorPosition={menuPosition || undefined}
        anchorEl={menuPosition ? undefined : menuAnchorEl}
        open={Boolean(menuAnchorEl) || Boolean(menuPosition)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isOwn ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isOwn ? 'right' : 'left',
        }}
      >
        <MenuItem onClick={handleReply}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        {isOwn && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

Message.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    type: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    isRead: PropTypes.bool,
    sender: PropTypes.object,
    attachments: PropTypes.array,
    encrypted: PropTypes.bool,
    replyTo: PropTypes.object,
    conversation: PropTypes.object,
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  showAvatar: PropTypes.bool,
  onReply: PropTypes.func,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func,
  onVisibilityChange: PropTypes.func,
  onResend: PropTypes.func,
};

Message.defaultProps = {
  showAvatar: true,
};

export default Message;
