import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

const AppointmentForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  jobs = [], 
  users = [], 
  loadingJobs = false, 
  loadingUsers = false,
  mode = 'create'
}) => {
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.jobId && !formData.jobTitle) {
      newErrors.job = 'Job is required';
    }
    
    if (!formData.hirerId && !formData.hirer) {
      newErrors.hirer = 'Hirer is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date and time are required';
    }
    
    if (formData.appointmentType === 'in-person' && !formData.location) {
      newErrors.location = 'Location is required for in-person appointments';
    }
    
    if (formData.appointmentType === 'virtual' && !formData.meetingLink) {
      newErrors.meetingLink = 'Meeting link is required for virtual appointments';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleJobChange = (event, newValue) => {
    if (newValue) {
      setFormData(prev => ({ 
        ...prev, 
        jobId: newValue.id,
        jobTitle: newValue.title
      }));
      
      if (errors.job) {
        setErrors(prev => ({ ...prev, job: null }));
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        jobId: '',
        jobTitle: ''
      }));
    }
  };
  
  const handleHirerChange = (event, newValue) => {
    if (newValue) {
      setFormData(prev => ({ 
        ...prev, 
        hirerId: newValue.id,
        hirer: newValue.name
      }));
      
      if (errors.hirer) {
        setErrors(prev => ({ ...prev, hirer: null }));
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        hirerId: '',
        hirer: ''
      }));
    }
  };
  
  const handleDateChange = (newDate) => {
    setFormData(prev => ({ ...prev, date: newDate }));
    
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: null }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit();
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        {/* Job Selection */}
        <Grid item xs={12}>
          <Autocomplete
            options={jobs}
            getOptionLabel={(option) => option.title || ''}
            loading={loadingJobs}
            onChange={handleJobChange}
            value={jobs.find(job => job.id === formData.jobId) || null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Job"
                fullWidth
                error={!!errors.job}
                helperText={errors.job}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingJobs ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
        
        {/* Hirer Selection */}
        <Grid item xs={12}>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => option.name || ''}
            loading={loadingUsers}
            onChange={handleHirerChange}
            value={users.find(user => user.id === formData.hirerId) || null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Hirer"
                fullWidth
                error={!!errors.hirer}
                helperText={errors.hirer}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid>
        
        {/* Date & Time */}
        <Grid item xs={12}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={formData.date}
              onChange={handleDateChange}
              slotProps={{
                textField: { 
                  fullWidth: true,
                  error: !!errors.date,
                  helperText: errors.date
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        {/* Status */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleFormChange}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Appointment Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Appointment Type</InputLabel>
            <Select
              name="appointmentType"
              value={formData.appointmentType}
              label="Appointment Type"
              onChange={handleFormChange}
            >
              <MenuItem value="in-person">In-Person</MenuItem>
              <MenuItem value="virtual">Virtual</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Location or Meeting Link based on type */}
        <Grid item xs={12}>
          {formData.appointmentType === 'in-person' ? (
            <TextField
              name="location"
              label="Location"
              value={formData.location}
              onChange={handleFormChange}
              fullWidth
              error={!!errors.location}
              helperText={errors.location}
            />
          ) : (
            <TextField
              name="meetingLink"
              label="Meeting Link"
              value={formData.meetingLink}
              onChange={handleFormChange}
              fullWidth
              error={!!errors.meetingLink}
              helperText={errors.meetingLink}
            />
          )}
        </Grid>
        
        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            name="notes"
            label="Notes"
            value={formData.notes}
            onChange={handleFormChange}
            fullWidth
            multiline
            rows={3}
          />
        </Grid>
        
        {/* Preview Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>Appointment Preview</Typography>
          <Box sx={(theme) => ({ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, bgcolor: 'background.paper' })}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Job:</Typography>
                <Typography variant="body1" fontWeight="medium">{formData.jobTitle || 'Not selected'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Hirer:</Typography>
                <Typography variant="body1" fontWeight="medium">{formData.hirer || 'Not selected'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Date & Time:</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formData.date ? format(new Date(formData.date), 'PPp') : 'Not selected'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                  {formData.status}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Type:</Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                  {formData.appointmentType === 'in-person' 
                    ? `In-person at ${formData.location || 'No location specified'}` 
                    : `Virtual meeting at ${formData.meetingLink || 'No link provided'}`}
                </Typography>
              </Grid>
              {formData.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Notes:</Typography>
                  <Typography variant="body1">{formData.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
      </Grid>
      
      {/* Form Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
        >
          {mode === 'create' ? 'Create Appointment' : 'Update Appointment'}
        </Button>
      </Box>
    </form>
  );
};

AppointmentForm.propTypes = {
  formData: PropTypes.shape({
    jobId: PropTypes.string,
    jobTitle: PropTypes.string,
    hirerId: PropTypes.string,
    hirer: PropTypes.string,
    date: PropTypes.instanceOf(Date),
    status: PropTypes.string,
    appointmentType: PropTypes.string,
    location: PropTypes.string,
    meetingLink: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  jobs: PropTypes.array,
  users: PropTypes.array,
  loadingJobs: PropTypes.bool,
  loadingUsers: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit'])
};

export default AppointmentForm;