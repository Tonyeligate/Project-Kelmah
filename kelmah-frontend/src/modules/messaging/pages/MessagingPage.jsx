import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../auth/contexts/AuthContext';
import ConversationList from '../components/common/ConversationList';
import Chatbox from '../components/common/Chatbox';

// Enhanced Messaging Page with modern features
const EnhancedMessagingPage = () => {
  const { user } = useAuth();
  const { search } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [archiveMode, setArchiveMode] = useState(false);
  
  // Message input state
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // UI state
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'info' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  // Mock data for development
  const mockConversations = [
    {
      id: '1',
      type: 'direct',
      participants: [
        { id: user?.id, name: user?.firstName || 'You', avatar: user?.profileImage },
        { id: '2', name: 'John Carpenter', avatar: '/api/placeholder/40/40', status: 'online' }
      ],
      lastMessage: {
        id: '1',
        text: 'Hey, I saw your carpentry work. Are you available for a kitchen renovation project?',
        sender: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        status: 'delivered'
      },
      unreadCount: 2,
      isArchived: false,
      isPinned: true,
      jobRelated: { id: 'job-1', title: 'Kitchen Renovation' }
    },
    {
      id: '2',
      type: 'direct',
      participants: [
        { id: user?.id, name: user?.firstName || 'You', avatar: user?.profileImage },
        { id: '3', name: 'Sarah Wilson', avatar: '/api/placeholder/40/40', status: 'offline' }
      ],
      lastMessage: {
        id: '2',
        text: 'Thank you for the excellent plumbing work! I\'ve left a 5-star review.',
        sender: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: 'read'
      },
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      jobRelated: { id: 'job-2', title: 'Bathroom Plumbing Repair' }
    },
    {
      id: '3',
      type: 'direct',
      participants: [
        { id: user?.id, name: user?.firstName || 'You', avatar: user?.profileImage },
        { id: '4', name: 'Mike Johnson', avatar: '/api/placeholder/40/40', status: 'online' }
      ],
      lastMessage: {
        id: '3',
        text: 'When can you start the electrical work?',
        sender: user?.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: 'read'
      },
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      jobRelated: { id: 'job-3', title: 'House Rewiring Project' }
    }
  ];

  const mockMessages = {
    '1': [
      {
        id: '1',
        text: 'Hi there! I saw your profile and I\'m impressed with your carpentry skills.',
        sender: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        status: 'read',
        type: 'text'
      },
      {
        id: '2',
        text: 'Thank you! I\'d be happy to help with your project. What kind of work are you looking for?',
        sender: user?.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        status: 'read',
        type: 'text'
      },
      {
        id: '3',
        text: 'I need a complete kitchen renovation. Custom cabinets, countertops, the works.',
        sender: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        status: 'read',
        type: 'text'
      },
      {
        id: '4',
        text: 'Here are some photos of my previous kitchen projects for reference.',
        sender: user?.id,
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        status: 'read',
        type: 'text',
        attachments: [
          { type: 'image', url: '/api/placeholder/300/200', name: 'kitchen1.jpg' },
          { type: 'image', url: '/api/placeholder/300/200', name: 'kitchen2.jpg' }
        ]
      },
      {
        id: '5',
        text: 'Wow, these look amazing! Exactly what I had in mind. What\'s your availability?',
        sender: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        status: 'delivered',
        type: 'text'
      }
    ]
  };

  // Initialize messaging system
  useEffect(() => {
    const initializeMessaging = async () => {
      setIsLoading(true);
      try {
        // Mock WebSocket connection
        setIsConnected(true);
        setConversations(mockConversations);
        
        // Calculate total unread count
        const totalUnread = mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
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

    // Auto-select conversation from URL
    const params = new URLSearchParams(search);
    const conversationId = params.get('conversation');
    if (conversationId) {
      const conversation = mockConversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        setMessages(mockMessages[conversationId] || []);
      }
    }
  }, [user, search]);

  // Filter conversations based on search and filter
  useEffect(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        const otherParticipant = conv.participants.find(p => p.id !== user?.id);
        return otherParticipant?.name.toLowerCase().includes(query) ||
               conv.lastMessage?.text.toLowerCase().includes(query) ||
               conv.jobRelated?.title.toLowerCase().includes(query);
      });
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'archived':
        filtered = filtered.filter(conv => conv.isArchived);
        break;
      case 'pinned':
        filtered = filtered.filter(conv => conv.isPinned);
        break;
      case 'job-related':
        filtered = filtered.filter(conv => conv.jobRelated);
        break;
      default:
        filtered = filtered.filter(conv => !conv.isArchived);
        break;
    }

    // Sort by pinned first, then by last message time
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessage?.timestamp) - new Date(a.lastMessage?.timestamp);
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, selectedFilter, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversation) => {
    setSelectedConversation(conversation);
    setMessages(mockMessages[conversation.id] || []);
    
    // Mark as read
    if (conversation.unreadCount > 0) {
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
      setUnreadCount(prev => prev - conversation.unreadCount);
    }

    // Update URL
    navigate(`/messages?conversation=${conversation.id}`, { replace: true });
  }, [navigate]);

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
      attachments: selectedFiles.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }))
    };

    // Add message optimistically
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setSelectedFiles([]);

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id
        ? {
            ...conv,
            lastMessage: {
              ...newMessage,
              text: newMessage.text || `Sent ${newMessage.attachments?.length} file(s)`
            }
          }
        : conv
    ));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'delivered' }
          : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
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
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      showFeedback('Some files were too large (max 10MB)', 'warning');
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  // Utility functions
  const showFeedback = (message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  };

  const getOtherParticipant = (conversation) => {
    return conversation?.participants.find(p => p.id !== user?.id);
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
        return <ScheduleIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />;
      case 'delivered':
        return <CheckIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />;
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
        background: 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(30,30,30,0.98) 100%)',
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
          background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
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
        <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto', pb: 1 }}>
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
                backgroundColor: selectedFilter === filter.value
                  ? alpha('#FFD700', 0.2)
                  : 'rgba(255,255,255,0.05)',
                color: selectedFilter === filter.value ? '#FFD700' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${selectedFilter === filter.value
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
                    borderLeft: isSelected ? '3px solid #FFD700' : '3px solid transparent',
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
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
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
                            <StarIcon sx={{ fontSize: 16, color: '#FFD700', ml: 0.5 }} />
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
                          {formatMessageTime(conversation.lastMessage?.timestamp)}
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

                      <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                          {conversation.lastMessage?.sender === user?.id && 'You: '}
                          {conversation.lastMessage?.text || 'No messages yet'}
                        </Typography>
                        
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {conversation.lastMessage?.sender === user?.id && 
                            getMessageStatus(conversation.lastMessage)
                          }
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
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
              No conversations found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              {searchQuery ? 'Try adjusting your search' : 'Start a new conversation'}
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
            background: 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(30,30,30,0.98) 100%)',
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
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
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
              Choose a conversation from the list to start chatting with clients and colleagues.
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
          background: 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(30,30,30,0.98) 100%)',
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
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setSelectedConversation(null)}
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
            background: 'linear-gradient(135deg, rgba(10,10,10,0.5) 0%, rgba(20,20,20,0.5) 100%)',
          }}
        >
          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwn = message.sender === user?.id;
              const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender !== message.sender);
              
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
                    {!isOwn && !showAvatar && (
                      <Box sx={{ width: 32, mr: 1 }} />
                    )}

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
                          '&::before': isOwn ? {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            right: -8,
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid #FFD700',
                            borderTop: '8px solid transparent',
                            borderBottom: '8px solid transparent',
                          } : {
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

                        {message.attachments && message.attachments.length > 0 && (
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
                                    <Stack direction="row" alignItems="center" spacing={1}>
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
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
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
            background: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.95) 100%)',
          }}
        >
          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
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
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
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
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                  color: '#000',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
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

  return (
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
        <MenuItem onClick={() => setMoreMenuAnchor(null)} sx={{ color: '#F44336' }}>
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
            background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>Start New Conversation</DialogTitle>
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
          <Button onClick={() => setNewChatDialog(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={() => setNewChatDialog(false)}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              '&:hover': {
                background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
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
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedMessagingPage;
