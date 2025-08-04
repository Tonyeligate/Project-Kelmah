import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
  Fade,
  Backdrop,
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';

const ProjectGallery = ({ 
  images = [], 
  projectTitle = '', 
  open = false, 
  onClose = () => {}, 
  initialIndex = 0 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle navigation
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageLoaded(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
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
      setCurrentIndex(initialIndex);
      setImageLoaded(false);
    }
  }, [open, initialIndex]);

  // Handle image download
  const handleDownload = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${projectTitle}_image_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
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
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(imageUrl);
        // You might want to show a snackbar here
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backgroundImage: 'none',
          maxWidth: isMobile ? '100vw' : '90vw',
          maxHeight: isMobile ? '100vh' : '90vh',
          width: isMobile ? '100vw' : 'auto',
          height: isMobile ? '100vh' : 'auto',
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
          <Typography variant="h6" component="div" noWrap>
            {projectTitle}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {currentIndex + 1} of {images.length}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <IconButton
            color="inherit"
            onClick={() => handleDownload(images[currentIndex], `${projectTitle}_${currentIndex + 1}`)}
            sx={{ color: 'white' }}
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => handleShare(images[currentIndex])}
            sx={{ color: 'white' }}
          >
            <ShareIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={onClose}
            sx={{ color: 'white' }}
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
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <PrevIcon fontSize="large" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
            src={images[currentIndex]}
            alt={`${projectTitle} - Image ${currentIndex + 1}`}
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
          >
            <Typography variant="body1" sx={{ color: 'white', opacity: 0.7 }}>
              Loading...
            </Typography>
          </Box>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && !isMobile && (
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
          >
            <ImageList
              cols={Math.min(images.length, 8)}
              gap={8}
              sx={{
                width: 'auto',
                margin: 0,
              }}
            >
              {images.map((image, index) => (
                <ImageListItem
                  key={index}
                  sx={{
                    width: 60,
                    height: 40,
                    cursor: 'pointer',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: index === currentIndex ? '2px solid white' : '2px solid transparent',
                    opacity: index === currentIndex ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                    },
                  }}
                  onClick={() => {
                    setCurrentIndex(index);
                    setImageLoaded(false);
                  }}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}

        {/* Mobile Thumbnail Dots */}
        {images.length > 1 && isMobile && (
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
            {images.map((_, index) => (
              <Box
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setImageLoaded(false);
                }}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
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