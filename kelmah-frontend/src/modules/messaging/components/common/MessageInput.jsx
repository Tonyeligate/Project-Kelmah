import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Typography,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import {
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from '../../../../config/constants';

// Styled components
const InputContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  marginTop: theme.spacing(2),
  boxShadow: theme.shadows[2],
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const AttachmentButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(1),
}));

// EmojiButton removed — unused styled component

const SendButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  '&.Mui-disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
  transition: theme.transitions.create(['background-color', 'box-shadow'], {
    duration: theme.transitions.duration.short,
  }),
}));

const FileInputLabel = styled('label')(({ theme }) => ({
  display: 'flex',
  cursor: 'pointer',
}));

const AttachmentPreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const FilePreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  position: 'relative',
}));

const RemoveFileButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.25),
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
  boxShadow: theme.shadows[1],
  zIndex: 1,
}));

// Helper function to get file icon based on file type
const getFileIcon = (fileType) => {
  if (fileType.includes('image')) {
    return <ImageIcon />;
  } else if (fileType.includes('pdf')) {
    return <FileIcon />;
  } else if (fileType.includes('zip') || fileType.includes('compressed')) {
    return <FileIcon />;
  } else {
    return <FileIcon />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else {
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
};

const MessageInput = ({
  onSendMessage,
  disabled = false,
  loading = false,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Handle typing in the message input
  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  // Handle sending a message
  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  // Handle pressing Enter to send
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ];

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name} has an unsupported file type.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setFileError(errors.join('\n'));
      return;
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    setFileError('');
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Attachment Dialog */}
      <Dialog
        open={showAttachmentDialog}
        onClose={() => setShowAttachmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Attachments</DialogTitle>
        <DialogContent>
          {fileError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {fileError}
            </Typography>
          )}
          <List>
            {attachments.map((file, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.type}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeAttachment(index)}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAttachmentDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Message Input */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        {/* Attachment Button */}
        <IconButton
          color="primary"
          onClick={() => {
            fileInputRef.current?.click();
            setShowAttachmentDialog(true);
          }}
          disabled={disabled || loading}
        >
          <AttachFileIcon />
        </IconButton>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          style={{ display: 'none' }}
        />

        {/* Message Text Field */}
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || loading}
          sx={{ mx: 1 }}
        />

        {/* Send Button */}
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={
            disabled || loading || (!message.trim() && attachments.length === 0)
          }
        >
          {loading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Paper>

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MessageInput;
