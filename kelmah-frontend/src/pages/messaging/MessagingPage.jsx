import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessage } from '../../contexts/MessageContext';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  IconButton,
  Avatar,
  Badge,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  Drawer,
  useMediaQuery,
  Chip,
  Skeleton,
  Fade,
  Grow
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  InfoOutlined as InfoIcon,
  Add as AddIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Article as DocIcon,
  Movie as VideoIcon,
  MoreHoriz as MoreHorizIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  AccessTime as PendingIcon
} from '@mui/icons-material';
import Picker from 'emoji-picker-react';

// Styled components
const MessagingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 64px)',
  backgroundColor: theme.palette.background.default
}));

const ConversationListContainer = styled(Paper)(({ theme, isMobile, isVisible }) => ({
  width: isMobile ? '100%' : 320,
  height: '100%',
  display: isMobile ? (isVisible ? 'flex' : 'none') : 'flex',
  flexDirection: 'column',
  borderRadius: 0,
  borderRight: `1px solid ${theme.palette.divider}`
}));

const MessageAreaContainer = styled(Paper)(({ theme, isMobile, isVisible }) => ({
  flexGrow: 1,
  height: '100%',
  display: isMobile ? (isVisible ? 'flex' : 'none') : 'flex',
  flexDirection: 'column',
  borderRadius: 0
}));

const ConversationHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const MessageHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const ConversationItem = styled(ListItem)(({ theme, isActive }) => ({
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  backgroundColor: isActive ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: isActive ? theme.palette.action.selected : theme.palette.action.hover
  }
}));

const SearchInput = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(1, 2),
  '& .MuiOutlinedInput-root': {
    borderRadius: 20
  }
}));

const MessageAreaContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center'
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: 20
  }
}));

const MessageBubble = styled(Box)(({ theme, isSelf }) => ({
  maxWidth: '75%',
  minWidth: '50px',
  padding: theme.spacing(1, 2),
  borderRadius: 10,
  marginBottom: theme.spacing(1),
  backgroundColor: isSelf ? theme.palette.primary.main : theme.palette.background.paper,
  color: isSelf ? theme.palette.primary.contrastText : theme.palette.text.primary,
  alignSelf: isSelf ? 'flex-end' : 'flex-start',
  position: 'relative',
  boxShadow: theme.shadows[1],
  overflowWrap: 'break-word',
  wordBreak: 'break-word'
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: theme.spacing(1)
}));

const AttachmentPreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  padding: theme.spacing(1),
  gap: theme.spacing(1)
}));

const EmojiPickerContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '65px',
  right: '20px',
  zIndex: 1000
}));

const DateDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(2, 0),
  '&::before, &::after': {
    content: '""',
    flex: 1,
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}));

const DateChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0, 2),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  fontWeight: 'normal',
  fontSize: '0.8rem'
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: 10,
  maxWidth: '75%',
  color: theme.palette.text.secondary,
  fontSize: '0.85rem',
  fontStyle: 'italic',
  display: 'flex',
  alignItems: 'center',
  '& .dot': {
    display: 'inline-block',
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: theme.palette.text.secondary,
    marginLeft: 2,
    animation: 'pulseDot 1.5s infinite',
    '&:nth-of-type(2)': {
      animationDelay: '0.3s'
    },
    '&:nth-of-type(3)': {
      animationDelay: '0.6s'
    }
  },
  '@keyframes pulseDot': {
    '0%, 100%': {
      opacity: 0.3
    },
    '50%': {
      opacity: 1
    }
  }
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: theme.palette.text.secondary,
  textAlign: 'center',
  padding: theme.spacing(3)
}));

