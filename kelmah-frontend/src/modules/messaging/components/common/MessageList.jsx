import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { useInView } from 'react-intersection-observer';
import { useMessages } from '../../contexts/MessageContext';
import Message from './Message';
import MessageDateDivider from './MessageDateDivider';
import TypingIndicator from './TypingIndicator';

// Styled components
const MessageListContainer = styled(Box)(() => ({
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

// DateDivider removed - unused styled component

const MessageList = ({
  messages = [],
  currentUserId,
  isLoading = false,
  typingUsers = [],
  onLoadMore,
  hasMore = false,
  conversation,
  onMessageRead,
  deleteMessage,
  onReply,
}) => {
  const { getTypingUsers, messageAnnouncement } = useMessages();
  const contextTypingUsers = getTypingUsers();
  const activeTypingUsers =
    contextTypingUsers.length > 0 ? contextTypingUsers : typingUsers;
  const messagesEndRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreLockRef = useRef(false);
  const isMountedRef = useRef(true);
  const loadMoreRequestIdRef = useRef(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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
        typeof onLoadMore === 'function' &&
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
      if (isVisible && onMessageRead) {
        onMessageRead(messageId);
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
          {activeTypingUsers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {activeTypingUsers.map((u) => (
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
    </MessageListContainer>
  );
};

const messageShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  senderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  content: PropTypes.string,
  createdAt: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
});

MessageList.propTypes = {
  messages: PropTypes.arrayOf(messageShape),
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isLoading: PropTypes.bool,
  typingUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  conversation: PropTypes.shape({
    type: PropTypes.string,
    name: PropTypes.string,
  }),
  onMessageRead: PropTypes.func,
  deleteMessage: PropTypes.func,
  onReply: PropTypes.func,
};

export default MessageList;
