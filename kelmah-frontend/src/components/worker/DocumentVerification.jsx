import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DocumentVerification = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    file: null,
    expiryDate: null
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workers/${user.id}/documents`);
      const data = await response.json();
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (document = null) => {
    setEditingDocument(document);
    if (document) {
      setFormData({
        type: document.type,
        title: document.title,
        description: document.description,
        file: null,
        expiryDate: document.expiryDate
      });
    } else {
      setFormData({
        type: '',
        title: '',
        description: '',
        file: null,
        expiryDate: null
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingDocument(null);
    setFormData({
      type: '',
      title: '',
      description: '',
      file: null,
      expiryDate: null
    });
    setUploadProgress(0);
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleFileChange = (event) => {
    setFormData({
      ...formData,
      file: event.target.files[0]
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const url = editingDocument
        ? `/api/workers/${user.id}/documents/${editingDocument.id}`
        : `/api/workers/${user.id}/documents`;
      
      const method = editingDocument ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
        }
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      handleDialogClose();
      fetchDocuments();
    } catch (err) {
      setError('Failed to save document');
      console.error(err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workers/${user.id}/documents/${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      fetchDocuments();
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await fetch(`/api/workers/${user.id}/documents/${documentId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download document');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <VerifiedIcon />;
      case 'pending':
        return <PendingIcon />;
      case 'rejected':
        return <CloseIcon />;
      case 'expired':
        return <WarningIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  const renderDocumentCard = (document) => (
    <Card key={document.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6">{document.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {document.type}
            </Typography>
          </Box>
          <Chip
            icon={getStatusIcon(document.status)}
            label={document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            color={getStatusColor(document.status)}
            size="small"
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" paragraph>
          {document.description}
        </Typography>
        {document.expiryDate && (
          <Typography variant="body2" color="text.secondary">
            Expires: {new Date(document.expiryDate).toLocaleDateString()}
          </Typography>
        )}
        {document.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {document.notes}
          </Typography>
        )}
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          size="small"
          startIcon={<DescriptionIcon />}
          onClick={() => handleDownload(document.id)}
        >
          Download
        </Button>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => handleDialogOpen(document)}
        >
          Edit
        </Button>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => handleDelete(document.id)}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Document Verification
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Upload Document
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No documents uploaded yet
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Required Documents
              </Typography>
              <List>
                {documents
                  .filter(doc => doc.required)
                  .map(doc => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>
                        {getStatusIcon(doc.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.title}
                        secondary={doc.type}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <DescriptionIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Additional Documents
              </Typography>
              <List>
                {documents
                  .filter(doc => !doc.required)
                  .map(doc => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>
                        {getStatusIcon(doc.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.title}
                        secondary={doc.type}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <DescriptionIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              All Documents
            </Typography>
            {documents.map(renderDocumentCard)}
          </Grid>
        </Grid>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingDocument ? 'Edit Document' : 'Upload Document'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Document Type"
                    onChange={handleInputChange('type')}
                  >
                    <MenuItem value="id">ID Document</MenuItem>
                    <MenuItem value="certificate">Certificate</MenuItem>
                    <MenuItem value="license">License</MenuItem>
                    <MenuItem value="portfolio">Portfolio</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  Upload File
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </Button>
                {formData.file && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formData.file.name}
                  </Typography>
                )}
                {uploadProgress > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={handleInputChange('expiryDate')}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.type || !formData.title || !formData.description || (!editingDocument && !formData.file)}
          >
            {editingDocument ? 'Update' : 'Upload'} Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentVerification; 