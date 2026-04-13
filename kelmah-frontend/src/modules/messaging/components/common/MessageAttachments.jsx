import React, { useState, useEffect, useRef } from 'react';
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
import useOnlineStatus from '@/hooks/useOnlineStatus';
import useNetworkSpeed from '@/hooks/useNetworkSpeed';

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
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.04)',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    background: theme.palette.action.hover,
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
  const { isOnline } = useOnlineStatus();
  const { isSlow, saveData } = useNetworkSpeed();
  const constrainedNetworkMode = !isOnline || isSlow || saveData;
  const hasImageAttachments = attachments.some((attachment) => {
    const type =
      attachment?.type ||
      attachment?.mimeType ||
      attachment?.virusScan?.metadata?.mimeType ||
      '';
    return String(type).startsWith('image/');
  });

  // H54 fix: memoize blob URLs and revoke on unmount/change to prevent memory leaks
  const blobUrlsRef = useRef(new Map());

  const getAttachmentUrl = (attachment, index) => {
    if (attachment.url) return attachment.url;
    if (attachment.fileUrl) return attachment.fileUrl;
    if (attachment.path) return attachment.path;
    const key = attachment.id || index;
    if (!blobUrlsRef.current.has(key) && attachment instanceof Blob) {
      blobUrlsRef.current.set(key, URL.createObjectURL(attachment));
    }
    return blobUrlsRef.current.get(key);
  };

  // Cleanup blob URLs on unmount or when attachments change
  useEffect(() => {
    const blobUrls = blobUrlsRef.current;
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.clear();
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
          {hasImageAttachments && constrainedNetworkMode && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ width: '100%', display: 'block', mb: 0.25 }}
            >
              {isOnline
                ? 'Low-bandwidth mode: image previews are reduced to save data.'
                : 'Offline mode: image previews are paused until connection returns.'}
            </Typography>
          )}

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
                    {(() => {
                      const attachmentUrl = getAttachmentUrl(attachment, index);
                      const canOpenImagePreview =
                        canInteract &&
                        !constrainedNetworkMode &&
                        !!attachmentUrl;

                      return (
                        <ImagePreview
                          onClick={
                            canOpenImagePreview
                              ? () => handleOpenPreview(attachmentUrl)
                              : undefined
                          }
                          sx={{
                            cursor: canOpenImagePreview
                              ? 'pointer'
                              : 'not-allowed',
                            opacity: canOpenImagePreview ? 1 : 0.7,
                          }}
                        >
                          {!constrainedNetworkMode && attachmentUrl ? (
                            <CardMedia
                              component="img"
                              height="100"
                              image={attachmentUrl}
                              alt={displayName}
                            />
                          ) : (
                            <Box
                              sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                px: 1,
                                gap: 0.4,
                                bgcolor: 'action.hover',
                              }}
                            >
                              <Image sx={{ color: 'text.secondary' }} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                align="center"
                              >
                                {isOnline
                                  ? 'Preview paused'
                                  : 'Offline preview'}
                              </Typography>
                            </Box>
                          )}
                          <ImageOverlay
                            className="overlay"
                            sx={{
                              opacity: canOpenImagePreview ? undefined : 1,
                              background: canOpenImagePreview
                                ? 'rgba(0, 0, 0, 0.5)'
                                : 'rgba(0, 0, 0, 0.7)',
                            }}
                          >
                            {canOpenImagePreview ? (
                              <Tooltip title="View image">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  aria-label="View image attachment"
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    '&:focus-visible': {
                                      outline: '3px solid',
                                      outlineColor: 'primary.main',
                                      outlineOffset: '2px',
                                    },
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption">
                                {constrainedNetworkMode
                                  ? 'Preview paused'
                                  : label}
                              </Typography>
                            )}
                          </ImageOverlay>
                        </ImagePreview>
                      );
                    })()}
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
                          aria-label="Remove attachment"
                          sx={{
                            color: 'text.secondary',
                            width: 44,
                            height: 44,
                            '&:focus-visible': {
                              outline: '3px solid',
                              outlineColor: 'primary.main',
                              outlineOffset: '2px',
                            },
                          }}
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
                            aria-label="Download attachment"
                            sx={{
                              color: 'primary.main',
                              width: 44,
                              height: 44,
                              '&:focus-visible': {
                                outline: '3px solid',
                                outlineColor: 'primary.main',
                                outlineOffset: '2px',
                              },
                            }}
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
      <Dialog
        open={!!previewUrl}
        onClose={handleClosePreview}
        maxWidth="lg"
        aria-label="Attachment preview"
      >
        <IconButton
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: 44,
            height: 44,
            color: (theme) => theme.palette.grey[500],
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
            '&:focus-visible': {
              outline: '3px solid #fff',
              outlineOffset: '2px',
            },
          }}
          onClick={handleClosePreview}
          aria-label="Close attachment preview"
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
