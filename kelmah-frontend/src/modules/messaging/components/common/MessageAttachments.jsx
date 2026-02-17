import React, { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Dialog,
  DialogContent,
  Tooltip,
  CardMedia,
  Chip,
} from '@mui/material';
import {
  Description,
  PictureAsPdf,
  Image,
  InsertDriveFile,
  Download,
  Close,
  Visibility,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { getVirusScanDisplay } from '../../utils/virusScanUtils';

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

const ImageOverlay = styled(Box)(() => ({
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
  readonly = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  // H54 fix: memoize blob URLs and revoke on unmount/change to prevent memory leaks
  const blobUrlsRef = useRef(new Map());

  const getAttachmentUrl = (attachment, index) => {
    if (attachment.url) return attachment.url;
    const key = attachment.id || index;
    if (!blobUrlsRef.current.has(key)) {
      blobUrlsRef.current.set(key, URL.createObjectURL(attachment));
    }
    return blobUrlsRef.current.get(key);
  };

  // Cleanup blob URLs on unmount or when attachments change
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, [attachments]);

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
          {attachments.map((attachment, index) => {
            const {
              label,
              color,
              icon: StatusIcon,
              tooltip,
              allowDownload,
            } = getVirusScanDisplay(attachment?.virusScan);
            const canInteract = !readonly || allowDownload;
            const fileType =
              attachment.type ||
              attachment.mimeType ||
              attachment?.virusScan?.metadata?.mimeType ||
              'application/octet-stream';
            const displayName =
              attachment.name ||
              attachment.fileName ||
              attachment.filename ||
              attachment?.virusScan?.metadata?.filename ||
              `File ${index + 1}`;
            const renderStatusChip = (
              <Tooltip title={tooltip} placement="top">
                <Chip
                  size="small"
                  icon={
                    StatusIcon ? <StatusIcon fontSize="inherit" /> : undefined
                  }
                  label={label}
                  color={color === 'default' ? 'default' : color}
                  variant={color === 'default' ? 'outlined' : 'filled'}
                  sx={{ alignSelf: 'flex-start', fontWeight: 500 }}
                />
              </Tooltip>
            );

            return (
              <React.Fragment key={attachment.id || index}>
                {fileType.startsWith('image/') ? (
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <ImagePreview
                      onClick={
                        canInteract
                          ? () =>
                              handleOpenPreview(
                                getAttachmentUrl(attachment, index),
                              )
                          : undefined
                      }
                      sx={{
                        cursor: canInteract ? 'pointer' : 'not-allowed',
                        opacity: canInteract ? 1 : 0.7,
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="100"
                        image={
                          getAttachmentUrl(attachment, index)
                        }
                        alt={displayName}
                      />
                      <ImageOverlay
                        className="overlay"
                        sx={{
                          opacity: canInteract ? undefined : 1,
                          background: canInteract
                            ? 'rgba(0, 0, 0, 0.5)'
                            : 'rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        {canInteract ? (
                          <Tooltip title="View image">
                            <IconButton size="small" color="primary">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption">{label}</Typography>
                        )}
                      </ImageOverlay>
                    </ImagePreview>
                    {renderStatusChip}
                  </Box>
                ) : (
                  <AttachmentItem>
                    {getFileIcon(fileType)}
                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                      <FileName variant="body2">{displayName}</FileName>
                      {attachment.size && (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(attachment.size)}
                        </Typography>
                      )}
                    </Box>
                    {renderStatusChip}
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
                      <Tooltip title={tooltip}>
                        <span>
                          <IconButton
                            size="small"
                            href={allowDownload ? attachment.url : undefined}
                            download={allowDownload ? displayName : undefined}
                            target={allowDownload ? '_blank' : undefined}
                            rel={
                              allowDownload ? 'noopener noreferrer' : undefined
                            }
                            sx={{ color: 'primary.main' }}
                            disabled={!allowDownload}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </AttachmentItem>
                )}
              </React.Fragment>
            );
          })}
        </AttachmentContainer>
      )}

      {/* Image preview dialog */}
      <Dialog open={!!previewUrl} onClose={handleClosePreview} maxWidth="lg">
        <IconButton
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
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

MessageAttachments.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      url: PropTypes.string,
      type: PropTypes.string,
      mimeType: PropTypes.string,
      size: PropTypes.number,
      name: PropTypes.string,
      fileName: PropTypes.string,
      filename: PropTypes.string,
      virusScan: PropTypes.shape({
        status: PropTypes.string,
        metadata: PropTypes.shape({
          mimeType: PropTypes.string,
          filename: PropTypes.string,
        }),
      }),
    }),
  ),
  isUploading: PropTypes.bool,
  uploadProgress: PropTypes.number,
  onRemove: PropTypes.func,
  readonly: PropTypes.bool,
};

export default MessageAttachments;
