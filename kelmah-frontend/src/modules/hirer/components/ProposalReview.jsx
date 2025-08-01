import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
  Alert,
  Skeleton,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated service client for job service
const jobServiceClient = axios.create({
  baseURL: SERVICES.AUTH_SERVICE, // Will be SERVICES.JOB_SERVICE when deployed
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth tokens to requests
jobServiceClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// No mock data - using real API data only

const ProposalReview = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    feedback: '',
    decision: '',
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      // Try to fetch from job service, fall back to mock data
      const response = await jobServiceClient.get('/api/jobs/proposals');
      setProposals(response.data || []);
      setError(null);
    } catch (err) {
      console.warn(
        'Job service unavailable for proposals:',
        err.message,
      );
      setProposals([]);
      setError('Unable to fetch proposals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'withdrawn':
        return 'default';
      default:
        return 'default';
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
    setSelectedProposal(null);
    setReviewForm({
      rating: 5,
      feedback: '',
      decision: '',
    });
  };

  const handleProposalAction = async (action) => {
    if (selectedProposal) {
      try {
        // Mock proposal action
        console.log(`${action} proposal ${selectedProposal.id}`);

        // Update local state
        setProposals((prev) =>
          prev.map((p) =>
            p.id === selectedProposal.id ? { ...p, status: action } : p,
          ),
        );

        handleDialogClose();
      } catch (error) {
        console.error(`Error ${action} proposal:`, error);
        setError(`Failed to ${action} proposal`);
      }
    }
  };

  // Summary Statistics
  const proposalStats = {
    total: proposals.length,
    pending: proposals.filter((p) => p.status === 'pending').length,
    accepted: proposals.filter((p) => p.status === 'accepted').length,
    rejected: proposals.filter((p) => p.status === 'rejected').length,
    averageRate:
      proposals.length > 0 ? (proposals || []).reduce((sum, p) => sum + (p.proposedRate || 0), 0) / proposals.length : 0,
  };

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} animation="wave" />
            </Grid>
          ))}
        </Grid>
        <Card>
          <CardContent>
            <Skeleton variant="text" height={40} width="40%" sx={{ mb: 2 }} />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="text" height={60} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Proposal Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {proposalStats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Proposals
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {proposalStats.pending}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Review
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(proposalStats.averageRate)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Average Rate
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {proposalStats.accepted}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Accepted
                  </Typography>
                </Box>
                <AcceptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Proposals Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Job Proposals ({proposals.length})
          </Typography>

          {proposals.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PersonIcon
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No proposals received yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Proposals from workers will appear here
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Worker & Job</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Proposed Rate</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Duration</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Rating</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Submitted</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar
                            src={proposal.worker.avatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            {proposal.worker.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {proposal.worker.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {proposal.jobTitle}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {proposal.worker.location} •{' '}
                              {proposal.worker.experience}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {formatCurrency(proposal.proposedRate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          vs {formatCurrency(proposal.jobBudget)} budget
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {proposal.estimatedDuration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                          <Typography variant="body2">
                            {proposal.worker.rating}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({proposal.worker.completedJobs} jobs)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={proposal.status.toUpperCase()}
                          color={getStatusColor(proposal.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(proposal.submittedDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, proposal)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('view')}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {selectedProposal?.status === 'pending' && [
          <MenuItem key="accept" onClick={() => handleDialogOpen('accept')}>
            <AcceptIcon sx={{ mr: 1, color: 'success.main' }} />
            Accept Proposal
          </MenuItem>,
          <MenuItem key="reject" onClick={() => handleDialogOpen('reject')}>
            <RejectIcon sx={{ mr: 1, color: 'error.main' }} />
            Reject Proposal
          </MenuItem>,
        ]}
      </Menu>

      {/* Proposal Details Dialog */}
      <Dialog
        open={dialogOpen && dialogType === 'view'}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Proposal Details</DialogTitle>
        <DialogContent>
          {selectedProposal && (
            <Box>
              {/* Worker Info */}
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  src={selectedProposal.worker.avatar}
                  sx={{ width: 64, height: 64 }}
                >
                  {selectedProposal.worker.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedProposal.worker.name}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                    <Typography variant="body2">
                      {selectedProposal.worker.rating} (
                      {selectedProposal.worker.completedJobs} jobs)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProposal.worker.location}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Job & Rate Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Job: {selectedProposal.jobTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget: {formatCurrency(selectedProposal.jobBudget)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="primary.main"
                  >
                    Proposed Rate:{' '}
                    {formatCurrency(selectedProposal.proposedRate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {selectedProposal.estimatedDuration}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Proposal Text */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Proposal
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedProposal.proposalText}
              </Typography>

              {/* Skills */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Skills
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                {selectedProposal.worker.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>

              {/* Timeline */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Proposed Timeline
              </Typography>
              <Box mb={2}>
                {selectedProposal.timeline.map((phase, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent="space-between"
                    py={0.5}
                  >
                    <Typography variant="body2">{phase.phase}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {phase.duration}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Attachments */}
              {selectedProposal.attachments.length > 0 && (
                <>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    Attachments
                  </Typography>
                  <Box>
                    {selectedProposal.attachments.map((attachment, index) => (
                      <Box
                        key={index}
                        display="flex"
                        justifyContent="space-between"
                        py={0.5}
                      >
                        <Typography variant="body2">
                          {attachment.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {attachment.size}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
          {selectedProposal?.status === 'pending' && (
            <>
              <Button
                onClick={() => handleProposalAction('rejected')}
                color="error"
                variant="outlined"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleProposalAction('accepted')}
                color="success"
                variant="contained"
              >
                Accept
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Accept/Reject Confirmation Dialogs */}
      <Dialog
        open={
          dialogOpen && (dialogType === 'accept' || dialogType === 'reject')
        }
        onClose={handleDialogClose}
      >
        <DialogTitle>
          {dialogType === 'accept' ? 'Accept Proposal' : 'Reject Proposal'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to {dialogType} this proposal from{' '}
            {selectedProposal?.worker?.name}?
          </Typography>
          {dialogType === 'reject' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for rejection (optional)"
              value={reviewForm.feedback}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, feedback: e.target.value })
              }
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={() =>
              handleProposalAction(
                dialogType === 'accept' ? 'accepted' : 'rejected',
              )
            }
            color={dialogType === 'accept' ? 'success' : 'error'}
            variant="contained"
          >
            {dialogType === 'accept' ? 'Accept' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProposalReview;
