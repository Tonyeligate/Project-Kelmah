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
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const ProposalReview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    feedback: '',
    decision: ''
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hirers/${user.id}/proposals`);
      const data = await response.json();
      setProposals(data);
      setError(null);
    } catch (err) {
      setError('Failed to load proposals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, proposal) => {
    setAnchorEl(event.currentTarget);
    setSelectedProposal(proposal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProposal(null);
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setReviewForm({
      rating: 0,
      feedback: '',
      decision: ''
    });
  };

  const handleReviewSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${selectedProposal.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewForm)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      fetchProposals();
      handleDialogClose();
    } catch (err) {
      setError('Failed to submit review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalDecision = async (proposalId, decision) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${proposalId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision })
      });

      if (!response.ok) {
        throw new Error('Failed to update proposal decision');
      }

      fetchProposals();
    } catch (err) {
      setError('Failed to update proposal decision');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'reviewed':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderProposalCard = (proposal) => (
    <Card key={proposal.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6">{proposal.jobTitle}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Avatar src={proposal.workerAvatar} sx={{ width: 24, height: 24 }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="body2">
                {proposal.workerName}
              </Typography>
              <Rating value={proposal.workerRating} readOnly size="small" />
            </Box>
          </Box>
          <Chip
            label={proposal.status}
            color={getStatusColor(proposal.status)}
            size="small"
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoneyIcon color="primary" />
              <Typography variant="body1">
                ${proposal.proposedBudget}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon color="primary" />
              <Typography variant="body1">
                {proposal.estimatedTime}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cover Letter
            </Typography>
            <Typography variant="body1">
              {proposal.coverLetter}
            </Typography>
          </Grid>
          {proposal.workerSkills && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Relevant Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {proposal.workerSkills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
      <Divider />
      <CardActions>
        {proposal.status === 'pending' && (
          <>
            <Button
              size="small"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleProposalDecision(proposal.id, 'accepted')}
            >
              Accept
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<CloseIcon />}
              onClick={() => handleProposalDecision(proposal.id, 'rejected')}
            >
              Reject
            </Button>
          </>
        )}
        <Button
          size="small"
          startIcon={<MessageIcon />}
          onClick={() => handleDialogOpen('message')}
        >
          Message
        </Button>
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, proposal)}
        >
          <MoreVertIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Proposal Review
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : proposals.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No proposals to review
          </Typography>
        </Paper>
      ) : (
        <Box>
          {proposals.map(renderProposalCard)}
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('message')}>
          <MessageIcon sx={{ mr: 1 }} /> Send Message
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('review')}>
          <StarIcon sx={{ mr: 1 }} /> Review Proposal
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('details')}>
          <DescriptionIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'message' && 'Send Message'}
          {dialogType === 'review' && 'Review Proposal'}
          {dialogType === 'details' && 'Proposal Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {dialogType === 'message' && (
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                margin="normal"
              />
            )}
            {dialogType === 'review' && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography component="legend">Rating</Typography>
                  <Rating
                    value={reviewForm.rating}
                    onChange={(event, newValue) => {
                      setReviewForm({ ...reviewForm, rating: newValue });
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Feedback"
                    multiline
                    rows={4}
                    value={reviewForm.feedback}
                    onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Decision"
                    value={reviewForm.decision}
                    onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
                  >
                    <MenuItem value="accepted">Accept</MenuItem>
                    <MenuItem value="rejected">Reject</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}
            {dialogType === 'details' && selectedProposal && (
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Worker"
                    secondary={selectedProposal.workerName}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AttachMoneyIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Proposed Budget"
                    secondary={`$${selectedProposal.proposedBudget}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AccessTimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Estimated Time"
                    secondary={selectedProposal.estimatedTime}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Cover Letter"
                    secondary={selectedProposal.coverLetter}
                  />
                </ListItem>
                {selectedProposal.workerSkills && (
                  <ListItem>
                    <ListItemText
                      primary="Skills"
                      secondary={
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedProposal.workerSkills.map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={dialogType === 'review' ? handleReviewSubmit : handleDialogClose}
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalReview; 