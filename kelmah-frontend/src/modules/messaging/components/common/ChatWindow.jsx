import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Paper, 
  Avatar, 
  Divider,
  CircularProgress,
  LinearProgress,
  Badge,
  InputAdornment,
  Popover,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import { 
  Send, 
  AttachFile, 
  InsertEmoticon,
  Image,
  Mic,
  MoreVert,
  Reply,
  ContentCopy,
  Delete,
  Download,
  PictureAsPdf,
  Description,
  ThumbUp,
  FavoriteBorder,
  EmojiEmotions,
  Close
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Picker from 'emoji-picker-react';
import messagingService from '../../services/messagingService';
import { format } from 'date-fns';

// Styled components
const ChatContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  background: 'rgba(26, 26, 26, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const MessageBubble = styled(Box)(({ theme, isOwn }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  background: isOwn 
    ? 'linear-gradient(45deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8))' 
    : 'rgba(255, 255, 255, 0.1)',
  color: isOwn ? '#000' : '#fff',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isOwn ? 'right' : 'left']: -8,
    width: 15,
    height: 15,
    background: isOwn 
      ? 'linear-gradient(45deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8))' 
      : 'rgba(255, 255, 255, 0.1)',
    clipPath: isOwn 
      ? 'polygon(0 0, 100% 100%, 100% 0)' 
      : 'polygon(0 100%, 100% 0, 0 0)',
  }
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    background: 'rgba(255, 255, 255, 0.05)',
    '& fieldset': {
      borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 215, 0, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FFD700',
    },
  },
  '& .MuiInputBase-input': {
    color: '#fff',
  },
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255, 215, 0, 0.8)',
  '&:hover': {
    background: 'rgba(255, 215, 0, 0.1)',
  }
}));

const FilePreview = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ReactionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  background: 'rgba(255, 255, 255, 0.1)',
  color: '#fff',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)',
  }
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  margin: theme.spacing(1, 0),
  '& .dot': {
    width: 8,
    height: 8,
    margin: theme.spacing(0, 0.25),
    borderRadius: '50%',
    background: '#FFD700',
    animation: '$typing 1.4s infinite both',
    '&:nth-of-type(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-of-type(3)': {
      animationDelay: '0.4s',
    }
  },
  '@keyframes typing': {
    '0%': {
      opacity: 0.2,
      transform: 'scale(0.8)',
    },
    '50%': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '100%': {
      opacity: 0.2,
      transform: 'scale(0.8)',
    },
  }
}));

