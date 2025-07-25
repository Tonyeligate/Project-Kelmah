import React from 'react';
import { Box, Typography, Avatar, Paper, Tooltip } from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../../../auth/hooks/useAuth';

const Message = ({ message }) => {
  const { user } = useAuth();
  const isOwnMessage = message.senderId === user.id;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      {!isOwnMessage && (
        <Avatar
          src={message.sender.avatar}
          alt={message.sender.name}
          sx={{ mr: 1 }}
        />
      )}
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        }}
      >
        {!isOwnMessage && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            {message.sender.name}
          </Typography>
        )}
        <Tooltip
          title={format(new Date(message.createdAt), 'PPpp')}
          placement={isOwnMessage ? 'left' : 'right'}
        >
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              backgroundColor: isOwnMessage
                ? 'primary.main'
                : 'background.paper',
              color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
          </Paper>
        </Tooltip>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {format(new Date(message.createdAt), 'p')}
        </Typography>
      </Box>
      {isOwnMessage && (
        <Avatar src={user.avatar} alt={user.name} sx={{ ml: 1 }} />
      )}
    </Box>
  );
};

export default Message;
