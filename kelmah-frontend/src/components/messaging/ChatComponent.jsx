import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../../contexts/MessageContext';
import { Box, Typography, TextField, IconButton, Paper, Avatar, Divider, Badge, Tooltip, CircularProgress } from '@mui/material';
import { Send, AttachFile, InsertEmoticon, Image, Mic, Videocam, Close, PictureAsPdf, Description, AudioFile, VideoFile } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow, format } from 'date-fns';
import fileUploadService from '../../services/fileUploadService';

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

const AttachmentPreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}));

const AttachmentItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 80,
  height: 80,
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 2,
  right: 2,
  padding: 2,
  background: 'rgba(0, 0, 0, 0.5)',
  color: '#fff',
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.7)',
  }
}));

const MessageAttachment = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  maxWidth: '100%',
}));

const getAttachmentIcon = (fileType) => {
  if (fileType.startsWith('image/')) return <Image />;
  if (fileType.startsWith('application/pdf')) return <PictureAsPdf />;
  if (fileType.startsWith('video/')) return <VideoFile />;
  if (fileType.startsWith('audio/')) return <AudioFile />;
  return <Description />;
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ChatComponent = ({ jobId, currentUserId, otherUserId }) => {
  const { messages, sendMessage, updateTypingStatus, typingUsers, onlineUsers } = useMessages();
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
    if (!inputMessage.trim() && attachments.length === 0) return;

        try {
      await sendMessage(jobId, inputMessage, attachments);
            setInputMessage('');
      setAttachments([]);
            setIsTyping(false);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = (e) => {
        const message = e.target.value;
        setInputMessage(message);

        // Typing indicator
        if (!isTyping) {
            setIsTyping(true);
      updateTypingStatus(jobId, true);
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
      updateTypingStatus(jobId, false);
        }, 2000);
    };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Create previews for the selected files
      const filePreviews = await fileUploadService.prepareFilesForDisplay(files);
      setAttachments([...attachments, ...files]);
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isOtherUserTyping = typingUsers.get(`${jobId}-${otherUserId}`);
  const isOtherUserOnline = onlineUsers.has(otherUserId);

  const renderAttachmentPreview = (attachment) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={URL.createObjectURL(attachment)} 
            alt={attachment.name} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} 
          />
        </Box>
      );
    }
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
        {getAttachmentIcon(attachment.type)}
        <Typography variant="caption" noWrap sx={{ maxWidth: '100%', mt: 0.5 }}>
          {attachment.name}
        </Typography>
      </Box>
    );
  };

  const renderMessageAttachment = (attachment) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <Box 
          component="img" 
          src={attachment.url} 
          alt={attachment.filename} 
          sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} 
        />
      );
    }

    return (
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {getAttachmentIcon(attachment.type)}
        <Box>
          <Typography variant="body2">{attachment.filename}</Typography>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(attachment.size)} • {format(new Date(attachment.createdAt), 'MMM d, yyyy')}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <ChatContainer>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color={isOtherUserOnline ? 'success' : 'error'}
          >
            <Avatar src="/path-to-avatar.jpg" />
          </Badge>
          <Box>
            <Typography variant="subtitle1">User Name</Typography>
            <Typography variant="caption" color="text.secondary">
              {isOtherUserOnline ? 'Online' : 'Offline'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages Container */}
      <MessagesContainer>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            isOwn={message.senderId === currentUserId}
          >
            {message.content && (
              <Typography variant="body1">{message.content}</Typography>
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <Box sx={{ mt: message.content ? 1 : 0 }}>
                {message.attachments.map((attachment, index) => (
                  <MessageAttachment key={index}>
                    {renderMessageAttachment(attachment)}
                  </MessageAttachment>
                ))}
              </Box>
            )}
            
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </Typography>
          </MessageBubble>
        ))}
        {isOtherUserTyping && (
          <Typography variant="caption" sx={{ ml: 2, opacity: 0.7 }}>
            User is typing...
          </Typography>
        )}
                <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <AttachmentPreview>
          {attachments.map((file, index) => (
            <AttachmentItem key={index}>
              {renderAttachmentPreview(file)}
              <CloseButton size="small" onClick={() => removeAttachment(index)}>
                <Close fontSize="small" />
              </CloseButton>
            </AttachmentItem>
          ))}
        </AttachmentPreview>
      )}

      {/* Input Area */}
      <InputContainer>
                <input 
          type="file" 
          multiple 
          style={{ display: 'none' }} 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
        />
        <IconButton size="small" onClick={triggerFileInput} disabled={isUploading}>
          {isUploading ? <CircularProgress size={24} /> : <AttachFile />}
        </IconButton>
        <IconButton size="small" onClick={() => triggerFileInput('image/*')}>
          <Image />
        </IconButton>
        <IconButton size="small">
          <InsertEmoticon />
        </IconButton>
        <IconButton size="small">
          <Mic />
        </IconButton>
        <IconButton size="small">
          <Videocam />
        </IconButton>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
                    value={inputMessage}
                    onChange={handleTyping}
          onKeyPress={handleKeyPress}
          sx={{ mx: 1 }}
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={(!inputMessage.trim() && attachments.length === 0) || isUploading}
        >
          <Send />
        </IconButton>
      </InputContainer>
    </ChatContainer>
    );
};

export default ChatComponent;
