import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Box,
  Divider,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Send, Person, Search } from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import axiosInstance from '../../../../common/services/axios';
import { wsService } from '../../../services/websocket';

function MessageSystem() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    // Set up polling for new messages
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const unsubscribe = wsService.subscribe((data) => {
      if (
        data.type === 'new_message' &&
        data.conversationId === selectedConversation?.id
      ) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get('/api/messages/conversations');
      setConversations(response.data);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/messages/${conversationId}`,
      );
      setMessages(response.data);
      scrollToBottom();
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await axiosInstance.post(`/api/messages/${selectedConversation.id}`, {
        content: newMessage,
      });
      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
      {/* Conversations List */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ height: '100%', overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              InputProps={{
                startAdornment: <Search color="action" />,
              }}
            />
          </Box>
          <Divider />
          <List>
            {conversations.map((conversation) => (
              <ListItem
                key={conversation.id}
                button
                selected={selectedConversation?.id === conversation.id}
                onClick={() => setSelectedConversation(conversation)}
              >
                <ListItemAvatar>
                  <Badge
                    color="error"
                    badgeContent={conversation.unread_count}
                    invisible={!conversation.unread_count}
                  >
                    <Avatar>
                      <Person />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    conversation.worker_id === user.userId
                      ? conversation.hirer_name
                      : conversation.worker_name
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {conversation.job_title}
                      </Typography>
                      {' — ' + conversation.last_message}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Messages Area */}
      <Grid item xs={12} md={8}>
        <Paper
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {selectedConversation ? (
            <>
              {/* Messages Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">
                  {selectedConversation.worker_id === user.userId
                    ? selectedConversation.hirer_name
                    : selectedConversation.worker_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedConversation.job_title}
                </Typography>
              </Box>

              {/* Messages List */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {loading ? (
                  <CircularProgress sx={{ alignSelf: 'center' }} />
                ) : (
                  messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent:
                          message.sender_id === user.userId
                            ? 'flex-end'
                            : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '70%',
                          p: 2,
                          bgcolor:
                            message.sender_id === user.userId
                              ? 'primary.main'
                              : 'grey.100',
                          color:
                            message.sender_id === user.userId
                              ? 'white'
                              : 'text.primary',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body1">
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{
                            mt: 1,
                            opacity: 0.8,
                          }}
                        >
                          {new Date(message.created_at).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  display: 'flex',
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  sx={{ mr: 1 }}
                />
                <IconButton
                  color="primary"
                  type="submit"
                  disabled={!newMessage.trim()}
                >
                  <Send />
                </IconButton>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">
                Select a conversation to start messaging
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

export default MessageSystem;
