import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  Divider, 
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  styled,
  Link,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import { 
  MoreVert as MoreIcon, 
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMessages } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';
import { MESSAGE_TYPES } from '../../config/constants';

// Styled components
const MessageListContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
}));

const MessageBubble = styled(Paper)(({ theme, variant }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '70%',
  width: 'fit-content',
  marginBottom: theme.spacing(1),
  borderRadius: variant === 'sender' 
    ? theme.spacing(2, 0, 2, 2) 
    : theme.spacing(0, 2, 2, 2),
  backgroundColor: variant === 'sender' 
    ? theme.palette.primary.light 
    : theme.palette.background.paper,
  color: variant === 'sender' 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  position: 'relative',
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  textAlign: 'right',
}));

const SystemMessage = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  margin: theme.spacing(1, 0),
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

const AttachmentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const AttachmentItem = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FilePreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

const ImagePreview = styled('img')(({ theme }) => ({
  maxWidth: '100%',
  maxHeight: 200,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
}));

const DateDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(2, 0),
  color: theme.palette.text.secondary,
  '&::before, &::after': {
    content: '""',
    flex: 1,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& > span': {
    padding: theme.spacing(0, 2),
    fontSize: '0.8rem',
  },
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const MessageList = () => {
  const { messages, activeConversation, loading, deleteMessage } = useMessages();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle menu open
  const handleMenuOpen = (event, message) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessage(null);
  };

  // Handle message delete
  const handleDeleteMessage = async () => {
    if (selectedMessage) {
      await deleteMessage(selectedMessage.id);
      handleMenuClose();
    }
  };

  // Handle message copy
  const handleCopyMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.content);
      handleMenuClose();
    }
  };

  // Format message date
  const formatMessageDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'p'); // 'p' = '12:00 AM/PM'
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt);
      const dateStr = format(date, 'MMM d, yyyy');
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      groups[dateStr].push(message);
    });
    
    return groups;
  }, [messages]);

  // Render system message
  const renderSystemMessage = (message) => (
    <SystemMessage key={message.id}>
      {message.content}
    </SystemMessage>
  );

  // Render attachments
  const renderAttachments = (message) => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <AttachmentContainer>
        {message.attachments.map((attachment, index) => (
          <AttachmentItem 
            key={index}
            component="a"
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {attachment.type.startsWith('image/') ? (
              <ImageIcon sx={{ mr: 1 }} />
            ) : (
              <FileIcon sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" noWrap>
              {attachment.name}
            </Typography>
          </AttachmentItem>
        ))}
      </AttachmentContainer>
    );
  };

  // Render message content based on type
  const renderMessageContent = (message) => {
    switch (message.type) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <>
            {message.content && <Typography variant="body1">{message.content}</Typography>}
            <ImagePreview 
              src={message.attachment?.url} 
              alt="Message attachment" 
              loading="lazy" 
            />
          </>
        );
      case MESSAGE_TYPES.ATTACHMENT:
        return (
          <>
            {message.content && <Typography variant="body1">{message.content}</Typography>}
            <FilePreview>
              <FileIcon sx={{ mr: 1 }} />
              <Typography variant="body2" noWrap>
                {message.attachment?.filename || 'Attachment'}
              </Typography>
            </FilePreview>
          </>
        );
      default:
        return <Typography variant="body1">{message.content}</Typography>;
    }
  };

  // Render message
  const renderMessage = (message) => {
    if (message.type === MESSAGE_TYPES.SYSTEM) {
      return renderSystemMessage(message);
    }

    const isSender = message.senderId === user?.id;
    
    return (
      <Box 
        key={message.id} 
        sx={{ 
          alignSelf: isSender ? 'flex-end' : 'flex-start',
          display: 'flex',
          flexDirection: isSender ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          mb: 2,
        }}
      >
        {!isSender && (
          <Avatar
            src={activeConversation?.recipient.avatar}
            alt={activeConversation?.recipient.name}
            sx={{ mr: 1, width: 32, height: 32 }}
          />
        )}
        
        <Box>
          <MessageBubble variant={isSender ? 'sender' : 'receiver'}>
            {renderMessageContent(message)}
            
            {/* Message options button (only for sender's messages) */}
            {isSender && (
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: 'background.paper',
                  '&:hover': { backgroundColor: 'action.hover' },
                  opacity: 0.7,
                }}
                onClick={(e) => handleMenuOpen(e, message)}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            )}
          </MessageBubble>
          <MessageTime>{formatMessageDate(message.createdAt)}</MessageTime>
        </Box>
      </Box>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <EmptyStateContainer>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        No messages yet
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Start the conversation by sending a message
      </Typography>
    </EmptyStateContainer>
  );

  // Render loading state
  const renderLoadingState = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress size={40} />
    </Box>
  );

  // Main render
  return (
    <MessageListContainer>
      {loading ? (
        renderLoadingState()
      ) : activeConversation ? (
        <MessagesContainer>
          {Object.entries(groupedMessages).map(([date, dailyMessages]) => (
            <React.Fragment key={date}>
              <DateDivider>
                <span>{date}</span>
              </DateDivider>
              {dailyMessages.map(renderMessage)}
            </React.Fragment>
          ))}
          {messages.length === 0 && renderEmptyState()}
          <div ref={messagesEndRef} />
        </MessagesContainer>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            p: 3,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="body1" color="textSecondary">
            Select a conversation to start messaging
          </Typography>
        </Box>
      )}
      
      {/* Message options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy message</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete message</ListItemText>
        </MenuItem>
      </Menu>
    </MessageListContainer>
  );
};

export default MessageList;