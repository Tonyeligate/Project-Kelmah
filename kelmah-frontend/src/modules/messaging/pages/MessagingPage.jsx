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
  alpha,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
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
import { safeFormatDate } from '@/modules/common/utils/formatters';
import { BOTTOM_NAV_HEIGHT } from '../../../constants/layout';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';
import { useMessages } from '../contexts/MessageContext';
import { messagingService } from '../services/messagingService';
import {
  formatMessageTime,
  getMessagePreview,
} from '../utils/conversationUtils';
import { useBreakpointDown } from '../../../hooks/useResponsive';
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
  const isMobile = useBreakpointDown('md');
  const isTablet = useBreakpointDown('lg');

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
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [newChatDialog, setNewChatDialog] = useState(false);

  // Confirmation dialog state for destructive actions (archive, block, delete)
  const [destructiveConfirm, setDestructiveConfirm] = useState({ open: false, action: null, label: '' });
  const handleDestructiveAction = useCallback((action, label) => {
    setMoreMenuAnchor(null);
    setDestructiveConfirm({ open: true, action, label });
  }, []);
  const handleConfirmDestructive = useCallback(async () => {
    if (destructiveConfirm.action) await destructiveConfirm.action();
    setDestructiveConfirm({ open: false, action: null, label: '' });
  }, [destructiveConfirm]);

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

  const selectedConversationOtherParticipant = useMemo(() => {
    const participants = Array.isArray(selectedConversation?.participants)
      ? selectedConversation.participants
      : [];
    return participants.find((participant) => {
      const participantId = resolveParticipantId(participant);
      return participantId && String(participantId) !== String(currentUserId);
    }) || null;
  }, [selectedConversation, resolveParticipantId, currentUserId]);
  const hasSelectedConversation = Boolean(selectedConversation);

  const getConversationId = useCallback(
    (conversation) => conversation?.id || conversation?._id || null,
    [],
  );

  // Utility: show snackbar feedback (must be declared before hooks that depend on it)
  const showFeedback = useCallback((message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  }, []);

  // Memoize file preview URLs to avoid creating new blob URLs on every render
  const filePreviewUrls = useMemo(
    () => selectedFiles.map((file) =>
      (file.type.startsWith('image/') || file.type.startsWith('video/'))
        ? URL.createObjectURL(file)
        : null
    ),
    [selectedFiles],
  );
  const canSendMessage = messageText.trim().length > 0 || selectedFiles.length > 0;
  const attachmentGuidance = selectedFiles.length > 0
    ? `${selectedFiles.length} attachment${selectedFiles.length > 1 ? 's' : ''} ready to send`
    : 'Add photos, video, or documents (10MB max each)';

  // Revoke preview blob URLs when selectedFiles change or on unmount
  useEffect(() => {
    const previewUrlsSnapshot = [...filePreviewUrls];

    return () => {
      previewUrlsSnapshot.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [filePreviewUrls]);

  // Revoke message attachment blob URLs on unmount
  useEffect(() => {
    return () => {
      const messageBlobUrlsSnapshot = [...blobUrlsRef.current];
      blobUrlsRef.current = [];
      messageBlobUrlsSnapshot.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
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
      setDeepLinkError(null);
      setDeepLinkLoading(true);

      try {
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

        if (temporaryConversation?.id) {
          selectConversation(temporaryConversation);
        }
        return;
      }
      } finally {
        setDeepLinkLoading(false);
      }
    };

    runDeepLink();
  }, [user, search, navigate, selectConversation, createConversation, loadingConversations, resolveParticipantId, showFeedback, openTemporaryConversation, locationState]);
  const handleBackToConversationList = useCallback(() => {
    clearConversation();
    navigate('/messages', { replace: true });
  }, [clearConversation, navigate]);


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

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    (conversation) => {
      const convoId = getConversationId(conversation);
      if (!convoId) {
        showFeedback('Unable to open this conversation right now.', 'warning');
        return;
      }

      selectConversation(conversation);

      // Update URL
      navigate(`/messages?conversation=${encodeURIComponent(String(convoId))}`, { replace: true });
    },
    [getConversationId, navigate, selectConversation, showFeedback],
  );

  const hideConversationLocally = useCallback(
    (conversationId) => {
      setFilteredConversations((prev) =>
        prev.filter((conversation) =>
          String(getConversationId(conversation)) !== String(conversationId)));
    },
    [getConversationId],
  );

  const restoreConversationLocally = useCallback(
    (conversation) => {
      if (!conversation) return;

      setFilteredConversations((prev) => {
        const targetId = getConversationId(conversation);
        if (!targetId) return prev;

        const exists = prev.some(
          (item) => String(getConversationId(item)) === String(targetId),
        );

        return exists ? prev : [conversation, ...prev];
      });
    },
    [getConversationId],
  );

  const handleOpenConversationInfo = useCallback(() => {
    setMoreMenuAnchor(null);

    if (!selectedConversation) {
      showFeedback('Select a conversation first to see details.', 'info');
      return;
    }

    const participantName = selectedConversationOtherParticipant?.name || 'participant';
    const linkedJobTitle = selectedConversation?.jobRelated?.title;
    const detailsMessage = linkedJobTitle
      ? `Conversation with ${participantName}. Linked job: ${linkedJobTitle}.`
      : `Conversation with ${participantName}.`;

    showFeedback(detailsMessage, 'info');
  }, [selectedConversation, selectedConversationOtherParticipant, showFeedback]);

  const handleArchiveConversation = useCallback(async () => {
    if (!selectedConversation) {
      showFeedback('Select a conversation first to archive it.', 'info');
      return;
    }

    const targetConversation = selectedConversation;
    const conversationId = getConversationId(targetConversation);

    if (!conversationId) {
      showFeedback('Unable to archive this conversation right now.', 'error');
      return;
    }

    hideConversationLocally(conversationId);
    clearConversation?.();
    navigate('/messages', { replace: true });

    try {
      if (typeof messagingService?.archiveConversation === 'function') {
        await messagingService.archiveConversation(conversationId);
      }
      showFeedback('Conversation archived.', 'success');
    } catch {
      restoreConversationLocally(targetConversation);
      showFeedback('Could not archive conversation. Please try again.', 'error');
    }
  }, [
    selectedConversation,
    getConversationId,
    hideConversationLocally,
    clearConversation,
    navigate,
    showFeedback,
    restoreConversationLocally,
  ]);

  const handleDeleteConversation = useCallback(async () => {
    if (!selectedConversation) {
      showFeedback('Select a conversation first to delete it.', 'info');
      return;
    }

    const targetConversation = selectedConversation;
    const conversationId = getConversationId(targetConversation);

    if (!conversationId) {
      showFeedback('Unable to delete this conversation right now.', 'error');
      return;
    }

    hideConversationLocally(conversationId);
    clearConversation?.();
    navigate('/messages', { replace: true });

    try {
      if (typeof messagingService?.deleteConversation === 'function') {
        await messagingService.deleteConversation(conversationId);
      }
      showFeedback('Conversation deleted.', 'success');
    } catch {
      restoreConversationLocally(targetConversation);
      showFeedback('Could not delete conversation. Please try again.', 'error');
    }
  }, [
    selectedConversation,
    getConversationId,
    hideConversationLocally,
    clearConversation,
    navigate,
    showFeedback,
    restoreConversationLocally,
  ]);

  const handleBlockConversationParticipant = useCallback(async () => {
    setMoreMenuAnchor(null);

    if (!selectedConversation) {
      showFeedback('Select a conversation first to block a participant.', 'info');
      return;
    }

    const participantId = resolveParticipantId(selectedConversationOtherParticipant);

    if (participantId && typeof messagingService?.blockUser === 'function') {
      try {
        await messagingService.blockUser(participantId);
        showFeedback('User blocked for this conversation.', 'success');
        return;
      } catch {
        showFeedback('Could not block this user right now. Support can help.', 'warning');
      }
    }

    navigate('/support', {
      state: {
        reason: 'messaging-block-user',
        conversationId: getConversationId(selectedConversation),
        participantId: participantId || null,
      },
    });
  }, [
    selectedConversation,
    resolveParticipantId,
    selectedConversationOtherParticipant,
    showFeedback,
    navigate,
    getConversationId,
  ]);

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
      type: file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'file',
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
      showFeedback('Message was not sent. Check your connection and try again.', 'error');
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
  }, [showFeedback]);

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

  const ConversationListLoadingSkeleton = ({ rows = 6 }) => (
    <Box sx={{ p: 2 }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={`conversation-loading-${index}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1.2,
            px: 1,
            borderRadius: 2,
            mb: 1,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="82%" height={20} />
          </Box>
          <Skeleton variant="circular" width={18} height={18} />
        </Box>
      ))}
    </Box>
  );

  const MessagePaneLoadingSkeleton = ({ rows = 4 }) => (
    <Box sx={{ width: '100%', py: 1 }} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => {
        const isOwnRow = index % 2 === 1;
        return (
          <Box
            key={`message-loading-${index}`}
            sx={{
              display: 'flex',
              justifyContent: isOwnRow ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: { xs: '76%', sm: '62%' },
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isOwnRow
                  ? alpha(theme.palette.primary.main, 0.06)
                  : alpha(theme.palette.background.paper, 0.7),
              }}
            >
              <Skeleton variant="text" width="86%" height={20} />
              <Skeleton variant="text" width="62%" height={20} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );

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
              aria-label="Open messaging options"
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
          placeholder="Search chats by name or recent message"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          inputProps={{ 'aria-label': 'Search conversations' }}
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
          {filteredConversations.map((conversation, index) => {
            const otherParticipant = getOtherParticipant(conversation);
            const conversationId = getConversationId(conversation);
            const isSelected =
              getConversationId(selectedConversation) === conversationId;
            const lastMessageSenderId =
              conversation.lastMessage?.sender || conversation.lastMessage?.senderId;

            return (
                <Box
                  key={conversationId || `conversation-${index}`}
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
                          {String(lastMessageSenderId) === String(currentUserId) &&
                            'You: '}
                            {getMessagePreview(conversation.lastMessage)}
                        </Typography>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          {String(lastMessageSenderId) === String(currentUserId) &&
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
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              {searchQuery
                ? 'Try another name, phone number, or keyword.'
                : 'Start a chat to ask about availability, budget, or timeline.'}
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
            <Box sx={{ width: '100%', maxWidth: 560, px: 3, py: 3 }}>
              <Skeleton variant="text" width="48%" height={34} sx={{ mx: 'auto', mb: 1 }} />
              <Skeleton variant="text" width="72%" height={24} sx={{ mx: 'auto', mb: 3 }} />
              <MessagePaneLoadingSkeleton rows={4} />
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
                Could not open this chat yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {deepLinkError || 'The chat service may still be starting. Please retry in a few seconds.'}
              </Typography>
              <Button
                variant="contained"
                onClick={handleRetryDeepLink}
                startIcon={<RefreshIcon />}
                sx={{ minHeight: 44, mb: 1 }}
              >
                Try Again
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
                onClick={handleBackToConversationList}
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
              <Tooltip title="More options">
                <IconButton
                  aria-label="Open messaging options"
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
            <MessagePaneLoadingSkeleton rows={5} />
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
                    key={message.id || message._id || `${message.timestamp || 'message'}-${index}`}
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
                                    const isVideoAttachment =
                                      attachment.type === 'video' ||
                                      String(attachmentMime).startsWith('video/');
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

                                    if (isVideoAttachment && attachmentUrl) {
                                      return (
                                        <video
                                          src={attachmentUrl}
                                          controls
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '240px',
                                            borderRadius: '8px',
                                            background: '#000',
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
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.75,
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                {attachmentGuidance}
              </Typography>
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
                      aria-label={`Remove attachment ${index + 1}: ${file.name}`}
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
                    ) : file.type.startsWith('video/') ? (
                      <video
                        src={filePreviewUrls[index] || ''}
                        style={{
                          width: '100%',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          background: '#000',
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
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1,
              color: 'text.secondary',
            }}
          >
            {attachmentGuidance}. Press Enter to send, Shift+Enter for a new line.
          </Typography>
          <Stack direction="row" alignItems="flex-end" spacing={1}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              style={{ display: 'none' }}
              aria-label="Attach files to message. Supported types: images, videos, PDF, Word, and text files"
              onChange={handleFileSelect}
            />

            <Tooltip title="Attach photos, videos, or documents">
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                aria-label={`Attach files${selectedFiles.length > 0 ? `, ${selectedFiles.length} selected` : ''}`}
                sx={{
                  minWidth: 44,
                  minHeight: 44,
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
              placeholder="Type your message. Include timing, budget, or location when relevant."
              value={messageText}
              inputProps={{ 'aria-label': 'Type a new chat message' }}
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
                disabled={!canSendMessage}
                aria-label={
                  canSendMessage
                    ? 'Send message'
                    : 'Send message unavailable until you type text or add an attachment'
                }
                sx={{
                  minWidth: 44,
                  minHeight: 44,
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
            <Box key={`conversation-skeleton-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
              <Chip
                label={`${unreadCount || 0} unread`}
                color={unreadCount > 0 ? 'primary' : 'default'}
                variant={unreadCount > 0 ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 700,
                  height: 34,
                }}
              />
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
                placeholder="Search chats by name or recent message"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                inputProps={{ 'aria-label': 'Search conversations on mobile' }}
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Search by worker, hirer, recent message, or job title.
              </Typography>
            </Box>

            {/* Conversations List — Real Data */}
            <Box sx={{ px: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                    }}
                  >
                    Recent Conversations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open a chat to continue where you left off.
                  </Typography>
                </Box>
                <Chip size="small" label={`${filteredConversations.length} chats`} variant="outlined" />
              </Stack>

              {filteredConversations.length === 0 && !deepLinkLoading && !deepLinkError && (
                <EmptyState
                  variant={searchQuery ? 'search' : 'messages'}
                  title={searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                  subtitle={searchQuery ? 'Try different keywords' : 'Start chatting by finding a worker or hirer'}
                />
              )}

              {deepLinkLoading && (
                <Box sx={{ py: 1 }}>
                  <ConversationListLoadingSkeleton rows={4} />
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

              {filteredConversations.map((conversation, index) => {
                const otherParticipant = getOtherParticipant(conversation);
                const conversationId = getConversationId(conversation);
                const lastMessageSenderId =
                  conversation.lastMessage?.sender || conversation.lastMessage?.senderId;
                return (
                <Paper
                  component="button"
                  type="button"
                  key={conversationId || `mobile-conversation-${index}`}
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
                          {String(lastMessageSenderId) === String(currentUserId) && 'You: '}
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
          <Box
            sx={{
              minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px)`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                bgcolor: 'background.default',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={handleBackToConversationList}
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
                  aria-label="Open messaging options"
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
              {selectedConversation.jobRelated && (
                <Box sx={{ px: 2, pb: 1.5 }}>
                  <Chip
                    size="small"
                    label={`Job: ${selectedConversation.jobRelated.title}`}
                    variant="outlined"
                    sx={{ maxWidth: '100%' }}
                  />
                </Box>
              )}
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
                <MessagePaneLoadingSkeleton rows={4} />
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
              {messages.map((message, index) => {
                const senderId = message.sender || message.senderId;
                const isOwn =
                  senderId && currentUserId
                    ? String(senderId) === String(currentUserId)
                    : false;
                return (
                <Box
                  key={message.id || message._id || `${message.timestamp || 'message'}-${index}`}
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
                bgcolor: 'background.default',
                px: 2,
                pt: 1,
                pb: `calc(12px + env(safe-area-inset-bottom, 0px))`,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              {selectedFiles.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {attachmentGuidance}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.25, overflowX: 'auto', pb: 0.5 }}>
                  {selectedFiles.map((file, index) => (
                    <Paper
                      key={`${file.name}-${index}`}
                      variant="outlined"
                      sx={{
                        px: 1.25,
                        py: 0.75,
                        minWidth: 120,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }} noWrap>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(file.size / 1024)} KB
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
                        aria-label={`Remove ${file.name}`}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                  </Stack>
                </>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                {attachmentGuidance}. Tap send when your message is ready.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={`Attach a file${selectedFiles.length > 0 ? `, ${selectedFiles.length} selected` : ''}`}
                  sx={{
                    bgcolor: 'background.paper',
                    border: `1px solid ${theme.palette.divider}`,
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  <AttachFileIcon fontSize="small" />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  hidden
                  aria-label="Attach files to message"
                  onChange={handleFileSelect}
                />
                <TextField
                  fullWidth
                  placeholder="Type your message. Add location, budget, or timing if helpful."
                  value={messageText}
                  inputProps={{ 'aria-label': 'Type your message' }}
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
                  disabled={!canSendMessage}
                  aria-label={
                    canSendMessage
                      ? 'Send message'
                      : 'Send message unavailable until you type text or add an attachment'
                  }
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

          </Box>
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
          {!hasSelectedConversation && (
            <MenuItem disabled>
              <ListItemText>Select a conversation first</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleOpenConversationInfo} disabled={!hasSelectedConversation}>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText>Conversation Info</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => handleDestructiveAction(handleArchiveConversation, 'Archive conversation')}
            disabled={!hasSelectedConversation}
          >
            <ListItemIcon>
              <ArchiveIcon />
            </ListItemIcon>
            <ListItemText>Archive</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleBlockConversationParticipant} disabled={!hasSelectedConversation}>
            <ListItemIcon>
              <BlockIcon />
            </ListItemIcon>
            <ListItemText>Block User</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => handleDestructiveAction(handleDeleteConversation, 'Delete conversation')}
            disabled={!hasSelectedConversation}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Confirmation dialog for destructive actions (delete, block, archive) */}
        <Dialog
          open={destructiveConfirm.open}
          onClose={() => setDestructiveConfirm({ open: false, action: null, label: '' })}
          maxWidth="xs"
          fullWidth
          aria-labelledby="destructive-confirm-title"
        >
          <DialogTitle id="destructive-confirm-title">
            {destructiveConfirm.label}?
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDestructiveConfirm({ open: false, action: null, label: '' })}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDestructive}
              variant="contained"
              color="error"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

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
            Start a New Conversation
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mt: 1 }}>
              Start from a worker profile or job listing to create a new conversation with context.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setNewChatDialog(false);
                navigate('/search', { state: { from: '/messages', intent: 'start-conversation' } });
              }}
              variant="outlined"
            >
              Find Workers
            </Button>
            <Button
              onClick={() => {
                setNewChatDialog(false);
                navigate('/jobs', { state: { from: '/messages', intent: 'start-conversation' } });
              }}
              variant="contained"
              sx={{ bgcolor: '#D4AF37', color: '#000', '&:hover': { bgcolor: '#C5A028' } }}
            >
              Browse Jobs
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


