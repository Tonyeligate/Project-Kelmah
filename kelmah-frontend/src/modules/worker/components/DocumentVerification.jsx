// IconButton focus-visible styling is enforced globally via MuiIconButton theme overrides.
















const unwrap = (response) => response?.data?.data ?? response?.data ?? {};

const toDocumentView = (certificate = {}) => ({
  id: certificate.id || certificate._id,
  type: certificate.issuer || 'Certificate',
  title: certificate.name || 'Untitled Document',
  description: certificate?.metadata?.description || '',
  file: null,
  fileUrl: certificate.url || null,
  expiryDate: certificate.expiresAt || null,
  issuedAt: certificate.issuedAt || null,
  credentialId: certificate.credentialId || '',
  status:
    certificate.status === 'verified'
      ? 'verified'
      : certificate.status === 'rejected'
        ? 'rejected'
        : 'pending',
});

const DocumentVerification = () => {
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
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
    expiryDate: null,
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      if (!userId) {
        setDocuments([]);
        setError('User context is missing. Please log in again.');
        return;
      }

      const response = await api.get(`/workers/${userId}/certificates`);
      const payload = unwrap(response);
      const certificates = Array.isArray(payload?.certificates)
        ? payload.certificates
        : [];

      setDocuments(certificates.map(toDocumentView));
      setError(null);
    } catch (err) {
      setError('Failed to load documents');
      devError(err);
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
        expiryDate: document.expiryDate,
      });
    } else {
      setFormData({
        type: '',
        title: '',
        description: '',
        file: null,
        expiryDate: null,
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
      expiryDate: null,
    });
    setUploadProgress(0);
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    setFormData({
      ...formData,
      file: event.target.files[0],
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      if (!userId) {
        throw new Error('Missing user id');
      }

      let uploadedFileUrl = editingDocument?.fileUrl || null;
      let uploadedFileMetadata = editingDocument?.metadata?.file || null;
      if (formData.file) {
        const uploadResult = await certificateService.uploadCertificateFile(
          formData.file,
          setUploadProgress,
        );
        uploadedFileUrl = uploadResult?.url || uploadedFileUrl;
        uploadedFileMetadata = {
          publicId: uploadResult?.publicId || null,
          resourceType: uploadResult?.resourceType || null,
          thumbnailUrl: uploadResult?.thumbnailUrl || null,
        };
      }

      const payload = {
        name: formData.title,
        issuer: formData.type,
        issuedAt: formData.expiryDate || new Date().toISOString(),
        expiresAt: formData.expiryDate || null,
        credentialId: editingDocument?.credentialId || null,
        url: uploadedFileUrl,
        metadata: {
          description: formData.description,
          file: uploadedFileMetadata,
        },
      };

      if (editingDocument?.id) {
        await api.put(`/workers/${userId}/certificates/${editingDocument.id}`, payload);
      } else {
        await api.post(`/workers/${userId}/certificates`, payload);
      }

      handleDialogClose();
      fetchDocuments();
    } catch (err) {
      setError('Failed to save document');
      devError(err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (documentId) => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      if (!userId) {
        throw new Error('Missing user id');
      }

      await api.delete(`/workers/${userId}/certificates/${documentId}`);

      fetchDocuments();
    } catch (err) {
      setError('Failed to delete document');
      devError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const selected = documents.find((item) => item.id === documentId);
      if (!selected?.fileUrl) {
        throw new Error('No file available for download');
      }

      const response = await fetch(selected.fileUrl);
      if (!response.ok) {
        throw new Error('Unable to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selected.title || 'document'}-${documentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download document');
      devError(err);
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6">{document.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {document.type}
            </Typography>
          </Box>
          <Chip
            icon={getStatusIcon(document.status)}
            label={
              document.status.charAt(0).toUpperCase() + document.status.slice(1)
            }
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
            Expires: {document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : 'N/A'}
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5">Document Verification</Typography>
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
                  .filter((doc) => doc.required)
                  .map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>{getStatusIcon(doc.status)}</ListItemIcon>
                      <ListItemText primary={doc.title} secondary={doc.type} />
                      <ListItemSecondaryAction>
                        <IconButton sx={{ ...iconButtonA11ySx, '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' } }}
                          edge="end"
                          onClick={() => handleDownload(doc.id)}
                          aria-label={`Download ${doc.title}`}
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
                  .filter((doc) => !doc.required)
                  .map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>{getStatusIcon(doc.status)}</ListItemIcon>
                      <ListItemText primary={doc.title} secondary={doc.type} />
                      <ListItemSecondaryAction>
                        <IconButton sx={{ ...iconButtonA11ySx, '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '2px' } }}
                          edge="end"
                          onClick={() => handleDownload(doc.id)}
                          aria-label={`Download ${doc.title}`}
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
        aria-labelledby="document-dialog-title"
      >
        <DialogTitle id="document-dialog-title">
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
                    aria-label="Upload verification document"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </Button>
                {formData.file && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
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
            disabled={
              loading ||
              !formData.type ||
              !formData.title ||
              !formData.description ||
              (!editingDocument && !formData.file)
            }
          >
            {editingDocument ? 'Update' : 'Upload'} Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentVerification;