const MessageSkeleton = styled(Box)(({ theme }) => ({
  height: 50,
  width: '100%',
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

// Helper to normalize raw message objects into ChatWindow-friendly format
const normalizeMsg = (msg) => ({
  id: msg.id || msg._id,
  text: msg.content,
  sender: `${msg.sender.firstName} ${msg.sender.lastName}`,
  senderAvatar: msg.sender.profilePicture,
  isOwn: msg.sender.id === messagingService.userId,
  files: msg.attachment ? [{
    name: msg.attachment.filename,
    size: msg.attachment.size,
    type: msg.attachment.contentType,
    url: msg.attachment.url,
  }] : [],
  timestamp: format(new Date(msg.createdAt), 'p'),
  reactions: msg.reactions || [],
  replyTo: msg.replyTo || null,
});

const ChatWindow = ({ 
  conversation,
  recipientName = 'John Smith', 
  recipientAvatar = 'https://randomuser.me/api/portraits/men/32.jpg',
  recipientStatus = 'online',
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for typing indicator events
  useEffect(() => {
    if (conversation) {
      const unsubscribeTyping = messagingService.on('typing', (data) => {
        if (data.conversationId === conversation.id && data.userId !== messagingService.userId) {
          setIsTyping(data.isTyping);
        }
      });
      return () => unsubscribeTyping();
    }
  }, [conversation]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Fetch initial messages for the selected conversation and mark as read
    const loadMessages = async () => {
      setMsgLoading(true);
      try {
        const rawMsgs = await messagingService.getMessages(conversation.id);
        const normalizedMsgs = rawMsgs.map(msg => normalizeMsg(msg));
        setMessages(normalizedMsgs);
        // Mark conversation as read after loading messages
        await messagingService.markConversationAsRead(conversation.id);
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setMsgLoading(false);
      }
    };
    if (conversation) loadMessages();
  }, [conversation]);

  // Join room and listen for real-time messages
  useEffect(() => {
    if (conversation) {
      messagingService.joinConversation(conversation.id);
      const unsubscribeNew = messagingService.onNewMessage((data) => {
        if (data.conversationId === conversation.id) {
          setMessages(prev => [...prev, normalizeMsg(data)]);
        }
      });
      return () => {
        messagingService.leaveConversation(conversation.id);
        unsubscribeNew();
      };
    }
  }, [conversation]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && files.length === 0) return;
    const content = newMessage;
    const attachments = files.map(f => f.file);
    setIsLoading(true);
    setUploadProgress(0);
    try {
      const raw = await messagingService.sendMessage(
        conversation.id,
        content,
        attachments,
        (percent) => setUploadProgress(percent)
      );
      const newMsg = normalizeMsg(raw);
      setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setFiles([]);
    setReplyTo(null);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Create file previews
    const fileObjects = selectedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file
    }));
    
    setFiles([...files, ...fileObjects]);
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].url);
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current.click();
  };

  const handleEmojiSelect = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleOpenEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleReplyMessage = (message) => {
    setReplyTo(message);
    setContextMenu(null);
  };

  const handleContextMenu = (event, message) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX - 2, mouseY: event.clientY - 4 }
        : null
    );
    setSelectedMessage(message);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedMessage(null);
  };

  const handleCopyMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.text);
    }
    handleCloseContextMenu();
  };

  const handleAddReaction = (emoji) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === selectedMessage.id 
          ? { 
              ...msg, 
              reactions: [...msg.reactions.filter(r => r.emoji !== emoji), { emoji, count: 1 }] 
            } 
          : msg
      )
    );
    handleCloseContextMenu();
  };

  const handleImagePreview = (url) => {
    setPreviewImage(url);
    setShowImagePreview(true);
  };

  const renderFileAttachment = (file) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    const icon = isPdf ? <PictureAsPdf /> : isImage ? <Image /> : <Description />;
    
    return (
      <Box 
        sx={{ 
          mt: 1, 
          p: 1, 
          borderRadius: 1, 
          background: 'rgba(0,0,0,0.1)', 
          display: 'flex', 
          alignItems: 'center',
          cursor: isImage ? 'pointer' : 'default'
        }}
        onClick={isImage ? () => handleImagePreview(file.url) : undefined}
      >
        {icon}
        <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
          {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </Typography>
        <IconButton size="small">
          <Download fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  return (
    <ChatContainer elevation={3}>
      {/* Chat Header */}
      <ChatHeader>
        <Avatar 
          src={recipientAvatar} 
          alt={recipientName}
          sx={{ 
            width: 48, 
            height: 48,
            mr: 2,
            border: '2px solid',
            borderColor: recipientStatus === 'online' ? '#4CAF50' : 'transparent'
          }}
        />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ color: '#FFD700' }}>
            {recipientName}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: recipientStatus === 'online' ? '#4CAF50' : 'rgba(255, 255, 255, 0.5)' 
          }}>
            {recipientStatus === 'online' ? 'Online' : 'Last seen today at 11:20 AM'}
          </Typography>
        </Box>
      </ChatHeader>
      
      {/* Messages Area */}
      <MessagesContainer>
        {msgLoading ? (
          Array.from(new Array(5)).map((_, idx) => (
            <MessageSkeleton key={idx} />
          ))
        ) : (
          messages.map((message) => (
          <Box 
            key={message.id} 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: message.isOwn ? 'flex-end' : 'flex-start'
            }}
            onContextMenu={(e) => handleContextMenu(e, message)}
          >
            {!message.isOwn && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, ml: 1 }}>
                <Avatar 
                  src={message.senderAvatar} 
                  alt={message.sender}
                  sx={{ width: 24, height: 24, mr: 1 }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {message.sender}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ maxWidth: '70%' }}>
              {message.replyTo && (
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    mb: 0.5,
                    borderLeft: '3px solid #FFD700' 
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#FFD700' }}>
                    Reply to
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {message.replyTo.text}
                  </Typography>
                </Box>
              )}
              
              <MessageBubble isOwn={message.isOwn}>
                <Typography variant="body1">{message.text}</Typography>
                
                {message.files && message.files.map((file, index) => (
                  renderFileAttachment(file)
                ))}
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 0.5
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: message.isOwn ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.5)',
                      ml: 'auto' 
                    }}
                  >
                    {message.timestamp}
                  </Typography>
                </Box>
              </MessageBubble>
              
              {message.reactions.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5, justifyContent: message.isOwn ? 'flex-end' : 'flex-start' }}>
                  {message.reactions.map((reaction, index) => (
                    <ReactionChip
                      key={index}
                      label={`${reaction.emoji} ${reaction.count}`}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
          ))
        )}
        
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Avatar 
              src={recipientAvatar} 
              alt={recipientName}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <TypingIndicator>
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </TypingIndicator>
          </Box>
        )}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} sx={{ color: '#FFD700' }} />
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      {/* Reply Preview */}
      {replyTo && (
        <Box sx={{ 
          p: 1.5, 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Box sx={{ 
            flexGrow: 1, 
            p: 1, 
            borderRadius: 1, 
            background: 'rgba(255, 255, 255, 0.05)',
            borderLeft: '3px solid #FFD700'
          }}>
            <Typography variant="caption" sx={{ color: '#FFD700' }}>
              Reply to
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {replyTo.text}
            </Typography>
          </Box>
          <IconButton onClick={() => setReplyTo(null)} sx={{ ml: 1 }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}
      
      {/* File Attachments Preview */}
      {files.length > 0 && (
        <Box sx={{ px: 2, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {uploadProgress != null && (
            <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1, mb: 1 }} />
          )}
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Attachments ({files.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            {files.map((file, index) => (
              <FilePreview key={index}>
                {file.type.startsWith('image/') ? (
                  <Box 
                    component="img" 
                    src={file.url} 
                    sx={{ 
                      height: 40, 
                      width: 40, 
                      objectFit: 'cover', 
                      borderRadius: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleImagePreview(file.url)}
                  />
                ) : (
                  <Box sx={{ 
                    height: 40, 
                    width: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: 1,
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}>
                    {file.type === 'application/pdf' ? (
                      <PictureAsPdf />
                    ) : (
                      <Description />
                    )}
                  </Box>
                )}
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => handleRemoveFile(index)}>
                  <Close fontSize="small" />
                </IconButton>
              </FilePreview>
            ))}
          </Box>
        </Box>
      )}
      
      {/* Input Area */}
      <InputContainer>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          multiple
        />
        
        <ActionButton onClick={handleOpenFileDialog} disabled={isLoading}>
          <AttachFile />
        </ActionButton>
        
        <Box>
          <ActionButton onClick={handleOpenEmojiPicker}>
            <InsertEmoticon />
          </ActionButton>
        </Box>
        {/* Emoji Picker Dialog */}
        <Dialog
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          maxWidth="xs"
          PaperProps={{ sx: { bgcolor: '#1a1a1a', p: 1 } }}
        >
          <DialogContent sx={{ p: 0 }}>
            <Picker onEmojiClick={(_, emojiObject) => { handleEmojiSelect(emojiObject); setShowEmojiPicker(false); }} />
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'flex-end', p: 1 }}>
            <Button onClick={() => setShowEmojiPicker(false)} sx={{ color: '#FFD700' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        <StyledTextField
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            const text = e.target.value;
            setNewMessage(text);
            // Emit typing indicator
            if (conversation) {
              messagingService.sendTypingIndicator(conversation.id, true);
            }
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              if (conversation) {
                messagingService.sendTypingIndicator(conversation.id, false);
              }
            }, 1000);
          }}
          onKeyPress={handleKeyPress}
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          size="small"
        />
        
        <ActionButton onClick={handleSendMessage} disabled={isLoading || (newMessage.trim() === '' && files.length === 0)}>
          <Send />
        </ActionButton>
      </InputContainer>
      
      {/* Context Popover */}
      <Popover
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff', borderRadius: 1, boxShadow: 3 } }}
      >
        <MenuList>
        <MenuItem onClick={() => handleReplyMessage(selectedMessage)}>
          <ListItemIcon>
              <Reply fontSize="small" sx={{ color: '#FFD700' }} />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
              <ContentCopy fontSize="small" sx={{ color: '#FFD700' }} />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
          <Divider sx={{ background: 'rgba(255, 255, 255, 0.2)' }} />
        <MenuItem onClick={() => handleAddReaction('👍')}>
          <ListItemIcon>
              <ThumbUp fontSize="small" sx={{ color: '#FFD700' }} />
          </ListItemIcon>
          <ListItemText>Like</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAddReaction('❤️')}>
          <ListItemIcon>
              <FavoriteBorder fontSize="small" sx={{ color: '#FFD700' }} />
          </ListItemIcon>
          <ListItemText>Love</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAddReaction('😂')}>
          <ListItemIcon>
              <EmojiEmotions fontSize="small" sx={{ color: '#FFD700' }} />
          </ListItemIcon>
          <ListItemText>Laugh</ListItemText>
        </MenuItem>
        </MenuList>
      </Popover>
      
      {/* Image Preview Dialog */}
      <Dialog 
        open={showImagePreview} 
        onClose={() => setShowImagePreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton 
            onClick={() => setShowImagePreview(false)}
            sx={{ 
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              }
            }}
          >
            <Close />
          </IconButton>
          <Box 
            component="img" 
            src={previewImage}
            sx={{ 
              width: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
      </Dialog>
    </ChatContainer>
  );
};

export default ChatWindow; 