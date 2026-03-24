import React, { useEffect, useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useProfile } from '../hooks/useProfile';
import { useSelector } from 'react-redux';
import { selectProfile } from '../../../store/slices/profileSlice.js';
import { useSnackbar } from 'notistack';
import { devError } from '@/modules/common/utils/devLogger';

const ProfilePicture = ({ size = 120, editable = true, altText = 'Profile picture' }) => {
  const { uploadProfilePicture } = useProfile({ autoInitialize: false });
  const profile = useSelector(selectProfile);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setOpenDialog(true);
    }
  };

  // Cleanup: previewUrl is a data: URI from FileReader, no revocation needed.
  // If we switch to createObjectURL in the future, add revokeObjectURL here.
  useEffect(() => {
    return () => {
      setPreviewUrl(null);
    };
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      await uploadProfilePicture(selectedFile);
      setOpenDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      enqueueSnackbar('Profile picture updated', { variant: 'success' });
    } catch (error) {
      devError('Error uploading profile picture:', error);
      enqueueSnackbar('Failed to upload picture', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await uploadProfilePicture(null); // Send null to remove picture
      setOpenDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      enqueueSnackbar('Profile picture removed', { variant: 'success' });
    } catch (error) {
      devError('Error removing profile picture:', error);
      enqueueSnackbar('Failed to remove picture', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <Avatar
        src={previewUrl || profile?.profilePicture || profile?.avatar || ''}
        alt={altText}
        imgProps={{
          loading: 'lazy',
          decoding: 'async',
          referrerPolicy: 'no-referrer',
        }}
        sx={{
          width: size,
          height: size,
          border: '2px solid',
          borderColor: 'primary.main',
          '& img': {
            objectFit: 'cover',
          },
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      />

      {editable && (
        <>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            id="profile-picture-input"
            onChange={handleFileSelect}
            aria-label="Upload profile image"
          />
          <label htmlFor="profile-picture-input">
            <Tooltip title="Change profile picture">
              <IconButton
                component="span"
                aria-label="Change profile picture"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
                  minHeight: 44,
                  minWidth: 44,
                  '&:focus-visible': {
                    outline: '3px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <PhotoCameraIcon />
              </IconButton>
            </Tooltip>
          </label>
        </>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} aria-labelledby="profile-picture-dialog-title">
        <DialogTitle id="profile-picture-dialog-title">Update Profile Picture</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              pt: 2,
            }}
          >
            <Avatar src={previewUrl} alt="Profile picture preview" sx={{ width: 200, height: 200 }} />
            {loading && (
              <CircularProgress size={24} sx={{ position: 'absolute' }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading} sx={{ minHeight: 44 }}>
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            color="error"
            startIcon={<DeleteIcon />}
            disabled={loading}
            sx={{ minHeight: 44 }}
          >
            Remove
          </Button>
          <Button onClick={handleUpload} variant="contained" disabled={loading} sx={{ minHeight: 44 }}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePicture;

