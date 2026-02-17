/**
 * QuickJobRequestPage - 3-Step Quick Job Request Flow
 * Part of Kelmah's Protected Quick-Hire system
 * 
 * Flow:
 * Step 1: Describe your problem (voice/text/photo)
 * Step 2: Confirm location
 * Step 3: Select urgency → Submit
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  IconButton,
  Avatar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  PhotoCamera as PhotoCameraIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  AccessTime as AccessTimeIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  SERVICE_CATEGORIES, 
  URGENCY_LEVELS, 
  createQuickJob, 
  getCurrentLocation 
} from '../services/quickJobService';

// Steps for the stepper
const steps = ['Describe Problem', 'Confirm Location', 'When do you need it?'];

const QuickJobRequestPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef(null);

  // Get category from URL params
  const categoryId = searchParams.get('category') || 'general_repair';
  const category = SERVICE_CATEGORIES.find(c => c.id === categoryId) || SERVICE_CATEGORIES[0];

  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('Greater Accra');
  const [urgency, setUrgency] = useState('soon');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Ghana regions
  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 
    'Northern', 'Volta', 'Brong Ahafo', 'Upper East', 'Upper West',
    'Western North', 'Ahafo', 'Bono East', 'Oti', 'North East', 'Savannah'
  ];

  // Get user's location on mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  // Handle get current location
  const handleGetLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    
    try {
      const pos = await getCurrentLocation();
      setLocation({
        type: 'Point',
        coordinates: [pos.longitude, pos.latitude]
      });
      
      // Reverse geocode to get address (simplified - in production use Google Maps API)
      // For now, just set coordinates
      setCity('Accra'); // Default for demo
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Limit to 5 photos
    const newPhotos = files.slice(0, 5 - photos.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      url: null // Will be set after upload
    }));
    
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
  };

  // Remove photo
  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Handle voice recording (simplified - would need Web Audio API for full implementation)
  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // In production, implement voice recording with MediaRecorder API
  };

  // Check if step is complete
  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return description.length >= 10 || photos.length > 0;
      case 1:
        return location && address;
      case 2:
        return urgency;
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle back
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    } else {
      navigate(-1);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isStepComplete(0) || !isStepComplete(1)) {
      setError('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // TODO: Upload photos to storage and get URLs
      const photoUrls = photos.map(p => ({ url: p.preview })); // Temporary

      const jobData = {
        category: categoryId,
        description,
        photos: photoUrls,
        voiceNote,
        location: {
          ...location,
          address,
          landmark,
          city,
          region
        },
        urgency
      };

      const result = await createQuickJob(jobData);

      if (result.success) {
        setSuccess(true);
        // Redirect to job tracking page after 2 seconds
        setTimeout(() => {
          navigate(`/quick-job/${result.data._id}`);
        }, 2000);
      } else {
        setError(result.error?.message || 'Failed to create job request');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {/* Category indicator */}
            <Card sx={{ mb: 3, bgcolor: theme.palette.primary.main + '10' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                  <Typography variant="h5">
                    {SERVICE_CATEGORIES.find(c => c.id === categoryId)?.icon || '🔧'}
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {category.name} Help
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Describe your {category.nameGh.toLowerCase()} issue
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Description input */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="What's the problem?"
              placeholder="E.g., 'My kitchen tap is leaking water onto the floor' or 'Need someone to build a wooden cabinet'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 3 }}
              helperText={`${description.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
            />

            {/* Photo upload */}
            <Typography variant="subtitle2" gutterBottom>
              Add photos (optional but helpful)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {photos.map((photo, index) => (
                <Box key={index} sx={{ position: 'relative' }}>
                  <Avatar
                    src={photo.preview}
                    variant="rounded"
                    sx={{ width: 80, height: 80 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemovePhoto(index)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              
              {photos.length < 5 && (
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    borderStyle: 'dashed',
                    flexDirection: 'column'
                  }}
                >
                  <PhotoCameraIcon />
                  <Typography variant="caption">Add</Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handlePhotoUpload}
                  />
                </Button>
              )}
            </Box>

            {/* Voice note (placeholder) */}
            <Button
              variant="outlined"
              startIcon={isRecording ? <MicOffIcon /> : <MicIcon />}
              onClick={handleVoiceToggle}
              color={isRecording ? 'error' : 'primary'}
              sx={{ mb: 2 }}
            >
              {isRecording ? 'Stop Recording' : 'Record Voice Note'}
            </Button>
            {voiceNote && (
              <Chip
                label="Voice note recorded"
                onDelete={() => setVoiceNote(null)}
                color="success"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Where do you need the work done?
            </Typography>

            {/* Location button */}
            <Button
              variant="contained"
              startIcon={locationLoading ? <CircularProgress size={20} color="inherit" /> : <MyLocationIcon />}
              onClick={handleGetLocation}
              disabled={locationLoading}
              sx={{ mb: 3 }}
              fullWidth
            >
              {locationLoading ? 'Getting Location...' : 'Use My Current Location'}
            </Button>

            {locationError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {locationError}
              </Alert>
            )}

            {location && (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  📍 Location captured: {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
                </Typography>
              </Alert>
            )}

            {/* Address input */}
            <TextField
              fullWidth
              required
              label="Street Address"
              placeholder="E.g., 15 Cantonments Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
              }}
            />

            <TextField
              fullWidth
              label="Landmark (helpful for finding you)"
              placeholder="E.g., Near the blue mosque"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label="City/Town"
                  placeholder="E.g., Accra"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  SelectProps={{ native: true }}
                >
                  {ghanaRegions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              How urgent is this?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This helps workers know when you need them
            </Typography>

            <RadioGroup
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              {URGENCY_LEVELS.map((level) => (
                <Paper
                  key={level.id}
                  elevation={urgency === level.id ? 3 : 0}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: `2px solid ${urgency === level.id ? theme.palette[level.color].main : theme.palette.divider}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: theme.palette[level.color].main
                    }
                  }}
                  onClick={() => setUrgency(level.id)}
                >
                  <FormControlLabel
                    value={level.id}
                    control={<Radio color={level.color} />}
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="600">
                          {level.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {level.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>

            {/* Summary */}
            <Card sx={{ mt: 3, bgcolor: theme.palette.grey[50] }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Job Summary
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
                  <Typography variant="body1" fontWeight="600">
                    {category.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📍 {address || 'No address'}, {city || 'No city'}
                </Typography>
                <Typography variant="body2" sx={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  "{description || 'No description'}"
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  // Success screen
  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Avatar
          sx={{ 
            width: 100, 
            height: 100, 
            bgcolor: 'success.main', 
            mx: 'auto', 
            mb: 3 
          }}
        >
          <CheckIcon sx={{ fontSize: 60 }} />
        </Avatar>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Request Sent! 🎉
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Workers nearby will see your request and send quotes. You'll be notified when they respond.
        </Typography>
        <CircularProgress size={24} />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* Back button & title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="600">
          Quick Job Request
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label} completed={isStepComplete(index)}>
            <StepLabel>{!isMobile && label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Progress bar */}
      <LinearProgress 
        variant="determinate" 
        value={(activeStep + 1) / steps.length * 100} 
        sx={{ mb: 3, borderRadius: 1, height: 6 }}
      />

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Step content */}
      <Box sx={{ minHeight: 400 }}>
        {renderStepContent(activeStep)}
      </Box>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{ flex: 1 }}
        >
          Back
        </Button>
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepComplete(activeStep)}
            endIcon={<ArrowForwardIcon />}
            sx={{ flex: 2 }}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !isStepComplete(activeStep)}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            color="success"
            sx={{ flex: 2 }}
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default QuickJobRequestPage;
