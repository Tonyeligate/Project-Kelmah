import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  DoneAll as DoneAllIcon,
  Image as ImageIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import SEO from '../../common/components/common/SEO';
import EmptyState from '../../../components/common/EmptyState';
import { useMessages } from '../contexts/MessageContext';
import { messagingService } from '../services/messagingService';

const CHAT_ACCENT = '#128C7E';
const CHAT_BG_DARK = '#0B141A';
const CHAT_BG_LIGHT = '#F3F7F7';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const getCurrentUserId = (user) => user?.id || user?._id || user?.userId || user?.sub || null;

const resolveParticipantId = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'string') return participant;
  return participant.id || participant._id || participant.userId || null;
};

const getConversationParticipant = (conversation = {}, currentUserId) => {
  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
  const otherParticipant = participants.find((participant) => {
    const participantId = resolveParticipantId(participant);
    return participantId && String(participantId) !== String(currentUserId);
  });

  return otherParticipant || participants[0] || null;
};

const getConversationTitle = (conversation = {}, currentUserId) => {
  const participant = getConversationParticipant(conversation, currentUserId);
  if (!participant) return conversation.title || 'New conversation';

  return (
    participant.name ||
    participant.fullName ||
    participant.displayName ||
    [participant.firstName, participant.lastName].filter(Boolean).join(' ') ||
    participant.email ||
    'New conversation'
  );
};

const getConversationAvatar = (conversation = {}, currentUserId) => {
  const participant = getConversationParticipant(conversation, currentUserId);
  return participant?.avatar || participant?.profilePicture || participant?.photo || participant?.image || null;
};

const getConversationPreview = (conversation = {}, currentUserId) => {
  const lastMessage = conversation.lastMessage || conversation.latestMessage || null;
  if (!lastMessage) return 'Start the conversation';

  const senderId = lastMessage.senderId || lastMessage.sender || null;
  const isOwn = senderId && currentUserId ? String(senderId) === String(currentUserId) : false;
  const prefix = isOwn ? 'You: ' : '';
  const text = String(lastMessage.text || lastMessage.content || '').trim();

  if (text) {
    return `${prefix}${text}`;
  }

  const attachments = Array.isArray(lastMessage.attachments) ? lastMessage.attachments : [];
  if (attachments.length > 0) {
    const firstType = String(attachments[0]?.type || attachments[0]?.mimeType || '');
    if (firstType.startsWith('image/')) return `${prefix}Photo`;
    if (firstType.startsWith('video/')) return `${prefix}Video`;
    return `${prefix}Attachment`;
  }

  return 'Start the conversation';
};

const formatConversationTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'HH:mm');
};

const formatTypingLabel = (typingUsers = []) => {
  if (!typingUsers.length) return null;
  if (typingUsers.length === 1) {
    const name = typingUsers[0]?.name || typingUsers[0]?.fullName || 'Someone';
    return `${name} is typing...`;
  }
  return 'Typing...';
};

const getSearchDestination = (role) => {
  if (role === 'worker') return '/jobs';
  return '/search';
};

const normalizeAttachmentPayload = (file) => ({
  file,
  name: file.name,
  size: file.size,
  type: file.type,
  mimeType: file.type,
});

