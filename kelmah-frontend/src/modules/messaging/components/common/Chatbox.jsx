import React from 'react';
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
  return (
    <Box display="flex" flexDirection="column" height="100%">
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Avatar src={recipientAvatar} alt={recipientName} />
          <Typography variant="body1" sx={{ ml: 1 }}>
            {recipientName}
          </Typography>
          <Typography variant="caption" sx={{ ml: 1 }}>
            {recipientStatus}
          </Typography>
          <Box flexGrow={1} />
          <IconButton edge="end" onClick={onClose}>
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
        />
      </Box>
    </Box>
  );
};

export default Chatbox;
