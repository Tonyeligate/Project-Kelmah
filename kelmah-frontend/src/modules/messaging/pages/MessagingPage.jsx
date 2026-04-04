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
  useMediaQuery,
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
  PushPin as PushPinIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Star as StarIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import SEO from '../../common/components/common/SEO';
import EmptyState from '../../../components/common/EmptyState';
import PageCanvas from '../../common/components/PageCanvas';
import { useMessages } from '../contexts/MessageContext';
import { messagingService } from '../services/messagingService';
import useKeyboardVisible from '../../../hooks/useKeyboardVisible';
import { HEADER_HEIGHT_MOBILE, TOUCH_TARGET_MIN } from '@/constants/layout';
import { withBottomNavSafeArea, withSafeAreaBottom } from '@/utils/safeArea';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const DRAFT_STORAGE_KEY = 'kelmah.messaging.drafts.v1';
const SCROLL_TO_LATEST_THRESHOLD = 140;

const FILTER_LABELS = {
  all: 'All conversations',
  unread: 'Unread conversations',
  pinned: 'Pinned conversations',
  drafts: 'Draft conversations',
  'unread-drafts': 'Unread + drafts',
};

const getCurrentUserId = (user) =>
  user?.id || user?._id || user?.userId || user?.sub || null;

const resolveParticipantId = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'string') return participant;
  return participant.id || participant._id || participant.userId || null;
};

const isConversationObject = (conversation) =>
  Boolean(conversation && typeof conversation === 'object');

const getConversationParticipant = (conversation = {}, currentUserId) => {
  const conversationRecord = isConversationObject(conversation)
    ? conversation
    : {};
  const participants = Array.isArray(conversationRecord.participants)
    ? conversationRecord.participants
    : [];
  const otherParticipant = participants.find((participant) => {
    const participantId = resolveParticipantId(participant);
    return participantId && String(participantId) !== String(currentUserId);
  });

  return otherParticipant || participants[0] || null;
};

const getConversationTitle = (conversation = {}, currentUserId) => {
  const conversationRecord = isConversationObject(conversation)
    ? conversation
    : {};
  const participant = getConversationParticipant(conversation, currentUserId);
  if (!participant) return conversationRecord.title || 'New conversation';

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
  const conversationRecord = isConversationObject(conversation)
    ? conversation
    : {};
  const lastMessage =
    conversationRecord.lastMessage || conversationRecord.latestMessage || null;
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

const getMessageDayKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'yyyy-MM-dd');
};

const formatMessageDayLabel = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
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
  if (!isConversationObject(conversation)) {
    return null;
  }

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

const getDraftEntry = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value
      ? {
          text: value,
          updatedAt: null,
        }
      : null;
  }

  const text = String(value.text || '');
  if (!text) {
    return null;
  }

  return {
    text,
    updatedAt: value.updatedAt || null,
  };
};

const getDraftText = (value) => getDraftEntry(value)?.text || '';

const normalizeDraftMap = (value) => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce((acc, [key, draftValue]) => {
    const entry = getDraftEntry(draftValue);
    if (entry?.text?.trim()) {
      acc[key] = {
        text: entry.text,
        updatedAt: entry.updatedAt || Date.now(),
      };
    }
    return acc;
  }, {});
};

const formatDraftSavedLabel = (value) => {
  if (!value) {
    return 'saved recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'saved recently';
  }

  return `saved ${formatDistanceToNow(date, { addSuffix: true })}`;
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

const ConversationSkeleton = ({ chatTheme }) => {
  const { border, panelBg, header, mutedFill } = chatTheme;
  return (
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
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: border,
            bgcolor: panelBg,
          }}
        >
          <CircularProgress size={18} thickness={5} sx={{ color: header }} />
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                width: '48%',
                height: 14,
                bgcolor: mutedFill,
                borderRadius: 999,
                mb: 1,
              }}
            />
            <Box
              sx={{
                width: '84%',
                height: 10,
                bgcolor: mutedFill,
                borderRadius: 999,
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

ConversationSkeleton.propTypes = {
  chatTheme: PropTypes.shape({
    border: PropTypes.string,
    panelBg: PropTypes.string,
    header: PropTypes.string,
    mutedFill: PropTypes.string,
  }).isRequired,
};

const MessageBubble = ({ message, currentUserId, chatTheme }) => {
  const {
    accentDark,
    header,
    border,
    outgoingBubble,
    incomingBubble,
    textPrimary,
  } = chatTheme;

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
        mb: { xs: 0.75, sm: 0.9, md: 1.05 },
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: '91%', sm: '84%', md: '74%', lg: '68%' },
          px: { xs: 1.25, sm: 1.4, md: 1.55 },
          py: { xs: 0.85, sm: 0.95, md: 1.05 },
          borderRadius: isOwn ? '10px 10px 4px 10px' : '10px 10px 10px 4px',
          bgcolor: isOwn ? outgoingBubble : incomingBubble,
          color: textPrimary,
          boxShadow: '0 1px 1px rgba(11, 20, 26, 0.12)',
          border: '1px solid',
          borderColor: isOwn ? alpha(accentDark, 0.35) : border,
        }}
      >
        {text && (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.45,
              fontSize: { xs: '0.9rem', sm: '0.92rem', md: '0.94rem' },
            }}
          >
            {text}
          </Typography>
        )}

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
                    bgcolor: isOwn ? alpha(header, 0.08) : alpha(header, 0.06),
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
              opacity: 0.95,
              color: alpha(textPrimary, 0.74),
              fontSize: '0.72rem',
            }}
          >
            {formatMessageTime(message.timestamp || message.createdAt)}
          </Typography>
          {isOwn && isSending && (
            <ScheduleIcon sx={{ fontSize: 14, opacity: 0.8 }} />
          )}
          {isOwn && isFailed && (
            <CloseIcon sx={{ fontSize: 14, color: '#D32F2F' }} />
          )}
          {isOwn && isRead && (
            <DoneAllIcon sx={{ fontSize: 14, color: accentDark }} />
          )}
          {isOwn && isDelivered && (
            <DoneAllIcon sx={{ fontSize: 14, color: accentDark }} />
          )}
          {isOwn && isSent && (
            <CheckIcon sx={{ fontSize: 14, color: accentDark }} />
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
  chatTheme: PropTypes.shape({
    accentDark: PropTypes.string,
    header: PropTypes.string,
    border: PropTypes.string,
    outgoingBubble: PropTypes.string,
    incomingBubble: PropTypes.string,
    textPrimary: PropTypes.string,
  }).isRequired,
};

const MessageDayDivider = ({ label, chatTheme }) => {
  const { textPrimary, panelHeader } = chatTheme;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        my: { xs: 1.25, md: 1.45 },
      }}
    >
      <Divider sx={{ flex: 1, borderColor: alpha(textPrimary, 0.15) }} />
      <Chip
        size="small"
        label={label}
        sx={{
          fontWeight: 700,
          color: alpha(textPrimary, 0.78),
          bgcolor: alpha(panelHeader, 0.98),
          border: '1px solid',
          borderColor: alpha(textPrimary, 0.18),
        }}
      />
      <Divider sx={{ flex: 1, borderColor: alpha(textPrimary, 0.15) }} />
    </Box>
  );
};

