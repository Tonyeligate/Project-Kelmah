import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../auth/contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  Fade,
  Zoom,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreIcon,
  Phone as PhoneIcon,
  VideoCall as VideoIcon,
  Info as InfoIcon,
  Circle as OnlineIcon,
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Image as ImageIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import websocketService from '../../../services/websocketService';
import useRealtimeMessaging from '../hooks/useRealtimeMessaging';
import fileUploadService from '../../common/services/fileUploadService';
import {
  selectActiveConversation,
  selectConversationById,
  selectTypingIndicators,
  selectOnlineUsers,
  selectUserStatuses,
  addMessage,
  setTypingIndicator,
  markConversationAsRead,
  updateMessageStatus,
} from '../../../store/slices/notificationSlice';
import { formatRelativeTime, formatDate } from '../../../utils/formatters';

const RealTimeChat = ({
  conversationId,
  onClose = null,
  height = 600,
  showHeader = true,
  showUserInfo = true,
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const dispatch = useDispatch();

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Redux selectors
  const conversation = useSelector(selectConversationById(conversationId));
  const typingUsers = useSelector(selectTypingIndicators)[conversationId] || {};
  const onlineUsers = useSelector(selectOnlineUsers);
  const userStatuses = useSelector(selectUserStatuses);

  // Local state
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(!conversation);
  // Hook to emit realtime events via socket service (if exposed) or replace with your socket instance
  const socket = websocketService.socket;
  const isConnected = !!socket && socket.connected;
  const { startTyping, stopTyping, shareFile, reportUploadProgress } =
    useRealtimeMessaging(socket, isConnected, conversationId);

  // Message states
  const [messages, setMessages] = useState(conversation?.messages || []);
  const [participants, setParticipants] = useState(
    conversation?.participants || [],
  );

  // Load conversation data
  useEffect(() => {
    if (!conversation && conversationId) {
      loadConversation();
    } else if (conversation) {
      setMessages(conversation.messages || []);
      setParticipants(conversation.participants || []);
      setLoading(false);
    }
  }, [conversationId, conversation]);

  // Setup WebSocket listeners
  useEffect(() => {
    const handleNewMessage = (data) => {
      if (data.conversationId === conversationId) {
        dispatch(
          addMessage({
            conversationId: data.conversationId,
            message: {
              id: data.messageId,
              content: data.content,
              senderId: data.senderId,
              senderName: data.senderName,
              timestamp: data.timestamp,
              status: 'delivered',
              attachments: data.attachments || [],
            },
          }),
        );
      }
    };

    const handleTypingIndicator = (data) => {
      if (data.conversationId === conversationId) {
        dispatch(
          setTypingIndicator({
            conversationId: data.conversationId,
            userId: data.userId,
            userName: data.userName,
            isTyping: data.isTyping,
          }),
        );
      }
    };

    const handleMessageStatus = (data) => {
      if (data.conversationId === conversationId) {
        dispatch(
          updateMessageStatus({
            conversationId: data.conversationId,
            messageId: data.messageId,
            status: data.status,
          }),
        );
      }
    };

    websocketService.addEventListener('message:new', handleNewMessage);
    websocketService.addEventListener(
      'typing:indicator',
      handleTypingIndicator,
    );
    websocketService.addEventListener('message:status', handleMessageStatus);

    return () => {
      websocketService.removeEventListener('message:new', handleNewMessage);
      websocketService.removeEventListener(
        'typing:indicator',
        handleTypingIndicator,
      );
      websocketService.removeEventListener(
        'message:status',
        handleMessageStatus,
      );
    };
  }, [conversationId, dispatch]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark as read when conversation becomes active
  useEffect(() => {
    if (conversationId && conversation) {
      dispatch(markConversationAsRead(conversationId));
    }
  }, [conversationId, conversation, dispatch]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      // Load conversation from API
      // This would typically fetch from messagingService
      // For now, we'll simulate with WebSocket subscription
      websocketService.socket?.emit('join-conversation', { conversationId });
    } catch (error) {
      enqueueSnackbar('Failed to load conversation', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle message send
  const handleSendMessage = () => {
    if (!message.trim()) return;

    const messageData = {
      id: Date.now(),
      content: message.trim(),
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    // Add to local state immediately for UI responsiveness
    dispatch(
      addMessage({
        conversationId,
        message: messageData,
      }),
    );

    // Send via WebSocket
    websocketService.sendMessage(conversationId, message.trim());

    // Clear input and stop typing indicator
    setMessage('');
    handleStopTyping();
    stopTyping();
  };

  // Handle typing indicator
  const handleTyping = (value) => {
    setMessage(value);

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      websocketService.sendTypingIndicator(conversationId, true);
      startTyping();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      websocketService.sendTypingIndicator(conversationId, false);
      stopTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get message status icon
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return <CircularProgress size={12} />;
      case 'sent':
        return <CheckIcon fontSize="small" color="action" />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" color="action" />;
      case 'read':
        return <DoneAllIcon fontSize="small" color="primary" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  // Get user online status
  const getUserStatus = (userId) => {
    if (onlineUsers.includes(userId)) {
      return 'online';
    }

    const status = userStatuses[userId];
    return status?.status || 'offline';
  };

  // Format typing indicator text
  const getTypingText = () => {
    const typingUserIds = Object.keys(typingUsers);
    if (typingUserIds.length === 0) return '';

    const names = typingUserIds.map((id) => typingUsers[id].userName);

    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing...`;
    }
  };

  // Handle file attachment
  const handleFileAttachment = (type) => {
    setAttachmentMenu(null);

    if (type === 'file') {
      fileInputRef.current?.click();
    } else if (type === 'image') {
      fileInputRef.current?.click();
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      try {
        for (const file of files) {
          const result = await fileUploadService.uploadFile(
            file,
            `attachments/${conversationId}`,
            'messaging',
          );
          reportUploadProgress('single', 100, file.name);
          const fileData = {
            fileId: `${Date.now()}`,
            fileName: file.name,
            url: result.url,
            type: file.type,
            size: file.size,
          };
          shareFile(fileData);
        }
      } catch (err) {
        console.error('Attachment upload failed', err);
      }
    }
  };

  // Render message item
  const renderMessage = (msg, index) => {
    const isOwnMessage = msg.senderId === user.id;
    const showAvatar =
      index === 0 || messages[index - 1]?.senderId !== msg.senderId;
    const participant = participants.find((p) => p.id === msg.senderId);

    return (
      <ListItem
        key={msg.id}
        sx={{
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          px: 2,
          py: 1,
        }}
      >
        {showAvatar && !isOwnMessage && (
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <OnlineIcon
                  sx={{
                    color:
                      getUserStatus(msg.senderId) === 'online'
                        ? 'success.main'
                        : 'grey.400',
                    fontSize: 12,
                  }}
                />
              }
            >
              <Avatar src={participant?.avatar} sx={{ width: 32, height: 32 }}>
                {participant?.name?.charAt(0) || msg.senderName?.charAt(0)}
              </Avatar>
            </Badge>
          </ListItemAvatar>
        )}

        <Box
          sx={{
            maxWidth: '70%',
            ml: isOwnMessage ? 0 : showAvatar ? 1 : 6,
            mr: isOwnMessage ? (showAvatar ? 1 : 6) : 0,
          }}
        >
          {showAvatar && !isOwnMessage && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: 'block' }}
            >
              {participant?.name || msg.senderName}
            </Typography>
          )}

          <Paper
            sx={{
              p: 1.5,
              backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
              color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              borderTopLeftRadius: isOwnMessage ? 2 : showAvatar ? 2 : 0.5,
              borderTopRightRadius: isOwnMessage ? (showAvatar ? 2 : 0.5) : 2,
            }}
            onClick={(e) => {
              setSelectedMessage(msg);
              setMessageMenu(e.currentTarget);
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </Typography>

            {msg.attachments && msg.attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {msg.attachments.map((attachment, idx) => (
                  <Chip
                    key={idx}
                    label={attachment.name}
                    size="small"
                    icon={
                      attachment.type.startsWith('image/') ? (
                        <ImageIcon />
                      ) : (
                        <FileIcon />
                      )
                    }
                    onClick={() => window.open(attachment.url, '_blank')}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}
          </Paper>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              mt: 0.5,
              gap: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(msg.timestamp)}
            </Typography>
            {isOwnMessage && getMessageStatusIcon(msg.status)}
          </Box>
        </Box>
      </ListItem>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    const typingText = getTypingText();
    if (!typingText) return null;

    return (
      <Fade in={true}>
        <ListItem sx={{ px: 2, py: 1 }}>
          <ListItemAvatar>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  '& .dot': {
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'text.secondary',
                    animation: 'pulse 1.5s infinite',
                    '&:nth-of-type(2)': { animationDelay: '0.5s' },
                    '&:nth-of-type(3)': { animationDelay: '1s' },
                  },
                  '@keyframes pulse': {
                    '0%, 60%, 100%': { opacity: 0.3 },
                    '30%': { opacity: 1 },
                  },
                }}
              >
                <Box className="dot" />
                <Box className="dot" />
                <Box className="dot" />
              </Box>
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography
                variant="caption"
                color="text.secondary"
                fontStyle="italic"
              >
                {typingText}
              </Typography>
            }
          />
        </ListItem>
      </Fade>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!conversation && !loading) {
    return (
      <Alert severity="error">Conversation not found or failed to load.</Alert>
    );
  }

  return (
    <Paper sx={{ height, display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      {showHeader && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={2}>
              {participants
                .filter((p) => p.id !== user.id)
                .map((participant) => (
                  <Box
                    key={participant.id}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <OnlineIcon
                          sx={{
                            color:
                              getUserStatus(participant.id) === 'online'
                                ? 'success.main'
                                : 'grey.400',
                            fontSize: 14,
                          }}
                        />
                      }
                    >
                      <Avatar
                        src={participant.avatar}
                        sx={{ width: 40, height: 40 }}
                      >
                        {participant.name?.charAt(0)}
                      </Avatar>
                    </Badge>

                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {participant.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getUserStatus(participant.id) === 'online'
                          ? 'Online'
                          : `Last seen ${formatRelativeTime(userStatuses[participant.id]?.lastSeen)}`}
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>

            <Box display="flex" gap={1}>
              <Tooltip title="Voice Call">
                <IconButton size="small">
                  <PhoneIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Video Call">
                <IconButton size="small">
                  <VideoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Info">
                <IconButton size="small">
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              {onClose && (
                <Tooltip title="Close">
                  <IconButton size="small" onClick={onClose}>
                    <MoreIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List sx={{ py: 0 }}>
          {messages.map((msg, index) => renderMessage(msg, index))}
          {renderTypingIndicator()}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="flex-end" gap={1}>
          <IconButton
            size="small"
            onClick={(e) => setAttachmentMenu(e.currentTarget)}
          >
            <AttachIcon />
          </IconButton>

          <TextField
            ref={messageInputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />

          <IconButton
            size="small"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <EmojiIcon />
          </IconButton>

          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Attachment Menu */}
      <Menu
        anchorEl={attachmentMenu}
        open={Boolean(attachmentMenu)}
        onClose={() => setAttachmentMenu(null)}
      >
        <MenuItem onClick={() => handleFileAttachment('image')}>
          <ImageIcon sx={{ mr: 1 }} />
          Photo
        </MenuItem>
        <MenuItem onClick={() => handleFileAttachment('file')}>
          <FileIcon sx={{ mr: 1 }} />
          Document
        </MenuItem>
      </Menu>

      {/* Message Context Menu */}
      <Menu
        anchorEl={messageMenu}
        open={Boolean(messageMenu)}
        onClose={() => setMessageMenu(null)}
      >
        <MenuItem onClick={() => setMessageMenu(null)}>Reply</MenuItem>
        <MenuItem onClick={() => setMessageMenu(null)}>Forward</MenuItem>
        <MenuItem onClick={() => setMessageMenu(null)}>Copy</MenuItem>
        {selectedMessage?.senderId === user.id && (
          <MenuItem onClick={() => setMessageMenu(null)}>Delete</MenuItem>
        )}
      </Menu>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.txt"
      />
    </Paper>
  );
};

export default RealTimeChat;