const ConversationSkeleton = () => (
  <Box sx={{ px: 1.5, py: 1.5 }}>
    {Array.from({ length: 6 }).map((_, index) => (
      <Box
        key={`conversation-skeleton-${index}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 1.25,
          px: 1,
          mb: 1,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <CircularProgress size={18} thickness={5} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ width: '48%', height: 14, bgcolor: 'action.selected', borderRadius: 999, mb: 1 }} />
          <Box sx={{ width: '84%', height: 10, bgcolor: 'action.selected', borderRadius: 999 }} />
        </Box>
      </Box>
    ))}
  </Box>
);

const MessageBubble = ({ message, currentUserId }) => {
  const senderId = message.senderId || message.sender || null;
  const isOwn = senderId && currentUserId ? String(senderId) === String(currentUserId) : false;
  const text = String(message.text || message.content || '').trim();
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];

  return (
    <Box sx={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', mb: 1.25 }}>
      <Box
        sx={{
          maxWidth: { xs: '86%', sm: '72%' },
          px: 1.5,
          py: 1,
          borderRadius: isOwn ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
          bgcolor: isOwn ? CHAT_ACCENT : 'background.paper',
          color: isOwn ? '#fff' : 'text.primary',
          boxShadow: isOwn ? '0 8px 20px rgba(18, 140, 126, 0.18)' : '0 6px 16px rgba(0, 0, 0, 0.08)',
          border: isOwn ? 'none' : '1px solid',
          borderColor: 'divider',
        }}
      >
        {text && (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.55,
              fontSize: { xs: '0.95rem', md: '0.92rem' },
            }}
          >
            {text}
          </Typography>
        )}

        {attachments.length > 0 && (
          <Stack spacing={1} sx={{ mt: text ? 1 : 0 }}>
            {attachments.map((attachment, index) => {
              const attachmentType = String(attachment?.type || attachment?.mimeType || '');
              const attachmentUrl = attachment?.url || attachment?.fileUrl || null;
              const attachmentName = attachment?.name || attachment?.fileName || `Attachment ${index + 1}`;

              if (attachmentType.startsWith('image/') && attachmentUrl) {
                return (
                  <Box
                    key={`${attachmentName}-${index}`}
                    component="img"
                    src={attachmentUrl}
                    alt={attachmentName}
                    sx={{
                      width: '100%',
                      maxHeight: 240,
                      objectFit: 'cover',
                      borderRadius: 2,
                      display: 'block',
                    }}
                  />
                );
              }

              return (
                <Box
                  key={`${attachmentName}-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: isOwn ? 'rgba(255,255,255,0.12)' : alpha(CHAT_ACCENT, 0.08),
                  }}
                >
                  <ImageIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }} noWrap>
                    {attachmentName}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}

        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.75,
              color: isOwn ? 'rgba(255,255,255,0.8)' : 'text.secondary',
              fontSize: '0.7rem',
            }}
          >
            {formatMessageTime(message.timestamp || message.createdAt)}
          </Typography>
          {isOwn && message.status === 'sending' && <ScheduleIcon sx={{ fontSize: 14, opacity: 0.8 }} />}
          {isOwn && (message.status === 'delivered' || message.status === 'sent') && <CheckIcon sx={{ fontSize: 14, opacity: 0.85 }} />}
          {isOwn && message.isRead && <DoneAllIcon sx={{ fontSize: 14, color: '#CDEFEA' }} />}
          {isOwn && message.status === 'failed' && <CloseIcon sx={{ fontSize: 14, color: '#FFB4B4' }} />}
        </Stack>
      </Box>
    </Box>
  );
};

const MessagingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);

  const currentUserId = useMemo(() => getCurrentUserId(user), [user]);
  const searchDestination = useMemo(() => getSearchDestination(user?.role), [user?.role]);

  const {
    conversations,
    selectedConversation,
    selectConversation,
    clearConversation,
    openTemporaryConversation,
    messages,
    sendMessage,
    unreadCount,
    loadingConversations,
    loadingMessages,
    isConnected,
    realtimeIssue,
    startTyping,
    stopTyping,
    getTypingUsers,
    isUserOnline,
  } = useMessages();

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [deepLinkLoading, setDeepLinkLoading] = useState(false);
  const [deepLinkError, setDeepLinkError] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const deepLinkHandledRef = useRef('');

  const previewUrls = useMemo(
    () => selectedFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null)),
    [selectedFiles],
  );

  useEffect(
    () => () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    },
    [previewUrls],
  );

  useEffect(() => {
    if (!messageEndRef.current) return;
    messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, selectedConversation?.id]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loadingConversations) return;

    const params = new URLSearchParams(location.search || '');
    const conversationId = params.get('conversation');
    const recipientId = params.get('recipient') || params.get('userId');
    const deepLinkKey = `${conversationId || ''}:${recipientId || ''}`;

    if (!conversationId && !recipientId) {
      deepLinkHandledRef.current = '';
      setDeepLinkLoading(false);
      setDeepLinkError('');
      return;
    }

    if (deepLinkHandledRef.current === deepLinkKey) {
      return;
    }

    deepLinkHandledRef.current = deepLinkKey;
    let cancelled = false;

    const existingConversation = conversationId
      ? conversations.find((conversation) => String(conversation.id || conversation._id) === String(conversationId))
      : recipientId
        ? conversations.find((conversation) =>
            (conversation.participants || []).some(
              (participant) => String(resolveParticipantId(participant)) === String(recipientId),
            ),
          )
        : null;

    if (existingConversation) {
      selectConversation(existingConversation);
      return;
    }

    if (recipientId) {
      const recipientProfile = location.state?.recipientProfile || {};
      openTemporaryConversation({
        id: recipientId,
        name:
          recipientProfile.name ||
          recipientProfile.fullName ||
          recipientProfile.displayName ||
          'New chat',
        avatar:
          recipientProfile.avatar ||
          recipientProfile.profilePicture ||
          recipientProfile.photo ||
          null,
        profilePicture:
          recipientProfile.profilePicture ||
          recipientProfile.avatar ||
          recipientProfile.photo ||
          null,
      });
      return;
    }

    if (conversationId) {
      setDeepLinkLoading(true);
      messagingService
        .getConversationById(conversationId)
        .then((conversation) => {
          if (cancelled) return;
          if (conversation?.id) {
            selectConversation(conversation);
          } else {
            setDeepLinkError('Conversation could not be loaded right now.');
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDeepLinkError('Conversation could not be loaded right now.');
          }
        })
        .finally(() => {
          if (!cancelled) setDeepLinkLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [conversations, loadingConversations, location.search, location.state, openTemporaryConversation, selectConversation]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = Array.isArray(conversations) ? [...conversations] : [];

    if (query) {
      list = list.filter((conversation) => {
        const title = getConversationTitle(conversation, currentUserId).toLowerCase();
        const preview = getConversationPreview(conversation, currentUserId).toLowerCase();
        const jobTitle = String(conversation.jobRelated?.title || '').toLowerCase();
        return title.includes(query) || preview.includes(query) || jobTitle.includes(query);
      });
    }

    if (activeFilter === 'unread') {
      list = list.filter((conversation) => (conversation.unreadCount || conversation.unread || 0) > 0);
    }

    if (activeFilter === 'pinned') {
      list = list.filter((conversation) => conversation.isPinned);
    }

    list.sort((left, right) => {
      const leftStamp = new Date(left?.lastMessage?.timestamp || left?.lastMessage?.createdAt || left?.updatedAt || 0).getTime();
      const rightStamp = new Date(right?.lastMessage?.timestamp || right?.lastMessage?.createdAt || right?.updatedAt || 0).getTime();
      return rightStamp - leftStamp;
    });

    return list;
  }, [activeFilter, conversations, currentUserId, searchQuery]);

  const typingLabel = useMemo(() => formatTypingLabel(selectedConversation ? getTypingUsers() : []), [getTypingUsers, selectedConversation]);

  const handleSelectConversation = useCallback(
    (conversation) => {
      if (!conversation) return;
      selectConversation(conversation);
      const convoId = conversation.id || conversation._id;
      if (convoId) {
        navigate(`/messages?conversation=${encodeURIComponent(String(convoId))}`, { replace: true });
      }
    },
    [navigate, selectConversation],
  );

  const handleBackToList = useCallback(() => {
    clearConversation();
    navigate('/messages', { replace: true });
  }, [clearConversation, navigate]);

  const handleStartNewChat = useCallback(() => {
    navigate(searchDestination);
  }, [navigate, searchDestination]);

  const handleTyping = useCallback(() => {
    startTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1800);
  }, [startTyping, stopTyping]);

  const handleFileChange = useCallback((event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);

    if (files.length !== validFiles.length) {
      setSendError('Some files were skipped because they are larger than 10 MB.');
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }

    event.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((removeIndex) => {
    setSelectedFiles((prev) => prev.filter((_, index) => index !== removeIndex));
  }, []);

  const handleSendMessage = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (!selectedConversation) return;

      const trimmedMessage = messageText.trim();
      if (!trimmedMessage && selectedFiles.length === 0) return;

      setIsSending(true);
      setSendError('');

      try {
        const attachments = selectedFiles.map((file) => normalizeAttachmentPayload(file));
        const messageType = attachments.length > 0
          ? selectedFiles.every((file) => file.type.startsWith('image/'))
            ? 'image'
            : 'file'
          : 'text';

        await sendMessage(trimmedMessage, messageType, attachments);
        setMessageText('');
        setSelectedFiles([]);
      } catch (error) {
        setSendError(error?.message || 'Message could not be sent.');
      } finally {
        setIsSending(false);
      }
    },
    [messageText, selectedFiles, selectedConversation, sendMessage],
  );

  const renderConversationList = (mobile = false) => (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: mobile ? 0 : 4,
        border: mobile ? 'none' : '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? CHAT_BG_DARK : CHAT_BG_LIGHT,
      }}
    >
      <Box
        sx={{
          px: mobile ? 1.5 : 2,
          pt: mobile ? 1.5 : 2,
          pb: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 3,
          bgcolor: theme.palette.mode === 'dark' ? CHAT_BG_DARK : CHAT_BG_LIGHT,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.25 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              Messages
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Secure conversations
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              sx={{ fontWeight: 700, bgcolor: alpha(CHAT_ACCENT, 0.14), color: CHAT_ACCENT }}
            />
            <Tooltip title="Start a new chat">
              <IconButton
                onClick={handleStartNewChat}
                aria-label="Start a new chat"
                sx={{
                  minWidth: 44,
                  minHeight: 44,
                  bgcolor: alpha(CHAT_ACCENT, 0.12),
                  color: CHAT_ACCENT,
                  '&:hover': { bgcolor: alpha(CHAT_ACCENT, 0.18) },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <TextField
          fullWidth
          size="small"
          placeholder="Search chats"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          inputProps={{ 'aria-label': 'Search conversations' }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
              '& fieldset': { borderColor: alpha(CHAT_ACCENT, 0.18) },
              '&:hover fieldset': { borderColor: alpha(CHAT_ACCENT, 0.4) },
              '&.Mui-focused fieldset': { borderColor: CHAT_ACCENT },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.25 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'pinned', label: 'Pinned' },
          ].map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              onClick={() => setActiveFilter(chip.key)}
              clickable
              variant={activeFilter === chip.key ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                borderColor: alpha(CHAT_ACCENT, 0.22),
                bgcolor: activeFilter === chip.key ? CHAT_ACCENT : 'transparent',
                color: activeFilter === chip.key ? '#fff' : 'text.primary',
              }}
            />
          ))}
          {deepLinkLoading && <Chip label="Loading" size="small" sx={{ fontWeight: 700 }} />}
        </Stack>
      </Box>

      {(realtimeIssue || !isConnected) && (
        <Box sx={{ px: mobile ? 1.5 : 2, pt: 1.5 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {realtimeIssue || 'Real-time updates are unavailable.'}
          </Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loadingConversations ? (
          <ConversationSkeleton />
        ) : filteredConversations.length > 0 ? (
          <List disablePadding>
            {filteredConversations.map((conversation, index) => {
              const participant = getConversationParticipant(conversation, currentUserId);
              const title = getConversationTitle(conversation, currentUserId);
              const preview = getConversationPreview(conversation, currentUserId);
              const lastStamp = conversation.lastMessage?.timestamp || conversation.lastMessage?.createdAt || conversation.updatedAt;
              const unread = conversation.unreadCount || conversation.unread || 0;
              const isSelected = String(selectedConversation?.id || selectedConversation?._id || '') === String(conversation.id || conversation._id);
              const isOnline = participant?.id ? isUserOnline(participant.id) : false;

              return (
                <React.Fragment key={conversation.id || conversation._id || `conversation-${index}`}>
                  <ListItemButton
                    onClick={() => handleSelectConversation(conversation)}
                    selected={isSelected}
                    sx={{
                      py: mobile ? 1.3 : 1.6,
                      px: mobile ? 1.5 : 2,
                      borderLeft: isSelected ? `4px solid ${CHAT_ACCENT}` : '4px solid transparent',
                      bgcolor: isSelected ? alpha(CHAT_ACCENT, 0.1) : 'transparent',
                      '&:hover': { bgcolor: alpha(CHAT_ACCENT, 0.08) },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 54 }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant={isOnline ? 'dot' : undefined}
                        color="success"
                      >
                        <Avatar
                          src={getConversationAvatar(conversation, currentUserId) || undefined}
                          alt={title}
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: alpha(CHAT_ACCENT, 0.14),
                            color: CHAT_ACCENT,
                            fontWeight: 800,
                          }}
                        >
                          {title.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={(
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                          <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ minWidth: 0 }}>
                            {title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            {formatConversationTime(lastStamp)}
                          </Typography>
                        </Stack>
                      )}
                      secondary={(
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 0.25 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              pr: 1,
                            }}
                          >
                            {preview}
                          </Typography>
                          {unread > 0 ? (
                            <Chip size="small" label={unread} color="error" sx={{ fontWeight: 800, minWidth: 28 }} />
                          ) : conversation.isPinned ? (
                            <StarIcon sx={{ fontSize: 16, color: CHAT_ACCENT }} />
                          ) : null}
                        </Stack>
                      )}
                    />
                  </ListItemButton>
                  {index < filteredConversations.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Box sx={{ py: 2 }}>
            {deepLinkError ? (
              <Box sx={{ px: 2 }}>
                <Alert
                  severity="error"
                  action={(
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setDeepLinkError('');
                        navigate('/messages', { replace: true });
                      }}
                    >
                      Retry
                    </Button>
                  )}
                >
                  {deepLinkError}
                </Alert>
              </Box>
            ) : (
              <EmptyState
                variant="messages"
                title={searchQuery ? 'No chats match your search' : 'No conversations yet'}
                subtitle={
                  searchQuery
                    ? 'Try a different name or clear the search.'
                    : user?.role === 'worker'
                      ? 'Browse jobs to start a conversation with a hirer.'
                      : 'Find workers to begin a new chat.'
                }
                actionLabel={user?.role === 'worker' ? 'Browse jobs' : 'Find workers'}
                onAction={handleStartNewChat}
              />
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );

  const renderChatPane = (mobile = false) => {
    if (!selectedConversation) {
      return (
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: mobile ? 0 : 4,
            border: mobile ? 'none' : '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? CHAT_BG_DARK : '#fff',
          }}
        >
          {deepLinkLoading ? (
            <Box sx={{ textAlign: 'center', px: 3 }}>
              <CircularProgress sx={{ color: CHAT_ACCENT, mb: 2 }} />
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Opening chat...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we load the conversation.
              </Typography>
            </Box>
          ) : (
            <EmptyState
              variant="messages"
              title="Select a conversation"
              subtitle="Open a chat to read messages, send a reply, and continue the conversation."
              actionLabel={user?.role === 'worker' ? 'Browse jobs' : 'Find workers'}
              onAction={handleStartNewChat}
            />
          )}
        </Paper>
      );
    }

    const participant = getConversationParticipant(selectedConversation, currentUserId);
    const title = getConversationTitle(selectedConversation, currentUserId);
    const avatarUrl = getConversationAvatar(selectedConversation, currentUserId);
    const typingText = formatTypingLabel(getTypingUsers());
    const jobTitle = selectedConversation.jobRelated?.title;
    const sendDisabled = isSending || (!messageText.trim() && selectedFiles.length === 0);

    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: mobile ? 0 : 4,
          border: mobile ? 'none' : '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? CHAT_BG_DARK : '#fff',
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? CHAT_BG_DARK : '#fff',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 1, md: 2 } }}>
            {mobile && (
              <IconButton
                onClick={handleBackToList}
                aria-label="Back to conversations"
                sx={{
                  mr: 0.5,
                  minWidth: 44,
                  minHeight: 44,
                  color: CHAT_ACCENT,
                  bgcolor: alpha(CHAT_ACCENT, 0.08),
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}

            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant={participant?.id && isUserOnline(participant.id) ? 'dot' : undefined}
              color="success"
            >
              <Avatar
                src={avatarUrl || undefined}
                alt={title}
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: alpha(CHAT_ACCENT, 0.16),
                  color: CHAT_ACCENT,
                  fontWeight: 800,
                  mr: 1.5,
                }}
              >
                {title.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} noWrap sx={{ lineHeight: 1.1 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {typingText || (participant?.id && isUserOnline(participant.id) ? 'Online' : 'Last seen recently')}
              </Typography>
              {jobTitle && (
                <Chip
                  size="small"
                  label={jobTitle}
                  sx={{ mt: 0.5, fontWeight: 700, bgcolor: alpha(CHAT_ACCENT, 0.1), color: CHAT_ACCENT }}
                />
              )}
            </Box>

            <Tooltip title="More options">
              <IconButton
                aria-label="Open conversation menu"
                sx={{
                  ml: 1,
                  minWidth: 44,
                  minHeight: 44,
                  color: 'text.secondary',
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 1.25, md: 2 },
            py: { xs: 1.5, md: 2 },
            backgroundImage:
              theme.palette.mode === 'dark'
                ? 'radial-gradient(circle at top, rgba(18,140,126,0.12), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 100%)'
                : 'radial-gradient(circle at top, rgba(18,140,126,0.08), transparent 42%)',
          }}
        >
          {(realtimeIssue || !isConnected) && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              {realtimeIssue || 'Real-time updates are unavailable. Messages will still send.'}
            </Alert>
          )}

          {loadingMessages ? (
            <Box sx={{ py: 2 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Box key={`message-skeleton-${index}`} sx={{ display: 'flex', justifyContent: index % 2 ? 'flex-end' : 'flex-start', mb: 1.5 }}>
                  <Box sx={{ width: { xs: '72%', sm: '58%' }, p: 1.5, borderRadius: 2, bgcolor: 'action.selected' }}>
                    <Box sx={{ width: '80%', height: 10, bgcolor: 'background.paper', borderRadius: 999, mb: 1 }} />
                    <Box sx={{ width: '45%', height: 10, bgcolor: 'background.paper', borderRadius: 999 }} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <EmptyState
                variant="messages"
                title="No messages yet"
                subtitle="Send the first message to start the conversation."
              />
            </Box>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id || message._id || `${message.timestamp || 'message'}-${index}`}
                message={message}
                currentUserId={currentUserId}
              />
            ))
          )}
          <div ref={messageEndRef} />
        </Box>

        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
            px: { xs: 1.25, md: 2 },
            py: 1.25,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(11,20,26,0.98)' : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(14px)',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {selectedFiles.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 1.25, overflowX: 'auto', pb: 0.5 }}>
              {selectedFiles.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  sx={{
                    minWidth: 132,
                    maxWidth: 180,
                    flexShrink: 0,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    p: 1,
                    position: 'relative',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    aria-label={`Remove ${file.name}`}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 28,
                      height: 28,
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>

                  {file.type.startsWith('image/') ? (
                    <Box
                      component="img"
                      src={previewUrls[index] || ''}
                      alt={file.name}
                      sx={{
                        width: '100%',
                        height: 72,
                        borderRadius: 1.25,
                        objectFit: 'cover',
                        display: 'block',
                        mb: 0.75,
                      }}
                    />
                  ) : (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      <ImageIcon sx={{ fontSize: 18, color: CHAT_ACCENT }} />
                      <Typography variant="caption" fontWeight={700} noWrap>
                        {file.name}
                      </Typography>
                    </Stack>
                  )}

                  <Typography variant="caption" color="text.secondary" noWrap>
                    {Math.round(file.size / 1024)} KB
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {sendError && (
            <Alert severity="error" sx={{ mb: 1.25, borderRadius: 2 }} onClose={() => setSendError('')}>
              {sendError}
            </Alert>
          )}

          <Stack direction="row" spacing={1} alignItems="flex-end">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              hidden
              onChange={handleFileChange}
            />

            <Tooltip title="Attach file">
              <IconButton
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                sx={{
                  minWidth: 44,
                  minHeight: 44,
                  color: CHAT_ACCENT,
                  bgcolor: alpha(CHAT_ACCENT, 0.08),
                  '&:hover': { bgcolor: alpha(CHAT_ACCENT, 0.14) },
                }}
              >
                <AttachFileIcon />
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Type a message"
              value={messageText}
              onChange={(event) => {
                setMessageText(event.target.value);
                handleTyping();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage(event);
                }
              }}
              inputProps={{ 'aria-label': 'Type message' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 999,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff',
                  '& fieldset': { borderColor: alpha(CHAT_ACCENT, 0.2) },
                  '&:hover fieldset': { borderColor: alpha(CHAT_ACCENT, 0.45) },
                  '&.Mui-focused fieldset': { borderColor: CHAT_ACCENT },
                },
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  lineHeight: 1.45,
                },
              }}
            />

            <Tooltip title="Send message">
              <IconButton
                type="submit"
                disabled={isSending || (!messageText.trim() && selectedFiles.length === 0)}
                aria-label="Send message"
                sx={{
                  minWidth: 44,
                  minHeight: 44,
                  bgcolor: CHAT_ACCENT,
                  color: '#fff',
                  '&:hover': { bgcolor: '#0F7366' },
                  '&:disabled': {
                    bgcolor: alpha(theme.palette.text.primary, 0.08),
                    color: 'text.disabled',
                  },
                }}
              >
                {isSending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>
    );
  };

  return (
    <Box
      sx={{
        minHeight: { xs: '100dvh', md: 'calc(100dvh - 64px)' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' ? CHAT_BG_DARK : CHAT_BG_LIGHT,
        color: 'text.primary',
        backgroundImage:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top, rgba(18,140,126,0.12) 0%, transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 24%)'
            : 'radial-gradient(circle at top, rgba(18,140,126,0.08) 0%, transparent 34%)',
      }}
    >
      <SEO title="Messages" description="Secure real-time conversations on Kelmah." openGraph={{ type: 'website' }} />

      <Box sx={{ px: { xs: 0, md: 2 }, py: { xs: 0, md: 2 }, flex: 1, display: 'flex' }}>
        {isMobile ? (
          selectedConversation ? (
            <Box sx={{ flex: 1, minHeight: 0 }}>{renderChatPane(true)}</Box>
          ) : (
            <Box sx={{ flex: 1, minHeight: 0 }}>{renderConversationList(true)}</Box>
          )
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: { md: '360px 1fr', lg: '380px 1fr' },
              gap: 2,
            }}
          >
            <Box sx={{ minHeight: 0 }}>{renderConversationList(false)}</Box>
            <Box sx={{ minHeight: 0 }}>{renderChatPane(false)}</Box>
          </Box>
        )}
      </Box>

      {!selectedConversation && !isMobile && (loadingConversations || deepLinkLoading || deepLinkError) && (
        <Box sx={{ px: 2, pb: 2 }}>
          {deepLinkError ? (
            <Alert
              severity="error"
              action={(
                <Button color="inherit" onClick={() => navigate('/messages', { replace: true })}>
                  Retry
                </Button>
              )}
            >
              {deepLinkError}
            </Alert>
          ) : loadingConversations ? (
            <Alert severity="info">Loading conversations...</Alert>
          ) : null}
        </Box>
      )}
    </Box>
  );
};

export default MessagingPage;



