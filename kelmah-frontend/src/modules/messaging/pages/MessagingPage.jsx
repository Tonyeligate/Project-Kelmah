import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
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
          color="text.secondary"
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  DeleteSweep as DeleteSweepIcon,
  Description as DescriptionIcon,
  DoneAll as DoneAllIcon,
  Image as ImageIcon,
  InsertDriveFile as InsertDriveFileIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Star as StarIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import SEO from '../../common/components/common/SEO';
import EmptyState from '../../../components/common/EmptyState';
import PageCanvas from '../../common/components/PageCanvas';
import { useMessages } from '../contexts/MessageContext';
import { messagingService } from '../services/messagingService';
import useKeyboardVisible from '../../../hooks/useKeyboardVisible';
import { BOTTOM_NAV_HEIGHT } from '@/constants/layout';

const CHAT_ACCENT = '#128C7E';
const CHAT_BG_DARK = '#0B141A';
const CHAT_BG_LIGHT = '#F3F7F7';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

const getCurrentUserId = (user) =>
  user?.id || user?._id || user?.userId || user?.sub || null;

const resolveParticipantId = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'string') return participant;
  return participant.id || participant._id || participant.userId || null;
};

const getConversationParticipant = (conversation = {}, currentUserId) => {
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants
    : [];
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
  return (
    participant?.avatar ||
    participant?.profilePicture ||
    participant?.photo ||
    participant?.image ||
    null
  );
};

const getConversationPreview = (conversation = {}, currentUserId) => {
  const lastMessage =
    conversation.lastMessage || conversation.latestMessage || null;
  if (!lastMessage) return 'Start the conversation';

  const senderId = lastMessage.senderId || lastMessage.sender || null;
  const isOwn =
    senderId && currentUserId
      ? String(senderId) === String(currentUserId)
      : false;
  const prefix = isOwn ? 'You: ' : '';
  const text = String(lastMessage.text || lastMessage.content || '').trim();

  if (text) {
    return `${prefix}${text}`;
  }

  const attachments = Array.isArray(lastMessage.attachments)
    ? lastMessage.attachments
    : [];
  if (attachments.length > 0) {
    const firstType = String(
      attachments[0]?.type || attachments[0]?.mimeType || '',
    );
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

const getConversationKey = (conversation = {}, currentUserId) => {
  const conversationId = conversation.id || conversation._id || null;
  if (conversationId) {
    return `conversation:${conversationId}`;
  }

  const participant = getConversationParticipant(conversation, currentUserId);
  const participantId = resolveParticipantId(participant);
  if (participantId) {
    return `participant:${participantId}`;
  }

  return null;
};

const normalizeAttachmentPayload = (file) => ({
  file,
  name: file.name,
  size: file.size,
  type: file.type,
  mimeType: file.type,
});

const getAttachmentKey = (file) =>
  `${file.name}-${file.size}-${file.lastModified}`;

const formatFileSize = (sizeInBytes) => {
  const size = Number(sizeInBytes);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const getAttachmentKindLabel = (file) => {
  const type = String(file?.type || '').toLowerCase();
  if (type.startsWith('image/')) return 'Photo';
  if (type.startsWith('video/')) return 'Video';
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('word') || type.includes('document')) return 'Document';
  if (type.includes('text')) return 'Text file';
  return 'File';
};

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
          <Box
            sx={{
              width: '48%',
              height: 14,
              bgcolor: 'action.selected',
              borderRadius: 999,
              mb: 1,
            }}
          />
          <Box
            sx={{
              width: '84%',
              height: 10,
              bgcolor: 'action.selected',
              borderRadius: 999,
            }}
          />
        </Box>
      </Box>
    ))}
  </Box>
);

