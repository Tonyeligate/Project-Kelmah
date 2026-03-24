import React, { useMemo, useState } from 'react';
import { Box, ButtonBase, Dialog, DialogContent, DialogTitle, IconButton, ImageList, ImageListItem, ImageListItemBar, Typography, Chip, Stack, useTheme, Fade, Backdrop } from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import { resolveMediaAssetUrls } from '../../common/utils/mediaAssets';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { devError } from '@/modules/common/utils/devLogger';

const ProjectGallery = ({
  images = [],
  projectTitle = '',
  open = false,
  onClose = () => {},
  initialIndex = 0,
}) => {
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);
  const galleryImages = useMemo(() => resolveMediaAssetUrls(images), [images]);

  // Handle navigation
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    setImageLoaded(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setImageLoaded(false);
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, onClose]);

  // Reset index when dialog opens
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex >= galleryImages.length ? 0 : initialIndex);
      setImageLoaded(false);
    }
  }, [open, initialIndex, galleryImages.length]);

  // Handle image download
  const handleDownload = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        filename || `${projectTitle}_image_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      devError('Failed to download image:', error);
    }
  };

  // Handle image share
  const handleShare = async (imageUrl) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectTitle,
          text: `Check out this project: ${projectTitle}`,
          url: imageUrl,
        });
      } catch (error) {
        devError('Failed to share:', error);
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        // You might want to show a snackbar here
      } catch (error) {
        devError('Failed to copy to clipboard:', error);
      }
    }
  };

  if (!galleryImages.length) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      aria-labelledby="project-gallery-dialog-title"
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backgroundImage: 'none',
          maxWidth: isMobile ? '100vw' : '90vw',
          maxHeight: isMobile ? '100dvh' : '90vh',
          width: isMobile ? '100vw' : 'auto',
          height: isMobile ? '100dvh' : 'auto',
          pb: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
        },
      }}
      BackdropComponent={Backdrop}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        id="project-gallery-dialog-title"
        sx={{
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              whiteSpace: { xs: 'normal', sm: 'nowrap' },
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, sm: 1 },
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {projectTitle}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {currentIndex + 1} of {galleryImages.length}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <IconButton
            color="inherit"
            onClick={() =>
              handleDownload(
                galleryImages[currentIndex],
                `${projectTitle}_${currentIndex + 1}`,
              )
            }
            aria-label="Download current image"
            sx={{
              color: 'white',
              minHeight: 44,
              minWidth: 44,
              '&:focus-visible': {
                outline: `3px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
            }}
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => handleShare(galleryImages[currentIndex])}
            aria-label="Share current image"
            sx={{
              color: 'white',
              minHeight: 44,
              minWidth: 44,
              '&:focus-visible': {
                outline: `3px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
            }}
          >
            <ShareIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={onClose}
            aria-label="Close gallery"
            sx={{
              color: 'white',
              minHeight: 44,
              minWidth: 44,
              '&:focus-visible': {
                outline: `3px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Main Image Display */}
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          position: 'relative',
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        {/* Navigation Buttons */}
        {galleryImages.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              aria-label="Previous image"
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                minHeight: 44,
                minWidth: 44,
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
                '&:focus-visible': {
                  outline: `3px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <PrevIcon fontSize="large" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              aria-label="Next image"
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                minHeight: 44,
                minWidth: 44,
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
                '&:focus-visible': {
                  outline: `3px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              <NextIcon fontSize="large" />
            </IconButton>
          </>
        )}

        {/* Main Image */}
        <Fade in={imageLoaded} timeout={300}>
          <Box
            component="img"
            src={galleryImages[currentIndex]}
            alt={`${projectTitle} - Image ${currentIndex + 1}`}
            loading="eager"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: imageLoaded ? 'block' : 'none',
            }}
          />
        </Fade>

        {/* Loading placeholder */}
        {!imageLoaded && (
          <Box
            sx={{
              width: '100%',
              height: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
            }}
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Typography variant="body1" sx={{ color: 'white', opacity: 0.7 }}>
              Loading...
            </Typography>
          </Box>
        )}

        {/* Thumbnail Strip */}
        {galleryImages.length > 1 && !isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: 1,
              p: 1,
              maxWidth: '80%',
              overflow: 'hidden',
            }}
            role="status"
            aria-live="polite"
            aria-label={`Showing image ${currentIndex + 1} of ${galleryImages.length}`}
          >
            <ImageList
              cols={Math.min(images.length, 8)}
              gap={8}
              sx={{
                width: 'auto',
                margin: 0,
              }}
            >
              {galleryImages.map((image, index) => (
                <ImageListItem
                  key={`${image || 'thumbnail'}-${index}`}
                  sx={{
                    width: 60,
                    height: 40,
                    cursor: 'pointer',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border:
                      index === currentIndex
                        ? '2px solid white'
                        : '2px solid transparent',
                    opacity: index === currentIndex ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                    },
                  }}
                >
                  <ButtonBase
                    onClick={() => {
                      setCurrentIndex(index);
                      setImageLoaded(false);
                    }}
                    aria-label={`Open gallery image ${index + 1}`}
                    sx={{ width: '100%', height: '100%' }}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      width="60"
                      height="40"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </ButtonBase>
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {/* Mobile Thumbnail Dots */}
        {galleryImages.length > 1 && isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
            }}
          >
            {galleryImages.map((image, index) => (
              <ButtonBase
                key={`${image || 'dot'}-${index}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setImageLoaded(false);
                }}
                aria-label={`Open gallery image ${index + 1}`}
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  minWidth: 16,
                  minHeight: 16,
                  p: 0,
                  backgroundColor: 'transparent',
                  transition: 'transform 0.2s ease',
                  '&::before': {
                    content: '""',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor:
                      index === currentIndex
                        ? 'white'
                        : 'rgba(255, 255, 255, 0.4)',
                  },
                  '&:hover': {
                    transform: 'scale(1.15)',
                  },
                }}
              />
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectGallery;


