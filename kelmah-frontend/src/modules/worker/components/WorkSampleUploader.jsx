import React from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import portfolioApi from '../services/portfolioService';

const WorkSampleUploader = ({ onUpload }) => {
  const fileInputRef = React.useRef(null);

  const handleSelect = () => fileInputRef.current?.click();

  const handleChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      await portfolioApi.uploadWorkSamples(files);
      onUpload?.(files);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Work Sample Uploader
      </Typography>
      <Paper sx={{ p: 2 }}>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          hidden
          ref={fileInputRef}
          onChange={handleChange}
        />
        <Button variant="contained" onClick={handleSelect}>
          Upload Samples
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Supported: images and short videos. Max 20MB per file.
        </Typography>
        <Alert severity="info" sx={{ mt: 1 }}>
          Uploads require authentication. Ensure you are logged in.
        </Alert>
      </Paper>
    </Box>
  );
};

export default WorkSampleUploader;
