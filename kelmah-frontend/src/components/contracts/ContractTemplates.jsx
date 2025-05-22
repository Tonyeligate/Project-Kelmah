import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Chip,
  Divider,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  VisibilityOutlined as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import ContractService from '../../services/ContractService';
import RichTextEditor from '../common/RichTextEditor';

const JOB_TYPES = [
  'Web Development',
  'Mobile Development',
  'Graphic Design',
  'Content Writing',
  'Translation',
  'Administrative Support',
  'Customer Service',
  'Accounting',
  'Legal Services',
  'Marketing',
  'Other'
];

const ContractTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    title: '',
    description: '',
    jobType: '',
    content: '',
    variables: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await ContractService.getContractTemplates();
      setTemplates(response.data.data || response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching contract templates:', err);
      setError('Failed to fetch contract templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null, view = false) => {
    if (template) {
      setCurrentTemplate(template);
    } else {
      setCurrentTemplate({
        title: '',
        description: '',
        jobType: '',
        content: '',
        variables: []
      });
    }
    setViewMode(view);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setViewMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setCurrentTemplate(prev => ({
      ...prev,
      content
    }));
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      
      // Validate inputs
      if (!currentTemplate.title || !currentTemplate.jobType || !currentTemplate.content) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        });
        setLoading(false);
        return;
      }

      // Extract variables from content (matching {{variableName}})
      const variableRegex = /{{([^}]+)}}/g;
      const matches = [...currentTemplate.content.matchAll(variableRegex)];
      const variables = matches.map(match => match[1]);

      const templateData = {
        ...currentTemplate,
        variables: [...new Set(variables)] // Remove duplicates
      };

      let response;
      if (currentTemplate.id) {
        // Update existing template
        response = await ContractService.updateContractTemplate(
          currentTemplate.id,
          templateData
        );
      } else {
        // Create new template
        response = await ContractService.createContractTemplate(templateData);
      }

      setSnackbar({
        open: true,
        message: `Template ${currentTemplate.id ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
      handleCloseDialog();
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${currentTemplate.id ? 'update' : 'create'} template. ${err.response?.data?.message || ''}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      setLoading(true);
      await ContractService.deleteContractTemplate(id);

      setSnackbar({
        open: true,
        message: 'Template deleted successfully',
        severity: 'success'
      });
      
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete template. It may be in use or you may not have permission.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = async (template) => {
    const duplicatedTemplate = {
      ...template,
      title: `${template.title} (Copy)`,
      id: undefined
    };

    setCurrentTemplate(duplicatedTemplate);
    setOpenDialog(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(search.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilter = filter === '' || template.jobType === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Contract Templates</Typography>
            <Button
              variant="contained"
          color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Template
            </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search templates..."
              variant="outlined"
              size="small"
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="filter-label">Filter by Job Type</InputLabel>
              <Select
                labelId="filter-label"
                value={filter}
                onChange={handleFilterChange}
                label="Filter by Job Type"
                displayEmpty
              >
                <MenuItem value="">All Types</MenuItem>
                {JOB_TYPES.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="body2" color="text.secondary">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && templates.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredTemplates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Templates Found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {templates.length === 0 ? 
              "You haven't created any contract templates yet." :
              "No templates match your search criteria."
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Your First Template
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Template Name</TableCell>
                <TableCell>Job Type</TableCell>
                <TableCell>Variables</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{template.title}</Typography>
                    {template.description && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {template.description.substring(0, 50)}
                        {template.description.length > 50 ? '...' : ''}
                    </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={template.jobType} size="small" />
                  </TableCell>
                  <TableCell>
                    {template.variables && template.variables.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {template.variables.slice(0, 3).map(variable => (
                        <Chip 
                          key={variable}
                            label={variable} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                        {template.variables.length > 3 && (
                          <Tooltip title={template.variables.slice(3).join(', ')}>
                            <Chip 
                              label={`+${template.variables.length - 3}`} 
                              size="small" 
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                          No variables
                        </Typography>
                      )}
                  </TableCell>
                  <TableCell>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small" 
                      onClick={() => handleOpenDialog(template, true)}
                      aria-label="View template"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small" 
                      onClick={() => handleOpenDialog(template)}
                      aria-label="Edit template"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDuplicateTemplate(template)}
                      aria-label="Duplicate template"
                    >
                      <CopyIcon />
                    </IconButton>
                    <IconButton
                      size="small" 
                      onClick={() => handleDeleteTemplate(template.id)}
                      aria-label="Delete template"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View Template Dialog */}
      {viewMode && currentTemplate && (
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
          maxWidth="md"
        fullWidth
        >
          <DialogTitle>
            {currentTemplate.title}
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>Job Type</Typography>
            <Typography variant="body1" paragraph>{currentTemplate.jobType}</Typography>
            
            <Typography variant="subtitle1" gutterBottom>Description</Typography>
            <Typography variant="body1" paragraph>{currentTemplate.description || 'No description provided'}</Typography>
            
            <Typography variant="subtitle1" gutterBottom>Variables</Typography>
            {currentTemplate.variables && currentTemplate.variables.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {currentTemplate.variables.map(variable => (
                  <Chip key={variable} label={variable} />
                ))}
              </Box>
            ) : (
              <Typography variant="body1" paragraph>No variables defined</Typography>
            )}
            
            <Typography variant="subtitle1" gutterBottom>Template Content</Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default',
                maxHeight: '300px',
                overflow: 'auto'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: currentTemplate.content }} />
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                handleCloseDialog();
                handleOpenDialog(currentTemplate, false);
              }}
            >
              Edit Template
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit/Create Template Dialog */}
      {!viewMode && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
        maxWidth="md"
          fullWidth
      >
        <DialogTitle>
            {currentTemplate.id ? 'Edit Template' : 'Create New Template'}
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
        </DialogTitle>
          <DialogContent dividers>
              <TextField
                label="Template Title"
                name="title"
                value={currentTemplate.title}
                onChange={handleInputChange}
              fullWidth
                required
                margin="normal"
              />
            
            <TextField
              label="Description"
              name="description"
              value={currentTemplate.description || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal" required>
                <InputLabel id="job-type-label">Job Type</InputLabel>
                <Select
                  labelId="job-type-label"
                  name="jobType"
                  value={currentTemplate.jobType}
                  onChange={handleInputChange}
                  label="Job Type"
                >
                  {JOB_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Template Content
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Use {{variableName}} syntax to define placeholders that will be replaced with actual values when creating a contract.
              </Typography>
              
                <RichTextEditor
                  value={currentTemplate.content}
                  onChange={handleContentChange}
                />
              </Box>
            
            {currentTemplate.variables && currentTemplate.variables.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Detected Variables
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {currentTemplate.variables.map(variable => (
                    <Chip key={variable} label={variable} />
                  ))}
                </Box>
              </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancel
          </Button>
            <Button 
              variant="contained"
              onClick={handleSaveTemplate} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : 'Save Template'}
            </Button>
        </DialogActions>
      </Dialog>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContractTemplates; 