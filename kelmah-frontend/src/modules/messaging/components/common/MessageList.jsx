import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { useInView } from 'react-intersection-observer';
import EmptyState from '@/components/common/EmptyState';
import { MESSAGE_TYPES } from '@/config/constants';
import useAuth from '@/modules/auth/hooks/useAuth';
import { useMessages } from '../../contexts/MessageContext';
import Message from './Message';
import MessageDateDivider from './MessageDateDivider';
import TypingIndicator from './TypingIndicator';

// Styled components
const MessageListContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  fontSize: 'clamp(0.95rem, 0.2vw + 0.9rem, 1.02rem)',
  lineHeight: 1.62,
}));

// MessageBubble and MessageTime removed â€” unused styled components

const SystemMessage = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  margin: theme.spacing(1, 0),
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.primary.main,
  borderRadius: theme.spacing(1),
  color: theme.palette.primary.contrastText,
  fontSize: '0.92rem',
  lineHeight: 1.45,
}));

const AttachmentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const AttachmentItem = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(1),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const FilePreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

const ImagePreview = styled('img')(({ theme }) => ({
  maxWidth: '100%',
  maxHeight: 200,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
}));

// DateDivider removed â€” unused styled component

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const MessageList = ({
  messages,
  currentUserId,
  isLoading,
  typingUsers = [],
  onLoadMore,
  hasMore,
  conversation,
  onMessageRead,
  deleteMessage,
  onReply,
}) => {
  const { user } = useAuth();
  const { getTypingUsers, messageAnnouncement } = useMessages();
  const messagesEndRef = useRef(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreLockRef = useRef(false);
  const isMountedRef = useRef(true);
  const loadMoreRequestIdRef = useRef(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState(new Set());

  // Ref for intersection observer to detect when we're at the top of the list
  const { ref: topRef, inView: isTopVisible } = useInView({
    threshold: 0.1,
    rootMargin: '100px 0px 0px 0px',
  });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      loadMoreRequestIdRef.current += 1;
    };
  }, []);

  // Group messages by date for dividers
  const groupedMessages = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: [...currentGroup],
          });
        }

        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: [...currentGroup],
      });
    }

    return groups;
  }, [messages]);

  // Format date headers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  // Handle loading more messages when scrolling to top
  useEffect(() => {
    const requestId = ++loadMoreRequestIdRef.current;
    const handleLoadMore = async () => {
      if (
        isTopVisible &&
        hasMore &&
        !loadingMore &&
        !isLoading &&
        !loadMoreLockRef.current
      ) {
        loadMoreLockRef.current = true;
        if (
          isMountedRef.current &&
          requestId === loadMoreRequestIdRef.current
        ) {
          setLoadingMore(true);
        }
        try {
          await onLoadMore();
        } finally {
          if (
            isMountedRef.current &&
            requestId === loadMoreRequestIdRef.current
          ) {
            setLoadingMore(false);
          }
        }
      }
    };

    handleLoadMore();
  }, [isTopVisible, hasMore, loadingMore, isLoading, onLoadMore]);

  useEffect(() => {
    if (!isTopVisible || !hasMore) {
      loadMoreLockRef.current = false;
    }
  }, [isTopVisible, hasMore]);

  // Scroll to bottom on first load or new messages
  useEffect(() => {
    if (isFirstLoad && messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      setIsFirstLoad(false);
    } else if (
      !isFirstLoad &&
      !loadingMore &&
      messages.length > 0 &&
      messagesEndRef.current
    ) {
      // Check if we're already at the bottom before scrolling
      const container = messagesEndRef.current.parentElement;
      const isAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 100;

      if (isAtBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isFirstLoad, loadingMore]);

  // Track visible messages for read receipts
  const updateVisibleMessages = useCallback(
    (messageId, isVisible) => {
      if (isVisible) {
        setVisibleMessages((prev) => {
          const newSet = new Set(prev);
          newSet.add(messageId);
          return newSet;
        });

        // Mark message as read
        if (onMessageRead) {
          onMessageRead(messageId);
        }
      } else {
        setVisibleMessages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }
    },
    [onMessageRead],
  );

  // Handle scroll position preservation when loading older messages
  const [prevMessagesLength, setPrevMessagesLength] = useState(messages.length);
  const [scrollHeight, setScrollHeight] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (
      containerRef.current &&
      loadingMore &&
      messages.length > prevMessagesLength
    ) {
      const container = containerRef.current;
      // After new messages are loaded, restore scroll position
      const scrollTo = container.scrollHeight - scrollHeight;
      container.scrollTop = scrollTo > 0 ? scrollTo : 0;
    }

    if (containerRef.current && !loadingMore) {
      // Save current scroll height before loading more messages
      setScrollHeight(containerRef.current.scrollHeight);
    }

    setPrevMessagesLength(messages.length);
  }, [messages.length, loadingMore, prevMessagesLength, scrollHeight]);

  // Handle menu open
  const handleMenuOpen = (event, message) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessage(null);
  };

  // Handle message delete
  const handleDeleteMessage = async () => {
    if (selectedMessage && typeof deleteMessage === 'function') {
      try {
        await deleteMessage(selectedMessage.id);
      } finally {
        if (isMountedRef.current) {
          handleMenuClose();
        }
      }
    } else {
      handleMenuClose();
    }
  };

  // Handle message copy
  const handleCopyMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.content);
      handleMenuClose();
    }
  };

  // Render system message
  const renderSystemMessage = (message) => (
    <SystemMessage key={message.id}>{message.content}</SystemMessage>
  );

  // Render attachments
  const renderAttachments = (message) => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <AttachmentContainer>
        {message.attachments.map((attachment, index) => (
          <AttachmentItem
            key={
              attachment.id ||
              attachment.url ||
              attachment.name ||
              `attachment-${index}`
            }
            component="a"
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {attachment.type.startsWith('image/') ? (
              <ImageIcon sx={{ mr: 1 }} />
            ) : (
              <FileIcon sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" noWrap>
              {attachment.name}
            </Typography>
          </AttachmentItem>
        ))}
      </AttachmentContainer>
    );
  };

  // Render message content based on type
  const renderMessageContent = (message) => {
    switch (message.type) {
      case MESSAGE_TYPES.IMAGE:
        return (
          <>
            {message.content && (
              <Typography variant="body1">{message.content}</Typography>
            )}
            <ImagePreview
              src={message.attachment?.url}
              alt="Message attachment"
              loading="lazy"
            />
          </>
        );
      case MESSAGE_TYPES.ATTACHMENT:
        return (
          <>
            {message.content && (
              <Typography variant="body1">{message.content}</Typography>
            )}
            <FilePreview>
              <FileIcon sx={{ mr: 1 }} />
              <Typography variant="body2" noWrap>
                {message.attachment?.filename || 'Attachment'}
              </Typography>
            </FilePreview>
          </>
        );
      default:
        return <Typography variant="body1">{message.content}</Typography>;
    }
  };

  // Render message
  const renderMessage = (message) => {
    if (message.type === MESSAGE_TYPES.SYSTEM) {
      return renderSystemMessage(message);
    }

    const isSender = message.senderId === user?.id;

    return (
      <Message
        key={message.id}
        message={message}
        isOwn={isSender}
        showAvatar={!isSender && message.senderId !== messages[0]?.senderId}
        onVisibilityChange={(isVisible) =>
          updateVisibleMessages(message.id, isVisible)
        }
      />
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <EmptyStateContainer>
      <EmptyState
        variant="messages"
        title="No messages yet"
        subtitle="Start the conversation by sending a message"
      />
    </EmptyStateContainer>
  );

  // Render loading state
  const renderLoadingState = () => (
    <Box sx={{ height: '100%', p: 2 }}>
      {[1, 2, 3, 4, 5].map((row) => {
        const isOwnMessage = row % 2 === 0;
        return (
          <Box
            key={`message-list-loading-skeleton-${row}`}
            sx={{
              display: 'flex',
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              mb: 1.5,
            }}
          >
            <Box
              sx={{
                width: { xs: '78%', sm: '62%' },
                borderRadius: 2,
                p: 1.25,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Skeleton
                variant="text"
                width="85%"
                height={18}
                sx={{ mb: 0.5 }}
              />
              <Skeleton variant="text" width="60%" height={18} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  // Main render
  return (
    <MessageListContainer>
      <Box
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {messageAnnouncement}
      </Box>
      {isLoading ? (
        renderLoadingState()
      ) : conversation ? (
        <MessagesContainer ref={containerRef}>
          {/* Load more indicator */}
          <div
            ref={topRef}
            role="status"
            aria-live="polite"
            style={{ minHeight: '10px' }}
          >
            {loadingMore && (
              <Box sx={{ p: 1.25 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    mb: 0.9,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '62%', sm: '48%' },
                      p: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Skeleton variant="text" width="78%" height={18} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box
                    sx={{
                      width: { xs: '70%', sm: '54%' },
                      p: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Skeleton variant="text" width="66%" height={18} />
                  </Box>
                </Box>
              </Box>
            )}
          </div>

          {/* No messages placeholder */}
          {!isLoading && messages.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                p: 3,
              }}
            >
              <Typography
                color="text.secondary"
                variant="body1"
                align="center"
                sx={{ mb: 2 }}
              >
                No messages yet. Send the first message to confirm scope,
                budget, and timeline.
              </Typography>
              {conversation?.type === 'group' && (
                <Typography
                  color="text.secondary"
                  variant="body2"
                  align="center"
                >
                  This is the beginning of the group chat {conversation.name}
                </Typography>
              )}
            </Box>
          )}

          {/* Messages by date groups */}
          {groupedMessages.map((group, groupIndex) => (
            <Box key={`group-${groupIndex}`} sx={{ mb: 2 }}>
              <MessageDateDivider date={formatDate(group.date)} />

              {group.messages.map((message, index) => {
                const isCurrentUser = message.senderId === currentUserId;
                const showAvatar =
                  !isCurrentUser &&
                  (index === 0 ||
                    group.messages[index - 1].senderId !== message.senderId);

                return (
                  <Message
                    key={message.id}
                    message={message}
                    isOwn={isCurrentUser}
                    showAvatar={showAvatar}
                    onVisibilityChange={(isVisible) =>
                      updateVisibleMessages(message.id, isVisible)
                    }
                    onCopy={(msg) => {
                      navigator.clipboard.writeText(msg.content);
                    }}
                    onDelete={
                      typeof deleteMessage === 'function'
                        ? (msg) => deleteMessage(msg.id)
                        : undefined
                    }
                    onReply={
                      typeof onReply === 'function'
                        ? (msg) => onReply(msg)
                        : undefined
                    }
                  />
                );
              })}
            </Box>
          ))}

          {/* Typing indicators */}
          {getTypingUsers().length > 0 && (
            <Box sx={{ mb: 2 }}>
              {getTypingUsers().map((u) => (
                <TypingIndicator key={u.id} user={u} />
              ))}
            </Box>
          )}

          {/* Loading indicator */}
          {isLoading && !loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {/* Anchor for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </MessagesContainer>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            p: 3,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Select a conversation to read or send messages.
          </Typography>
        </Box>
      )}

      {/* Message options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyMessage} aria-label="Copy message">
          <ListItemIcon>
            <CopyIcon fontSize="small" aria-hidden="true" />
          </ListItemIcon>
          <ListItemText>Copy message</ListItemText>
        </MenuItem>
        {typeof deleteMessage === 'function' && (
          <MenuItem onClick={handleDeleteMessage} aria-label="Delete message">
            <ListItemIcon>
              <DeleteIcon fontSize="small" aria-hidden="true" />
            </ListItemIcon>
            <ListItemText>Delete message</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </MessageListContainer>
  );
};

export default MessageList;
