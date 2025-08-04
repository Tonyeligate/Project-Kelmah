import React, { useState, useCallback } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import certificateService from '../services/certificateService';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stack,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  CheckCircle as VerifiedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Add as AddIcon,
  Description as DocumentIcon,
  School as CertificateIcon,
  WorkOutline as LicenseIcon,
  Security as BadgeIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useDropzone } from 'react-dropzone';
import { formatFileSize, formatDate } from '../../../utils/formatters';

const CertificateUploader = ({ onCertificatesChange }) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // State management
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    description: '',
    category: '',
    skills: [],
  });

  const certificateTypes = [
    { value: 'certificate', label: 'Certificate', icon: CertificateIcon },
    { value: 'license', label: 'License', icon: LicenseIcon },
    { value: 'badge', label: 'Digital Badge', icon: BadgeIcon },
    { value: 'diploma', label: 'Diploma', icon: DocumentIcon },
  ];

  const categories = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Masonry',
    'Painting',
    'Roofing',
    'Safety',
    'HVAC',
    'General Construction',
    'Project Management',
    'Other'
  ];

  // Load certificates
  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await certificateService.getWorkerCertificates(user.id);
      setCertificates(response.data || []);
      if (onCertificatesChange) {
        onCertificatesChange(response.data || []);
      }
    } catch (error) {
      enqueueSnackbar('Failed to load certificates', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user.id, enqueueSnackbar, onCertificatesChange]);

  React.useEffect(() => {
    if (user?.id) {
      loadCertificates();
    }
  }, [loadCertificates, user]);

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!selectedCertificate && !isDialogOpen) {
      // If no certificate is selected, open dialog first
      setIsDialogOpen(true);
      setFormData(prev => ({ ...prev, file }));
      return;
    }

    try {
      setUploadProgress({ [file.name]: 0 });
      
      const uploadResult = await certificateService.uploadCertificateFile(
        file,
        (progress) => {
          setUploadProgress({ [file.name]: progress });
        }
      );

      setFormData(prev => ({
        ...prev,
        file,
        fileUrl: uploadResult.data.url,
        fileName: file.name,
        fileSize: file.size,
      }));

      setUploadProgress({});
      enqueueSnackbar('File uploaded successfully', { variant: 'success' });
    } catch (error) {
      setUploadProgress({});
      enqueueSnackbar('Failed to upload file', { variant: 'error' });
    }
  }, [selectedCertificate, isDialogOpen, enqueueSnackbar]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const certificateData = {
        ...formData,
        workerId: user.id,
        skills: formData.skills.join(','),
        status: 'pending', // Default status
      };

      if (isEditing && selectedCertificate) {
        await certificateService.updateCertificate(selectedCertificate.id, certificateData);
        enqueueSnackbar('Certificate updated successfully', { variant: 'success' });
      } else {
        await certificateService.createCertificate(certificateData);
        enqueueSnackbar('Certificate added successfully', { variant: 'success' });
      }

      handleCloseDialog();
      loadCertificates();
    } catch (error) {
      enqueueSnackbar('Failed to save certificate', { variant: 'error' });
    }
  };

  // Handle delete
  const handleDelete = async (certificateId) => {
    if (window.confirm('Are you sure you want to delete this certificate?')) {
      try {
        await certificateService.deleteCertificate(certificateId);
        enqueueSnackbar('Certificate deleted successfully', { variant: 'success' });
        loadCertificates();
      } catch (error) {
        enqueueSnackbar('Failed to delete certificate', { variant: 'error' });
      }
    }
  };

  // Dialog handlers
  const handleOpenDialog = (certificate = null) => {
    if (certificate) {
      setSelectedCertificate(certificate);
      setFormData({
        name: certificate.name || '',
        type: certificate.type || '',
        issuingOrganization: certificate.issuingOrganization || '',
        issueDate: certificate.issueDate || '',
        expiryDate: certificate.expiryDate || '',
        credentialId: certificate.credentialId || '',
        description: certificate.description || '',
        category: certificate.category || '',
        skills: certificate.skills ? certificate.skills.split(',') : [],
        fileUrl: certificate.fileUrl || '',
        fileName: certificate.fileName || '',
        fileSize: certificate.fileSize || 0,
      });
      setIsEditing(true);
    } else {
      setSelectedCertificate(null);
      setFormData({
        name: '',
        type: '',
        issuingOrganization: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        description: '',
        category: '',
        skills: [],
        file: null,
        fileUrl: '',
        fileName: '',
        fileSize: 0,
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCertificate(null);
    setIsEditing(false);
    setFormData({
      name: '',
      type: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      description: '',
      category: '',
      skills: [],
      file: null,
      fileUrl: '',
      fileName: '',
      fileSize: 0,
    });
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'verified':
        return { color: 'success', icon: VerifiedIcon, label: 'Verified' };
      case 'pending':
        return { color: 'warning', icon: PendingIcon, label: 'Pending' };
      case 'rejected':
        return { color: 'error', icon: RejectedIcon, label: 'Rejected' };
      default:
        return { color: 'default', icon: PendingIcon, label: 'Unknown' };
    }
  };

  // Render certificate card
  const renderCertificateCard = (certificate) => {
    const status = getStatusDisplay(certificate.status);
    const TypeIcon = certificateTypes.find(t => t.value === certificate.type)?.icon || DocumentIcon;

    return (
      <Card
        key={certificate.id}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <TypeIcon color="primary" />
              <Typography variant="h6" component="h3">
                {certificate.name}
              </Typography>
            </Box>
            <Chip
              icon={<status.icon />}
              label={status.label}
              color={status.color}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {certificate.issuingOrganization}
          </Typography>

          <Typography variant="body2" paragraph>
            {certificate.description?.length > 100
              ? `${certificate.description.substring(0, 100)}...`
              : certificate.description}
          </Typography>

          <Stack spacing={1}>
            {certificate.category && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  Category:
                </Typography>
                <Typography variant="body2">{certificate.category}</Typography>
              </Box>
            )}

            {certificate.issueDate && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  Issued:
                </Typography>
                <Typography variant="body2">{formatDate(certificate.issueDate)}</Typography>
              </Box>
            )}

            {certificate.expiryDate && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  Expires:
                </Typography>
                <Typography variant="body2">{formatDate(certificate.expiryDate)}</Typography>
              </Box>
            )}

            {certificate.credentialId && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" fontWeight="medium" color="text.secondary">
                  ID:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {certificate.credentialId}
                </Typography>
              </Box>
            )}
          </Stack>

          {certificate.skills && (
            <Box mt={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {certificate.skills.split(',').slice(0, 3).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill.trim()}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {certificate.skills.split(',').length > 3 && (
                  <Chip
                    label={`+${certificate.skills.split(',').length - 3} more`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Stack>
            </Box>
          )}

          {certificate.fileName && (
            <Box mt={2} display="flex" alignItems="center" gap={1}>
              <DocumentIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {certificate.fileName} ({formatFileSize(certificate.fileSize)})
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions>
          {certificate.fileUrl && (
            <IconButton
              size="small"
              onClick={() => window.open(certificate.fileUrl, '_blank')}
              title="View Document"
            >
              <ViewIcon />
            </IconButton>
          )}
          {certificate.fileUrl && (
            <IconButton
              size="small"
              onClick={() => {
                const link = document.createElement('a');
                link.href = certificate.fileUrl;
                link.download = certificate.fileName;
                link.click();
              }}
              title="Download"
            >
              <DownloadIcon />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(certificate)}
            title="Edit"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(certificate.id)}
            title="Delete"
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h2">
          Certificates & Licenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Certificate
        </Button>
      </Box>

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.1) : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <input {...getInputProps()} />
        <Box textAlign="center">
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop the file here' : 'Drag & drop a certificate file here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to select a file (PDF, DOC, DOCX, PNG, JPG - max 10MB)
          </Typography>
        </Box>
      </Paper>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box mb={3}>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <Box key={fileName}>
              <Typography variant="body2" gutterBottom>
                Uploading {fileName}...
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          ))}
        </Box>
      )}

      {/* Certificates Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CircularProgress size={20} />
                    <Typography>Loading...</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : certificates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CertificateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Certificates Added Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload your certificates, licenses, and qualifications to build credibility
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Your First Certificate
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {certificates.map((certificate) => (
            <Grid item xs={12} sm={6} md={4} key={certificate.id}>
              {renderCertificateCard(certificate)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? 'Edit Certificate' : 'Add Certificate'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certificate Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  label="Type"
                >
                  {certificateTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <type.icon fontSize="small" />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issuing Organization"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Issue Date"
                value={formData.issueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Expiry Date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Credential ID"
                value={formData.credentialId}
                onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
                placeholder="Certificate or license number"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the certificate or what skills it represents"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Related Skills"
                value={formData.skills.join(', ')}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                }))}
                placeholder="Enter skills separated by commas"
              />
            </Grid>

            {formData.fileName && (
              <Grid item xs={12}>
                <Alert severity="success">
                  File uploaded: {formData.fileName} ({formatFileSize(formData.fileSize)})
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.type || !formData.issuingOrganization}
          >
            {isEditing ? 'Update' : 'Add'} Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateUploader;