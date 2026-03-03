import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  TextField,
  Grid,
  IconButton,
  Divider,
  Chip,
  Stack,
  CircularProgress,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  Description as ContractIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { api } from '../../../../services/apiClient';

/**
 * ContractForm — create a contract between hirer and worker with milestones.
 */
const ContractForm = ({ jobId, workerId, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [milestones, setMilestones] = useState([
    { title: '', amount: '', dueDate: '', description: '' },
  ]);
  const [paymentTerms, setPaymentTerms] = useState('milestone');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      { title: '', amount: '', dueDate: '', description: '' },
    ]);
  };

  const removeMilestone = (index) => {
    if (milestones.length <= 1) return;
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    setMilestones(prev =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  };

  const milestoneTotalValid = () => {
    if (!totalAmount) return true;
    const sum = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
    return Math.abs(sum - parseFloat(totalAmount)) < 0.01;
  };

  const isFormValid = () =>
    title.trim() && totalAmount && startDate && milestones[0]?.title?.trim();

  const handleSubmit = async () => {
    setError('');
    if (!isFormValid()) {
      setError('Please fill in contract title, amount, start date, and at least one milestone.');
      return;
    }
    if (!milestoneTotalValid()) {
      setError('Milestone amounts must equal the total contract amount.');
      return;
    }

    setSubmitting(true);
    try {
      const contractData = {
        title,
        description,
        totalAmount: parseFloat(totalAmount),
        startDate,
        endDate: endDate || undefined,
        paymentTerms,
        milestones: milestones.filter(m => m.title.trim()).map(m => ({
          title: m.title,
          amount: parseFloat(m.amount) || 0,
          dueDate: m.dueDate || undefined,
          description: m.description || undefined,
        })),
        jobId: jobId || undefined,
        workerId: workerId || undefined,
      };

      if (onSubmit) {
        await onSubmit(contractData);
      } else {
        await api.post('/jobs/contracts', contractData);
      }
      setSnackbar({ open: true, message: 'Contract created successfully!' });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create contract.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 4 }, maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <ContractIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold">Create Contract</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="Contract Title"
            placeholder="e.g. Kitchen renovation contract"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><AssignmentIcon color="action" /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            placeholder="Describe the scope of work, expectations, and deliverables"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            required
            type="number"
            label="Total Amount (GHS)"
            placeholder="e.g. 5000"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            inputProps={{ min: 0, step: '0.01' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MoneyIcon color="action" />GH₵</InputAdornment> }}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            required
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Payment Terms */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Payment Terms</Typography>
          <Stack direction="row" spacing={1}>
            {['milestone', 'upfront', 'completion'].map(term => (
              <Chip
                key={term}
                label={term.charAt(0).toUpperCase() + term.slice(1)}
                variant={paymentTerms === term ? 'filled' : 'outlined'}
                color={paymentTerms === term ? 'primary' : 'default'}
                onClick={() => setPaymentTerms(term)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Grid>

        {/* Milestones */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Milestones ({milestones.length})
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addMilestone}>
              Add Milestone
            </Button>
          </Box>
          {!milestoneTotalValid() && (
            <Alert severity="warning" sx={{ mb: 1, py: 0 }} variant="outlined">
              Milestone amounts (GHS {milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0).toFixed(2)}) should equal total (GHS {parseFloat(totalAmount || 0).toFixed(2)})
            </Alert>
          )}
        </Grid>

        {milestones.map((ms, i) => (
          <Grid item xs={12} key={i}>
            <Paper variant="outlined" sx={{ p: 2, position: 'relative' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Milestone {i + 1}
              </Typography>
              {milestones.length > 1 && (
                <IconButton size="small" onClick={() => removeMilestone(i)} sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Milestone Title"
                    placeholder="e.g. Foundation complete"
                    value={ms.title}
                    onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Amount (GHS)"
                    value={ms.amount}
                    onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                    inputProps={{ min: 0, step: '0.01' }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Due Date"
                    value={ms.dueDate}
                    onChange={(e) => updateMilestone(i, 'dueDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}

        {/* Job/Worker info */}
        {(jobId || workerId) && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              {jobId && `Job: ${jobId}`}
              {jobId && workerId && ' • '}
              {workerId && `Worker: ${workerId}`}
            </Typography>
          </Grid>
        )}
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !isFormValid()}
          startIcon={submitting ? <CircularProgress size={18} /> : <CheckIcon />}
        >
          {submitting ? 'Creating...' : 'Create Contract'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
};

ContractForm.propTypes = {
  jobId: PropTypes.string,
  workerId: PropTypes.string,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ContractForm;
