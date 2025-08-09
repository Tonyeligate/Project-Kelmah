import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemText } from '@mui/material';
import portfolioApi from '../services/portfolioApi';

const CertificateManager = ({ certificates = [], onAdd, onRemove }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Certificate Manager</Typography>
      <Paper sx={{ p: 2 }}>
        <List dense>
          {certificates.map((cert) => (
            <ListItem key={cert.id} secondaryAction={
              <Button size="small" color="error" onClick={() => onRemove?.(cert.id)}>Remove</Button>
            }>
              <ListItemText primary={cert.title} secondary={cert.issuer} />
            </ListItem>
          ))}
          {certificates.length === 0 && (
            <Typography variant="body2" color="text.secondary">No certificates uploaded yet.</Typography>
          )}
        </List>
        <Button variant="contained" onClick={() => document.getElementById('cert-upload')?.click()}>Add Certificate</Button>
        <input id="cert-upload" type="file" multiple hidden onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;
          await portfolioApi.uploadCertificates(files);
          onAdd?.();
        }} />
      </Paper>
    </Box>
  );
};

export default CertificateManager;


