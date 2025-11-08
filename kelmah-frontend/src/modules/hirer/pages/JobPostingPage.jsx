import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  RadioGroup,
  Radio,
  FormControlLabel,
  Autocomplete,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Work,
  Category,
  Description,
  AttachMoney,
  LocationOn,
  Publish,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Add,
  Save,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import {
  createHirerJob,
  selectHirerLoading,
  selectHirerError,
} from '../services/hirerSlice';
import { alpha, useTheme } from '@mui/material/styles';

const steps = [
  { label: 'Job Details', icon: <Work /> },
  { label: 'Description & Skills', icon: <Description /> },
  { label: 'Budget & Scope', icon: <AttachMoney /> },
  { label: 'Location & Visibility', icon: <LocationOn /> },
  { label: 'Review & Publish', icon: <Publish /> },
];

const JobPreview = ({ formData }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        position: 'sticky',
        top: 100,
        background: alpha(theme.palette.background.default, 0.7),
        backdropFilter: 'blur(10px)',
      }}
    >
      <Typography variant="h5" gutterBottom>
        Job Preview
      </Typography>
      <Typography variant="h6">{formData.title || 'Job Title'}</Typography>
      <Typography variant="subtitle1" color="text.secondary">
        {formData.location || 'Location'}
      </Typography>
      <Chip label={formData.category || 'Category'} sx={{ my: 1 }} />
      <Typography variant="body1" sx={{ mt: 2 }}>
        {formData.description || 'Job description will appear here.'}
      </Typography>
      <Box sx={{ mt: 2 }}>
        {formData.skills.map((skill) => (
          <Chip key={skill} label={skill} sx={{ mr: 1, mb: 1 }} />
        ))}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Budget:</strong>{' '}
            {formData.paymentType === 'hourly'
              ? `${formData.budget.min || 0} - ${formData.budget.max || 0} /hr`
              : `${formData.budget.fixed || 0}`}
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Expected Duration:</strong> {formData.duration || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Location:</strong> {formData.locationType}
            {formData.locationType !== 'remote'
              ? ` (${formData.location || ''})`
              : ''}
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Requirements:</strong> {formData.requirements || 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const JobPostingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectHirerLoading('jobs'));
  const error = useSelector(selectHirerError('jobs'));
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    skills: [],
    description: '',
    requirements: '',
    paymentType: 'hourly',
    budget: { min: '', max: '', fixed: '' },
    duration: '',
    locationType: 'remote',
    location: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleSkillsChange = (event, newSkills) => {
    setFormData((prev) => ({ ...prev, skills: newSkills }));
  };
  const handleSubmit = (asDraft = false) => {
    // Map UI form to canonical API payload
    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      skills: formData.skills,
      paymentType: formData.paymentType,
      budget:
        formData.paymentType === 'hourly'
          ? Number(formData.budget.max || formData.budget.min || 0)
          : Number(formData.budget.fixed || 0),
      currency: 'GHS',
      duration: (() => {
        const match = String(formData.duration || '').match(
          /(\d+)\s*(hour|day|week|month|hours|days|weeks|months)/i,
        );
        if (match) {
          let unit = match[2].toLowerCase();
          if (unit.endsWith('s')) unit = unit.slice(0, -1);
          return { value: Number(match[1]), unit };
        }
        return { value: 1, unit: 'week' };
      })(),
      location: {
        type: formData.locationType,
        address: formData.location,
      },
      visibility: 'public',
      status: asDraft ? 'draft' : 'open',
    };

    dispatch(createHirerJob(payload))
      .unwrap()
      .then(() => setSubmitSuccess(true))
      .catch(() => {});
  };

  // Determine if Next button should be disabled
  const isNextDisabled = () => {
    switch (activeStep) {
      case 0:
        return !(formData.title && formData.category);
      case 2:
        if (formData.paymentType === 'hourly') {
          return !(
            formData.budget.min &&
            formData.budget.max &&
            formData.duration
          );
        }
        return !(formData.budget.fixed && formData.duration);
      case 3:
        return !formData.location;
      default:
        return false;
    }
  };

  if (submitSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: 5, textAlign: 'center' }}>
        <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Job Posted Successfully!
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/hirer/jobs')}
          sx={{ mr: 2 }}
        >
          Manage Jobs
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setSubmitSuccess(false);
            setActiveStep(0);
            setFormData({
              title: '',
              category: '',
              skills: [],
              description: '',
              requirements: '',
              paymentType: 'hourly',
              budget: { min: '', max: '', fixed: '' },
              duration: '',
              locationType: 'remote',
              location: '',
            });
          }}
        >
          Post Another Job
        </Button>
      </Container>
    );
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              name="title"
              label="Job Title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleChange}
              >
                {[
                  'Plumbing',
                  'Electrical',
                  'Carpentry',
                  'Masonry',
                  'Welding',
                  'Painting',
                  'HVAC',
                  'Roofing',
                  'Tiling',
                  'Interior Design',
                  'Landscaping',
                ].map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        );
      case 1:
        return (
          <>
            <TextField
              name="description"
              label="Job Description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={6}
              fullWidth
              margin="normal"
            />
            <TextField
              name="requirements"
              label="Requirements"
              value={formData.requirements}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              margin="normal"
            />
            <Autocomplete
              multiple
              freeSolo
              options={[
                'Web Development',
                'Mobile Development',
                'Design',
                'Writing',
                'Marketing',
              ]}
              value={formData.skills}
              onChange={handleSkillsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    key={option}
                    label={option}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Skills" placeholder="Add skill" />
              )}
              sx={{ mt: 2 }}
            />
          </>
        );
      case 2:
        return (
          <>
            <FormControl component="fieldset">
              <Typography variant="subtitle1" gutterBottom>
                Payment Type
              </Typography>
              <RadioGroup
                row
                name="paymentType"
                value={formData.paymentType}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="hourly"
                  control={<Radio />}
                  label="Hourly Rate"
                />
                <FormControlLabel
                  value="fixed"
                  control={<Radio />}
                  label="Fixed Price"
                />
              </RadioGroup>
            </FormControl>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              {formData.paymentType === 'hourly' ? (
                <>
                  <TextField
                    name="budget.min"
                    label="Min Rate"
                    value={formData.budget.min}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    name="budget.max"
                    label="Max Rate"
                    value={formData.budget.max}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    fullWidth
                    margin="normal"
                  />
                </>
              ) : (
                <TextField
                  name="budget.fixed"
                  label="Fixed Price"
                  value={formData.budget.fixed}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  fullWidth
                  margin="normal"
                />
              )}
              <TextField
                name="duration"
                label="Expected Duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 2 weeks"
                fullWidth
                margin="normal"
              />
            </Box>
          </>
        );
      case 3:
        return (
          <>
            <FormControl component="fieldset">
              <Typography variant="subtitle1" gutterBottom>
                Location Type
              </Typography>
              <RadioGroup
                row
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="remote"
                  control={<Radio />}
                  label="Remote"
                />
                <FormControlLabel
                  value="onsite"
                  control={<Radio />}
                  label="On-site"
                />
                <FormControlLabel
                  value="hybrid"
                  control={<Radio />}
                  label="Hybrid"
                />
              </RadioGroup>
            </FormControl>
            <TextField
              name="location"
              label="Job Location"
              value={formData.location}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
          </>
        );
      case 4:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Review & Publish
            </Typography>
            <JobPreview formData={formData} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Helmet>
        <title>Post a Job | Kelmah</title>
      </Helmet>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Post a Job
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a detailed job posting to find the perfect talent for your
          project
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel StepIconComponent={() => step.icon}>
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>{getStepContent(activeStep)}</Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <JobPreview formData={formData} />
        </Grid>
      </Grid>

      {activeStep !== 5 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBack />}
            disabled={activeStep === 0}
          >
            Back
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(true)}
                  startIcon={<Save />}
                  sx={{ mr: 1 }}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmit(false)}
                  endIcon={<Publish />}
                  disabled={isLoading}
                  color="primary"
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Post Job'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                disabled={isNextDisabled()}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default JobPostingPage;
