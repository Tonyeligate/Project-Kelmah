import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Skeleton,
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
  ChatBubbleOutline as ChatBubbleOutlineIcon,
} from '@mui/icons-material';
// ✅ MOBILE-AUDIT P3: framer-motion import removed — AnimatePresence/motion.div wrappers already replaced
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { safeFormatDate } from '@/modules/common/utils/formatters';
import { BOTTOM_NAV_HEIGHT } from '../../../constants/layout';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';
import { useMessages } from '../contexts/MessageContext';
import { messagingService } from '../services/messagingService';
// ConversationList + Chatbox rendered inline — imports removed (dead code)
import SEO from '../../common/components/common/SEO';
import EmptyState from '../../../components/common/EmptyState';

// Enhanced Messaging Page with modern features
const EnhancedMessagingPage = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
  const { search, state: locationState } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Defense-in-depth: redirect if user is null (ProtectedRoute should catch this, but just in case)
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  // State management - Get conversations and messages from context
  const {
    conversations,
    selectedConversation,
    selectConversation,
    clearConversation,
    createConversation,
    openTemporaryConversation,
    typingUsers,
    getTypingUsers,
    isConnected,
    realtimeIssue,
    messages,
    sendMessage: contextSendMessage,
    unreadCount,
    startTyping,
    stopTyping,
    loadingConversations,
    loadingMessages,
    isUserOnline,
  } = useMessages();

  // Local state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
  const blobUrlsRef = useRef([]); // Track blob URLs for cleanup
  const conversationsRef = useRef(conversations); // Stable ref for deep-link effect
  const selectedConversationSnapshotRef = useRef(selectedConversation);
  const clearConversationRef = useRef(clearConversation);
  conversationsRef.current = conversations;
  selectedConversationSnapshotRef.current = selectedConversation;
  clearConversationRef.current = clearConversation;

  useEffect(() => () => {
    if (selectedConversationSnapshotRef.current?.isTemporary) {
      clearConversationRef.current?.();
    }
  }, []);

  const currentUserId = useMemo(
    () => user?.id || user?._id || user?.userId || user?.sub || null,
    [user],
  );

  const resolveParticipantId = useCallback((participant) => {
    if (!participant) return null;
    if (typeof participant === 'string') return participant;
    return participant.id || participant._id || participant.userId || null;
  }, []);

  // Memoize file preview URLs to avoid creating new blob URLs on every render
  const filePreviewUrls = useMemo(
    () => selectedFiles.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    ),
    [selectedFiles],
  );

  // Revoke preview blob URLs when selectedFiles change or on unmount
  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
    };
  }, [filePreviewUrls]);

  // Revoke message attachment blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Deep-link and initial load (runs once per URL change, not on every conversations update)
  // State for deep-link creation progress
  const [deepLinkLoading, setDeepLinkLoading] = useState(false);
  const [deepLinkError, setDeepLinkError] = useState(null);
  const deepLinkAttemptedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    // Wait until conversations have loaded before checking for existing ones
    // This prevents a race condition where the list is empty and we create duplicate conversations
    if (loadingConversations) return;

    // Deep-link: /messages?recipient=<userId> or /messages?conversation=<id>
    const urlParams = new URLSearchParams(search);
    const conversationId = urlParams.get('conversation');
    const recipientId = urlParams.get('recipient') || urlParams.get('userId');

    // Skip if no deep-link params
    if (!conversationId && !recipientId) return;

    const runDeepLink = async () => {
      // Use ref for conversations to avoid retriggering
      const currentConversations = conversationsRef.current || [];

      if (conversationId) {
        const existing = currentConversations.find(
          (c) => String(c.id || c._id) === String(conversationId),
        );
        if (existing) {
          selectConversation(existing);
          return;
        }

        try {
          const fetchedConversation = await messagingService.getConversationById(conversationId);
          if (fetchedConversation?.id) {
            selectConversation(fetchedConversation);
            return;
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn(`Failed to deep-load conversation ${conversationId}:`, error.message);
          }
          setDeepLinkError('Conversation could not be loaded. It may no longer exist.');
          showFeedback('Conversation could not be loaded.', 'error');
        }

        // If not found anywhere, keep the URL but avoid silently showing stale state
        return;
      }

      if (recipientId) {
        // Check if we already have a conversation with this recipient
        const existing = currentConversations.find((c) =>
          (c.participants || []).some(
            (p) => String(resolveParticipantId(p)) === String(recipientId),     
          ),
        );
        if (existing) {
          selectConversation(existing);
          if (!existing.isTemporary) {
            const extId = existing.id || existing._id;
            navigate(`/messages?conversation=${extId}`, { replace: true });
          }
          return;
        }

        const routeParticipant = locationState?.recipientProfile || {};
        const temporaryConversation = openTemporaryConversation({
          id: recipientId,
          name:
            routeParticipant?.name ||
            routeParticipant?.fullName ||
            routeParticipant?.displayName ||
            'New conversation',
          profilePicture:
            routeParticipant?.profilePicture ||
            routeParticipant?.avatar ||
            routeParticipant?.photo ||
            null,
        });

        setDeepLinkLoading(false);
        setDeepLinkError(null);
        if (temporaryConversation?.id) {
          selectConversation(temporaryConversation);
        }
        return;
      }
    };

    runDeepLink();
  }, [user, search, navigate, selectConversation, createConversation, loadingConversations, resolveParticipantId, showFeedback, openTemporaryConversation, locationState]);

  // Manual retry handler for deep-link failures
  const handleRetryDeepLink = useCallback(() => {
    deepLinkAttemptedRef.current = false;
    setDeepLinkError(null);
    setDeepLinkLoading(false);
    // Soft retry: briefly navigate away then back so the useEffect re-fires
    const urlParams = new URLSearchParams(search);
    const recipientId = urlParams.get('recipient') || urlParams.get('userId');
    if (recipientId) {
      navigate('/messages', { replace: true });
      // Allow React to flush the removal of params, then re-navigate
      requestAnimationFrame(() => {
        navigate(`/messages?recipient=${recipientId}`, { replace: true });
      });
    }
  }, [search, navigate]);

  useEffect(() => {
    try {
      const rawDraft = sessionStorage.getItem('kelmah_message_draft');
      if (!rawDraft) {
        return;
      }

      const parsedDraft = JSON.parse(rawDraft);
      const draftText = String(parsedDraft?.text || '').trim();
      if (draftText) {
        setMessageText(draftText);
        showFeedback('Message draft loaded. Select a chat to send it.', 'info');
      }

      sessionStorage.removeItem('kelmah_message_draft');
    } catch (draftError) {
      if (import.meta.env.DEV) console.warn('Failed to load message draft from session storage', draftError);
    }
  }, []);

  // Filter conversations based on search and filter
  useEffect(() => {
    let filtered = Array.isArray(conversations) ? [...conversations] : [];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        const participants = Array.isArray(conv?.participants)
          ? conv.participants
          : [];
        const otherParticipant = participants.find(
          (participant) => {
            const participantId = resolveParticipantId(participant);
            return participantId && String(participantId) !== String(currentUserId);
          },
        );

        const participantName = String(otherParticipant?.name || '').toLowerCase();
        const lastMessageText = String(conv?.lastMessage?.text || '').toLowerCase();
        const jobTitle = String(conv?.jobRelated?.title || '').toLowerCase();
        return (
          participantName.includes(query) ||
          lastMessageText.includes(query) ||
          jobTitle.includes(query)
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
  }, [conversations, searchQuery, selectedFilter, currentUserId, resolveParticipantId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Utility: show snackbar feedback (declared before hooks that reference it)
  const showFeedback = useCallback((message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  }, []);

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    (conversation) => {
      selectConversation(conversation);

      // Update URL
      const convoId = conversation.id ?? conversation._id;
      navigate(`/messages?conversation=${convoId}`, { replace: true });
    },
    [navigate, selectConversation],
  );

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;
    if (!selectedConversation) return;

    const text = messageText.trim();
    const hasAttachments = selectedFiles.length > 0;
    const hasOnlyImages =
      hasAttachments && selectedFiles.every((file) => file.type.startsWith('image/'));
    const type = hasAttachments ? (hasOnlyImages ? 'image' : 'file') : 'text';
    const attachments = selectedFiles.map((file) => ({
      type: file.type.startsWith('image/') ? 'image' : 'file',
      mimeType: file.type,
      file,
      name: file.name,
      size: file.size,
    }));

    // Clear input immediately for responsiveness
    setMessageText('');
    setSelectedFiles([]);

    try {
      // Use context's sendMessage (handles optimistic updates, WebSocket, REST fallback)
      if (contextSendMessage) {
        await contextSendMessage(text, type, attachments);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to send message:', error);
      showFeedback('Failed to send message', 'error');
    }
  }, [messageText, selectedFiles, selectedConversation, contextSendMessage, showFeedback]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      if (startTyping) startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (stopTyping) stopTyping();
    }, 2000);
  }, [isTyping, startTyping, stopTyping]);

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

  const getOtherParticipant = (conversation) => {
    const participant = conversation?.participants?.find((candidate) => {
      const participantId = resolveParticipantId(candidate);
      return participantId && String(participantId) !== String(currentUserId);
    });

    const participantId = resolveParticipantId(participant);
    if (!participant) return null;

    return {
      ...participant,
      id: participantId,
      avatar: participant.avatar || participant.profilePicture || null,
      status:
        participantId && isUserOnline(String(participantId))
          ? 'online'
          : 'offline',
    };
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM dd');
      }
    } catch {
      return '';
    }
  };

  const getMessagePreview = (message) => {
    if (!message) return 'No messages yet';
    const text = message.text || message.content || '';
    const mType = message.messageType || '';
    
    if (mType === 'image') return '🖼️ Photo';
    if (mType === 'video') return '🎥 Video';
    if (mType === 'audio') return '🎵 Audio';
    if (mType === 'file' || mType === 'document') return '📎 File';
    
    // Check if it's a URL to an image or video
    const isImageUrl = text.match(/\.(jpeg|jpg|gif|png|webp|bmp)($|\?)/i) || text.includes('/image/upload/') || text.includes('cloudinary.com/');
    const isVideoUrl = text.match(/\.(mp4|webm|avi|mov)($|\?)/i) || text.includes('/video/upload/');
    
    if (isImageUrl) return '🖼️ Photo';
    if (isVideoUrl) return '🎥 Video';
    
    if (message.hasAttachment || (Array.isArray(message.attachments) && message.attachments.length > 0)) {
      if (!text.trim() || text.startsWith('http')) return '📎 Attachment';
    }
    
    if (text.startsWith('http')) return '📎 Attachment';
    
    return text || 'No messages yet';
  };

  const getMessageStatus = (message) => {
    switch (message.status) {
      case 'sending':
        return (
          <ScheduleIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        );
      case 'delivered':
        return (
          <CheckIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        );
      case 'read':
        return <DoneAllIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'failed':
        return <CloseIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  // Enhanced Conversation List Component
  const EnhancedConversationList = () => (
    <Paper
      sx={{
        height: '100%',
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
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
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: alpha(theme.palette.primary.main, 0.06),
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
              color: 'primary.main',
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
                aria-label="Start new chat"
                onClick={() => setNewChatDialog(true)}
                sx={{
                  color: 'primary.main',
                  background: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Badge>
            <IconButton
              size="small"
              aria-label="More options"
              onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  background: alpha(theme.palette.primary.main, 0.1),
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
              backgroundColor: alpha(theme.palette.background.default, 0.5),
              borderRadius: 2,
              '& fieldset': {
                borderColor: theme.palette.divider,
              },
              '&:hover fieldset': {
                borderColor: alpha(theme.palette.primary.main, 0.5),
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary',
              '&::placeholder': {
                color: theme.palette.text.disabled,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
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
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.action.hover, 0.5),
                color:
                  selectedFilter === filter.value
                    ? 'primary.main'
                    : 'text.secondary',
                border: `1px solid ${
                  selectedFilter === filter.value
                    ? alpha(theme.palette.primary.main, 0.5)
                    : theme.palette.divider
                }`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                },
                flexShrink: 0,
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Conversations List — ✅ MOBILE-AUDIT P3: removed motion.div/AnimatePresence */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
          {filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation);
            const isSelected = selectedConversation?.id === conversation.id;

            return (
                <Box
                  key={conversation.id}
                  component="button"
                  type="button"
                  onClick={() => handleConversationSelect(conversation)}
                  aria-label={`Open conversation with ${otherParticipant?.name || 'participant'}`}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    background: isSelected
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'transparent',
                    borderLeft: isSelected
                      ? `3px solid ${theme.palette.primary.main}`
                      : '3px solid transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: alpha(theme.palette.action.hover, 0.5),
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${alpha(theme.palette.primary.main, 0.8)}`,
                      outlineOffset: -2,
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
                              backgroundColor: 'success.main',
                              border: `2px solid ${theme.palette.background.paper}`,
                            }}
                          />
                        ) : null
                      }
                    >
                      <Avatar
                        src={otherParticipant?.avatar}
                        alt={otherParticipant?.name || 'Participant avatar'}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: 'primary.main',
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
                            color: 'text.primary',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                            display: { xs: '-webkit-box', sm: 'block' },
                            WebkitLineClamp: { xs: 2, sm: 'unset' },
                            WebkitBoxOrient: { xs: 'vertical', sm: 'unset' },
                            flex: 1,
                          }}
                        >
                          {otherParticipant?.name}
                          {conversation.isPinned && (
                            <StarIcon
                              sx={{ fontSize: 16, color: 'primary.main', ml: 0.5 }}
                            />
                          )}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.disabled',
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
                            backgroundColor: alpha(theme.palette.info.main, 0.15),
                            color: 'info.main',
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
                            color: 'text.secondary',
                            fontSize: '0.85rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                            display: { xs: '-webkit-box', sm: 'block' },
                            WebkitLineClamp: { xs: 2, sm: 'unset' },
                            WebkitBoxOrient: { xs: 'vertical', sm: 'unset' },
                            flex: 1,
                          }}
                        >
                          {String(conversation.lastMessage?.sender) === String(currentUserId) &&
                            'You: '}
                            {getMessagePreview(conversation.lastMessage)}
                        </Typography>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          {String(conversation.lastMessage?.sender) === String(currentUserId) &&
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
            );
          })}

        {filteredConversations.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography
              variant="h6"
              sx={{ color: 'text.disabled', mb: 1 }}
            >
              {searchQuery ? 'No results' : 'No messages yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {searchQuery
                ? 'Try a different name or keyword'
                : 'Your conversations will appear here'}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  // Enhanced Chat Area Component
  const EnhancedChatArea = () => {
    if (!selectedConversation) {
      // Show deep-link loading/error state when creating conversation
      if (deepLinkLoading) {
        return (
          <Paper
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            }}
          >
            <Box textAlign="center">
              <CircularProgress size={48} sx={{ color: 'primary.main', mb: 3 }} />
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                Starting conversation...
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled', maxWidth: 300, mx: 'auto' }}>
                Connecting to the messaging service. This may take a moment if the service is warming up.
              </Typography>
            </Box>
          </Paper>
        );
      }

      if (deepLinkError) {
        return (
          <Paper
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
            }}
          >
            <Box textAlign="center" sx={{ maxWidth: 360, px: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: alpha(theme.palette.error.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <RefreshIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Connection failed
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {deepLinkError}
              </Typography>
              <Button
                variant="contained"
                onClick={handleRetryDeepLink}
                startIcon={<RefreshIcon />}
                sx={{ minHeight: 44, mb: 1 }}
              >
                Retry
              </Button>
              <br />
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/messages')}
                sx={{ mt: 1 }}
              >
                Go to Messages
              </Button>
            </Box>
          </Paper>
        );
      }

      return (
        <Paper
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Box textAlign="center">
            <Box
              sx={{
                width: { xs: 96, sm: 120 },
                height: { xs: 96, sm: 120 },
                borderRadius: '50%',
                background: alpha(theme.palette.primary.main, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <SendIcon sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.5) }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                mb: 1,
              }}
            >
              Select a conversation
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.disabled',
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
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Chat Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: alpha(theme.palette.primary.main, 0.06),
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="Go back"
                onClick={() => clearConversation()}
                sx={{ mr: 2, color: 'primary.main' }}
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
                      backgroundColor: 'success.main',
                      border: `2px solid ${theme.palette.background.paper}`,
                    }}
                  />
                ) : null
              }
            >
              <Avatar
                src={otherParticipant?.avatar}
                alt={otherParticipant?.name || 'Participant avatar'}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  color: 'primary.main',
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
                  color: 'primary.main',
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
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}
                >
                  Job: {selectedConversation.jobRelated.title}
                </Typography>
              )}
              {getTypingUsers().length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'success.main',
                    fontSize: '0.75rem',
                    fontStyle: 'italic',
                  }}
                >
                  typing...
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Voice call — Coming Soon">
                <span>
                <IconButton
                  aria-label="Voice call — Coming Soon"
                  disabled
                  sx={{
                    color: 'text.disabled',
                    minWidth: 44,
                    minHeight: 44,
                    opacity: 0.5,
                  }}
                >
                  <PhoneIcon />
                </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Video call — Coming Soon">
                <span>
                <IconButton
                  aria-label="Video call — Coming Soon"
                  disabled
                  sx={{
                    color: 'text.disabled',
                    minWidth: 44,
                    minHeight: 44,
                    opacity: 0.5,
                  }}
                >
                  <VideoCallIcon />
                </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="More options">
                <IconButton
                  aria-label="More options"
                  onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                  sx={{
                    color: 'text.secondary',
                    minWidth: 44,
                    minHeight: 44,
                    '&:hover': {
                      color: 'primary.main',
                      background: alpha(theme.palette.primary.main, 0.1),
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
            bgcolor: alpha(theme.palette.background.default, 0.5),
          }}
        >
          {loadingMessages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
          ) : (messages || []).length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                No messages yet. Say hello!
              </Typography>
            </Box>
          ) : null}
          {/* ✅ MOBILE-AUDIT P3: removed AnimatePresence + motion.div from messages */}
            {(messages || []).map((message, index) => {
              const senderId = message.sender || message.senderId;
              const isOwn =
                senderId && currentUserId
                  ? String(senderId) === String(currentUserId)
                  : false;
              const showAvatar =
                !isOwn &&
                (index === 0 || messages[index - 1].sender !== message.sender);
              const messageText =
                typeof message.text === 'string'
                  ? message.text
                  : typeof message.content === 'string'
                    ? message.content
                    : '';
              const textLooksLikeImageUrl =
                /^https?:\/\/\S+$/i.test(messageText) &&
                /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(messageText);

              return (
                  <Box
                    key={message.id}
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
                        alt={otherParticipant?.name || 'Participant avatar'}
                        sx={{
                          width: 32,
                          height: 32,
                          mr: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: 'primary.main',
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
                        minWidth: { xs: '84px', sm: '120px' },
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          // ✅ MOBILE-AUDIT P4: solid bg instead of gradient, removed speech-bubble tails
                          bgcolor: isOwn
                            ? 'primary.main'
                            : alpha(theme.palette.text.primary, 0.08),
                          color: isOwn ? theme.palette.primary.contrastText : 'text.primary',
                          border: `1px solid ${isOwn ? alpha(theme.palette.primary.main, 0.3) : theme.palette.divider}`,
                        }}
                      >
                        {messageText && !textLooksLikeImageUrl && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.9rem',
                              lineHeight: 1.4,
                              wordBreak: 'break-word',
                            }}
                          >
                            {messageText}
                          </Typography>
                        )}

                        {textLooksLikeImageUrl && (
                          <Box sx={{ mb: 1 }}>
                            <img
                              src={messageText}
                              alt="Shared media"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '220px',
                                borderRadius: '8px',
                                display: 'block',
                              }}
                            />
                          </Box>
                        )}

                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <Box sx={{ mt: messageText ? 1 : 0 }}>
                              {message.attachments.map((attachment, idx) => (
                                <Box
                                  key={
                                    attachment.url ||
                                    attachment.fileUrl ||
                                    attachment.name ||
                                    idx
                                  }
                                  sx={{ mb: 1 }}
                                >
                                  {(() => {
                                    const attachmentUrl =
                                      attachment.url ||
                                      attachment.fileUrl ||
                                      attachment.getUrl ||
                                      attachment.path ||
                                      null;
                                    const attachmentMime =
                                      attachment.mimeType ||
                                      attachment.fileType ||
                                      attachment.type ||
                                      '';
                                    const isImageAttachment =
                                      attachment.type === 'image' ||
                                      String(attachmentMime).startsWith('image/');
                                    const displayName =
                                      attachment.name ||
                                      attachment.fileName ||
                                      attachment.filename ||
                                      'Attachment';
                                    const attachmentSize = Number(
                                      attachment.size || attachment.fileSize || 0,
                                    );

                                    if (isImageAttachment && attachmentUrl) {
                                      return (
                                    <img
                                      src={attachmentUrl}
                                      alt={displayName}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '200px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                      }}
                                    />
                                      );
                                    }

                                    return (
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
                                            {displayName}
                                          </Typography>
                                          {attachmentSize > 0 && (
                                            <Typography
                                              variant="caption"
                                              sx={{ opacity: 0.7 }}
                                            >
                                              {(attachmentSize / 1024 / 1024).toFixed(2)} MB
                                            </Typography>
                                          )}
                                        </Box>
                                      </Stack>
                                      {attachmentUrl && (
                                        <Box sx={{ mt: 0.75 }}>
                                          <a
                                            href={attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              color: 'inherit',
                                              fontSize: '0.75rem',
                                            }}
                                          >
                                            Open file
                                          </a>
                                        </Box>
                                      )}
                                    </Paper>
                                    );
                                  })()}
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
                            {safeFormatDate(message.timestamp, 'HH:mm')}
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
              );
            })}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
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
                    key={file.name + '-' + file.size}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      background: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      minWidth: { xs: '92px', sm: '120px' },
                      position: 'relative',
                    }}
                  >
                    <IconButton
                      size="small"
                      aria-label="Remove attachment"
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        background: 'error.main',
                        color: 'error.contrastText',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          background: 'error.dark',
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>

                    {file.type.startsWith('image/') ? (
                      <img
                        src={filePreviewUrls[index] || ''}
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
                        <FileIcon sx={{ color: 'primary.main' }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.primary',
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
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    background: alpha(theme.palette.primary.main, 0.1),
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  '&::placeholder': {
                    color: theme.palette.text.disabled,
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
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || '#FFC000'} 100%)`,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    background:
                      `linear-gradient(135deg, ${theme.palette.primary.dark || '#FFC000'} 0%, ${theme.palette.primary.dark || '#FFB300'} 100%)`,
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.text.primary, 0.1),
                    color: 'text.disabled',
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
      <Box sx={{ display: 'flex', height: 'calc(100dvh - 64px)' }}>
        <Box sx={{ width: { xs: '100%', md: 360 }, borderRight: 1, borderColor: 'divider', p: 2 }}>
          <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
          {[1,2,3,4,5].map(i => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="80%" height={16} />
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', p: 3 }}>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={48} />
        </Box>
      </Box>
    );
  }

  // Mobile messaging template — uses isMobile (theme.breakpoints.down('md'))
  if (isMobile) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
          color: 'text.primary',
          fontFamily: 'Manrope, "Noto Sans", sans-serif',
        }}
      >
        {selectedConversation == null ? (
          // Conversations List View
          <>
            {/* Mobile Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.default',
                p: 2,
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography
                  sx={{
                    color: 'primary.main',
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                  }}
                >
                  Messages
                </Typography>
              </Box>
              <IconButton
                aria-label="Search conversations"
                onClick={() => {
                  const searchInput = document.querySelector('#mobile-search-input input');
                  if (searchInput) searchInput.focus();
                }}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Search Bar */}
            <Box sx={{ p: 2 }}>
              {(realtimeIssue || !isConnected) && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2 }}
                >
                  {realtimeIssue || 'Reconnecting... You can still read and send messages.'}
                </Alert>
              )}
              <TextField
                id="mobile-search-input"
                fullWidth
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: '12px',
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                    // ✅ MOBILE-AUDIT: fontSize removed — theme MuiInputBase sets 16px globally
                    // to prevent iOS keyboard auto-zoom (< 16px triggers zoom)
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: theme.palette.text.secondary,
                    opacity: 1,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }}
                    />
                  ),
                }}
              />
            </Box>

            {/* Conversations List — Real Data */}
            <Box sx={{ px: 2 }}>
              <Typography
                sx={{
                  color: 'text.primary',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                Recent Conversations
              </Typography>

              {filteredConversations.length === 0 && !deepLinkLoading && !deepLinkError && (
                <EmptyState
                  variant={searchQuery ? 'search' : 'messages'}
                  title={searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                  subtitle={searchQuery ? 'Try different keywords' : 'Start chatting by finding a worker or hirer'}
                />
              )}

              {deepLinkLoading && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={40} sx={{ color: 'primary.main', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Starting conversation...
                  </Typography>
                </Box>
              )}

              {deepLinkError && (
                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                  <Typography variant="body1" sx={{ color: 'error.main', mb: 2 }}>
                    {deepLinkError}
                  </Typography>
                  <Button variant="contained" onClick={handleRetryDeepLink} startIcon={<RefreshIcon />} sx={{ minHeight: 44 }}>
                    Retry
                  </Button>
                </Box>
              )}

              {filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                return (
                <Paper
                  component="button"
                  type="button"
                  key={conversation.id}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: '12px',
                    p: 2,
                    mb: 1.5,
                    border: `1px solid ${theme.palette.divider}`,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    color: 'inherit',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.5),
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${alpha(theme.palette.primary.main, 0.8)}`,
                      outlineOffset: 2,
                    },
                  }}
                  aria-label={`Open conversation with ${otherParticipant?.name || 'participant'}`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={otherParticipant?.avatar}
                        alt={otherParticipant?.name || 'Participant avatar'}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: theme.palette.primary.contrastText,
                          width: 48,
                          height: 48,
                          fontWeight: 'bold',
                        }}
                      >
                        {otherParticipant?.name?.charAt(0) || '?'}
                      </Avatar>
                      {otherParticipant?.status === 'online' && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 12,
                            height: 12,
                            backgroundColor: 'success.main',
                            borderRadius: '50%',
                            border: `2px solid ${theme.palette.background.paper}`,
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
                            color: 'text.primary',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                            display: { xs: '-webkit-box', sm: 'block' },
                            WebkitLineClamp: { xs: 2, sm: 'unset' },
                            WebkitBoxOrient: { xs: 'vertical', sm: 'unset' },
                          }}
                        >
                          {otherParticipant?.name || 'Unknown'}
                        </Typography>
                        <Typography
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            flexShrink: 0,
                            ml: 1,
                          }}
                        >
                          {conversation.lastMessage?.timestamp
                            ? formatMessageTime(conversation.lastMessage.timestamp)
                            : ''}
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
                            color: 'text.secondary',
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: { xs: 'normal', sm: 'nowrap' },
                            display: { xs: '-webkit-box', sm: 'block' },
                            WebkitLineClamp: { xs: 2, sm: 'unset' },
                            WebkitBoxOrient: { xs: 'vertical', sm: 'unset' },
                            flex: 1,
                          }}
                        >
                          {String(conversation.lastMessage?.sender) === String(currentUserId) && 'You: '}
                          {getMessagePreview(conversation.lastMessage)}
                        </Typography>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            badgeContent={conversation.unreadCount}
                            sx={{
                              '& .MuiBadge-badge': {
                                backgroundColor: 'primary.main',
                                color: theme.palette.primary.contrastText,
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
                );
              })}
            </Box>

            {/* Bottom spacing for nav — uses shared layout constant */}
            <Box sx={{ height: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 16px)` }} />
          </>
        ) : (
          // Chat View
          (() => {
            const chatParticipant = getOtherParticipant(selectedConversation);
            return (
          <>
            {/* Chat Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.default',
                p: 2,
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => clearConversation()}
                  aria-label="Back to conversations"
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Avatar
                  src={chatParticipant?.avatar}
                  alt={chatParticipant?.name || 'Chat participant avatar'}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: theme.palette.primary.contrastText,
                    width: 36,
                    height: 36,
                    fontWeight: 'bold',
                  }}
                >
                  {chatParticipant?.name?.charAt(0) || '?'}
                </Avatar>
                <Box>
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      lineHeight: 1,
                    }}
                  >
                    {chatParticipant?.name || 'Unknown'}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      lineHeight: 1,
                    }}
                  >
                    {chatParticipant?.status === 'online'
                      ? 'Online'
                      : 'Last seen recently'}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                aria-label="More options"
                onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <MoreVertIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            {/* Messages Area — Real Data */}
            <Box
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                minHeight: 0, // allow flex shrink
              }}
            >
              {loadingMessages && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                </Box>
              )}
              {!loadingMessages && messages.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No messages yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.9rem' }}>
                    Say hello to start the conversation!
                  </Typography>
                </Box>
              )}
              {messages.map((message) => {
                const senderId = message.sender || message.senderId;
                const isOwn =
                  senderId && currentUserId
                    ? String(senderId) === String(currentUserId)
                    : false;
                return (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '75%',
                      p: 1.5,
                      borderRadius: '12px',
                      backgroundColor: isOwn ? 'primary.main' : 'background.paper',
                      color: isOwn ? theme.palette.primary.contrastText : 'text.primary',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.875rem', mb: 0.5, wordBreak: 'break-word' }}>
                      {message.text}
                    </Typography>
                    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          opacity: 0.7,
                        }}
                      >
                        {safeFormatDate(message.timestamp, 'HH:mm')}
                      </Typography>
                      {isOwn && getMessageStatus(message)}
                    </Stack>
                  </Box>
                </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input — Wired to real handlers */}
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                bgcolor: 'background.default',
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper',
                      borderRadius: '20px',
                      '& fieldset': { borderColor: theme.palette.divider },
                      '&:hover fieldset': { borderColor: theme.palette.primary.main },
                      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                    },
                    '& .MuiInputBase-input': {
                      color: 'text.primary',
                      fontSize: '1rem',
                      py: 1,
                    },
                  }}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && selectedFiles.length === 0}
                  aria-label="Send message"
                  sx={{
                    backgroundColor: 'primary.main',
                    color: theme.palette.primary.contrastText,
                    minWidth: 44,
                    minHeight: 44,
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '&:disabled': {
                      backgroundColor: alpha(theme.palette.text.primary, 0.1),
                      color: 'text.disabled',
                    },
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Bottom spacing for mobile nav — uses shared layout constant */}
            <Box sx={{ height: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 16px)` }} />
          </>
            );
          })()
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
          height: 'calc(100dvh - 64px)',
          p: { xs: 1, sm: 2, md: 3 },
          bgcolor: 'background.default',
        }}
      >
        {(realtimeIssue || !isConnected) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {realtimeIssue || 'Reconnecting... You can still read and send messages.'}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {isMobile ? (
            selectedConversation ? (
              <Grid item xs={12}>
                {EnhancedChatArea()}
              </Grid>
            ) : (
              <Grid item xs={12}>
                {EnhancedConversationList()}
              </Grid>
            )
          ) : (
            <>
              <Grid item md={4} lg={3}>
                {EnhancedConversationList()}
              </Grid>
              <Grid item md={8} lg={9}>
                {EnhancedChatArea()}
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
          <MenuItem disabled sx={{ opacity: 0.6 }}>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText>Conversation Info</ListItemText>
            <Typography variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>Soon</Typography>
          </MenuItem>
          <MenuItem disabled sx={{ opacity: 0.6 }}>
            <ListItemIcon>
              <ArchiveIcon />
            </ListItemIcon>
            <ListItemText>Archive</ListItemText>
            <Typography variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>Soon</Typography>
          </MenuItem>
          <MenuItem disabled sx={{ opacity: 0.6 }}>
            <ListItemIcon>
              <BlockIcon />
            </ListItemIcon>
            <ListItemText>Block User</ListItemText>
            <Typography variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>Soon</Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            disabled
            sx={{ opacity: 0.6 }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ color: 'text.disabled' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
            <Typography variant="caption" sx={{ ml: 1, color: 'text.disabled' }}>Soon</Typography>
          </MenuItem>
        </Menu>

        {/* New Chat Dialog */}
        <Dialog
          open={newChatDialog}
          onClose={() => setNewChatDialog(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          aria-labelledby="new-chat-dialog-title"
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <DialogTitle id="new-chat-dialog-title" sx={{ color: '#D4AF37' }}>
            New Conversation
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mt: 1 }}>
              This feature is coming soon. For now, you can message workers directly from their profile or a job listing.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setNewChatDialog(false)}
              variant="contained"
              sx={{ bgcolor: '#D4AF37', color: '#000', '&:hover': { bgcolor: '#C5A028' } }}
            >
              OK
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

