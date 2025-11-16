import React, { useState, useMemo } from 'react';
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
  FormHelperText,
  Autocomplete,
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress,
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

const DESCRIPTION_MIN_CHARS = 120;
const DESCRIPTION_MAX_CHARS = 1200;

const normalizeDescription = (value = '') => value.replace(/\s+/g, ' ').trim();

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const normalizedDescription = useMemo(
    () => normalizeDescription(formData.description || ''),
    [formData.description],
  );
  const descriptionLength = normalizedDescription.length;
  const descriptionRemaining = Math.max(0, DESCRIPTION_MIN_CHARS - descriptionLength);
  const descriptionTooLong = descriptionLength > DESCRIPTION_MAX_CHARS;
  const descriptionProgress = Math.min(
    100,
    Math.round((descriptionLength / DESCRIPTION_MIN_CHARS) * 100),
  );

  const getFieldError = (field, data = formData) => {
    switch (field) {
      case 'title':
        return data.title.trim()
          ? ''
          : 'Job title is required.';
      case 'category':
        return data.category
          ? ''
          : 'Select a category to continue.';
      case 'description':
        {
          const normalized = normalizeDescription(data.description || '');
          if (!normalized) {
            return 'Add a project description so workers know what to expect.';
          }
          if (normalized.length < DESCRIPTION_MIN_CHARS) {
            return `Use at least ${DESCRIPTION_MIN_CHARS} characters (${DESCRIPTION_MIN_CHARS - normalized.length} more to go).`;
          }
          if (normalized.length > DESCRIPTION_MAX_CHARS) {
            return `Keep the description under ${DESCRIPTION_MAX_CHARS} characters.`;
          }
          return '';
        }
      case 'budget.min': {
        if (data.paymentType !== 'hourly') return '';
        const rawValue = String(data.budget.min ?? '').trim();
        if (!rawValue) return 'Enter a minimum hourly rate.';
        const value = Number(rawValue);
        if (Number.isNaN(value) || value <= 0)
          return 'Minimum rate must be greater than zero.';
        return '';
      }
      case 'budget.max': {
        if (data.paymentType !== 'hourly') return '';
        const rawValue = String(data.budget.max ?? '').trim();
        if (!rawValue) return 'Enter a maximum hourly rate.';
        const value = Number(rawValue);
        if (Number.isNaN(value) || value <= 0)
          return 'Maximum rate must be greater than zero.';
        const minValue = Number(data.budget.min ?? 0);
        if (!Number.isNaN(minValue) && value < minValue)
          return 'Maximum rate cannot be lower than the minimum rate.';
        return '';
      }
      case 'budget.fixed': {
        if (data.paymentType !== 'fixed') return '';
        const rawValue = String(data.budget.fixed ?? '').trim();
        if (!rawValue) return 'Enter a project budget.';
        const value = Number(rawValue);
        if (Number.isNaN(value) || value <= 0)
          return 'Project budget must be greater than zero.';
        return '';
      }
      case 'duration':
        return String(data.duration ?? '').trim()
          ? ''
          : 'Share the expected duration so workers can plan.';
      case 'location': {
        const trimmed = data.location.trim();
        if (trimmed) return '';
        return data.locationType === 'remote'
          ? 'Add the primary region or time zone for remote collaboration.'
          : 'Tell workers where the job will take place.';
      }
      default:
        return '';
    }
  };

  const refreshFieldError = (field, data = formData) => {
    const message = getFieldError(field, data);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (message) {
        updated[field] = message;
      } else {
        delete updated[field];
      }
      return updated;
    });
  };

  const markFieldTouched = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    refreshFieldError(field, formData);
  };

  const getStepFields = (step, data = formData) => {
    switch (step) {
      case 0:
        return ['title', 'category'];
      case 1:
        return ['description'];
      case 2:
        return data.paymentType === 'hourly'
          ? ['budget.min', 'budget.max', 'duration']
          : ['budget.fixed', 'duration'];
      case 3:
        return ['location'];
      default:
        return [];
    }
  };

  const validateStep = (step, data = formData) => {
    const errors = {};
    const fields = getStepFields(step, data);
    fields.forEach((field) => {
      const message = getFieldError(field, data);
      if (message) {
        errors[field] = message;
      }
    });
    return errors;
  };

  const clearErrorsForFields = (fields) => {
    if (!fields.length) return;
    setFieldErrors((prev) => {
      const updated = { ...prev };
      fields.forEach((field) => {
        delete updated[field];
      });
      return updated;
    });
  };

  const handleNext = () => {
    const fields = getStepFields(activeStep);
    const errors = validateStep(activeStep);

    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));
      setTouchedFields((prev) => ({
        ...prev,
        ...fields.reduce(
          (acc, field) => ({ ...acc, [field]: true }),
          {},
        ),
      }));
      return;
    }

    clearErrorsForFields(fields);
    setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'paymentType') {
      const nextData = {
        ...formData,
        paymentType: value,
        budget:
          value === 'hourly'
            ? { ...formData.budget, fixed: '' }
            : { ...formData.budget, min: '', max: '' },
      };
      setFormData(nextData);
      setTouchedFields((prev) => ({ ...prev, [name]: true }));
      ['budget.min', 'budget.max', 'budget.fixed'].forEach((field) =>
        refreshFieldError(field, nextData),
      );
      return;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      const nextData = {
        ...formData,
        [parent]: { ...formData[parent], [child]: value },
      };
      setFormData(nextData);
      setTouchedFields((prev) => ({ ...prev, [name]: true }));
      refreshFieldError(name, nextData);
    } else {
      const nextData = { ...formData, [name]: value };
      setFormData(nextData);
      setTouchedFields((prev) => ({ ...prev, [name]: true }));
      refreshFieldError(name, nextData);
    }
  };
  const handleSkillsChange = (event, newSkills) => {
    const nextData = { ...formData, skills: newSkills };
    setFormData(nextData);
    setTouchedFields((prev) => ({ ...prev, skills: true }));
  };
  const handleSubmit = (asDraft = false) => {
    if (!asDraft) {
      const requiredSteps = [0, 1, 2, 3];
      const collectedErrors = requiredSteps.reduce((acc, step) => {
        const stepErrors = validateStep(step);
        return { ...acc, ...stepErrors };
      }, {});

      if (Object.keys(collectedErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...collectedErrors }));
        setTouchedFields((prev) => ({
          ...prev,
          ...Object.keys(collectedErrors).reduce(
            (acc, field) => ({ ...acc, [field]: true }),
            {},
          ),
        }));
        const firstInvalidStep = requiredSteps.find(
          (step) => Object.keys(validateStep(step)).length > 0,
        );
        if (typeof firstInvalidStep === 'number') {
          setActiveStep(firstInvalidStep);
        }
        return;
      }
    }

    // Map UI form to canonical API payload
    const payload = {
      title: formData.title,
      description: normalizedDescription,
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
  const isNextDisabled = () =>
    Object.keys(validateStep(activeStep)).length > 0;

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
              required
              onBlur={() => markFieldTouched('title')}
              error={Boolean(touchedFields.title && fieldErrors.title)}
              helperText={
                (touchedFields.title && fieldErrors.title) ||
                'Example: Senior Carpenter for custom kitchen cabinets'
              }
            />
            <FormControl
              fullWidth
              margin="normal"
              error={Boolean(touchedFields.category && fieldErrors.category)}
            >
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleChange}
                onBlur={() => markFieldTouched('category')}
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
              <FormHelperText>
                {(touchedFields.category && fieldErrors.category) ||
                  'Choose the trade that best matches this project'}
              </FormHelperText>
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
              required
              onBlur={() => markFieldTouched('description')}
              error={Boolean(touchedFields.description && fieldErrors.description)}
              helperText={
                touchedFields.description && fieldErrors.description
                  ? fieldErrors.description
                  : descriptionTooLong
                    ? `Description too long (${descriptionLength}/${DESCRIPTION_MAX_CHARS})`
                    : descriptionRemaining > 0
                      ? `Need ${descriptionRemaining} more characters`
                      : `${descriptionLength} characters`
              }
            />
            <Box mt={1}>
              <LinearProgress
                variant="determinate"
                value={descriptionProgress}
                color={
                  descriptionTooLong
                    ? 'error'
                    : descriptionRemaining > 0
                      ? 'secondary'
                      : 'success'
                }
              />
              <Typography
                variant="caption"
                color={
                  descriptionTooLong || descriptionRemaining > 0
                    ? 'error.main'
                    : 'text.secondary'
                }
              >
                {descriptionTooLong
                  ? `Please remove ${descriptionLength - DESCRIPTION_MAX_CHARS} characters`
                  : `${Math.min(descriptionLength, DESCRIPTION_MAX_CHARS)} / ${DESCRIPTION_MAX_CHARS} characters`}
              </Typography>
            </Box>
            <TextField
              name="requirements"
              label="Requirements"
              value={formData.requirements}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              margin="normal"
              helperText="Optional: certifications, safety gear, or permits"
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
                <TextField
                  {...params}
                  label="Skills"
                  placeholder="Add skill"
                  helperText="Add up to five skills to help the right workers find this job"
                />
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
                    onBlur={() => markFieldTouched('budget.min')}
                    error={Boolean(
                      touchedFields['budget.min'] && fieldErrors['budget.min'],
                    )}
                    helperText={
                      (touchedFields['budget.min'] && fieldErrors['budget.min']) ||
                      'Lowest hourly rate you are willing to pay'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                  />
                  <TextField
                    name="budget.max"
                    label="Max Rate"
                    value={formData.budget.max}
                    onChange={handleChange}
                    onBlur={() => markFieldTouched('budget.max')}
                    error={Boolean(
                      touchedFields['budget.max'] && fieldErrors['budget.max'],
                    )}
                    helperText={
                      (touchedFields['budget.max'] && fieldErrors['budget.max']) ||
                      'Highest hourly rate for this project'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                  />
                </>
              ) : (
                <TextField
                  name="budget.fixed"
                  label="Project Budget"
                  value={formData.budget.fixed}
                  onChange={handleChange}
                  onBlur={() => markFieldTouched('budget.fixed')}
                  error={Boolean(
                    touchedFields['budget.fixed'] && fieldErrors['budget.fixed'],
                  )}
                  helperText={
                    (touchedFields['budget.fixed'] && fieldErrors['budget.fixed']) ||
                    'Total amount you plan to spend on this job'
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                  fullWidth
                  margin="normal"
                  type="number"
                  required
                />
              )}
              <TextField
                name="duration"
                label="Expected Duration"
                value={formData.duration}
                onChange={handleChange}
                onBlur={() => markFieldTouched('duration')}
                error={Boolean(touchedFields.duration && fieldErrors.duration)}
                helperText={
                  (touchedFields.duration && fieldErrors.duration) ||
                  'Example: 2 weeks, 5 days, or 40 hours'
                }
                placeholder="e.g. 2 weeks"
                fullWidth
                margin="normal"
                required
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
              onBlur={() => markFieldTouched('location')}
              error={Boolean(touchedFields.location && fieldErrors.location)}
              helperText={
                (touchedFields.location && fieldErrors.location) ||
                (formData.locationType === 'remote'
                  ? 'Share the city/region or time zone you prefer to work with'
                  : 'Specify the site address or nearest landmark')
              }
              required
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
