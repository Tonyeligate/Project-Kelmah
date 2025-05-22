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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Gavel as GavelIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  Comment as CommentIcon,
  Warning as WarningIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import PaymentService from '../../services/PaymentService';

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolution, setResolution] = useState({
    decision: '',
    notes: ''
  });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDispute, setNewDispute] = useState({
    transactionId: '',
    reason: '',
    description: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await PaymentService.getDisputes();
      setDisputes(response.data);
    } catch (err) {
      setError('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, dispute) => {
    setAnchorEl(event.currentTarget);
    setSelectedDispute(dispute);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDispute(null);
  };

  const handleResolve = async () => {
    if (!selectedDispute || !resolution.decision || !resolution.notes) return;

    try {
      await PaymentService.updateDispute(selectedDispute.id, {
        status: 'resolved',
        resolution: resolution
      });
      fetchDisputes();
      setResolutionDialogOpen(false);
      setResolution({
        decision: '',
        notes: ''
      });
    } catch (err) {
      setError('Failed to resolve dispute');
    }
  };

  const handleReject = async () => {
    if (!selectedDispute) return;

    try {
      await PaymentService.updateDispute(selectedDispute.id, {
        status: 'rejected'
      });
      fetchDisputes();
    } catch (err) {
      setError('Failed to reject dispute');
    }
  };

  const handleAddComment = async () => {
    if (!selectedDispute || !comment) return;

    try {
      await PaymentService.updateDispute(selectedDispute.id, {
        comments: [...(selectedDispute.comments || []), {
          text: comment,
          timestamp: new Date().toISOString()
        }]
      });
      fetchDisputes();
      setCommentDialogOpen(false);
      setComment('');
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleCreateDispute = async () => {
    if (!newDispute.transactionId || !newDispute.reason || !newDispute.description) return;

    try {
      await PaymentService.createDispute(newDispute);
      fetchDisputes();
      setCreateDialogOpen(false);
      setNewDispute({
        transactionId: '',
        reason: '',
        description: ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      case 'rejected':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <WarningIcon />;
      case 'resolved':
        return <CheckCircleIcon />;
      case 'closed':
        return <CancelIcon />;
      case 'rejected':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderDisputeCard = (dispute) => (
    <Grid item xs={12} md={6} key={dispute.id}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Dispute #{dispute.id}
            </Typography>
            <Chip
              icon={getStatusIcon(dispute.status)}
              label={dispute.status}
              color={getStatusColor(dispute.status)}
              size="small"
            />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" color="textSecondary">
            Transaction: #{dispute.transactionId}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Amount: {formatAmount(dispute.amount)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Created: {formatDate(dispute.createdAt)}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Reason: {dispute.reason}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {dispute.description}
          </Typography>
        </CardContent>
        <Divider />
        <CardActions>
          {dispute.status === 'open' && (
            <Button
              size="small"
              color="primary"
              onClick={() => {
                setSelectedDispute(dispute);
                setResolutionDialogOpen(true);
              }}
            >
              Resolve Dispute
            </Button>
          )}
        </CardActions>
      </Card>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Payment Disputes</Typography>
        <Tooltip title="Manage payment disputes and resolutions">
          <IconButton>
            <InfoIcon />
          </IconButton>
        </Tooltip>
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
      ) : disputes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No active disputes
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {disputes.map(renderDisputeCard)}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedDispute?.status === 'open' && (
          <>
            <MenuItem onClick={() => {
              setResolutionDialogOpen(true);
              handleMenuClose();
            }}>
              <CheckCircleIcon sx={{ mr: 1 }} /> Resolve Dispute
            </MenuItem>
            <MenuItem onClick={() => {
              handleReject();
              handleMenuClose();
            }}>
              <CancelIcon sx={{ mr: 1 }} /> Reject Dispute
            </MenuItem>
          </>
        )}
        <MenuItem onClick={() => {
          setCommentDialogOpen(true);
          handleMenuClose();
        }}>
          <CommentIcon sx={{ mr: 1 }} /> Add Comment
        </MenuItem>
      </Menu>

      <Dialog
        open={resolutionDialogOpen}
        onClose={() => setResolutionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolve Dispute</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Decision"
              value={resolution.decision}
              onChange={(e) => setResolution(prev => ({
                ...prev,
                decision: e.target.value
              }))}
              margin="normal"
              required
            >
              <option value="refund">Refund to Customer</option>
              <option value="reject">Reject Dispute</option>
          <TextField
            fullWidth
            label="Resolution Details"
            multiline
            rows={4}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolutionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResolve}
            variant="contained"
            disabled={!resolution}
          >
            Resolve Dispute
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Comment"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddComment}
            variant="contained"
            disabled={!comment}
          >
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Disputes; 