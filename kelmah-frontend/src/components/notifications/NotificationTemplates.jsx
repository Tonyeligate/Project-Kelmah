import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Save,
  Add,
  Delete,
  Preview,
  RestartAlt,
  InfoOutlined,
  NotificationsActive
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { notificationService } from '../../services/notificationService';

// Styled components
const VariableChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }
}));

const PreviewCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  backgroundColor: theme.palette.background.default,
}));

const TemplateVariables = {
  USER: ['userName', 'userFirstName', 'userLastName', 'userEmail'],
  JOB: ['jobTitle', 'jobId', 'jobSalary', 'jobLocation', 'jobType', 'jobDescription', 'employerName'],
  PAYMENT: ['amount', 'currency', 'paymentDate', 'paymentMethod', 'invoiceId'],
  MESSAGE: ['senderName', 'messagePreview', 'conversationId'],
  REVIEW: ['reviewerName', 'rating', 'reviewContent'],
  CONTRACT: ['contractTitle', 'contractStartDate', 'contractEndDate', 'contractValue'],
};

const NotificationTypes = [
  { value: 'job_posted', label: 'New Job Posted', category: 'JOB' },
  { value: 'job_application', label: 'Job Application Received', category: 'JOB' },
  { value: 'job_offer', label: 'Job Offer Received', category: 'JOB' },
  { value: 'message_received', label: 'New Message', category: 'MESSAGE' },
  { value: 'payment_received', label: 'Payment Received', category: 'PAYMENT' },
  { value: 'payment_sent', label: 'Payment Sent', category: 'PAYMENT' },
  { value: 'review_received', label: 'New Review', category: 'REVIEW' },
  { value: 'contract_created', label: 'Contract Created', category: 'CONTRACT' },
  { value: 'contract_ended', label: 'Contract Ended', category: 'CONTRACT' },
];

