import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Tooltip,
  LinearProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  AttachFile as AttachFileIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  PlayArrow as StartIcon,
  Send as SubmitIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import milestoneService from '../../services/milestoneService';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { formatDistanceToNow } from 'date-fns';
import ContractService from '../../services/ContractService';

const MilestoneTracker = ({ contractId, userRole, readOnly = false, status }) => {
  const { token } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    amount: '',
    deliverables: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [success, setSuccess] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  const [formMode, setFormMode] = useState('create');
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Fetch milestones on component mount
  useEffect(() => {
    if (contractId) {
      fetchMilestones();
    }
  }, [contractId]);

  // Calculate active step based on milestone status
  useEffect(() => {
    if (milestones.length > 0) {
      const completedMilestones = milestones.filter(m => m.status === 'completed');
      const inProgressMilestones = milestones.filter(m => m.status === 'in_progress');
      
      if (inProgressMilestones.length > 0) {
        // Find the index of the first in-progress milestone
        const inProgressIndex = milestones.findIndex(m => m.status === 'in_progress');
        setActiveStep(inProgressIndex);
      } else {
        // Set to the next milestone after the last completed one
        setActiveStep(completedMilestones.length);
      }
    }
  }, [milestones]);

  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await milestoneService.getMilestones(contractId);
      setMilestones(response);
      calculateActiveStep(response);
    } catch (error) {
      setError('Error fetching milestones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (milestone = null) => {
    if (milestone) {
      // Edit existing milestone
      setSelectedMilestone(milestone);
      setMilestoneForm({
        title: milestone.title,
        description: milestone.description || '',
        dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
        amount: milestone.amount,
        deliverables: milestone.deliverables || []
      });
    } else {
      // Create new milestone
      setSelectedMilestone(null);
      setMilestoneForm({
        title: '',
        description: '',
        dueDate: '',
        amount: '',
        deliverables: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMilestone(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setMilestoneForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) || value : value
    }));
  };

  const handleAddDeliverable = () => {
    if (deliverableInput.trim()) {
      setMilestoneForm(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, deliverableInput.trim()]
      }));
      setDeliverableInput('');
    }
  };

  const handleRemoveDeliverable = (index) => {
    setMilestoneForm(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitMilestone = async () => {
    if (!milestoneForm.title || !milestoneForm.amount) {
      setError('Title and amount are required');
      return;
    }

    try {
      setSubmitting(true);
      
      const data = {
        ...milestoneForm,
        contractId
      };
      
      let response;
      if (selectedMilestone) {
        // Update existing milestone
        response = await axios.put(
          `${apiUrl}/contracts/${contractId}/milestones/${selectedMilestone.id}`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        // Create new milestone
        response = await axios.post(
          `${apiUrl}/contracts/${contractId}/milestones`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
      
      // Refresh milestones
      fetchMilestones();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving milestone:', err);
      setError('Failed to save milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMilestoneAction = async (milestoneId, action) => {
    try {
      setLoading(true);
      await axios.post(
        `${apiUrl}/contracts/${contractId}/milestones/${milestoneId}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Refresh milestones
      fetchMilestones();
    } catch (err) {
      console.error(`Error ${action} milestone:`, err);
      setError(`Failed to ${action} milestone`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMilestoneDelivery = async () => {
    if (!submissionNote && selectedFiles.length === 0) {
      setError('Please provide a note or upload files');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('note', submissionNote);
      
      // Add files to form data
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      await axios.post(
        `${apiUrl}/contracts/${contractId}/milestones/${selectedMilestone.id}/submit`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Refresh milestones and close dialog
      fetchMilestones();
      setSubmissionDialogOpen(false);
      setSubmissionNote('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Error submitting milestone:', err);
      setError('Failed to submit milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveMilestone = async () => {
    try {
      setSubmitting(true);
      
      await axios.post(
        `${apiUrl}/contracts/${contractId}/milestones/${selectedMilestone.id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Refresh milestones and close dialog
      fetchMilestones();
      setApprovalDialogOpen(false);
    } catch (err) {
      console.error('Error approving milestone:', err);
      setError('Failed to approve milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const renderMilestoneStatus = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="default" size="small" />;
      case 'in_progress':
        return <Chip label="In Progress" color="primary" size="small" />;
      case 'submitted':
        return <Chip label="Submitted" color="warning" size="small" />;
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const calculateActiveStep = (milestones) => {
    if (milestones.length > 0) {
      const completedMilestones = milestones.filter(m => m.status === 'completed');
      const inProgressMilestones = milestones.filter(m => m.status === 'in_progress');
      
      if (inProgressMilestones.length > 0) {
        // Find the index of the first in-progress milestone
        const inProgressIndex = milestones.findIndex(m => m.status === 'in_progress');
        setActiveStep(inProgressIndex);
      } else {
        // Set to the next milestone after the last completed one
        setActiveStep(completedMilestones.length);
      }
    }
  };

  // Add milestone form handlers
  const handleAddMilestone = () => {
    setFormMode('create');
    setMilestoneForm({
      title: '',
      description: '',
      amount: '',
      dueDate: null,
      deliverables: []
    });
    setDialogOpen(true);
  };

  // Handle edit milestone
  const handleEditMilestone = (milestone) => {
    setFormMode('edit');
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount.toString(),
      dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
      deliverables: [...milestone.deliverables]
    });
    setSelectedMilestone(milestone);
    setDialogOpen(true);
  };

  // Handle save milestone
  const handleSaveMilestone = async () => {
    setSubmitting(true);
    try {
      const milestoneData = {
        title: milestoneForm.title,
        description: milestoneForm.description,
        amount: parseFloat(milestoneForm.amount),
        dueDate: milestoneForm.dueDate,
        deliverables: milestoneForm.deliverables
      };

      if (formMode === 'create') {
        await milestoneService.createMilestone(contractId, milestoneData);
        setSuccess('Milestone created successfully');
      } else {
        await milestoneService.updateMilestone(selectedMilestone._id, milestoneData);
        setSuccess('Milestone updated successfully');
      }
      
      setDialogOpen(false);
      fetchMilestones();
    } catch (error) {
      setError(`Error ${formMode === 'create' ? 'creating' : 'updating'} milestone: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle start milestone
  const handleStartMilestone = async (milestoneId) => {
    setSubmitting(true);
    try {
      await milestoneService.startMilestone(milestoneId);
      setSuccess('Milestone started successfully');
      fetchMilestones();
    } catch (error) {
      setError(`Error starting milestone: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Open submit dialog
  const handleOpenSubmitDialog = (milestone) => {
    setSelectedMilestone(milestone);
    setSubmissionForm({
      notes: '',
      deliverables: [...milestone.deliverables]
    });
    setSubmitDialogOpen(true);
  };

  // Submit milestone
  const handleSubmitMilestone = async () => {
    setSubmitting(true);
    try {
      await milestoneService.submitMilestone(
        selectedMilestone._id,
        submissionForm.notes,
        submissionForm.deliverables
      );
      setSuccess('Milestone submitted for review');
      setSubmitDialogOpen(false);
      fetchMilestones();
    } catch (error) {
      setError(`Error submitting milestone: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Open approval dialog
  const handleOpenApproveDialog = (milestone) => {
    setSelectedMilestone(milestone);
    setApprovalForm({
      feedback: '',
      rejectionReason: ''
    });
    setApprovalDialogOpen(true);
  };

  // Approve milestone
  const handleApproveMilestone = async () => {
    setSubmitting(true);
    try {
      await milestoneService.approveMilestone(selectedMilestone._id, approvalForm.feedback);
      setSuccess('Milestone approved successfully');
      setApprovalDialogOpen(false);
      fetchMilestones();
    } catch (error) {
      setError(`Error approving milestone: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Reject milestone
  const handleRejectMilestone = async () => {
    if (!approvalForm.rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    try {
      await milestoneService.rejectMilestone(
        selectedMilestone._id, 
        approvalForm.rejectionReason
      );
      setSuccess('Milestone rejected');
      setApprovalDialogOpen(false);
      fetchMilestones();
    } catch (error) {
      setError(`Error rejecting milestone: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Pay milestone
  const handlePayMilestone = async (milestoneId) => {
    if (window.confirm('Are you sure you want to mark this milestone as paid?')) {
      setSubmitting(true);
      try {
        await milestoneService.markMilestonePaid(milestoneId);
        setSuccess('Milestone marked as paid');
        fetchMilestones();
      } catch (error) {
        setError(`Error marking milestone as paid: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Handle delete milestone
  const handleDeleteMilestone = async (milestoneId) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      setSubmitting(true);
      try {
        await milestoneService.deleteMilestone(milestoneId);
        setSuccess('Milestone deleted successfully');
        fetchMilestones();
      } catch (error) {
        setError(`Error deleting milestone: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleCompleteMilestone = (milestone) => {
    setCurrentMilestone(milestone);
    setCompletionNotes('');
    setDialogOpen(true);
  };

  const handleSubmitCompletion = async () => {
    if (!currentMilestone) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      await ContractService.completeMilestone(
        contractId, 
        currentMilestone.id, 
        { completionNotes }
      );
      
      setDialogOpen(false);
      
      fetchMilestones();
    } catch (err) {
      console.error('Error completing milestone:', err);
      setError('Failed to complete milestone. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && milestones.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Sort milestones by order or dueDate
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Milestones & Deliverables</Typography>
        {!readOnly && userRole === 'hirer' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Milestone
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {milestones.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No milestones have been created for this contract yet.
          </Typography>
          {!readOnly && userRole === 'hirer' && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mt: 2 }}
            >
              Create First Milestone
            </Button>
          )}
        </Paper>
      ) : (
        <Stepper activeStep={activeStep} orientation="vertical">
          {sortedMilestones.map((milestone, index) => (
            <Step key={milestone.id || index}>
              <StepLabel
                optional={
                  <Typography variant="caption">
                    {milestone.dueDate ? `Due: ${format(new Date(milestone.dueDate), 'MMM d, yyyy')}` : ''}
                  </Typography>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">{milestone.title}</Typography>
                  {renderMilestoneStatus(milestone.status)}
                  <Typography 
                    variant="subtitle2" 
                    color="primary" 
                    sx={{ ml: 'auto' }}
                  >
                    {milestone.amount} {milestone.currency || 'GHS'}
                  </Typography>
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" paragraph>
                    {milestone.description || 'No description provided.'}
                  </Typography>

                  {milestone.deliverables && milestone.deliverables.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Deliverables:
                      </Typography>
                      <ul>
                        {milestone.deliverables.map((deliverable, i) => (
                          <li key={i}>
                            <Typography variant="body2">{deliverable}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}

                  {milestone.submissions && milestone.submissions.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Submissions:
                      </Typography>
                      {milestone.submissions.map((submission, i) => (
                        <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                          <CardContent>
                            <Typography variant="body2">
                              {submission.note || 'No note provided.'}
                            </Typography>
                            {submission.files && submission.files.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption">Attachments:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                  {submission.files.map((file, fileIndex) => (
                                    <Chip
                                      key={fileIndex}
                                      label={file.name}
                                      size="small"
                                      icon={<AttachFileIcon />}
                                      component="a"
                                      href={file.url}
                                      target="_blank"
                                      clickable
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </CardContent>
                          <CardActions>
                            <Typography variant="caption" color="textSecondary">
                              Submitted on {format(new Date(submission.createdAt), 'MMM d, yyyy')}
                            </Typography>
                          </CardActions>
                        </Card>
                      ))}
                    </Box>
                  )}

                  {!readOnly && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      {/* Worker Actions */}
                      {userRole === 'worker' && (
                        <>
                          {(milestone.status === 'pending' || milestone.status === 'in_progress') && (
                            <Button
                              variant="contained"
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setSubmissionDialogOpen(true);
                              }}
                            >
                              Submit Work
                            </Button>
                          )}
                          {milestone.status === 'rejected' && (
                            <Button
                              variant="outlined"
                              color="warning"
                              onClick={() => {
                                setSelectedMilestone(milestone);
                                setSubmissionDialogOpen(true);
                              }}
                            >
                              Resubmit
                            </Button>
                          )}
                        </>
                      )}

                      {/* Hirer Actions */}
                      {userRole === 'hirer' && (
                        <>
                          {milestone.status === 'pending' && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleMilestoneAction(milestone.id, 'start')}
                            >
                              Start Milestone
                            </Button>
                          )}
                          {milestone.status === 'submitted' && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => {
                                  setSelectedMilestone(milestone);
                                  setApprovalDialogOpen(true);
                                }}
                              >
                                Approve & Pay
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => handleMilestoneAction(milestone.id, 'reject')}
                              >
                                Request Changes
                              </Button>
                            </>
                          )}
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(milestone)}
                            disabled={milestone.status === 'completed'}
                          >
                            <EditIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Milestone Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedMilestone ? 'Edit Milestone' : 'Create New Milestone'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Milestone Title"
                name="title"
                value={milestoneForm.title}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={milestoneForm.amount}
                onChange={handleFormChange}
                required
                InputProps={{
                  startAdornment: <Typography variant="body2">GHS</Typography>,
                  inputProps: { min: 1 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={milestoneForm.description}
                onChange={handleFormChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={milestoneForm.dueDate}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Deliverables
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Add Deliverable"
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDeliverable();
                    }
                  }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleAddDeliverable}
                  disabled={!deliverableInput.trim()}
                >
                  Add
                </Button>
              </Box>
              <Box>
                {milestoneForm.deliverables.map((deliverable, index) => (
                  <Chip
                    key={index}
                    label={deliverable}
                    onDelete={() => handleRemoveDeliverable(index)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitMilestone} 
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : selectedMilestone ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Milestone Work Dialog */}
      <Dialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Milestone Work</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Submission Notes"
            value={submissionNote}
            onChange={(e) => setSubmissionNote(e.target.value)}
            multiline
            rows={3}
            margin="normal"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Attach Files (optional)
            </Typography>
            <input
              accept="*/*"
              style={{ display: 'none' }}
              id="contained-button-file"
              multiple
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="contained-button-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AttachFileIcon />}
              >
                Upload Files
              </Button>
            </label>
            
            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption">Selected Files:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                  {Array.from(selectedFiles).map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      size="small"
                      onDelete={() => {
                        const newFiles = [...selectedFiles];
                        newFiles.splice(index, 1);
                        setSelectedFiles(newFiles);
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitMilestoneDelivery}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Work'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Milestone Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve & Release Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to approve this milestone and release the payment?
          </Typography>
          {selectedMilestone && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedMilestone.title}
              </Typography>
              <Typography variant="h6" color="primary">
                {selectedMilestone.amount} {selectedMilestone.currency || 'GHS'}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            This action cannot be undone. The funds will be released to the worker.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveMilestone}
            variant="contained"
            color="success"
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Approve & Pay'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Milestone completion dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Complete Milestone: {currentMilestone?.title}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          <TextField
            label="Completion Notes"
            multiline
            rows={4}
            fullWidth
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Describe what was completed and any relevant details..."
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitCompletion} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Complete Milestone'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MilestoneTracker; 