/* eslint-disable react/prop-types */
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Chatbox = ({
  conversation,
  recipientName,
  recipientAvatar,
  recipientStatus,
  onClose,
}) => {
  const displayName = recipientName || 'Conversation';

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      aria-label={`Chat with ${displayName}`}
    >
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Avatar src={recipientAvatar} alt={displayName} />
          <Box sx={{ ml: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', overflowWrap: 'anywhere' }}
            >
              {recipientStatus || 'Status unavailable'}
            </Typography>
          </Box>
          <Box flexGrow={1} />
          <IconButton
            edge="end"
            onClick={onClose}
            aria-label="Close conversation"
            sx={{
              width: 44,
              height: 44,
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <MessageList
          messages={conversation.messages}
          currentUserId={conversation.currentUserId}
          isLoading={conversation.isLoading}
          typingUsers={conversation.typingUsers}
          onLoadMore={conversation.onLoadMore}
          hasMore={conversation.hasMore}
          conversation={conversation}
          onMessageRead={conversation.onMessageRead}
        />
      </Box>
      <Box>
        <MessageInput
          onSendMessage={conversation.sendMessage}
          disabled={conversation.isLoading}
          loading={conversation.sending}
          placeholder={`Type a message to ${displayName}`}
        />
      </Box>
    </Box>
  );
};

export default Chatbox;
