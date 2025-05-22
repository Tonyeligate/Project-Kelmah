import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip
} from '@mui/material';
import {
    CloudUpload,
    CheckCircle,
    Error,
    Delete,
    Description,
    VerifiedUser
} from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const DocumentVerification = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [documents, setDocuments] = useState([]);
    const [uploadDialog, setUploadDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const documentTypes = [
        { id: 'id_card', name: 'ID Card', description: 'Government-issued ID (Ghana Card, Passport, etc.)' },
        { id: 'proof_of_address', name: 'Proof of Address', description: 'Utility bill or bank statement' },
        { id: 'certification', name: 'Certification', description: 'Professional certifications or qualifications' },
        { id: 'portfolio', name: 'Portfolio', description: 'Work samples or portfolio items' }
    ];

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/worker/documents`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setDocuments(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load documents. Please try again later.');
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !documentType) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', documentType);

        try {
            setUploadProgress(0);
            const response = await axios.post(
                `${BACKEND_URL}/worker/documents/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(progress);
                    }
                }
            );

            setDocuments(prev => [...prev, response.data.data]);
            setUploadDialog(false);
            setSelectedFile(null);
            setDocumentType('');
        } catch (err) {
            setError('Failed to upload document. Please try again.');
        } finally {
            setUploadProgress(0);
        }
    };

    const handleDelete = async (documentId) => {
        try {
            await axios.delete(`${BACKEND_URL}/worker/documents/${documentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        } catch (err) {
            setError('Failed to delete document. Please try again.');
        }
    };

    const getVerificationStatus = () => {
        const requiredDocs = ['id_card', 'proof_of_address'];
        const verifiedDocs = documents.filter(doc => doc.status === 'verified');
        const hasAllRequired = requiredDocs.every(type =>
            verifiedDocs.some(doc => doc.type === type)
        );

        return hasAllRequired ? 'verified' : 'pending';
    };

    const renderDocumentList = () => (
        <List>
            {documents.map((document) => (
                <ListItem key={document.id}>
                    <ListItemText
                        primary={documentTypes.find(t => t.id === document.type)?.name}
                        secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {documentTypes.find(t => t.id === document.type)?.description}
                                </Typography>
                                <Chip
                                    size="small"
                                    label={document.status}
                                    color={
                                        document.status === 'verified'
                                            ? 'success'
                                            : document.status === 'pending'
                                            ? 'warning'
                                            : 'error'
                                    }
                                />
                            </Box>
                        }
                    />
                    <ListItemSecondaryAction>
                        <IconButton
                            edge="end"
                            onClick={() => handleDelete(document.id)}
                            disabled={document.status === 'verified'}
                        >
                            <Delete />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
        </List>
    );

    const renderUploadDialog = () => (
        <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)}>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Document Type</InputLabel>
                            <Select
                                value={documentType}
                                label="Document Type"
                                onChange={(e) => setDocumentType(e.target.value)}
                            >
                                {documentTypes.map(type => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            startIcon={<CloudUpload />}
                        >
                            Select File
                            <input
                                type="file"
                                hidden
                                onChange={handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                        </Button>
                        {selectedFile && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Selected: {selectedFile.name}
                            </Typography>
                        )}
                    </Grid>
                    {uploadProgress > 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress variant="determinate" value={uploadProgress} size={20} />
                                <Typography variant="body2">
                                    Uploading: {uploadProgress}%
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!selectedFile || !documentType || uploadProgress > 0}
                >
                    Upload
                </Button>
            </DialogActions>
        </Dialog>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <VerifiedUser sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                            Document Verification Status
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getVerificationStatus() === 'verified' ? (
                            <>
                                <CheckCircle color="success" />
                                <Typography>All required documents verified</Typography>
                            </>
                        ) : (
                            <>
                                <Error color="warning" />
                                <Typography>Verification pending</Typography>
                            </>
                        )}
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Documents</Typography>
                <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    onClick={() => setUploadDialog(true)}
                >
                    Upload Document
                </Button>
            </Box>

            {renderDocumentList()}
            {renderUploadDialog()}
        </Box>
    );
};

export default DocumentVerification; 