// Helper components
const MessageStatus = ({ status, isSelf, timestamp }) => {
  if (!isSelf) return null;

  let icon = null;
  let tooltipText = "";

  switch (status) {
    case 'sending':
      icon = <PendingIcon fontSize="small" />;
      tooltipText = "Sending...";
      break;
    case 'sent':
      icon = <CheckIcon fontSize="small" />;
      tooltipText = "Sent";
      break;
    case 'delivered':
      icon = <DoneAllIcon fontSize="small" />;
      tooltipText = "Delivered";
      break;
    case 'read':
      icon = <DoneAllIcon fontSize="small" color="primary" />;
      tooltipText = "Read";
      break;
    case 'failed':
      icon = <CloseIcon fontSize="small" color="error" />;
      tooltipText = "Failed to send";
      break;
    default:
      return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 0.5, gap: 0.5 }}>
      <Typography variant="caption" color="textSecondary">
        {format(parseISO(timestamp), 'HH:mm')}
      </Typography>
      <Tooltip title={tooltipText}>
        {icon}
      </Tooltip>
    </Box>
  );
};

const AttachmentThumbnail = ({ attachment, handleOpenAttachment }) => {
  const getAttachmentIcon = () => {
    const type = attachment.mimeType || '';
    
    if (type.startsWith('image/')) {
      return <ImageIcon />;
    } else if (type.startsWith('video/')) {
      return <VideoIcon />;
    } else if (type === 'application/pdf') {
      return <PdfIcon />;
    } else if (type.includes('document') || type.includes('sheet')) {
      return <DocIcon />;
    } else {
      return <FileIcon />;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: 'background.paper',
        cursor: 'pointer'
      }}
      onClick={() => handleOpenAttachment(attachment)}
    >
      {attachment.mimeType?.startsWith('image/') && attachment.url ? (
        <Box
          component="img"
          src={attachment.url}
          alt={attachment.name}
          sx={{ height: 80, width: 80, objectFit: 'cover', borderRadius: 1 }}
        />
      ) : (
        <Box sx={{ height: 80, width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getAttachmentIcon()}
        </Box>
      )}
      <Typography variant="caption" sx={{ mt: 0.5, maxWidth: 80, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {attachment.name}
      </Typography>
    </Box>
  );
};

const EmptyState = ({ type }) => {
  return (
    <EmptyStateContainer>
      {type === 'no-conversation' ? (
        <>
          <MessageIcon sx={{ fontSize: 60, opacity: 0.4, mb: 2 }} />
          <Typography variant="h6">No conversation selected</Typography>
          <Typography variant="body2">
            Select a conversation from the list or start a new one
          </Typography>
        </>
      ) : (
        <>
          <MessageIcon sx={{ fontSize: 60, opacity: 0.4, mb: 2 }} />
          <Typography variant="h6">No messages yet</Typography>
          <Typography variant="body2">
            Send a message to start the conversation
          </Typography>
        </>
      )}
    </EmptyStateContainer>
  );
};

// Main component
const MessagingPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    typingUsers,
    onlineUsers,
    setActiveConversation,
    fetchConversations,
    sendMessage,
    updateTypingStatus,
    createDirectConversation
  } = useMessage();

  // State
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConversationRecipient, setNewConversationRecipient] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);

  // Refs
  const messageEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Detect mobile view
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const participants = conversation.participants || [];
    const matchesName = participants.some(p => 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const lastMessage = conversation.lastMessage?.content || '';
    const matchesContent = lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesName || matchesContent;
  });

  // Handle sending message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if ((!messageText.trim() && attachments.length === 0) || !activeConversation) return;
    
    await sendMessage(messageText, attachments);
    setMessageText('');
    setAttachments([]);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  // Handle typing status
  const handleTyping = useCallback(
    (event) => {
      setMessageText(event.target.value);
      if (activeConversation) {
        updateTypingStatus(activeConversation.id, event.target.value.length > 0);
      }
    },
    [activeConversation, updateTypingStatus]
  );

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    const newAttachments = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      url: URL.createObjectURL(file)
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset file input so the same file can be selected again
    event.target.value = '';
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    setMessageText(prev => prev + emojiObject.emoji);
    messageInputRef.current?.focus();
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  // Handle conversation menu
  const handleOpenMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  // Handle new conversation dialog
  const handleOpenNewConversationDialog = () => {
    setShowNewConversationDialog(true);
    handleCloseMenu();
  };

  const handleCloseNewConversationDialog = () => {
    setShowNewConversationDialog(false);
    setNewConversationRecipient('');
  };

  const handleCreateNewConversation = async () => {
    try {
      if (!newConversationRecipient.trim()) return;
      
      const newConversation = await createDirectConversation(newConversationRecipient);
      setActiveConversation(newConversation);
      handleCloseNewConversationDialog();
      
      if (isMobile) {
        setShowConversationList(false);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Handle back button (mobile)
  const handleBackToList = () => {
    setShowConversationList(true);
  };

  // Handle attachment preview
  const handleOpenAttachment = (attachment) => {
    setSelectedAttachment(attachment);
    setShowAttachmentDialog(true);
  };

  const handleCloseAttachmentDialog = () => {
    setShowAttachmentDialog(false);
    setSelectedAttachment(null);
  };

  // Handle removing attachment before sending
  const handleRemoveAttachment = (index) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      // Release object URL if needed
      if (newAttachments[index].url && newAttachments[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(newAttachments[index].url);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = message.createdAt ? parseISO(message.createdAt) : new Date();
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    
    groups[dateStr].push(message);
    return groups;
  }, {});

  // Format date for display
  const formatMessageDate = (dateStr) => {
    const date = parseISO(dateStr);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };

  // Get user name by id
  const getUserName = (userId) => {
    if (!activeConversation?.participants) return 'Unknown User';
    
    const participant = activeConversation.participants.find(p => p.id === userId);
    return participant?.name || 'Unknown User';
  };

  // Render conversation name
  const renderConversationName = (conversation) => {
    if (conversation.type === 'group' && conversation.name) {
      return conversation.name;
    }
    
    // For direct conversations, show the other participant's name
    const otherParticipant = (conversation.participants || []).find(
      p => p.id !== user?.id
    );
    
    return otherParticipant?.name || 'Unknown User';
  };

  // Render conversation avatar
  const renderConversationAvatar = (conversation) => {
    if (conversation.type === 'group') {
      if (conversation.avatar) {
        return <Avatar src={conversation.avatar} alt={conversation.name || 'Group'} />;
      }
      return <Avatar><GroupIcon /></Avatar>;
    }
    
    // For direct conversations, show the other participant's avatar
    const otherParticipant = (conversation.participants || []).find(
      p => p.id !== user?.id
    );
    
    if (otherParticipant?.profileImage) {
      return <Avatar src={otherParticipant.profileImage} alt={otherParticipant.name || 'User'} />;
    }
    
    return <Avatar><PersonIcon /></Avatar>;
  };

  return (
    <MessagingContainer>
      {/* Conversation List */}
      <ConversationListContainer 
        elevation={0}
        isMobile={isMobile}
        isVisible={isMobile ? showConversationList : true}
      >
        <ConversationHeader>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Messages
          </Typography>
          <IconButton onClick={handleOpenMenu}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleOpenNewConversationDialog}>
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              New Conversation
            </MenuItem>
            <MenuItem onClick={() => fetchConversations()}>
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              Refresh
            </MenuItem>
          </Menu>
        </ConversationHeader>
        
        <SearchInput
          placeholder="Search conversations..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        
        <Divider />
        
        <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
          {loading && conversations.length === 0 ? (
            // Loading skeletons
            Array.from(new Array(5)).map((_, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="80%" />}
                />
              </ListItem>
            ))
          ) : filteredConversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Box>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                button
                isActive={activeConversation?.id === conversation.id}
                onClick={() => handleSelectConversation(conversation)}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color="success"
                    invisible={!onlineUsers[conversation.participants?.[0]?.id]}
                  >
                    {renderConversationAvatar(conversation)}
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={renderConversationName(conversation)}
                  secondary={
                    conversation.lastMessage ? (
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ display: 'inline-block', maxWidth: '100%' }}
                      >
                        {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </Typography>
                    ) : 'No messages yet'
                  }
                  primaryTypographyProps={{ noWrap: true }}
                />
                <ListItemSecondaryAction>
                  {conversation.lastMessage && (
                    <Typography variant="caption" color="text.secondary">
                      {format(parseISO(conversation.lastMessage.createdAt), 'HH:mm')}
                    </Typography>
                  )}
                  {conversation.unreadCount > 0 && (
                    <Badge
                      badgeContent={conversation.unreadCount}
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItemSecondaryAction>
              </ConversationItem>
            ))
          )}
        </List>
      </ConversationListContainer>

      {/* Message Area */}
      <MessageAreaContainer
        elevation={0}
        isMobile={isMobile}
        isVisible={isMobile ? !showConversationList : true}
      >
        {activeConversation ? (
          <>
            <MessageHeader>
              {isMobile && (
                <IconButton edge="start" onClick={handleBackToList}>
                  <ArrowBackIcon />
                </IconButton>
              )}
              
              <ListItemAvatar sx={{ minWidth: 50 }}>
                {renderConversationAvatar(activeConversation)}
              </ListItemAvatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1">
                  {renderConversationName(activeConversation)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {typingUsers[activeConversation.id] ? (
                    `${typingUsers[activeConversation.id]} is typing...`
                  ) : onlineUsers[activeConversation.id] ? (
                    'Online'
                  ) : (
                    'Offline'
                  )}
                </Typography>
              </Box>
              
              <Tooltip title="Info">
                <IconButton>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            </MessageHeader>
            
            <MessageAreaContent>
              {loading && messages.length === 0 ? (
                // Loading skeletons
                Array.from(new Array(5)).map((_, index) => (
                  <MessageContainer key={index} sx={{ 
                    alignItems: index % 2 === 0 ? 'flex-start' : 'flex-end'
                  }}>
                    <Skeleton 
                      variant="rounded" 
                      width={`${Math.random() * 30 + 50}%`} 
                      height={40}
                      sx={{ mb: 1 }}
                    />
                  </MessageContainer>
                ))
              ) : messages.length === 0 ? (
                <EmptyState type="no-messages" />
              ) : (
                Object.keys(groupedMessages).map(dateStr => (
                  <React.Fragment key={dateStr}>
                    <DateDivider>
                      <DateChip label={formatMessageDate(dateStr)} />
                    </DateDivider>
                    
                    {groupedMessages[dateStr].map((message, index) => {
                      const isSelf = message.senderId === user?.id;
                      const showAvatar = !isSelf && (
                        index === 0 || 
                        groupedMessages[dateStr][index - 1]?.senderId !== message.senderId
                      );
                      
                      return (
                        <MessageContainer 
                          key={message.id} 
                    sx={{ 
                            alignItems: isSelf ? 'flex-end' : 'flex-start',
                            ml: isSelf ? 0 : showAvatar ? 0 : 4
                          }}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-end',
                            mb: 0.5
                          }}>
                            {!isSelf && showAvatar && (
                              <Avatar 
                                src={message.sender?.profileImage}
                                sx={{ width: 32, height: 32, mr: 1 }}
                              >
                                <PersonIcon fontSize="small" />
                              </Avatar>
                            )}
                            
                            <Grow
                              in={true}
                              timeout={300}
                              style={{ 
                                transformOrigin: isSelf ? 'right' : 'left'
                              }}
                            >
                              <MessageBubble isSelf={isSelf}>
                                {!isSelf && showAvatar && (
                                  <Typography 
                                    variant="caption" 
                                    color={isSelf ? 'inherit' : 'primary'}
                                    sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}
                                  >
                                    {message.sender?.name || getUserName(message.senderId)}
                                  </Typography>
                                )}
                                
                                {message.content && (
                                  <Typography variant="body2">
                                    {message.content}
                  </Typography>
                                )}
                                
                                {message.attachments?.length > 0 && (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 1,
                                    mt: message.content ? 1 : 0
                                  }}>
                                    {message.attachments.map((attachment, i) => (
                                      <AttachmentThumbnail 
                                        key={attachment.id || i}
                                        attachment={attachment}
                                        handleOpenAttachment={handleOpenAttachment}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </MessageBubble>
                            </Grow>
                          </Box>
                          
                          <MessageStatus 
                            status={message.status || (message.isRead ? 'read' : 'delivered')} 
                            isSelf={isSelf}
                            timestamp={message.createdAt}
                          />
                        </MessageContainer>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
              
              {/* Typing indicator */}
              {typingUsers[activeConversation.id] && (
                <TypingIndicator>
                  {typingUsers[activeConversation.id]} is typing
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </TypingIndicator>
              )}
              
              <div ref={messageEndRef} />
            </MessageAreaContent>
            
            <MessageInputContainer component="form" onSubmit={handleSendMessage}>
              {attachments.length > 0 && (
                <AttachmentPreview>
                  {attachments.map((attachment, index) => (
                    <Box 
                      key={index}
                    sx={{ 
                        position: 'relative',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 0.5
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      
                      {attachment.mimeType?.startsWith('image/') ? (
                        <Box
                          component="img"
                          src={attachment.url}
                          alt={attachment.name}
                          sx={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 0.5 }}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                            {attachment.name}
                  </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </AttachmentPreview>
              )}
              
              <IconButton 
                onClick={() => fileInputRef.current?.click()}
                color="primary"
              >
                <AttachFileIcon />
              </IconButton>
              
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              
              <MessageInput
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                value={messageText}
                onChange={handleTyping}
                inputRef={messageInputRef}
                multiline
                maxRows={4}
                sx={{ mx: 1 }}
              />
              
              <IconButton
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                color={showEmojiPicker ? 'primary' : 'default'}
              >
                <EmojiIcon />
              </IconButton>
              
              <IconButton
                type="submit"
                color="primary"
                disabled={!messageText.trim() && attachments.length === 0}
              >
                <SendIcon />
              </IconButton>
              
              {showEmojiPicker && (
                <EmojiPickerContainer>
                  <Paper elevation={3} sx={{ p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <IconButton size="small" onClick={() => setShowEmojiPicker(false)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Picker onEmojiClick={handleEmojiClick} />
                  </Paper>
                </EmojiPickerContainer>
              )}
            </MessageInputContainer>
          </>
        ) : (
          <EmptyState type="no-conversation" />
        )}
      </MessageAreaContainer>
      
      {/* New Conversation Dialog */}
      <Dialog 
        open={showNewConversationDialog} 
        onClose={handleCloseNewConversationDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Recipient ID"
            type="text"
            fullWidth
            variant="outlined"
            value={newConversationRecipient}
            onChange={(e) => setNewConversationRecipient(e.target.value)}
            helperText="Enter the user ID of the person you want to message"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewConversationDialog}>Cancel</Button>
          <Button onClick={handleCreateNewConversation} variant="contained" color="primary">
            Start Conversation
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Attachment Preview Dialog */}
      <Dialog
        open={showAttachmentDialog}
        onClose={handleCloseAttachmentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {selectedAttachment?.name}
          <IconButton edge="end" onClick={handleCloseAttachmentDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedAttachment?.mimeType?.startsWith('image/') ? (
            <Box
              component="img"
              src={selectedAttachment.url}
              alt={selectedAttachment.name}
              sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          ) : selectedAttachment?.mimeType?.startsWith('video/') ? (
            <Box
              component="video"
              controls
              sx={{ width: '100%', maxHeight: '70vh' }}
            >
              <source src={selectedAttachment.url} type={selectedAttachment.mimeType} />
              Your browser does not support the video tag.
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FileIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
              <Typography variant="h6">{selectedAttachment?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAttachment?.mimeType || 'Unknown file type'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FileIcon />}
                sx={{ mt: 2 }}
                href={selectedAttachment?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open File
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </MessagingContainer>
  );
};

export default MessagingPage; 