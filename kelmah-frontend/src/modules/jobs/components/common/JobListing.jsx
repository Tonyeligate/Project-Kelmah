import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { LocationOn, Work, AttachMoney, AccessTime } from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

function JobListing({ job, onApply, onViewDetails }) {
  const { user, token } = useAuth();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [application, setApplication] = useState({
    proposedRate: '',
    message: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleApply = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/jobs/${job.id}/apply`,
        application,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess('Application submitted successfully!');
      setShowApplyDialog(false);
      if (onApply) onApply(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    }
  };

  const handleInputChange = (e) => {
    setApplication({
      ...application,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Card sx={{ mb: 2, position: 'relative' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {job.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Work sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {job.profession}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {job.location}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Budget: ${job.budget}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Posted {formatDistanceToNow(new Date(job.created_at))} ago
                </Typography>
              </Box>

              <Typography variant="body1" sx={{ mt: 2 }} color="text.secondary">
                {job.description}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
              <Chip
                label={job.status.toUpperCase()}
                color={job.status === 'open' ? 'success' : 'default'}
                sx={{ mb: 2 }}
              />

              {user.role === 'worker' && job.status === 'open' && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => setShowApplyDialog(true)}
                >
                  Apply Now
                </Button>
              )}

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => onViewDetails(job)}
              >
                View Details
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Apply Dialog */}
      <Dialog
        open={showApplyDialog}
        onClose={() => setShowApplyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Apply for {job.title}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Proposed Rate ($/hour)"
            type="number"
            name="proposedRate"
            value={application.proposedRate}
            onChange={handleInputChange}
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            fullWidth
            label="Cover Message"
            multiline
            rows={4}
            name="message"
            value={application.message}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApplyDialog(false)}>Cancel</Button>
          <Button onClick={handleApply} variant="contained" color="primary">
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default JobListing;
