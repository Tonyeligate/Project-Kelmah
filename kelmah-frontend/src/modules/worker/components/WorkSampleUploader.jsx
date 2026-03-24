import React from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import portfolioApi from '../services/portfolioService';
import { devError } from '@/modules/common/utils/devLogger';

const WorkSampleUploader = ({ onUpload }) => {
  const fileInputRef = React.useRef(null);
  const [uploadError, setUploadError] = React.useState(null);

  const handleSelect = () => fileInputRef.current?.click();

  const handleChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadError(null);
    try {
      await portfolioApi.uploadWorkSamples(files);
      onUpload?.(files);
    } catch (err) {
      devError('Upload failed', err);
      setUploadError('Upload failed. Please try again.');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Work Sample Uploader
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Add clear before-and-after photos when possible. This helps hirers trust your work quality quickly.
        </Alert>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          hidden
          ref={fileInputRef}
          aria-label="Choose work sample files"
          onChange={handleChange}
        />
        <Button variant="contained" onClick={handleSelect} sx={{ minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
          Upload Samples
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Supported: images and short videos, up to 20MB per file. Use simple titles so clients can scan your work fast.
        </Typography>
        {uploadError && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={() => setUploadError(null)}>
            {uploadError}
          </Alert>
        )}
        <Alert severity="info" sx={{ mt: 1 }}>
          Uploads require authentication. Ensure you are logged in.
        </Alert>
      </Paper>
    </Box>
  );
};

export default WorkSampleUploader;

