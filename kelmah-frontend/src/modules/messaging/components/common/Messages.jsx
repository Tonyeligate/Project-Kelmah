import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Divider,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Send, AttachFile } from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { API_ENDPOINTS } from '../../../../config/services';

function Messages() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    fetchConversations();
    initializeWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    try {
      // Use centralized WebSocket URL from config
      const wsBaseUrl = API_ENDPOINTS.WEBSOCKET.MESSAGING || '/socket.io';
      ws.current = new WebSocket(`${wsBaseUrl}/ws?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connection established');
        setError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.conversation_id === selectedConversation?.id) {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
          }
          updateConversationPreview(message);
        } catch (err) {
          console.error('Error processing message:', err);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Messages may not be real-time.');
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (ws.current?.readyState === WebSocket.CLOSED) {
            initializeWebSocket();
          }
        }, 5000);
      };
    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      setError('Failed to establish real-time connection');
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/conversation/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
      scrollToBottom();
    } catch (err) {
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = {
        conversation_id: selectedConversation.id,
        content: newMessage,
        sender_id: user.userId,
      };

      // Send through WebSocket
      ws.current.send(JSON.stringify(message));

      // Clear input
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const updateConversationPreview = (message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === message.conversation_id) {
          return {
            ...conv,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: conv.unread_count + 1,
          };
        }
        return conv;
      }),
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box
      sx={{
        height: 'calc(100vh - 100px)',
      }}
    >
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Conversations
            </Typography>
            <Divider />
            <List>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : conversations.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No conversations yet"
                    secondary="Start a new conversation from a job posting or profile"
                  />
                </ListItem>
              ) : (
                conversations.map((conversation) => (
                  <ListItem
                    key={conversation.id}
                    button
                    selected={selectedConversation?.id === conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      fetchMessages(conversation.id);
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={conversation.unread_count}
                        color="primary"
                      >
                        <Avatar src={conversation.other_user.profile_image}>
                          {conversation.other_user.username[0]}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={conversation.other_user.username}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            noWrap
                          >
                            {conversation.last_message}
                          </Typography>
                          <br />
                          {formatDistanceToNow(
                            new Date(conversation.last_message_time),
                            { addSuffix: true },
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Messages */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {selectedConversation ? (
              <>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">
                    {selectedConversation.other_user.username}
                  </Typography>
                </Box>

                {/* Messages List */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
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
                            sx={{
                              display: 'block',
                              mt: 1,
                              opacity: 0.7,
                            }}
                          >
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Grid container spacing={1}>
                    <Grid item xs>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                      />
                    </Grid>
                    <Grid item>
                      <IconButton
                        color="primary"
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Messages;
