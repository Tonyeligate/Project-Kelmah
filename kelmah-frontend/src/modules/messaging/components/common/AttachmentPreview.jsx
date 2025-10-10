import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideocamIcon from '@mui/icons-material/Videocam';
import AudioFileIcon from '@mui/icons-material/AudioFile';

// Styled components
const PreviewContainer = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  margin: theme.spacing(1, 0),
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[2],
    backgroundColor: theme.palette.action.hover,
  },
}));

const FileTypeIcon = ({ type }) => {
  if (type.startsWith('image/')) return <ImageIcon color="info" />;
  if (type.startsWith('video/')) return <VideocamIcon color="secondary" />;
  if (type.startsWith('audio/')) return <AudioFileIcon color="error" />;
  if (type === 'application/pdf') return <PictureAsPdfIcon color="error" />;
  return <InsertDriveFileIcon color="primary" />;
};

FileTypeIcon.propTypes = {
  type: PropTypes.string.isRequired,
};

/**
 * Component for displaying attachment previews in message input or within messages
 */
const AttachmentPreview = ({
  attachment,
  onRemove,
  isUploading = false,
  progress = 0,
  inMessage = false,
  showDownload = true,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Get file size in human readable format
  const formatSize = (size) => {
    if (size < 1024) return `${size} bytes`;
    else if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    else return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file download
  const handleDownload = (e) => {
    e.stopPropagation();
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const togglePreview = () => {
    if (
      attachment.type.startsWith('image/') ||
      attachment.type === 'application/pdf'
    ) {
      setShowPreview(!showPreview);
    }
  };

  return (
    <>
      <PreviewContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ display: 'flex', p: 0.5, mr: 1 }}>
            <FileTypeIcon type={attachment.type} />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {attachment.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatSize(attachment.size)}
            </Typography>
          </Box>

          {isUploading ? (
            <Box sx={{ position: 'relative', mr: 1 }}>
              <CircularProgress
                variant="determinate"
                value={progress}
                size={24}
                thickness={5}
                sx={{ color: 'primary.main' }}
              />
              <Typography
                variant="caption"
                component="div"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                }}
              >
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex' }}>
              {(attachment.type.startsWith('image/') ||
                attachment.type === 'application/pdf') && (
                <Tooltip title="Preview">
                  <IconButton
                    size="small"
                    onClick={togglePreview}
                    sx={{ mr: 0.5 }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {showDownload && (
                <Tooltip title="Download">
                  <IconButton
                    size="small"
                    onClick={handleDownload}
                    sx={{ mr: 0.5 }}
                  >
                    <CloudDownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {!inMessage && (
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove && onRemove(attachment);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </PreviewContainer>

      {showPreview && attachment.type.startsWith('image/') && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            p: 2,
          }}
          onClick={() => setShowPreview(false)}
        >
          <IconButton
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
            }}
            onClick={() => setShowPreview(false)}
          >
            <CloseIcon />
          </IconButton>

          <img
            src={attachment.url}
            alt={attachment.name}
            style={{
              maxWidth: '90%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />

          <Typography
            variant="body2"
            sx={{
              color: 'white',
              mt: 2,
              maxWidth: '80%',
              textAlign: 'center',
            }}
          >
            {attachment.name}
          </Typography>
        </Box>
      )}
    </>
  );
};

AttachmentPreview.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    url: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func,
  isUploading: PropTypes.bool,
  progress: PropTypes.number,
  inMessage: PropTypes.bool,
  showDownload: PropTypes.bool,
};

export default AttachmentPreview;
