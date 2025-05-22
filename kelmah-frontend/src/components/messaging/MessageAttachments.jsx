import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  CircularProgress, 
  Dialog,
  DialogContent,
  Tooltip,
  Card,
  CardMedia
} from '@mui/material';
import { 
  Description, 
  PictureAsPdf, 
  Image, 
  InsertDriveFile, 
  Download, 
  Close, 
  Visibility 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const AttachmentContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const AttachmentItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  borderRadius: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.12)',
  },
  maxWidth: '100%',
  overflow: 'hidden',
}));

const ImagePreview = styled(Box)(({ theme }) => ({
  width: 150,
  height: 100,
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
  '&:hover': {
    '& .overlay': {
      opacity: 1,
    },
  },
}));

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
}));

const FileName = styled(Typography)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '150px',
});

/**
 * Component to display message attachments
 * @param {Object} props
 * @param {Array} props.attachments - Array of attachment objects
 * @param {boolean} props.isUploading - Is attachment currently uploading
 * @param {number} props.uploadProgress - Upload progress percentage
 * @param {Function} props.onRemove - Function to call when attachment is removed
 * @param {boolean} props.readonly - If true, removes the ability to remove attachments
 */
const MessageAttachments = ({ 
  attachments = [], 
  isUploading = false, 
  uploadProgress = 0, 
  onRemove,
  readonly = false
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Handle opening image preview
  const handleOpenPreview = (url) => {
    setPreviewUrl(url);
  };
  
  // Handle closing image preview
  const handleClosePreview = () => {
    setPreviewUrl(null);
  };
  
  // Get icon for file type
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image color="primary" />;
    } else if (fileType === 'application/pdf') {
      return <PictureAsPdf color="error" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <Description color="info" />;
    } else {
      return <InsertDriveFile color="action" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / 1048576).toFixed(1) + ' MB';
    }
  };
  
  return (
    <>
      {(attachments.length > 0 || isUploading) && (
        <AttachmentContainer>
          {/* Handle uploading state */}
          {isUploading && (
            <AttachmentItem>
              <CircularProgress 
                size={24} 
                variant="determinate" 
                value={uploadProgress} 
                color="primary" 
              />
              <Box sx={{ ml: 1 }}>
                <Typography variant="body2">Uploading...</Typography>
                <Typography variant="caption" color="text.secondary">
                  {uploadProgress}%
                </Typography>
              </Box>
            </AttachmentItem>
          )}
          
          {/* Render attachments */}
          {attachments.map((attachment, index) => (
            <React.Fragment key={attachment.id || index}>
              {attachment.type && attachment.type.startsWith('image/') ? (
                <ImagePreview onClick={() => handleOpenPreview(attachment.url || URL.createObjectURL(attachment))}>
                  <CardMedia
                    component="img"
                    height="100"
                    image={attachment.url || URL.createObjectURL(attachment)}
                    alt={attachment.name || 'Image attachment'}
                  />
                  <ImageOverlay className="overlay">
                    <Tooltip title="View image">
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </ImageOverlay>
                </ImagePreview>
              ) : (
                <AttachmentItem>
                  {getFileIcon(attachment.type || 'application/octet-stream')}
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <FileName variant="body2">
                      {attachment.name || `File ${index + 1}`}
                    </FileName>
                    {attachment.size && (
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(attachment.size)}
                      </Typography>
                    )}
                  </Box>
                  {!readonly && (
                    <Tooltip title="Remove">
                      <IconButton 
                        size="small" 
                        onClick={() => onRemove && onRemove(index)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {readonly && attachment.url && (
                    <Tooltip title="Download">
                      <IconButton 
                        size="small"
                        href={attachment.url}
                        download={attachment.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main' }}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </AttachmentItem>
              )}
            </React.Fragment>
          ))}
        </AttachmentContainer>
      )}
      
      {/* Image preview dialog */}
      <Dialog
        open={!!previewUrl}
        onClose={handleClosePreview}
        maxWidth="lg"
      >
        <IconButton
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }
          }}
          onClick={handleClosePreview}
        >
          <Close />
        </IconButton>
        <DialogContent sx={{ p: 1 }}>
          <img 
            src={previewUrl} 
            alt="Attachment preview" 
            style={{ maxWidth: '100%', maxHeight: '80vh' }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageAttachments; 