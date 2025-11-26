import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Badge,
  Stack,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Fade,
  Collapse,
  useTheme,
  useMediaQuery,
  alpha,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  Image as ImageIcon,
  Description as FileIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';
import { useMessages } from '../contexts/MessageContext';
// Use consolidated messaging service client that matches backend routes
import messagingService from '../services/messagingService';
import ConversationList from '../components/common/ConversationList';
import Chatbox from '../components/common/Chatbox';
import SEO from '../../common/components/common/SEO';

// Enhanced Messaging Page with modern features
const EnhancedMessagingPage = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
  const { search } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management - Get conversations from context
  const {
    conversations,
    selectedConversation,
    selectConversation,
    clearConversation,
    typingUsers,
  } = useMessages();

  // Local state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState([]);

  // Message composition state
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Menu and dialog state
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null); // Fix: Added missing menu anchor state
  const [newChatDialog, setNewChatDialog] = useState(false); // Fix: Added missing dialog state

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mock data for fallback
  const mockConversations = [];
  const mockMessages = {};

  // Initialize messaging system
  useEffect(() => {
    const initializeMessaging = async () => {
      setIsLoading(true);
      try {
        // Real messaging initialization will be handled by the context
        console.log('Messaging system initialized with real data');

        // Calculate total unread count from context conversations
        const totalUnread = (conversations || []).reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0,
        );
        setUnreadCount(totalUnread);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
        showFeedback('Failed to connect to messaging service', 'error');
        setIsLoading(false);
      }
    };

    if (user) {
      initializeMessaging();
    }

    // Deep-link: /messages?recipient=<userId> or /messages?conversation=<id>
    const runDeepLink = async () => {
      const params = new URLSearchParams(search);
      const conversationId = params.get('conversation');
      const recipientId = params.get('recipient');

      if (conversationId) {
        // Select if present in current list; otherwise just set URL
        const existing = (conversations || []).find(
          (c) => c.id === conversationId,
        );
        if (existing) {
          selectConversation(existing);
          setMessages([]);
        } else {
          navigate(`/messages?conversation=${conversationId}`, {
            replace: true,
          });
        }
        return;
      }

      if (recipientId) {
        // Try to find an existing direct conversation with this recipient
        const existing = (conversations || []).find((c) =>
          (c.participants || []).some(
            (p) => String(p.id) === String(recipientId),
          ),
        );
        if (existing) {
          selectConversation(existing);
          setMessages([]);
          navigate(`/messages?conversation=${existing.id}`, { replace: true });
          return;
        }
        // Create new direct conversation
        try {
          const convo =
            await messagingService.createDirectConversation(recipientId);
          const newId =
            convo?.id ||
            convo?.data?.data?.conversation?.id ||
            convo?.data?.conversation?.id ||
            convo?.conversation?.id ||
            convo?.data?.id;
          if (newId) {
            navigate(`/messages?conversation=${newId}`, { replace: true });
          }
        } catch (e) {
          console.error('Deep-link conversation creation failed:', e);
        }
      }
    };

    runDeepLink();
  }, [user, search, conversations, navigate, selectConversation]);

  // Filter conversations based on search and filter
  useEffect(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p.id !== user?.id,
        );
        return (
          otherParticipant?.name.toLowerCase().includes(query) ||
          conv.lastMessage?.text.toLowerCase().includes(query) ||
          conv.jobRelated?.title.toLowerCase().includes(query)
        );
      });
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter((conv) => conv.unreadCount > 0);
        break;
      case 'archived':
        filtered = filtered.filter((conv) => conv.isArchived);
        break;
      case 'pinned':
        filtered = filtered.filter((conv) => conv.isPinned);
        break;
      case 'job-related':
        filtered = filtered.filter((conv) => conv.jobRelated);
        break;
      default:
        filtered = filtered.filter((conv) => !conv.isArchived);
        break;
    }

    // Sort by pinned first, then by last message time
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp)
      );
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, selectedFilter, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    (conversation) => {
      selectConversation(conversation);
      setMessages([]);

      // Mark as read
      if (conversation.unreadCount > 0) {
        setUnreadCount((prev) => prev - conversation.unreadCount);
      }

      // Update URL
      navigate(`/messages?conversation=${conversation.id}`, { replace: true });
    },
    [navigate, selectConversation],
  );

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;
    if (!selectedConversation) return;

    const newMessage = {
      id: Date.now().toString(),
      text: messageText.trim(),
      sender: user?.id,
      timestamp: new Date(),
      status: 'sending',
      type: selectedFiles.length > 0 ? 'mixed' : 'text',
      attachments: selectedFiles.map((file) => ({
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      })),
    };

    // Add message optimistically
    setMessages((prev) => [...prev, newMessage]);
    setMessageText('');
    setSelectedFiles([]);

    // Update conversation last message would be handled by context
    console.log('Message sent:', newMessage);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update message status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg,
        ),
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg,
        ),
      );
      showFeedback('Failed to send message', 'error');
    }
  }, [messageText, selectedFiles, selectedConversation, user]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Emit typing start event
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Emit typing stop event
    }, 2000);
  }, [isTyping]);

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024); // 10MB limit

    if (validFiles.length !== files.length) {
      showFeedback('Some files were too large (max 10MB)', 'warning');
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  }, []);

  // Utility functions
  const showFeedback = (message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  };

  const getOtherParticipant = (conversation) => {
    return conversation?.participants.find((p) => p.id !== user?.id);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  const getMessageStatus = (message) => {
    switch (message.status) {
      case 'sending':
        return (
          <ScheduleIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
        );
      case 'delivered':
        return (
          <CheckIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
        );
      case 'read':
        return <DoneAllIcon sx={{ fontSize: 16, color: '#4CAF50' }} />;
      case 'failed':
        return <CloseIcon sx={{ fontSize: 16, color: '#F44336' }} />;
      default:
        return null;
    }
  };

  // Enhanced Conversation List Component
  const EnhancedConversationList = () => (
    <Paper
      sx={{
        height: '100%',
        background:
          'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(30,30,30,0.98) 100%)',
        border: '1px solid rgba(255,215,0,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(255,215,0,0.1)',
          background:
            'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#FFD700',
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
            }}
          >
            Messages
          </Typography>
          <Stack direction="row" spacing={1}>
            <Badge badgeContent={unreadCount} color="error">
              <IconButton
                size="small"
                onClick={() => setNewChatDialog(true)}
                sx={{
                  color: '#FFD700',
                  background: alpha('#FFD700', 0.1),
                  '&:hover': {
                    background: alpha('#FFD700', 0.2),
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Badge>
            <IconButton
              size="small"
              onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#FFD700',
                  background: alpha('#FFD700', 0.1),
                },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(255,215,0,0.3)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,215,0,0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#FFD700',
              },
            },
            '& .MuiInputBase-input': {
              color: '#fff',
              '&::placeholder': {
                color: 'rgba(255,255,255,0.5)',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Filter Chips */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2, overflowX: 'auto', pb: 1 }}
        >
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'pinned', label: 'Pinned' },
            { value: 'job-related', label: 'Jobs' },
            { value: 'archived', label: 'Archived' },
          ].map((filter) => (
            <Chip
              key={filter.value}
              label={filter.label}
              clickable
              size="small"
              onClick={() => setSelectedFilter(filter.value)}
              sx={{
                backgroundColor:
                  selectedFilter === filter.value
                    ? alpha('#FFD700', 0.2)
                    : 'rgba(255,255,255,0.05)',
                color:
                  selectedFilter === filter.value
                    ? '#FFD700'
                    : 'rgba(255,255,255,0.7)',
                border: `1px solid ${
                  selectedFilter === filter.value
                    ? 'rgba(255,215,0,0.5)'
                    : 'rgba(255,255,255,0.1)'
                }`,
                '&:hover': {
                  backgroundColor: alpha('#FFD700', 0.1),
                  color: '#FFD700',
                },
                flexShrink: 0,
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <AnimatePresence>
          {filteredConversations.map((conversation, index) => {
            const otherParticipant = getOtherParticipant(conversation);
            const isSelected = selectedConversation?.id === conversation.id;

            return (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Box
                  onClick={() => handleConversationSelect(conversation)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid #FFD700'
                      : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.03)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        otherParticipant?.status === 'online' ? (
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: '#4CAF50',
                              border: '2px solid rgba(20,20,20,0.98)',
                            }}
                          />
                        ) : null
                      }
                    >
                      <Avatar
                        src={otherParticipant?.avatar}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha('#FFD700', 0.2),
                          color: '#FFD700',
                          fontSize: '1.2rem',
                          fontWeight: 600,
                        }}
                      >
                        {otherParticipant?.name?.charAt(0)}
                      </Avatar>
                    </Badge>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {otherParticipant?.name}
                          {conversation.isPinned && (
                            <StarIcon
                              sx={{ fontSize: 16, color: '#FFD700', ml: 0.5 }}
                            />
                          )}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '0.75rem',
                            flexShrink: 0,
                            ml: 1,
                          }}
                        >
                          {formatMessageTime(
                            conversation.lastMessage?.timestamp,
                          )}
                        </Typography>
                      </Stack>

                      {conversation.jobRelated && (
                        <Chip
                          label={conversation.jobRelated.title}
                          size="small"
                          sx={{
                            backgroundColor: alpha('#2196F3', 0.2),
                            color: '#2196F3',
                            fontSize: '0.7rem',
                            height: '20px',
                            mb: 0.5,
                          }}
                        />
                      )}

                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {conversation.lastMessage?.sender === user?.id &&
                            'You: '}
                          {conversation.lastMessage?.text || 'No messages yet'}
                        </Typography>

                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          {conversation.lastMessage?.sender === user?.id &&
                            getMessageStatus(conversation.lastMessage)}
                          {conversation.unreadCount > 0 && (
                            <Badge
                              badgeContent={conversation.unreadCount}
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.7rem',
                                  minWidth: '18px',
                                  height: '18px',
                                },
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredConversations.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography
              variant="h6"
              sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}
            >
              No conversations found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Start a new conversation'}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  // Enhanced Chat Area Component
  const EnhancedChatArea = () => {
    if (!selectedConversation) {
      return (
        <Paper
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(30,30,30,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 3,
          }}
        >
          <Box textAlign="center">
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <SendIcon sx={{ fontSize: 48, color: 'rgba(255,215,0,0.5)' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: '#FFD700',
                fontWeight: 600,
                mb: 1,
              }}
            >
              Select a conversation
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                maxWidth: '300px',
                mx: 'auto',
              }}
            >
              Choose a conversation from the list to start chatting with clients
              and colleagues.
            </Typography>
          </Box>
        </Paper>
      );
    }

    const otherParticipant = getOtherParticipant(selectedConversation);

    return (
      <Paper
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(30,30,30,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Chat Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background:
              'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => clearConversation()}
                sx={{ mr: 2, color: '#FFD700' }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}

            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                otherParticipant?.status === 'online' ? (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: '#4CAF50',
                      border: '2px solid rgba(20,20,20,0.98)',
                    }}
                  />
                ) : null
              }
            >
              <Avatar
                src={otherParticipant?.avatar}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha('#FFD700', 0.2),
                  color: '#FFD700',
                  mr: 2,
                }}
              >
                {otherParticipant?.name?.charAt(0)}
              </Avatar>
            </Badge>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#FFD700',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                {otherParticipant?.name}
              </Typography>
              {selectedConversation.jobRelated && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.75rem',
                  }}
                >
                  Job: {selectedConversation.jobRelated.title}
                </Typography>
              )}
              {typingUsers.size > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#4CAF50',
                    fontSize: '0.75rem',
                    fontStyle: 'italic',
                  }}
                >
                  typing...
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Voice call">
                <IconButton
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      color: '#FFD700',
                      background: alpha('#FFD700', 0.1),
                    },
                  }}
                >
                  <PhoneIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Video call">
                <IconButton
                  size="small"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      color: '#FFD700',
                      background: alpha('#FFD700', 0.1),
                    },
                  }}
                >
                  <VideoCallIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="More options">
                <IconButton
                  size="small"
                  onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      color: '#FFD700',
                      background: alpha('#FFD700', 0.1),
                    },
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            background:
              'linear-gradient(135deg, rgba(10,10,10,0.5) 0%, rgba(20,20,20,0.5) 100%)',
          }}
        >
          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwn = message.sender === user?.id;
              const showAvatar =
                !isOwn &&
                (index === 0 || messages[index - 1].sender !== message.sender);

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      mb: 2,
                      alignItems: 'flex-end',
                    }}
                  >
                    {!isOwn && showAvatar && (
                      <Avatar
                        src={otherParticipant?.avatar}
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 1,
                          bgcolor: alpha('#FFD700', 0.2),
                          color: '#FFD700',
                          fontSize: '0.9rem',
                        }}
                      >
                        {otherParticipant?.name?.charAt(0)}
                      </Avatar>
                    )}
                    {!isOwn && !showAvatar && <Box sx={{ width: 32, mr: 1 }} />}

                    <Box
                      sx={{
                        maxWidth: { xs: '85%', sm: '70%' },
                        minWidth: '120px',
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          background: isOwn
                            ? 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)'
                            : 'linear-gradient(135deg, rgba(60,60,60,0.8) 0%, rgba(80,80,80,0.8) 100%)',
                          color: isOwn ? '#000' : '#fff',
                          border: `1px solid ${isOwn ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'}`,
                          position: 'relative',
                          '&::before': isOwn
                            ? {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                right: -8,
                                width: 0,
                                height: 0,
                                borderLeft: '8px solid #FFD700',
                                borderTop: '8px solid transparent',
                                borderBottom: '8px solid transparent',
                              }
                            : {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: -8,
                                width: 0,
                                height: 0,
                                borderRight: '8px solid rgba(60,60,60,0.8)',
                                borderTop: '8px solid transparent',
                                borderBottom: '8px solid transparent',
                              },
                        }}
                      >
                        {message.text && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.9rem',
                              lineHeight: 1.4,
                              wordBreak: 'break-word',
                            }}
                          >
                            {message.text}
                          </Typography>
                        )}

                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <Box sx={{ mt: message.text ? 1 : 0 }}>
                              {message.attachments.map((attachment, idx) => (
                                <Box key={idx} sx={{ mb: 1 }}>
                                  {attachment.type === 'image' ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                      }}
                                    />
                                  ) : (
                                    <Paper
                                      sx={{
                                        p: 1,
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                      >
                                        <FileIcon />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              display: 'block',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {attachment.name}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            sx={{ opacity: 0.7 }}
                                          >
                                            {(
                                              attachment.size /
                                              1024 /
                                              1024
                                            ).toFixed(2)}{' '}
                                            MB
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </Paper>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}

                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ mt: 0.5 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: 0.7,
                              fontSize: '0.7rem',
                            }}
                          >
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </Typography>
                          {isOwn && (
                            <Box sx={{ ml: 1 }}>
                              {getMessageStatus(message)}
                            </Box>
                          )}
                        </Stack>
                      </Paper>
                    </Box>
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255,215,0,0.2)',
            background:
              'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.95) 100%)',
          }}
        >
          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ overflowX: 'auto', pb: 1 }}
              >
                {selectedFiles.map((file, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      background: 'rgba(255,215,0,0.1)',
                      border: '1px solid rgba(255,215,0,0.3)',
                      minWidth: '120px',
                      position: 'relative',
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        background: '#F44336',
                        color: '#fff',
                        width: 20,
                        height: 20,
                        '&:hover': {
                          background: '#D32F2F',
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </IconButton>

                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        style={{
                          width: '100%',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                      />
                    ) : (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FileIcon sx={{ color: '#FFD700' }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {file.name}
                        </Typography>
                      </Stack>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* Input Row */}
          <Stack direction="row" alignItems="flex-end" spacing={1}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <Tooltip title="Attach files">
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: '#FFD700',
                    background: alpha('#FFD700', 0.1),
                  },
                }}
              >
                <AttachFileIcon />
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: 'rgba(255,215,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,215,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                },
              }}
            />

            <Tooltip title="Send message">
              <IconButton
                onClick={handleSendMessage}
                disabled={!messageText.trim() && selectedFiles.length === 0}
                sx={{
                  background:
                    'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                  color: '#000',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  // Mobile detection for our custom template
  const isActualMobile = useMediaQuery('(max-width: 768px)');

  // Mobile messaging template
  if (isActualMobile) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#161513',
          color: 'white',
          fontFamily: 'Manrope, "Noto Sans", sans-serif',
        }}
      >
        {!selectedConversation ? (
          // Conversations List View
          <>
            {/* Mobile Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#161513',
                p: 2,
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => navigate('/worker/dashboard')}
                  sx={{
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    color: '#FFD700',
                    width: 40,
                    height: 40,
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography
                  sx={{
                    color: '#FFD700',
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                  }}
                >
                  Messages
                </Typography>
              </Box>
              <IconButton
                sx={{
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  color: '#FFD700',
                  width: 40,
                  height: 40,
                }}
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Search Bar */}
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#24231e',
                    borderRadius: '12px',
                    '& fieldset': { borderColor: '#35332c' },
                    '&:hover fieldset': { borderColor: '#FFD700' },
                    '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    fontSize: '0.875rem',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b2afa3',
                    opacity: 1,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{ color: '#b2afa3', mr: 1, fontSize: 20 }}
                    />
                  ),
                }}
              />
            </Box>

            {/* Conversations List */}
            <Box sx={{ px: 2 }}>
              <Typography
                sx={{
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                Recent Conversations
              </Typography>

              {/* Sample Conversations */}
              {[
                {
                  id: 1,
                  name: 'Golden Gate Construction',
                  role: 'Hirer',
                  lastMessage: 'When can you start the carpentry project?',
                  time: '10:30 AM',
                  unread: 2,
                  avatar: 'GG',
                  online: true,
                },
                {
                  id: 2,
                  name: 'AquaFlow Services',
                  role: 'Hirer',
                  lastMessage: 'Great work on the plumbing installation!',
                  time: 'Yesterday',
                  unread: 0,
                  avatar: 'AS',
                  online: false,
                },
                {
                  id: 3,
                  name: 'PowerTech Ghana',
                  role: 'Hirer',
                  lastMessage:
                    'Can you handle electrical wiring for our new office?',
                  time: '2 days ago',
                  unread: 1,
                  avatar: 'PT',
                  online: true,
                },
              ].map((conversation) => (
                <Paper
                  key={conversation.id}
                  sx={{
                    backgroundColor: '#24231e',
                    borderRadius: '12px',
                    p: 2,
                    mb: 1.5,
                    border: '1px solid #35332c',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#2a2926',
                    },
                  }}
                  onClick={() => selectConversation(conversation)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        sx={{
                          backgroundColor: '#FFD700',
                          color: '#161513',
                          width: 48,
                          height: 48,
                          fontWeight: 'bold',
                        }}
                      >
                        {conversation.avatar}
                      </Avatar>
                      {conversation.online && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 12,
                            height: 12,
                            backgroundColor: '#4CAF50',
                            borderRadius: '50%',
                            border: '2px solid #24231e',
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          sx={{
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {conversation.name}
                        </Typography>
                        <Typography
                          sx={{
                            color: '#b2afa3',
                            fontSize: '0.75rem',
                          }}
                        >
                          {conversation.time}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography
                          sx={{
                            color: '#b2afa3',
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {conversation.lastMessage}
                        </Typography>
                        {conversation.unread > 0 && (
                          <Badge
                            badgeContent={conversation.unread}
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: '#FFD700',
                                color: '#161513',
                                fontWeight: 'bold',
                                fontSize: '0.65rem',
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Bottom spacing for nav */}
            <Box sx={{ height: '100px' }} />
          </>
        ) : (
          // Chat View
          <>
            {/* Chat Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#161513',
                p: 2,
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => setSelectedConversation(null)}
                  sx={{
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    color: '#FFD700',
                    width: 40,
                    height: 40,
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Avatar
                  sx={{
                    backgroundColor: '#FFD700',
                    color: '#161513',
                    width: 36,
                    height: 36,
                    fontWeight: 'bold',
                  }}
                >
                  {selectedConversation.avatar}
                </Avatar>
                <Box>
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      lineHeight: 1,
                    }}
                  >
                    {selectedConversation.name}
                  </Typography>
                  <Typography
                    sx={{
                      color: '#b2afa3',
                      fontSize: '0.75rem',
                      lineHeight: 1,
                    }}
                  >
                    {selectedConversation.online
                      ? 'Online'
                      : 'Last seen recently'}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                sx={{
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  color: '#FFD700',
                  width: 40,
                  height: 40,
                }}
              >
                <MoreVertIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                minHeight: 'calc(100vh - 160px)',
              }}
            >
              {/* Sample Messages */}
              {[
                {
                  id: 1,
                  text: "Hello! I saw your profile and I'm interested in hiring you for a carpentry project.",
                  sender: 'them',
                  time: '10:25 AM',
                },
                {
                  id: 2,
                  text: "Hi! Thank you for reaching out. I'd be happy to help. Could you tell me more about the project?",
                  sender: 'me',
                  time: '10:27 AM',
                },
                {
                  id: 3,
                  text: 'We need custom kitchen cabinets installed. The project should take about a week. When can you start?',
                  sender: 'them',
                  time: '10:30 AM',
                },
              ].map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent:
                      message.sender === 'me' ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '75%',
                      p: 1.5,
                      borderRadius: '12px',
                      backgroundColor:
                        message.sender === 'me' ? '#FFD700' : '#35332c',
                      color: message.sender === 'me' ? '#161513' : 'white',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                      {message.text}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        opacity: 0.7,
                        textAlign: 'right',
                      }}
                    >
                      {message.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Message Input */}
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: '#161513',
                p: 2,
                borderTop: '1px solid #35332c',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#24231e',
                      borderRadius: '20px',
                      '& fieldset': { borderColor: '#35332c' },
                      '&:hover fieldset': { borderColor: '#FFD700' },
                      '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      fontSize: '0.875rem',
                      py: 1,
                    },
                  }}
                />
                <IconButton
                  sx={{
                    backgroundColor: '#FFD700',
                    color: '#161513',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: '#FFC000',
                    },
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Bottom spacing for mobile nav */}
            <Box sx={{ height: '80px' }} />
          </>
        )}
      </Box>
    );
  }

  return (
    <>
      <SEO
        title="Messages"
        description="Stay connected with workers and hirers through secure real-time conversations on Kelmah."
        openGraph={{ type: 'website' }}
      />
      <Box
        sx={{
          height: 'calc(100vh - 64px)',
          p: { xs: 1, sm: 2, md: 3 },
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        }}
      >
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {isMobile ? (
            selectedConversation ? (
              <Grid item xs={12}>
                <EnhancedChatArea />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <EnhancedConversationList />
              </Grid>
            )
          ) : (
            <>
              <Grid item md={4} lg={3}>
                <EnhancedConversationList />
              </Grid>
              <Grid item md={8} lg={9}>
                <EnhancedChatArea />
              </Grid>
            </>
          )}
        </Grid>

        {/* More Menu */}
        <Menu
          anchorEl={moreMenuAnchor}
          open={Boolean(moreMenuAnchor)}
          onClose={() => setMoreMenuAnchor(null)}
        >
          <MenuItem onClick={() => setMoreMenuAnchor(null)}>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText>Conversation Info</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setMoreMenuAnchor(null)}>
            <ListItemIcon>
              <ArchiveIcon />
            </ListItemIcon>
            <ListItemText>Archive</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setMoreMenuAnchor(null)}>
            <ListItemIcon>
              <BlockIcon />
            </ListItemIcon>
            <ListItemText>Block User</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => setMoreMenuAnchor(null)}
            sx={{ color: '#F44336' }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ color: '#F44336' }} />
            </ListItemIcon>
            <ListItemText>Delete Conversation</ListItemText>
          </MenuItem>
        </Menu>

        {/* New Chat Dialog */}
        <Dialog
          open={newChatDialog}
          onClose={() => setNewChatDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background:
                'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
              border: '1px solid rgba(255,215,0,0.2)',
            },
          }}
        >
          <DialogTitle sx={{ color: '#FFD700' }}>
            Start New Conversation
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Search users..."
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255,215,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,215,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setNewChatDialog(false)}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setNewChatDialog(false)}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                },
              }}
            >
              Start Chat
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Snackbar */}
        <Snackbar
          open={feedback.open}
          autoHideDuration={4000}
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
            severity={feedback.severity}
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default EnhancedMessagingPage;