MessageDayDivider.propTypes = {
  label: PropTypes.string.isRequired,
  chatTheme: PropTypes.shape({
    textPrimary: PropTypes.string,
    panelHeader: PropTypes.string,
  }).isRequired,
};

const MessagingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  const { isKeyboardVisible } = useKeyboardVisible();

  const isDarkMode = theme.palette.mode === 'dark';
  const chatTheme = useMemo(
    () => ({
      accent: '#FFD700',
      accentDark: '#B8860B',
      header: isDarkMode
        ? alpha(theme.palette.background.paper, 0.12)
        : '#1B1C22',
      bgLight: isDarkMode ? theme.palette.background.default : '#F3E8CB',
      panelBg: isDarkMode ? theme.palette.background.paper : '#FFFDF4',
      panelHeader: isDarkMode
        ? alpha(theme.palette.background.paper, 0.16)
        : '#F4EFE3',
      messageBg: isDarkMode
        ? alpha(theme.palette.background.paper, 0.08)
        : '#F9F7ED',
      outgoingBubble: isDarkMode
        ? alpha(theme.palette.primary.main, 0.16)
        : '#F6E7BE',
      incomingBubble: isDarkMode ? theme.palette.background.paper : '#FFFFFF',
      textPrimary: theme.palette.text.primary,
      textSecondary: theme.palette.text.secondary,
      border: theme.palette.divider,
      mutedFill: isDarkMode
        ? alpha(theme.palette.text.secondary, 0.12)
        : '#E8DFC7',
    }),
    [isDarkMode, theme],
  );

  const {
    accent: CHAT_ACCENT,
    accentDark: CHAT_ACCENT_DARK,
    header: CHAT_HEADER,
    bgLight: CHAT_BG_LIGHT,
    panelBg: CHAT_PANEL_BG,
    panelHeader: CHAT_PANEL_HEADER,
    messageBg: CHAT_MESSAGE_BG,
    textPrimary: CHAT_TEXT_PRIMARY,
    textSecondary: CHAT_TEXT_SECONDARY,
    border: CHAT_BORDER,
    mutedFill: CHAT_MUTED_FILL,
  } = chatTheme;

  const currentUserId = useMemo(() => getCurrentUserId(user), [user]);
  const searchDestination = useMemo(
    () => getSearchDestination(user?.role),
    [user?.role],
  );
  const emptyStateActionLabel = useMemo(
    () => (user?.role === 'worker' ? 'Browse jobs' : 'Find talent'),
    [user?.role],
  );
  const emptyConversationSubtitle = useMemo(
    () =>
      user?.role === 'worker'
        ? 'Browse open jobs and message a hirer directly to get started.'
        : 'Find talent and send your first message with job details.',
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

  const safeConversations = useMemo(
    () =>
      Array.isArray(conversations)
        ? conversations.filter((conversation) =>
            isConversationObject(conversation),
          )
        : [],
    [conversations],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [deepLinkLoading, setDeepLinkLoading] = useState(false);
  const [deepLinkError, setDeepLinkError] = useState('');
  const [sendError, setSendError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [draftRestoreNotice, setDraftRestoreNotice] = useState('');
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [draftsByConversation, setDraftsByConversation] = useState(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const storedDrafts = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!storedDrafts) {
        return {};
      }

      const parsedDrafts = JSON.parse(storedDrafts);
      return normalizeDraftMap(parsedDrafts);
    } catch {
      return {};
    }
  });

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const deepLinkHandledRef = useRef('');
  const previousConversationKeyRef = useRef(null);
  const lastDraftNoticeRef = useRef('');

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
  const selectedDraftEntry = useMemo(
    () =>
      selectedConversationKey
        ? getDraftEntry(draftsByConversation[selectedConversationKey])
        : null,
    [draftsByConversation, selectedConversationKey],
  );
  const selectedDraftText = selectedDraftEntry?.text || '';
  const hasSelectedDraft = selectedDraftText.trim().length > 0;
  const selectedDraftSavedLabel = hasSelectedDraft
    ? formatDraftSavedLabel(selectedDraftEntry?.updatedAt)
    : '';
  const selectedDraftPreview = hasSelectedDraft
    ? selectedDraftText.length > 180
      ? `${selectedDraftText.slice(0, 180).trim()}...`
      : selectedDraftText
    : '';
  const unsentDraftCount = useMemo(
    () =>
      Object.values(draftsByConversation).filter((entry) =>
        getDraftText(entry).trim(),
      ).length,
    [draftsByConversation],
  );
  const draftConversationCount = useMemo(() => {
    if (safeConversations.length === 0) {
      return 0;
    }

    return safeConversations.reduce((count, conversation) => {
      const conversationKey = getConversationKey(conversation, currentUserId);
      const hasDraft = conversationKey
        ? Boolean(getDraftText(draftsByConversation[conversationKey]).trim())
        : false;
      return hasDraft ? count + 1 : count;
    }, 0);
  }, [currentUserId, draftsByConversation, safeConversations]);
  const unreadDraftConversationCount = useMemo(() => {
    if (safeConversations.length === 0) {
      return 0;
    }

    return safeConversations.reduce((count, conversation) => {
      const unread = conversation.unreadCount || conversation.unread || 0;
      if (unread <= 0) {
        return count;
      }

      const conversationKey = getConversationKey(conversation, currentUserId);
      const hasDraft = conversationKey
        ? Boolean(getDraftText(draftsByConversation[conversationKey]).trim())
        : false;

      return hasDraft ? count + 1 : count;
    }, 0);
  }, [currentUserId, draftsByConversation, safeConversations]);

  const handleDiscardSelectedDraft = useCallback(() => {
    if (!selectedConversationKey) {
      return;
    }

    setDraftsByConversation((previous) => {
      if (!(selectedConversationKey in previous)) {
        return previous;
      }

      const nextDrafts = { ...previous };
      delete nextDrafts[selectedConversationKey];
      return nextDrafts;
    });

    setMessageText('');
    setSendError('');
  }, [selectedConversationKey]);

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

    const nextDraft = getDraftText(
      draftsByConversation[selectedConversationKey],
    );
    setMessageText((previous) =>
      previous === nextDraft ? previous : nextDraft,
    );
  }, [draftsByConversation, selectedConversationKey]);

  useEffect(() => {
    const previousKey = previousConversationKeyRef.current;
    const didSwitchConversation =
      previousKey !== null && previousKey !== selectedConversationKey;

    if (didSwitchConversation) {
      setSelectedFiles([]);
      setSendError('');

      if (selectedConversationKey) {
        const restoredDraft = getDraftEntry(
          draftsByConversation[selectedConversationKey],
        );
        if (restoredDraft?.text?.trim()) {
          const noticeKey = `${selectedConversationKey}:${restoredDraft.updatedAt || ''}`;
          if (lastDraftNoticeRef.current !== noticeKey) {
            setDraftRestoreNotice(
              `Draft restored (${formatDraftSavedLabel(restoredDraft.updatedAt)}).`,
            );
            lastDraftNoticeRef.current = noticeKey;
          }
        } else {
          setDraftRestoreNotice('');
        }
      } else {
        setDraftRestoreNotice('');
      }
    }

    previousConversationKeyRef.current = selectedConversationKey;
  }, [draftsByConversation, selectedConversationKey]);

  useEffect(() => {
    if (!draftRestoreNotice) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setDraftRestoreNotice('');
    }, 2600);

    return () => clearTimeout(timeoutId);
  }, [draftRestoreNotice]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const normalizedDrafts = normalizeDraftMap(draftsByConversation);
      if (Object.keys(normalizedDrafts).length === 0) {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(normalizedDrafts),
      );
    } catch {
      // Ignore storage write failures silently.
    }
  }, [draftsByConversation]);

  useEffect(() => {
    if (!messageEndRef.current) return;
    messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setShowScrollToLatest(false);
  }, [messages, selectedConversation?.id]);

  const handleMessagesScroll = useCallback(() => {
    const node = messagesScrollRef.current;
    if (!node) {
      return;
    }

    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    setShowScrollToLatest(distanceFromBottom > SCROLL_TO_LATEST_THRESHOLD);
  }, []);

  useEffect(() => {
    const node = messagesScrollRef.current;
    if (!node) {
      return undefined;
    }

    node.addEventListener('scroll', handleMessagesScroll, { passive: true });
    handleMessagesScroll();

    return () => {
      node.removeEventListener('scroll', handleMessagesScroll);
    };
  }, [handleMessagesScroll, selectedConversation?.id, messages.length]);

  const handleScrollToLatest = useCallback(() => {
    if (!messageEndRef.current) {
      return;
    }

    messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setShowScrollToLatest(false);
  }, []);

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
      ? safeConversations.find(
          (conversation) =>
            String(conversation.id || conversation._id) ===
            String(conversationId),
        )
      : recipientId
        ? safeConversations.find((conversation) =>
            (Array.isArray(conversation.participants)
              ? conversation.participants
              : []
            ).some(
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
    safeConversations,
    loadingConversations,
    location.search,
    location.state,
    openTemporaryConversation,
    selectConversation,
  ]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = [...safeConversations];

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

    if (activeFilter === 'drafts') {
      list = list.filter((conversation) => {
        const conversationKey = getConversationKey(conversation, currentUserId);
        return conversationKey
          ? Boolean(getDraftText(draftsByConversation[conversationKey]).trim())
          : false;
      });
    }

    if (activeFilter === 'unread-drafts') {
      list = list.filter((conversation) => {
        const unread = conversation.unreadCount || conversation.unread || 0;
        if (unread <= 0) {
          return false;
        }

        const conversationKey = getConversationKey(conversation, currentUserId);
        return conversationKey
          ? Boolean(getDraftText(draftsByConversation[conversationKey]).trim())
          : false;
      });
    }

    list.sort((left, right) => {
      const leftDraftKey = getConversationKey(left, currentUserId);
      const rightDraftKey = getConversationKey(right, currentUserId);
      const leftDraftEntry = leftDraftKey
        ? getDraftEntry(draftsByConversation[leftDraftKey])
        : null;
      const rightDraftEntry = rightDraftKey
        ? getDraftEntry(draftsByConversation[rightDraftKey])
        : null;
      const leftHasDraft = Boolean(leftDraftEntry?.text?.trim());
      const rightHasDraft = Boolean(rightDraftEntry?.text?.trim());

      if (leftHasDraft !== rightHasDraft) {
        return rightHasDraft ? 1 : -1;
      }

      if (leftHasDraft && rightHasDraft) {
        const leftDraftStamp = new Date(
          leftDraftEntry?.updatedAt || 0,
        ).getTime();
        const rightDraftStamp = new Date(
          rightDraftEntry?.updatedAt || 0,
        ).getTime();

        if (leftDraftStamp !== rightDraftStamp) {
          return rightDraftStamp - leftDraftStamp;
        }
      }

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
  }, [
    activeFilter,
    currentUserId,
    draftsByConversation,
    safeConversations,
    searchQuery,
  ]);

  const totalConversationCount = safeConversations.length;
  const hasConversationFilters =
    activeFilter !== 'all' || searchQuery.trim() !== '';
  const selectedConversationId =
    selectedConversation?.id || selectedConversation?._id || null;
  const activeFilterLabel = FILTER_LABELS[activeFilter] || 'Filtered view';

  useEffect(() => {
    if (!selectedConversationId || activeFilter === 'all') {
      return;
    }

    if (searchQuery.trim()) {
      return;
    }

    const selectedConversationIsVisible = filteredConversations.some(
      (conversation) =>
        String(conversation.id || conversation._id) ===
        String(selectedConversationId),
    );

    if (!selectedConversationIsVisible) {
      setActiveFilter('all');
    }
  }, [
    activeFilter,
    filteredConversations,
    searchQuery,
    selectedConversationId,
  ]);

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
          [selectedConversationKey]: {
            text: template,
            updatedAt: Date.now(),
          },
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
        borderRadius: 0,
        border: 'none',
        borderRight: mobile ? 'none' : '1px solid',
        borderColor: CHAT_BORDER,
        bgcolor: CHAT_PANEL_BG,
      }}
    >
      <Box
        sx={{
          px: mobile ? { xs: 1.1, sm: 1.5 } : { md: 1.5, lg: 1.75, xl: 2 },
          pt: mobile ? { xs: 1.1, sm: 1.5 } : { md: 1.5, lg: 1.75, xl: 2 },
          pb: mobile ? { xs: 1.1, sm: 1.35 } : { md: 1.15, lg: 1.35 },
          position: 'sticky',
          top: 0,
          zIndex: 3,
          bgcolor: CHAT_PANEL_HEADER,
          borderBottom: '1px solid',
          borderColor: CHAT_BORDER,
          backdropFilter: 'blur(16px)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: { xs: 0.85, sm: 1.1, md: 1.15 } }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              Chats
            </Typography>
            <Typography variant="caption" sx={{ color: CHAT_TEXT_SECONDARY }}>
              Kelmah service inbox
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
                minHeight: mobile ? TOUCH_TARGET_MIN : undefined,
                bgcolor: alpha(CHAT_HEADER, 0.12),
                color: CHAT_HEADER,
                '& .MuiChip-label': {
                  px: mobile ? 1.1 : undefined,
                },
                display: {
                  xs: unreadCount > 0 ? 'inline-flex' : 'none',
                  sm: 'inline-flex',
                },
              }}
            />
            {unsentDraftCount > 0 && (
              <Chip
                size="small"
                label={`${unsentDraftCount} draft${unsentDraftCount === 1 ? '' : 's'}`}
                icon={<PushPinIcon sx={{ fontSize: 12 }} />}
                sx={{
                  fontWeight: 700,
                  minHeight: mobile ? TOUCH_TARGET_MIN : undefined,
                  bgcolor: alpha(theme.palette.warning.main, 0.16),
                  color: theme.palette.warning.dark,
                  '& .MuiChip-label': {
                    px: mobile ? 1.1 : undefined,
                  },
                  '& .MuiChip-icon': {
                    color: theme.palette.warning.dark,
                  },
                }}
              />
            )}
            <Tooltip title="Start a new chat">
              <IconButton
                onClick={handleStartNewChat}
                aria-label="Start a new chat"
                sx={{
                  minWidth: TOUCH_TARGET_MIN,
                  minHeight: TOUCH_TARGET_MIN,
                  bgcolor: CHAT_HEADER,
                  color: '#fff',
                  '&:hover': { bgcolor: CHAT_ACCENT_DARK },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <TextField
          fullWidth
          size={mobile ? 'medium' : 'small'}
          placeholder="Search by name or keyword"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          inputProps={{ 'aria-label': 'Search conversations' }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: CHAT_PANEL_BG,
              '& fieldset': { borderColor: CHAT_BORDER },
              '&:hover fieldset': { borderColor: CHAT_HEADER },
              '&.Mui-focused fieldset': { borderColor: CHAT_HEADER },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: CHAT_TEXT_SECONDARY, fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear chat search"
                  onClick={() => setSearchQuery('')}
                  sx={{
                    minWidth: TOUCH_TARGET_MIN,
                    minHeight: TOUCH_TARGET_MIN,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <Stack
          direction="row"
          spacing={0.75}
          useFlexGap
          sx={{
            mt: { xs: 1, sm: 1.25, md: 1.35 },
            pb: 0.15,
            pr: mobile ? 0.35 : 0,
            maxWidth: '100%',
            overflowX: 'visible',
            flexWrap: 'wrap',
            rowGap: 0.75,
          }}
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
              size={mobile ? 'medium' : 'small'}
              variant={activeFilter === chip.key ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                minWidth: mobile ? TOUCH_TARGET_MIN : undefined,
                minHeight: mobile ? TOUCH_TARGET_MIN : undefined,
                borderColor: alpha(CHAT_HEADER, 0.28),
                bgcolor:
                  activeFilter === chip.key ? CHAT_HEADER : CHAT_PANEL_BG,
                color: activeFilter === chip.key ? '#fff' : CHAT_TEXT_PRIMARY,
                opacity: activeFilter === chip.key ? 1 : 0.82,
                '& .MuiChip-label': {
                  px: mobile ? 1.15 : undefined,
                },
              }}
            />
          ))}
          <Chip
            label={
              draftConversationCount > 0
                ? `Drafts (${draftConversationCount})`
                : 'Drafts'
            }
            onClick={() => setActiveFilter('drafts')}
            clickable
            size={mobile ? 'medium' : 'small'}
            icon={<PushPinIcon sx={{ fontSize: 14 }} />}
            variant={activeFilter === 'drafts' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              minWidth: mobile ? TOUCH_TARGET_MIN : undefined,
              minHeight: mobile ? TOUCH_TARGET_MIN : undefined,
              borderColor: alpha(theme.palette.warning.main, 0.3),
              bgcolor:
                activeFilter === 'drafts'
                  ? theme.palette.warning.main
                  : CHAT_PANEL_BG,
              color: activeFilter === 'drafts' ? '#111' : CHAT_TEXT_PRIMARY,
              opacity: activeFilter === 'drafts' ? 1 : 0.82,
              '& .MuiChip-label': {
                px: mobile ? 1.15 : undefined,
              },
              '& .MuiChip-icon': {
                color:
                  activeFilter === 'drafts'
                    ? '#111'
                    : theme.palette.warning.main,
              },
            }}
          />
          <Chip
            label={
              unreadDraftConversationCount > 0
                ? `Unread + Drafts (${unreadDraftConversationCount})`
                : 'Unread + Drafts'
            }
            onClick={() => setActiveFilter('unread-drafts')}
            clickable
            size={mobile ? 'medium' : 'small'}
            icon={<PushPinIcon sx={{ fontSize: 14 }} />}
            variant={activeFilter === 'unread-drafts' ? 'filled' : 'outlined'}
            sx={{
              fontWeight: 700,
              minWidth: mobile ? TOUCH_TARGET_MIN : undefined,
              minHeight: mobile ? TOUCH_TARGET_MIN : undefined,
              borderColor: alpha(theme.palette.error.main, 0.35),
              bgcolor:
                activeFilter === 'unread-drafts'
                  ? theme.palette.error.main
                  : CHAT_PANEL_BG,
              color:
                activeFilter === 'unread-drafts' ? '#fff' : CHAT_TEXT_PRIMARY,
              opacity: activeFilter === 'unread-drafts' ? 1 : 0.82,
              '& .MuiChip-label': {
                px: mobile ? 1.15 : undefined,
              },
              '& .MuiChip-icon': {
                color:
                  activeFilter === 'unread-drafts'
                    ? '#fff'
                    : theme.palette.error.main,
              },
            }}
          />
          {deepLinkLoading && (
            <Chip label="Loading" size="small" sx={{ fontWeight: 700 }} />
          )}
        </Stack>

        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 1, color: CHAT_TEXT_SECONDARY }}
        >
          Tip: use Unread for pending replies, Drafts for unsent notes, or
          Unread + Drafts for urgent follow-up.
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: 'block', mt: 0.25, color: CHAT_TEXT_SECONDARY }}
        >
          {hasConversationFilters
            ? `Showing ${filteredConversations.length} of ${totalConversationCount} conversations | ${activeFilterLabel}`
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
          <ConversationSkeleton chatTheme={chatTheme} />
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
              const draftEntry = conversationKey
                ? getDraftEntry(draftsByConversation[conversationKey])
                : null;
              const draftPreview = String(draftEntry?.text || '').trim();
              const hasDraftPreview = draftPreview.length > 0;
              const draftSavedLabel = hasDraftPreview
                ? formatDraftSavedLabel(draftEntry?.updatedAt)
                : '';
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
              const participantId = resolveParticipantId(participant);
              const isOnline = participantId
                ? isUserOnline(participantId)
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
                      py: mobile
                        ? { xs: 0.85, sm: 1.05 }
                        : { md: 0.85, lg: 0.95, xl: 1 },
                      px: mobile
                        ? { xs: 1, sm: 1.35 }
                        : { md: 1.2, lg: 1.5, xl: 1.6 },
                      borderLeft: isSelected
                        ? `4px solid ${CHAT_ACCENT_DARK}`
                        : '4px solid transparent',
                      bgcolor: isSelected
                        ? alpha(CHAT_ACCENT_DARK, 0.12)
                        : 'transparent',
                      boxShadow: isSelected
                        ? `inset 0 0 0 1px ${alpha(CHAT_ACCENT_DARK, 0.25)}`
                        : 'none',
                      '&:hover': { bgcolor: alpha(CHAT_ACCENT_DARK, 0.06) },
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
                            width: {
                              xs: 40,
                              sm: 44,
                              md: 40,
                              lg: 42,
                              xl: 44,
                            },
                            height: {
                              xs: 40,
                              sm: 44,
                              md: 40,
                              lg: 42,
                              xl: 44,
                            },
                            bgcolor: alpha(CHAT_HEADER, 0.12),
                            color: CHAT_HEADER,
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
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{ minWidth: 0 }}
                            >
                              <Typography
                                variant="subtitle2"
                                fontWeight={800}
                                noWrap
                                sx={{
                                  minWidth: 0,
                                  lineHeight: 1.2,
                                  flex: 1,
                                  fontSize: {
                                    xs: '0.86rem',
                                    sm: '0.9rem',
                                    md: '0.86rem',
                                    lg: '0.89rem',
                                  },
                                }}
                              >
                                {title}
                              </Typography>
                              {hasDraftPreview && (
                                <Tooltip
                                  title={`Draft pinned (${draftSavedLabel})`}
                                >
                                  <PushPinIcon
                                    sx={{
                                      fontSize: 14,
                                      color: theme.palette.warning.main,
                                      opacity: 0.8,
                                      transform: 'rotate(18deg)',
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Stack>
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.2,
                                minWidth: 0,
                                overflow: 'hidden',
                                pr: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: mobile ? 2 : 1,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.25,
                                fontSize: {
                                  xs: '0.78rem',
                                  sm: '0.82rem',
                                  md: '0.78rem',
                                  lg: '0.82rem',
                                },
                                color: hasDraftPreview
                                  ? theme.palette.warning.dark
                                  : CHAT_TEXT_SECONDARY,
                                fontWeight: hasDraftPreview ? 700 : 500,
                              }}
                            >
                              {conversationPreviewLabel}
                            </Typography>
                            {jobContextLabel && (
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{
                                  display: 'block',
                                  mt: 0.35,
                                  color: alpha(CHAT_TEXT_PRIMARY, 0.74),
                                  fontWeight: 500,
                                }}
                              >
                                Job: {jobContextLabel}
                              </Typography>
                            )}
                          </Box>

                          <Stack
                            alignItems="flex-end"
                            spacing={0.25}
                            sx={{
                              flexShrink: 0,
                              minWidth: {
                                xs: 52,
                                sm: 58,
                                md: 58,
                                lg: 64,
                                xl: 68,
                              },
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: alpha(CHAT_TEXT_PRIMARY, 0.72),
                                fontWeight: hasDraftPreview ? 700 : 600,
                                fontSize: '0.76rem',
                              }}
                            >
                              {hasDraftPreview
                                ? draftSavedLabel
                                : formatConversationTime(lastStamp)}
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
                                label="Unsent"
                                icon={<PushPinIcon sx={{ fontSize: 12 }} />}
                                sx={{
                                  fontWeight: 800,
                                  height: 20,
                                  bgcolor: alpha(
                                    theme.palette.warning.main,
                                    0.16,
                                  ),
                                  color: theme.palette.warning.dark,
                                  '& .MuiChip-icon': {
                                    color: theme.palette.warning.dark,
                                  },
                                }}
                              />
                            ) : conversation.isPinned ? (
                              <StarIcon
                                sx={{ fontSize: 16, color: CHAT_ACCENT }}
                              />
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: alpha(CHAT_TEXT_PRIMARY, 0.68),
                                  fontSize: '0.74rem',
                                  fontWeight: 500,
                                }}
                              >
                                {isOnline ? 'Online now' : 'Offline'}
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
                      ? activeFilter === 'drafts'
                        ? 'No conversations currently have unsent drafts. Clear filters to view all chats.'
                        : activeFilter === 'unread-drafts'
                          ? 'No conversations currently match both unread and draft conditions. Try Unread or Drafts separately.'
                          : 'Try a different keyword or clear filters to see more chats.'
                      : emptyConversationSubtitle
                  }
                  actionLabel={emptyStateActionLabel}
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
            borderRadius: 0,
            border: 'none',
            bgcolor: CHAT_MESSAGE_BG,
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
              actionLabel={emptyStateActionLabel}
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
    const participantPresenceId = resolveParticipantId(participant);
    const typingText = typingLabel;
    const jobTitle = selectedConversation.jobRelated?.title;
    const sendDisabled =
      isSending || (!messageText.trim() && selectedFiles.length === 0);
    const mobileComposerOffset =
      mobile && !isKeyboardVisible ? withBottomNavSafeArea(0) : 0;
    const quickReplyBarVisible = messageText.trim().length === 0;

    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 0,
          border: 'none',
          bgcolor: CHAT_MESSAGE_BG,
        }}
      >
        <AppBar
          data-testid="messages-chat-header"
          position="sticky"
          elevation={0}
          sx={{
            top: 0,
            zIndex: 4,
            bgcolor: CHAT_HEADER,
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.22)',
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: 56,
                sm: 60,
                md: 62,
                lg: 66,
                xl: 70,
              },
              px: { xs: 0.65, sm: 1, md: 1.25, lg: 1.5, xl: 1.75 },
            }}
          >
            {mobile && (
              <IconButton
                onClick={handleBackToList}
                aria-label="Back to conversations"
                sx={{
                  mr: 0.5,
                  minWidth: TOUCH_TARGET_MIN,
                  minHeight: TOUCH_TARGET_MIN,
                  color: '#fff',
                  bgcolor: alpha('#fff', 0.18),
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}

            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant={
                participantPresenceId && isUserOnline(participantPresenceId)
                  ? 'dot'
                  : undefined
              }
              color="success"
            >
              <Avatar
                src={avatarUrl || undefined}
                alt={title}
                sx={{
                  width: { xs: 34, sm: 38, md: 38, lg: 40 },
                  height: { xs: 34, sm: 38, md: 38, lg: 40 },
                  bgcolor: alpha('#fff', 0.24),
                  color: '#fff',
                  fontWeight: 800,
                  mr: { xs: 0.85, sm: 1.15, md: 1.25, lg: 1.5 },
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
                sx={{
                  lineHeight: 1.1,
                  fontSize: {
                    xs: '0.95rem',
                    sm: '1rem',
                    md: '0.97rem',
                    lg: '1rem',
                  },
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ display: 'block', color: 'rgba(255,255,255,0.82)' }}
              >
                {typingText ||
                  (participantPresenceId && isUserOnline(participantPresenceId)
                    ? 'Online now'
                    : 'Offline')}
              </Typography>
              {hasSelectedDraft && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ mt: 0.2 }}
                >
                  <Typography
                    variant="caption"
                    color="warning.main"
                    noWrap
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}
                  >
                    <ScheduleIcon sx={{ fontSize: 12 }} />
                    Unsent changes, {selectedDraftSavedLabel}
                  </Typography>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleDiscardSelectedDraft}
                    sx={{
                      minHeight: 20,
                      px: 0.75,
                      lineHeight: 1,
                      color: 'rgba(255,255,255,0.84)',
                    }}
                  >
                    Discard
                  </Button>
                </Stack>
              )}
              {jobTitle && (
                <Chip
                  size="small"
                  label={jobTitle}
                  sx={{
                    mt: 0.5,
                    fontWeight: 700,
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                  }}
                />
              )}
            </Box>

            <Tooltip title="More options">
              <IconButton
                aria-label="Open conversation menu"
                sx={{
                  ml: 1,
                  minWidth: TOUCH_TARGET_MIN,
                  minHeight: TOUCH_TARGET_MIN,
                  color: '#fff',
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {!mobile && (
          <Box
            data-testid="messages-active-chat-context"
            sx={{
              px: { md: 1.4, lg: 1.7, xl: 2 },
              py: 0.5,
              bgcolor: alpha(CHAT_PANEL_HEADER, 0.98),
              borderBottom: '1px solid',
              borderColor: CHAT_BORDER,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor:
                    participantPresenceId && isUserOnline(participantPresenceId)
                      ? theme.palette.success.main
                      : alpha(CHAT_TEXT_PRIMARY, 0.35),
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                noWrap
                sx={{
                  color: alpha(CHAT_TEXT_PRIMARY, 0.86),
                  fontWeight: 700,
                  letterSpacing: '0.005em',
                }}
              >
                Active chat: {title}
              </Typography>
              {jobTitle && (
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: alpha(CHAT_TEXT_PRIMARY, 0.68) }}
                >
                  | Job: {jobTitle}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        <Box
          data-testid="messages-scroll-region"
          ref={messagesScrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            scrollPaddingTop: { xs: 72, sm: 78, md: 92 },
            px: {
              xs: 0.65,
              sm: 1,
              md: 1.15,
              lg: 1.35,
              xl: 1.5,
            },
            py: { xs: 1.05, sm: 1.2, md: 1.35, lg: 1.5, xl: 1.6 },
            pb: {
              xs: mobile && !isKeyboardVisible ? 1.55 : 0.9,
              sm: mobile && !isKeyboardVisible ? 1.9 : 1.2,
              md: 1.5,
              lg: 1.75,
            },
            backgroundColor: CHAT_MESSAGE_BG,
            backgroundImage:
              'radial-gradient(rgba(17, 27, 33, 0.06) 0.7px, transparent 0.7px), radial-gradient(rgba(17, 27, 33, 0.04) 0.7px, transparent 0.7px)',
            backgroundPosition: '0 0, 8px 8px',
            backgroundSize: '16px 16px',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: mobile ? '100%' : { md: 1080, lg: 1220, xl: 1320 },
              mx: mobile ? 0 : 'auto',
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
                        bgcolor: CHAT_PANEL_HEADER,
                      }}
                    >
                      <Box
                        sx={{
                          width: '80%',
                          height: 10,
                          bgcolor: CHAT_MUTED_FILL,
                          borderRadius: 999,
                          mb: 1,
                        }}
                      />
                      <Box
                        sx={{
                          width: '45%',
                          height: 10,
                          bgcolor: CHAT_MUTED_FILL,
                          borderRadius: 999,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ py: 6 }}>
                {hasSelectedDraft && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.08),
                      borderColor: alpha(theme.palette.warning.main, 0.4),
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      sx={{ mb: 0.75 }}
                    >
                      <ScheduleIcon
                        sx={{ fontSize: 14, color: theme.palette.warning.main }}
                      />
                      <Typography variant="caption" color="warning.main">
                        Unsent draft {selectedDraftSavedLabel}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {selectedDraftPreview}
                    </Typography>
                  </Paper>
                )}
                <EmptyState
                  variant="messages"
                  title="Start the conversation"
                  subtitle="Send a message below or attach photos/documents to get started."
                />
              </Box>
            ) : (
              messages.map((message, index) => {
                const messageTimestamp = message.timestamp || message.createdAt;
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const previousTimestamp =
                  previousMessage?.timestamp || previousMessage?.createdAt;
                const currentDayKey = getMessageDayKey(messageTimestamp);
                const previousDayKey = getMessageDayKey(previousTimestamp);
                const showDayDivider =
                  currentDayKey && currentDayKey !== previousDayKey;
                const dayLabel = formatMessageDayLabel(messageTimestamp);
                const messageKey =
                  message.id ||
                  message._id ||
                  `${message.timestamp || 'message'}-${index}`;

                return (
                  <React.Fragment key={messageKey}>
                    {showDayDivider && dayLabel && (
                      <MessageDayDivider
                        label={dayLabel}
                        chatTheme={chatTheme}
                      />
                    )}
                    <MessageBubble
                      message={message}
                      currentUserId={currentUserId}
                      chatTheme={chatTheme}
                    />
                  </React.Fragment>
                );
              })
            )}
            <div ref={messageEndRef} />
          </Box>
        </Box>

        <Box
          component="form"
          data-testid="messages-composer"
          onSubmit={handleSendMessage}
          sx={{
            position: mobile ? 'sticky' : 'relative',
            flexShrink: 0,
            bottom: mobile ? mobileComposerOffset : 0,
            zIndex: 2,
            px: { xs: 0.65, sm: 1, md: 1.15, lg: 1.35, xl: 1.5 },
            py: { xs: 0.65, sm: 0.8, md: 0.9, lg: 1 },
            pb: {
              xs: isKeyboardVisible
                ? withSafeAreaBottom(6)
                : withSafeAreaBottom(10),
              sm: isKeyboardVisible
                ? withSafeAreaBottom(8)
                : withSafeAreaBottom(12),
              md: 1,
              lg: 1.15,
            },
            bgcolor: alpha(CHAT_PANEL_HEADER, 0.98),
            backdropFilter: 'blur(14px)',
            borderTop: '1px solid',
            borderColor: CHAT_BORDER,
            transition: 'padding-bottom 0.22s ease',
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: mobile ? '100%' : { md: 1080, lg: 1220, xl: 1320 },
              mx: mobile ? 0 : 'auto',
            }}
          >
            {showScrollToLatest && !(mobile && isKeyboardVisible) && (
              <Box
                data-testid="messages-jump-latest"
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mb: 0.85,
                }}
              >
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={handleScrollToLatest}
                  sx={{
                    minHeight: TOUCH_TARGET_MIN,
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2,
                    color: '#fff',
                    bgcolor: CHAT_HEADER,
                    '&:hover': { bgcolor: CHAT_ACCENT_DARK },
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  Jump to latest
                </Button>
              </Box>
            )}

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
                      sx={{ minHeight: TOUCH_TARGET_MIN, px: 1.25 }}
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
                            width: 36,
                            height: 36,
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
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              noWrap
                            >
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

            {draftRestoreNotice && (
              <Alert
                severity="info"
                sx={{ mb: 1.25, borderRadius: 2 }}
                onClose={() => setDraftRestoreNotice('')}
              >
                {draftRestoreNotice}
              </Alert>
            )}

            {quickReplyBarVisible && (
              <Stack
                data-testid="messages-quick-replies"
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
                      bgcolor: alpha(CHAT_HEADER, 0.05),
                      borderColor: alpha(CHAT_HEADER, 0.22),
                      '& .MuiChip-label': { px: { xs: 1, sm: 1.2 } },
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
                      minWidth: TOUCH_TARGET_MIN,
                      minHeight: TOUCH_TARGET_MIN,
                      color: CHAT_HEADER,
                      bgcolor: CHAT_PANEL_BG,
                      '&:hover': { bgcolor: CHAT_PANEL_HEADER },
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
                      const trimmedValue = nextValue.trim();
                      const previousEntry = getDraftEntry(
                        previous[selectedConversationKey],
                      );

                      if (!trimmedValue) {
                        if (!(selectedConversationKey in previous)) {
                          return previous;
                        }

                        const nextDrafts = { ...previous };
                        delete nextDrafts[selectedConversationKey];
                        return nextDrafts;
                      }

                      if (previousEntry?.text === nextValue) {
                        return previous;
                      }

                      return {
                        ...previous,
                        [selectedConversationKey]: {
                          text: nextValue,
                          updatedAt: Date.now(),
                        },
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
                    borderRadius: 3,
                    bgcolor: CHAT_PANEL_BG,
                    '& fieldset': { borderColor: CHAT_BORDER },
                    '&:hover fieldset': { borderColor: CHAT_ACCENT_DARK },
                    '&.Mui-focused fieldset': {
                      borderColor: CHAT_ACCENT_DARK,
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: {
                      xs: '0.9rem',
                      sm: '0.94rem',
                      md: '0.95rem',
                      lg: '0.98rem',
                    },
                    lineHeight: 1.4,
                  },
                }}
              />

              <Tooltip title="Send message">
                <IconButton
                  type="submit"
                  disabled={sendDisabled}
                  aria-label="Send message"
                  sx={{
                    minWidth: TOUCH_TARGET_MIN,
                    minHeight: TOUCH_TARGET_MIN,
                    bgcolor: CHAT_HEADER,
                    color: '#fff',
                    '&:hover': { bgcolor: CHAT_ACCENT_DARK },
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
                ? `${selectedFiles.length} attached | ${remainingAttachmentSlots} slot${remainingAttachmentSlots === 1 ? '' : 's'} left | ${messageCharacterCount}/1000 chars | Press Enter to send`
                : hasSelectedDraft
                  ? `Press Enter for quick send | Shift+Enter for new line | ${messageCharacterCount}/1000 chars | Draft ${selectedDraftSavedLabel}`
                  : `Press Enter for quick send | Shift+Enter for new line | ${messageCharacterCount}/1000 chars | Max ${MAX_ATTACHMENTS} files (10MB limit)`}
            </Typography>
            {isKeyboardVisible && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.25, pl: 0.5 }}
              >
                Keyboard open - composer remains pinned for quick replies.
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <PageCanvas
      disableContainer
      sx={{
        minHeight: '100%',
        height: '100%',
        pt: { xs: 0, md: 0 },
        pb: { xs: 0, md: 0 },
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: {
            xs: 'calc(100dvh - var(--kelmah-network-banner-offset, 0px))',
            md: `calc(100dvh - ${HEADER_HEIGHT_MOBILE}px - var(--kelmah-network-banner-offset, 0px))`,
          },
          display: 'flex',
          flexDirection: 'column',
          bgcolor: CHAT_BG_LIGHT,
          color: 'text.primary',
          backgroundImage: {
            xs: 'none',
            md: `linear-gradient(180deg, ${alpha(CHAT_ACCENT, 0.28)} 0px, ${alpha(
              CHAT_ACCENT,
              0.1,
            )} 140px, ${CHAT_BG_LIGHT} 140px)`,
          },
        }}
      >
        <SEO
          title="Messages"
          description="Secure real-time conversations on Kelmah."
          openGraph={{ type: 'website' }}
        />

        <Box
          sx={{
            px: { xs: 0, sm: 0.25, md: 1.2, lg: 1.5, xl: 2 },
            py: { xs: 0, sm: 0.25, md: 1.25, lg: 1.5, xl: 2 },
            pb: {
              xs: isMobile
                ? selectedConversation
                  ? 0
                  : isKeyboardVisible
                    ? withSafeAreaBottom(0)
                    : withBottomNavSafeArea(4)
                : 1.25,
              md: 1.25,
              lg: 1.5,
              xl: 2,
            },
            flex: 1,
            minHeight: 0,
            display: 'flex',
            justifyContent: { xs: 'stretch', md: 'center' },
          }}
        >
          {isMobile ? (
            selectedConversation ? (
              <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
                {renderChatPane(true)}
              </Box>
            ) : (
              <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
                {renderConversationList(true)}
              </Box>
            )
          ) : (
            <Box
              sx={{
                flex: 1,
                width: '100%',
                maxWidth: 1560,
                height: '100%',
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: {
                  md: '390px 1fr',
                  lg: '450px 1fr',
                  xl: '500px 1fr',
                },
                gridTemplateRows: 'minmax(0, 1fr)',
                alignItems: 'stretch',
                gap: 0,
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${CHAT_BORDER}`,
                boxShadow: '0 16px 40px rgba(11, 20, 26, 0.2)',
                bgcolor: CHAT_PANEL_BG,
              }}
            >
              <Box sx={{ minHeight: 0, height: '100%', display: 'flex' }}>
                {renderConversationList(false)}
              </Box>
              <Box sx={{ minHeight: 0, height: '100%', display: 'flex' }}>
                {renderChatPane(false)}
              </Box>
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
