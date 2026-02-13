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

const ProfilePicture = ({ size = 120, editable = true }) => {
  const { uploadProfilePicture } = useProfile();
  const profile = useSelector(selectProfile);
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

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      await uploadProfilePicture(selectedFile);
      setOpenDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
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
    } catch (error) {
      console.error('Error removing profile picture:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <Avatar
        src={previewUrl || profile?.profilePicture || profile?.avatar || ''}
        sx={{
          width: size,
          height: size,
          border: '2px solid',
          borderColor: 'primary.main',
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
          />
          <label htmlFor="profile-picture-input">
            <Tooltip title="Change profile picture">
              <IconButton
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Update Profile Picture</DialogTitle>
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
            <Avatar src={previewUrl} sx={{ width: 200, height: 200 }} />
            {loading && (
              <CircularProgress size={24} sx={{ position: 'absolute' }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            color="error"
            startIcon={<DeleteIcon />}
            disabled={loading}
          >
            Remove
          </Button>
          <Button onClick={handleUpload} variant="contained" disabled={loading}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePicture;