const MessageBubble = ({ message, currentUserId }) => {
  const senderId = message.senderId || message.sender || null;
  const isOwn =
    senderId && currentUserId
      ? String(senderId) === String(currentUserId)
      : false;
  const text = String(message.text || message.content || '').trim();
  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];
  const normalizedStatus = String(message.status || '').toLowerCase();
  const isSending = normalizedStatus === 'sending';
  const isFailed =
    normalizedStatus === 'failed' || normalizedStatus === 'error';
  const isRead = Boolean(message.isRead);
  const isDelivered =
    !isRead &&
    (normalizedStatus === 'delivered' || normalizedStatus === 'received');
  const isSent = !isRead && !isDelivered && !isSending && !isFailed;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        mb: 1.25,
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: '86%', sm: '72%' },
          px: 1.5,
          py: 1,
          borderRadius: isOwn ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
          bgcolor: isOwn ? CHAT_ACCENT : 'background.paper',
          color: isOwn ? '#fff' : 'text.primary',
          boxShadow: isOwn
            ? '0 8px 20px rgba(18, 140, 126, 0.18)'
            : '0 6px 16px rgba(0, 0, 0, 0.08)',
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
                                color="text.secondary"
        {attachments.length > 0 && (
          <Stack spacing={1} sx={{ mt: text ? 1 : 0 }}>
            {attachments.map((attachment, index) => {
              const attachmentType = String(
                attachment?.type || attachment?.mimeType || '',
              );
              const attachmentUrl =
                attachment?.url || attachment?.fileUrl || null;
              const attachmentName =
                attachment?.name ||
                attachment?.fileName ||
                `Attachment ${index + 1}`;

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
                    bgcolor: isOwn
                      ? 'rgba(255,255,255,0.12)'
                      : alpha(CHAT_ACCENT, 0.08),
                  }}
                >
                  <ImageIcon sx={{ fontSize: 18 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    noWrap
                  >
                    {attachmentName}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent="flex-end"
          sx={{ mt: 0.5 }}
        >
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
          {isOwn && isSending && (
            <ScheduleIcon sx={{ fontSize: 14, opacity: 0.8 }} />
          )}
          {isOwn && isFailed && (
            <CloseIcon sx={{ fontSize: 14, color: '#FFB4B4' }} />
          )}
          {isOwn && isRead && (
            <DoneAllIcon sx={{ fontSize: 14, color: '#CDEFEA' }} />
          )}
          {isOwn && isDelivered && (
            <DoneAllIcon sx={{ fontSize: 14, opacity: 0.85 }} />
          )}
          {isOwn && isSent && (
            <CheckIcon sx={{ fontSize: 14, opacity: 0.85 }} />
          )}
        </Stack>
      </Box>
    </Box>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    senderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sender: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    text: PropTypes.string,
    content: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string,
        mimeType: PropTypes.string,
        url: PropTypes.string,
        fileUrl: PropTypes.string,
        name: PropTypes.string,
        fileName: PropTypes.string,
      }),
    ),
    timestamp: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Date),
    ]),
    status: PropTypes.string,
    isRead: PropTypes.bool,
  }).isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const MessagingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  const { isKeyboardVisible } = useKeyboardVisible();

  const currentUserId = useMemo(() => getCurrentUserId(user), [user]);
  const searchDestination = useMemo(
    () => getSearchDestination(user?.role),
    [user?.role],
  );
  const emptyStateActionLabel = useMemo(
    () => (user?.role === 'worker' ? 'Browse jobs' : 'Find workers'),
    [user?.role],
  );
  const emptyConversationSubtitle = useMemo(
    () =>
      user?.role === 'worker'
        ? 'Browse open jobs and message a hirer directly to get started.'
        : 'Find workers and send your first message with job details.',
    [user?.role],
  );

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
  const [draftsByConversation, setDraftsByConversation] = useState({});

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const deepLinkHandledRef = useRef('');
  const previousConversationKeyRef = useRef(null);

  const previewUrls = useMemo(
    () =>
      selectedFiles.map((file) =>
        file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      ),
    [selectedFiles],
  );

  const totalAttachmentSize = useMemo(
    () =>
      selectedFiles.reduce((sum, file) => sum + (Number(file.size) || 0), 0),
    [selectedFiles],
  );

  const remainingAttachmentSlots = Math.max(
    MAX_ATTACHMENTS - selectedFiles.length,
    0,
  );

  const selectedConversationKey = useMemo(
    () => getConversationKey(selectedConversation, currentUserId),
    [currentUserId, selectedConversation],
  );

  const quickReplyTemplates = useMemo(
    () =>
      user?.role === 'worker'
        ? [
            'I can start this job this week.',
            'Can we confirm budget and timeline?',
            'I can share photos of similar work.',
          ]
        : [
            'What is your expected completion time?',
            'Can you confirm your final quote?',
            'Please share recent work photos.',
          ],
    [user?.role],
  );

  const messageCharacterCount = messageText.length;

  useEffect(
    () => () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    },
    [previewUrls],
  );

  useEffect(() => {
    if (!selectedConversationKey) {
      setMessageText((previous) => (previous ? '' : previous));
      return;
    }

    const nextDraft = draftsByConversation[selectedConversationKey] || '';
    setMessageText((previous) =>
      previous === nextDraft ? previous : nextDraft,
    );
  }, [draftsByConversation, selectedConversationKey]);

  useEffect(() => {
    const previousKey = previousConversationKeyRef.current;
    if (previousKey !== null && previousKey !== selectedConversationKey) {
      setSelectedFiles([]);
      setSendError('');
    }

    previousConversationKeyRef.current = selectedConversationKey;
  }, [selectedConversationKey]);

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
      ? conversations.find(
          (conversation) =>
            String(conversation.id || conversation._id) ===
            String(conversationId),
        )
      : recipientId
        ? conversations.find((conversation) =>
            (conversation.participants || []).some(
              (participant) =>
                String(resolveParticipantId(participant)) ===
                String(recipientId),
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
            setDeepLinkError(
              'Conversation not found or connection is too weak to load.',
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDeepLinkError(
              'Network error while loading this chat. Please try again.',
            );
          }
        })
        .finally(() => {
          if (!cancelled) setDeepLinkLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    conversations,
    loadingConversations,
    location.search,
    location.state,
    openTemporaryConversation,
    selectConversation,
  ]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = Array.isArray(conversations) ? [...conversations] : [];

    if (query) {
      list = list.filter((conversation) => {
        const title = getConversationTitle(
          conversation,
          currentUserId,
        ).toLowerCase();
        const preview = getConversationPreview(
          conversation,
          currentUserId,
        ).toLowerCase();
        const jobTitle = String(
          conversation.jobRelated?.title || '',
        ).toLowerCase();
        return (
          title.includes(query) ||
          preview.includes(query) ||
          jobTitle.includes(query)
        );
      });
    }

    if (activeFilter === 'unread') {
      list = list.filter(
        (conversation) =>
          (conversation.unreadCount || conversation.unread || 0) > 0,
      );
    }

    if (activeFilter === 'pinned') {
      list = list.filter((conversation) => conversation.isPinned);
    }

    list.sort((left, right) => {
      const leftStamp = new Date(
        left?.lastMessage?.timestamp ||
          left?.lastMessage?.createdAt ||
          left?.updatedAt ||
          0,
      ).getTime();
      const rightStamp = new Date(
        right?.lastMessage?.timestamp ||
          right?.lastMessage?.createdAt ||
          right?.updatedAt ||
          0,
      ).getTime();
      return rightStamp - leftStamp;
    });

    return list;
  }, [activeFilter, conversations, currentUserId, searchQuery]);

  const totalConversationCount = Array.isArray(conversations)
    ? conversations.length
    : 0;
  const hasConversationFilters =
    activeFilter !== 'all' || searchQuery.trim() !== '';

  const typingLabel = useMemo(
    () => formatTypingLabel(selectedConversation ? getTypingUsers() : []),
    [getTypingUsers, selectedConversation],
  );

  const handleSelectConversation = useCallback(
    (conversation) => {
      if (!conversation) return;
      selectConversation(conversation);
      const convoId = conversation.id || conversation._id;
      if (convoId) {
        navigate(
          `/messages?conversation=${encodeURIComponent(String(convoId))}`,
          { replace: true },
        );
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

  const handleFileChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files || []);
      const validFiles = files.filter(
        (file) => file.size <= MAX_FILE_SIZE_BYTES,
      );
      const existingKeys = new Set(selectedFiles.map(getAttachmentKey));
      const uniqueFiles = validFiles.filter(
        (file) => !existingKeys.has(getAttachmentKey(file)),
      );
      const filesToAdd = uniqueFiles.slice(0, remainingAttachmentSlots);

      const oversizeCount = files.length - validFiles.length;
      const duplicateCount = validFiles.length - uniqueFiles.length;
      const overflowCount = uniqueFiles.length - filesToAdd.length;
      const warnings = [];

      if (oversizeCount > 0) {
        warnings.push(
          `${oversizeCount} file${oversizeCount > 1 ? 's were' : ' was'} skipped because ${oversizeCount > 1 ? 'they are' : 'it is'} over 10MB.`,
        );
      }
      if (duplicateCount > 0) {
        warnings.push(
          `${duplicateCount} duplicate file${duplicateCount > 1 ? 's were' : ' was'} skipped.`,
        );
      }
      if (overflowCount > 0) {
        warnings.push(`Attachment limit reached (${MAX_ATTACHMENTS} max).`);
      }

      if (warnings.length > 0) {
        setSendError(warnings.join(' '));
      }

      if (filesToAdd.length > 0) {
        setSelectedFiles((prev) => [...prev, ...filesToAdd]);
      } else if (warnings.length === 0 && files.length > 0) {
        setSendError('No new files were added.');
      }

      event.target.value = '';
    },
    [remainingAttachmentSlots, selectedFiles],
  );

  const handleRemoveFile = useCallback((removeIndex) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== removeIndex),
    );
  }, []);

  const handleClearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const handleQuickTemplateSelect = useCallback(
    (template) => {
      setMessageText(template);
      if (selectedConversationKey) {
        setDraftsByConversation((previous) => ({
          ...previous,
          [selectedConversationKey]: template,
        }));
      }
      setSendError('');
      handleTyping();
    },
    [handleTyping, selectedConversationKey],
  );

  const handleSendMessage = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (!selectedConversation) return;

      const trimmedMessage = messageText.trim();
      if (!trimmedMessage && selectedFiles.length === 0) return;

      setIsSending(true);
      setSendError('');

      try {
        const attachments = selectedFiles.map((file) =>
          normalizeAttachmentPayload(file),
        );
        const messageType =
          attachments.length > 0
            ? selectedFiles.every((file) => file.type.startsWith('image/'))
              ? 'image'
              : 'file'
            : 'text';

        await sendMessage(trimmedMessage, messageType, attachments);
        setMessageText('');
        if (selectedConversationKey) {
          setDraftsByConversation((previous) => {
            if (!(selectedConversationKey in previous)) {
              return previous;
            }

            const nextDrafts = { ...previous };
            delete nextDrafts[selectedConversationKey];
            return nextDrafts;
          });
        }
        setSelectedFiles([]);
      } catch (error) {
        setSendError(
          error?.message ||
            'Message failed to send. Check your connection and try again.',
        );
      } finally {
        setIsSending(false);
      }
    },
    [
      messageText,
      selectedConversation,
      selectedConversationKey,
      selectedFiles,
      sendMessage,
    ],
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.25 }}
        >
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
              label={
                unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'
              }
              sx={{
                fontWeight: 700,
                bgcolor: alpha(CHAT_ACCENT, 0.14),
                color: CHAT_ACCENT,
                display: {
                  xs: unreadCount > 0 ? 'inline-flex' : 'none',
                  sm: 'inline-flex',
                },
              }}
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
          placeholder="Search by name or keyword"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          inputProps={{ 'aria-label': 'Search conversations' }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.04)'
                  : '#fff',
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
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear chat search"
                  onClick={() => setSearchQuery('')}
                  sx={{ minWidth: 36, minHeight: 36 }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, overflowX: 'auto', pb: 0.25 }}
        >
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
                bgcolor:
                  activeFilter === chip.key ? CHAT_ACCENT : 'transparent',
                color: activeFilter === chip.key ? '#fff' : 'text.primary',
              }}
            />
          ))}
          {deepLinkLoading && (
            <Chip label="Loading" size="small" sx={{ fontWeight: 700 }} />
          )}
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          Tip: use Unread to quickly reply to pending worker or hirer messages.
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mt: 0.25 }}
        >
          {hasConversationFilters
            ? `Showing ${filteredConversations.length} of ${totalConversationCount} conversations`
            : `Showing all ${totalConversationCount} conversations`}
        </Typography>
      </Box>

      {(realtimeIssue || !isConnected) && (
        <Box sx={{ px: mobile ? 1.5 : 2, pt: 1.5 }}>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {realtimeIssue ||
              'Weak connection detected. Chat updates may be delayed.'}
          </Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loadingConversations ? (
          <ConversationSkeleton />
        ) : filteredConversations.length > 0 ? (
          <List disablePadding>
            {filteredConversations.map((conversation, index) => {
              const participant = getConversationParticipant(
                conversation,
                currentUserId,
              );
              const title = getConversationTitle(conversation, currentUserId);
              const preview = getConversationPreview(
                conversation,
                currentUserId,
              );
              const conversationKey = getConversationKey(
                conversation,
                currentUserId,
              );
              const draftPreview = conversationKey
                ? String(draftsByConversation[conversationKey] || '').trim()
                : '';
              const hasDraftPreview = draftPreview.length > 0;
              const conversationPreviewLabel = hasDraftPreview
                ? `Draft: ${draftPreview}`
                : preview;
              const lastStamp =
                conversation.lastMessage?.timestamp ||
                conversation.lastMessage?.createdAt ||
                conversation.updatedAt;
              const unread =
                conversation.unreadCount || conversation.unread || 0;
              const isSelected =
                String(
                  selectedConversation?.id || selectedConversation?._id || '',
                ) === String(conversation.id || conversation._id);
              const isOnline = participant?.id
                ? isUserOnline(participant.id)
                : false;
              const jobContextLabel =
                conversation.jobRelated?.title || conversation.jobTitle || '';

              return (
                <React.Fragment
                  key={
                    conversation.id ||
                    conversation._id ||
                    `conversation-${index}`
                  }
                >
                  <ListItemButton
                    onClick={() => handleSelectConversation(conversation)}
                    selected={isSelected}
                    sx={{
                      py: mobile ? 1.1 : 1,
                      px: mobile ? 1.5 : 2,
                      borderLeft: isSelected
                        ? `4px solid ${CHAT_ACCENT}`
                        : '4px solid transparent',
                      bgcolor: isSelected
                        ? alpha(CHAT_ACCENT, 0.1)
                        : 'transparent',
                      '&:hover': { bgcolor: alpha(CHAT_ACCENT, 0.08) },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: { xs: 52, md: 48 } }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        variant={isOnline ? 'dot' : undefined}
                        color="success"
                      >
                        <Avatar
                          src={
                            getConversationAvatar(
                              conversation,
                              currentUserId,
                            ) || undefined
                          }
                          alt={title}
                          sx={{
                            width: { xs: 48, md: 44 },
                            height: { xs: 48, md: 44 },
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
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 1,
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={800}
                              noWrap
                              sx={{ minWidth: 0, lineHeight: 1.2 }}
                            >
                              {title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.2,
                                minWidth: 0,
                                overflow: 'hidden',
                                pr: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: mobile ? 2 : 1,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.35,
                                color: hasDraftPreview
                                  ? theme.palette.warning.dark
                                  : undefined,
                                fontWeight: hasDraftPreview ? 700 : 400,
                              }}
                            >
                              {conversationPreviewLabel}
                            </Typography>
                            {jobContextLabel && (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                noWrap
                                sx={{ display: 'block', mt: 0.35 }}
                              >
                                Job: {jobContextLabel}
                              </Typography>
                            )}
                          </Box>

                          <Stack
                            alignItems="flex-end"
                            spacing={0.35}
                            sx={{ flexShrink: 0, minWidth: { xs: 60, md: 68 } }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatConversationTime(lastStamp)}
                            </Typography>
                            {unread > 0 ? (
                              <Chip
                                size="small"
                                label={unread}
                                color="error"
                                sx={{ fontWeight: 800, minWidth: 28 }}
                              />
                            ) : hasDraftPreview ? (
                              <Chip
                                size="small"
                                label="Draft"
                                sx={{
                                  fontWeight: 800,
                                  height: 20,
                                  bgcolor: alpha(
                                    theme.palette.warning.main,
                                    0.16,
                                  ),
                                  color: theme.palette.warning.dark,
                                }}
                              />
                            ) : conversation.isPinned ? (
                              <StarIcon
                                sx={{ fontSize: 16, color: CHAT_ACCENT }}
                              />
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {isOnline ? 'Online' : 'Seen'}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItemButton>
                  {index < filteredConversations.length - 1 && (
                    <Divider component="li" />
                  )}
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
                  action={
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
                  }
                >
                  {deepLinkError}
                </Alert>
              </Box>
            ) : (
              <Box>
                {hasConversationFilters && (
                  <Box sx={{ px: 2, pb: 0.5 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  </Box>
                )}
                <EmptyState
                  variant="messages"
                  title={
                    searchQuery
                      ? 'No chats match your search'
                      : 'No conversations yet'
                  }
                  subtitle={
                    searchQuery || activeFilter !== 'all'
                      ? 'Try a different keyword or clear filters to see more chats.'
                      : user?.role === 'worker'
                        ? 'Browse jobs to start a conversation with a hirer.'
                        : 'Find workers to begin a new chat.'
                  }
                  actionLabel={
                    user?.role === 'worker' ? 'Browse jobs' : 'Find workers'
                  }
                  onAction={handleStartNewChat}
                />
              </Box>
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
              title="Select or start a conversation"
              subtitle="Pick a chat from the list or tap the + icon to connect with someone new."
              actionLabel={
                user?.role === 'worker' ? 'Browse jobs' : 'Find workers'
              }
              onAction={handleStartNewChat}
            />
          )}
        </Paper>
      );
    }

    const participant = getConversationParticipant(
      selectedConversation,
      currentUserId,
    );
    const title = getConversationTitle(selectedConversation, currentUserId);
    const avatarUrl = getConversationAvatar(
      selectedConversation,
      currentUserId,
    );
    const typingText = typingLabel;
    const jobTitle = selectedConversation.jobRelated?.title;
    const sendDisabled =
      isSending || (!messageText.trim() && selectedFiles.length === 0);

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
              variant={
                participant?.id && isUserOnline(participant.id)
                  ? 'dot'
                  : undefined
              }
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
              <Typography
                variant="h6"
                fontWeight={800}
                noWrap
                sx={{ lineHeight: 1.1 }}
              >
                {title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ display: 'block' }}
              >
                {typingText ||
                  (participant?.id && isUserOnline(participant.id)
                    ? 'Online'
                    : 'Last seen recently')}
              </Typography>
              {jobTitle && (
                <Chip
                  size="small"
                  label={jobTitle}
                  sx={{
                    mt: 0.5,
                    fontWeight: 700,
                    bgcolor: alpha(CHAT_ACCENT, 0.1),
                    color: CHAT_ACCENT,
                  }}
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
              {realtimeIssue ||
                'Weak connection detected. Your messages will queue and send automatically.'}
            </Alert>
          )}

          {loadingMessages ? (
            <Box sx={{ py: 2 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Box
                  key={`message-skeleton-${index}`}
                  sx={{
                    display: 'flex',
                    justifyContent: index % 2 ? 'flex-end' : 'flex-start',
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '72%', sm: '58%' },
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'action.selected',
                    }}
                  >
                    <Box
                      sx={{
                        width: '80%',
                        height: 10,
                        bgcolor: 'background.paper',
                        borderRadius: 999,
                        mb: 1,
                      }}
                    />
                    <Box
                      sx={{
                        width: '45%',
                        height: 10,
                        bgcolor: 'background.paper',
                        borderRadius: 999,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <EmptyState
                variant="messages"
                title="Start the conversation"
                subtitle="Send a message below or attach photos/documents to get started."
              />
            </Box>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={
                  message.id ||
                  message._id ||
                  `${message.timestamp || 'message'}-${index}`
                }
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
            bgcolor:
              theme.palette.mode === 'dark'
                ? 'rgba(11,20,26,0.98)'
                : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(14px)',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 1.25 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 0.75, px: 0.25 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700 }}
                >
                  Attachment review ({selectedFiles.length}/{MAX_ATTACHMENTS})
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(totalAttachmentSize)} total
                  </Typography>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleClearFiles}
                    startIcon={<DeleteSweepIcon sx={{ fontSize: 16 }} />}
                    sx={{ minHeight: 30, px: 1 }}
                  >
                    Clear all
                  </Button>
                </Stack>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{ overflowX: 'auto', pb: 0.5 }}
              >
                {selectedFiles.map((file, index) => {
                  const fileType = String(file.type || '').toLowerCase();
                  const isVideoFile = fileType.startsWith('video/');
                  const isDocumentFile =
                    fileType.includes('pdf') ||
                    fileType.includes('word') ||
                    fileType.includes('document');
                  const AttachmentIcon = isVideoFile
                    ? VideocamIcon
                    : isDocumentFile
                      ? DescriptionIcon
                      : InsertDriveFileIcon;

                  return (
                    <Box
                      key={`${file.name}-${index}`}
                      sx={{
                        minWidth: 136,
                        maxWidth: 190,
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

                      {fileType.startsWith('image/') ? (
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
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.75 }}
                        >
                          <AttachmentIcon
                            sx={{ fontSize: 18, color: CHAT_ACCENT }}
                          />
                          <Typography variant="caption" fontWeight={700} noWrap>
                            {getAttachmentKindLabel(file)}
                          </Typography>
                        </Stack>
                      )}

                      <Typography
                        variant="caption"
                        fontWeight={700}
                        noWrap
                        sx={{ display: 'block' }}
                      >
                        {file.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {sendError && (
            <Alert
              severity="error"
              sx={{ mb: 1.25, borderRadius: 2 }}
              onClose={() => setSendError('')}
            >
              {sendError}
            </Alert>
          )}

          {messageText.trim().length === 0 && (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ mb: 1, overflowX: 'auto', pb: 0.25 }}
            >
              {quickReplyTemplates.map((template) => (
                <Chip
                  key={template}
                  label={template}
                  onClick={() => handleQuickTemplateSelect(template)}
                  clickable
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    bgcolor: alpha(CHAT_ACCENT, 0.05),
                    borderColor: alpha(CHAT_ACCENT, 0.22),
                    '& .MuiChip-label': { px: 1.25 },
                  }}
                />
              ))}
            </Stack>
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
              <span>
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file"
                  disabled={remainingAttachmentSlots === 0}
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
              </span>
            </Tooltip>

            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={
                selectedFiles.length > 0
                  ? 'Add a note for these attachments (optional)'
                  : 'Type your message (price, timing, and next step)'
              }
              value={messageText}
              onChange={(event) => {
                const nextValue = event.target.value;
                setMessageText(nextValue);
                if (selectedConversationKey) {
                  setDraftsByConversation((previous) => {
                    if (previous[selectedConversationKey] === nextValue) {
                      return previous;
                    }

                    return {
                      ...previous,
                      [selectedConversationKey]: nextValue,
                    };
                  });
                }
                handleTyping();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSendMessage(event);
                }
              }}
              inputProps={{ 'aria-label': 'Type message', maxLength: 1000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 999,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : '#fff',
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
                disabled={sendDisabled}
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
                {isSending ? (
                  <CircularProgress size={18} sx={{ color: 'inherit' }} />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </Tooltip>
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.75, pl: 0.5 }}
          >
            {selectedFiles.length > 0
              ? `${selectedFiles.length} attached • ${remainingAttachmentSlots} slot${remainingAttachmentSlots === 1 ? '' : 's'} left • ${messageCharacterCount}/1000 chars • Press Enter to send`
              : `Press Enter for quick send • Shift+Enter for new line • ${messageCharacterCount}/1000 chars • Max ${MAX_ATTACHMENTS} files (10MB limit)`}
          </Typography>
        </Box>
      </Paper>
    );
  };

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 0, md: 2 }, pb: { xs: 0, md: 2 }, overflow: 'hidden' }}
    >
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
        <SEO
          title="Messages"
          description="Secure real-time conversations on Kelmah."
          openGraph={{ type: 'website' }}
        />

        <Box
          sx={{
            px: { xs: 0, md: 2 },
            py: { xs: 0, md: 2 },
            flex: 1,
            display: 'flex',
          }}
        >
          {isMobile ? (
            selectedConversation ? (
              <Box sx={{ flex: 1, minHeight: 0 }}>{renderChatPane(true)}</Box>
            ) : (
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {renderConversationList(true)}
              </Box>
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

        {!selectedConversation &&
          !isMobile &&
          (loadingConversations || deepLinkLoading || deepLinkError) && (
            <Box sx={{ px: 2, pb: 2 }}>
              {deepLinkError ? (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      onClick={() => navigate('/messages', { replace: true })}
                    >
                      Retry
                    </Button>
                  }
                >
                  {deepLinkError}
                </Alert>
              ) : deepLinkLoading ? (
                <Alert severity="info">Connecting securely...</Alert>
              ) : loadingConversations ? (
                <Alert severity="info">Loading your chats...</Alert>
              ) : null}
            </Box>
          )}
      </Box>
    </PageCanvas>
  );
};

export default MessagingPage;
