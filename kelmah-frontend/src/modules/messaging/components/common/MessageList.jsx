import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Link,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Button,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { styled } from '@mui/material/styles';
import { useMessages } from '../../contexts/MessageContext';
import { useAuth } from '../../../auth/hooks/useAuth';
import { MESSAGE_TYPES } from '../../../../config/constants';
import { useInView } from 'react-intersection-observer';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import MessageDateDivider from './MessageDateDivider';

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
}));

const MessageBubble = styled(Paper)(({ theme, variant }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '70%',
  width: 'fit-content',
  marginBottom: theme.spacing(1),
  borderRadius:
    variant === 'sender'
      ? theme.spacing(2, 0, 2, 2)
      : theme.spacing(0, 2, 2, 2),
  backgroundColor:
    variant === 'sender'
      ? theme.palette.primary.light
      : theme.palette.background.dark,
  color: variant === 'sender' ? theme.palette.primary.contrastText : '#fff',
  boxShadow: theme.shadows[1],
  position: 'relative',
}));

const MessageTime = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
  textAlign: 'right',
}));

const SystemMessage = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  margin: theme.spacing(1, 0),
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.primary.main,
  borderRadius: theme.spacing(1),
  color: theme.palette.primary.contrastText,
  fontSize: '0.875rem',
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

const DateDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(2, 0),
  color: theme.palette.text.secondary,
  '&::before, &::after': {
    content: '""',
    flex: 1,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& > span': {
    padding: theme.spacing(0, 2),
    fontSize: '0.8rem',
  },
}));

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
  const { getTypingUsers } = useMessages();
  const messagesEndRef = useRef(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState(new Set());

  // Ref for intersection observer to detect when we're at the top of the list
  const { ref: topRef, inView: isTopVisible } = useInView({
    threshold: 0.1,
    rootMargin: '100px 0px 0px 0px',
  });

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
    const handleLoadMore = async () => {
      if (isTopVisible && hasMore && !loadingMore && !isLoading) {
        setLoadingMore(true);
        await onLoadMore();
        setLoadingMore(false);
      }
    };

    handleLoadMore();
  }, [isTopVisible, hasMore, loadingMore, isLoading, onLoadMore]);

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
      await deleteMessage(selectedMessage.id);
      handleMenuClose();
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
            key={index}
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
      <Typography variant="body1" color="textSecondary" gutterBottom>
        No messages yet
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Start the conversation by sending a message
      </Typography>
    </EmptyStateContainer>
  );

  // Render loading state
  const renderLoadingState = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <CircularProgress size={40} />
    </Box>
  );

  // Main render
  return (
    <MessageListContainer>
      {isLoading ? (
        renderLoadingState()
      ) : conversation ? (
        <MessagesContainer ref={containerRef}>
          {/* Load more indicator */}
          <div ref={topRef} style={{ minHeight: '10px' }}>
            {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                <CircularProgress size={24} />
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
                No messages yet. Start a conversation!
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
                    onDelete={typeof deleteMessage === 'function' ? (msg) => deleteMessage(msg.id) : undefined}
                    onReply={typeof onReply === 'function' ? (msg) => onReply(msg) : undefined}
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
          <Typography variant="body1" color="textSecondary">
            Select a conversation to start messaging
          </Typography>
        </Box>
      )}

      {/* Message options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy message</ListItemText>
        </MenuItem>
        {typeof deleteMessage === 'function' && (
          <MenuItem onClick={handleDeleteMessage}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete message</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </MessageListContainer>
  );
};

export default MessageList;