const ChannelTypes = [
  { value: 'in_app', label: 'In-App' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push Notification' },
];

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [currentType, setCurrentType] = useState('job_posted');
  const [currentChannel, setCurrentChannel] = useState('in_app');
  const [currentTemplate, setCurrentTemplate] = useState({ subject: '', body: '' });
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  // First tab is template editor, second tab is template list
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update current template when type or channel changes
  useEffect(() => {
    if (templates && templates[currentType] && templates[currentType][currentChannel]) {
      setCurrentTemplate(templates[currentType][currentChannel]);
    } else {
      // Set default template
      setCurrentTemplate({
        subject: '',
        body: ''
      });
    }
  }, [currentType, currentChannel, templates]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getNotificationTemplates();
      setTemplates(response);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notification templates:', err);
      setError('Failed to load templates. Please try again later.');
      setLoading(false);
      
      // Create mock templates for development
      const mockTemplates = {};
      NotificationTypes.forEach(type => {
        mockTemplates[type.value] = {};
        ChannelTypes.forEach(channel => {
          mockTemplates[type.value][channel.value] = {
            subject: channel.value === 'email' ? `[Kelmah] ${type.label}` : '',
            body: `This is a sample template for ${type.label} via ${channel.label}`
          };
        });
      });
      
      setTemplates(mockTemplates);
    }
  };

  const handleTypeChange = (event) => {
    setCurrentType(event.target.value);
  };

  const handleChannelChange = (event) => {
    setCurrentChannel(event.target.value);
  };

  const handleTemplateChange = (field) => (event) => {
    setCurrentTemplate({
      ...currentTemplate,
      [field]: event.target.value
    });
  };

  const handleInsertVariable = (variable) => {
    const textField = document.getElementById('template-body');
    const cursorPosition = textField.selectionStart;
    
    const newBody = 
      currentTemplate.body.substring(0, cursorPosition) + 
      `{{${variable}}}` + 
      currentTemplate.body.substring(cursorPosition);
    
    setCurrentTemplate({
      ...currentTemplate,
      body: newBody
    });
    
    // Focus back on the text field
    setTimeout(() => {
      textField.focus();
      textField.setSelectionRange(
        cursorPosition + variable.length + 4,
        cursorPosition + variable.length + 4
      );
    }, 0);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    setError(null);
    
    try {
      await notificationService.saveNotificationTemplate(
        currentType,
        currentChannel,
        currentTemplate
      );
      
      // Update local state
      setTemplates({
        ...templates,
        [currentType]: {
          ...(templates[currentType] || {}),
          [currentChannel]: currentTemplate
        }
      });
      
      enqueueSnackbar('Template saved successfully', { variant: 'success' });
      setSaving(false);
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template. Please try again.');
      setSaving(false);
    }
  };

  const handleResetTemplate = () => {
    if (templates && templates[currentType] && templates[currentType][currentChannel]) {
      setCurrentTemplate(templates[currentType][currentChannel]);
    } else {
      setCurrentTemplate({ subject: '', body: '' });
    }
  };

  const handlePreviewTemplate = () => {
    // Generate sample data based on template type
    const category = NotificationTypes.find(t => t.value === currentType)?.category || 'USER';
    const sampleData = {};
    
    // Add user variables (common to all notifications)
    TemplateVariables.USER.forEach(variable => {
      sampleData[variable] = variable === 'userName' ? 'John Doe' : 
                             variable === 'userFirstName' ? 'John' :
                             variable === 'userLastName' ? 'Doe' : 
                             'john.doe@example.com';
    });
    
    // Add category-specific variables
    if (category === 'JOB') {
      sampleData.jobTitle = 'Senior Software Engineer';
      sampleData.jobId = 'JOB-12345';
      sampleData.jobSalary = '$120,000 - $150,000';
      sampleData.jobLocation = 'San Francisco, CA';
      sampleData.jobType = 'Full-time';
      sampleData.jobDescription = 'This is a sample job description';
      sampleData.employerName = 'Tech Solutions Inc.';
    } else if (category === 'PAYMENT') {
      sampleData.amount = '500.00';
      sampleData.currency = 'USD';
      sampleData.paymentDate = new Date().toLocaleDateString();
      sampleData.paymentMethod = 'Credit Card';
      sampleData.invoiceId = 'INV-67890';
    } else if (category === 'MESSAGE') {
      sampleData.senderName = 'Jane Smith';
      sampleData.messagePreview = 'Hi there, I wanted to discuss the project...';
      sampleData.conversationId = 'CONV-54321';
    } else if (category === 'REVIEW') {
      sampleData.reviewerName = 'Alex Johnson';
      sampleData.rating = '4.5';
      sampleData.reviewContent = 'It was a pleasure working with you!';
    } else if (category === 'CONTRACT') {
      sampleData.contractTitle = 'Web Development Project';
      sampleData.contractStartDate = new Date().toLocaleDateString();
      sampleData.contractEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
      sampleData.contractValue = '$3,000';
    }
    
    setPreviewData(sampleData);
  };

  const renderPreview = () => {
    if (!previewData) return null;
    
    let previewSubject = currentTemplate.subject;
    let previewBody = currentTemplate.body;
    
    // Replace all variables with sample data
    Object.keys(previewData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewSubject = previewSubject.replace(regex, previewData[key]);
      previewBody = previewBody.replace(regex, previewData[key]);
    });
    
    return (
      <PreviewCard>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Preview:
          </Typography>
          {currentChannel === 'email' && (
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Subject: {previewSubject}
            </Typography>
          )}
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
            {previewBody}
          </Typography>
        </CardContent>
      </PreviewCard>
    );
  };

  const getCurrentTypeVariables = () => {
    const category = NotificationTypes.find(t => t.value === currentType)?.category || 'USER';
    return [
      ...TemplateVariables.USER,
      ...(TemplateVariables[category] || [])
    ];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <NotificationsActive sx={{ mr: 1 }} />
        Notification Templates
      </Typography>
      
      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Edit Templates" />
        <Tab label="All Templates" />
      </Tabs>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {currentTab === 0 && (
        <Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Notification Type</InputLabel>
                <Select
                  value={currentType}
                  onChange={handleTypeChange}
                  label="Notification Type"
                >
                  {NotificationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Channel</InputLabel>
                <Select
                  value={currentChannel}
                  onChange={handleChannelChange}
                  label="Channel"
                >
                  {ChannelTypes.map((channel) => (
                    <MenuItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Available Variables:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {getCurrentTypeVariables().map((variable) => (
                <VariableChip
                  key={variable}
                  label={variable}
                  onClick={() => handleInsertVariable(variable)}
                  clickable
                />
              ))}
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {currentChannel === 'email' && (
            <TextField
              fullWidth
              label="Subject Line"
              value={currentTemplate.subject}
              onChange={handleTemplateChange('subject')}
              margin="normal"
              variant="outlined"
            />
          )}
          
          <TextField
            id="template-body"
            fullWidth
            label="Template Content"
            value={currentTemplate.body}
            onChange={handleTemplateChange('body')}
            margin="normal"
            variant="outlined"
            multiline
            rows={6}
            helperText="Use {{variable}} syntax to include dynamic content"
          />
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSaveTemplate}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={handlePreviewTemplate}
            >
              Preview
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<RestartAlt />}
              onClick={handleResetTemplate}
            >
              Reset
            </Button>
          </Box>
          
          {renderPreview()}
        </Box>
      )}
      
      {currentTab === 1 && (
        <Box>
          {NotificationTypes.map((type) => (
            <Accordion key={type.value}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">{type.label}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {ChannelTypes.map((channel) => {
                    const template = templates[type.value]?.[channel.value];
                    return (
                      <Grid item xs={12} key={channel.value}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                              {channel.label}
                            </Typography>
                            
                            {channel.value === 'email' && template?.subject && (
                              <Typography variant="body2" gutterBottom>
                                <strong>Subject:</strong> {template.subject}
                              </Typography>
                            )}
                            
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              <strong>Content:</strong> {template?.body || 'No template defined'}
                            </Typography>
                            
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setCurrentTab(0);
                                  setCurrentType(type.value);
                                  setCurrentChannel(channel.value);
                                }}
                              >
                                Edit
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default NotificationTemplates; 