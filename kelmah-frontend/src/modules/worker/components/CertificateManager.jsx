import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
} from '@mui/material';
import portfolioApi from '../services/portfolioService';

const CertificateManager = ({ certificates = [], onAdd, onRemove }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Certificate Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Certificates build trust. Add documents that show your trade training or
        safety compliance.
      </Typography>
      <Paper sx={{ p: 2 }}>
        <List dense>
          {certificates.map((cert) => (
            <ListItem
              key={cert.id}
              sx={{ alignItems: 'flex-start' }}
              secondaryAction={
                <Button
                  size="small"
                  color="error"
                  onClick={() => onRemove?.(cert.id)}
                  aria-label={`Remove certificate ${cert.title}`}
                  sx={{ minHeight: 44, whiteSpace: 'nowrap' }}
                >
                  Remove
                </Button>
              }
            >
              <ListItemText
                primary={cert.title}
                secondary={cert.issuer}
                primaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
                secondaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
              />
            </ListItem>
          ))}
          {certificates.length === 0 && (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                mt: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No certificates uploaded yet. Add at least one certificate so
                clients can quickly trust your profile.
              </Typography>
            </Box>
          )}
        </List>
        <Stack spacing={1} alignItems="flex-start">
          <Button
            variant="contained"
            onClick={() => document.getElementById('cert-upload')?.click()}
            sx={{ minHeight: 44 }}
          >
            Add Certificate
          </Button>
          <Typography variant="caption" color="text.secondary">
            Supported files: image or PDF. Upload clear, readable documents.
          </Typography>
        </Stack>
        <input
          id="cert-upload"
          type="file"
          multiple
          hidden
          aria-label="Choose certificate files"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;
            await portfolioApi.uploadCertificates(files);
            onAdd?.();
          }}
        />
      </Paper>
    </Box>
  );
};

export default CertificateManager;
