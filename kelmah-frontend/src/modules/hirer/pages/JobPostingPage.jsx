import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  updateHirerJob,
  selectHirerLoading,
  selectHirerError,
} from '../services/hirerSlice';
import { alpha, useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const steps = [
  { label: 'Job Details', icon: <Work /> },
  { label: 'Description & Skills', icon: <Description /> },
  { label: 'Budget & Scope', icon: <AttachMoney /> },
  { label: 'Location & Visibility', icon: <LocationOn /> },
  { label: 'Review & Publish', icon: <Publish /> },
];

const DESCRIPTION_MIN_CHARS = 120;
const DESCRIPTION_MAX_CHARS = 1200;

const toSafeText = (value = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const normalizeDescription = (value = '') =>
  toSafeText(value).replace(/\s+/g, ' ').trim();

const formatCurrency = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'GH₵0';
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(numeric);
};

const getBudgetPreview = (formData) => {
  if (formData.paymentType === 'hourly') {
    const min = Number(formData.budget.min);
    const max = Number(formData.budget.max);
    if (Number.isFinite(min) && Number.isFinite(max) && min && max) {
      return `${formatCurrency(min)} – ${formatCurrency(max)} / hr`;
    }
    if (Number.isFinite(min) && min) {
      return `From ${formatCurrency(min)} / hr`;
    }
    if (Number.isFinite(max) && max) {
      return `Up to ${formatCurrency(max)} / hr`;
    }
    return 'GH₵0 / hr';
  }
  const fixed = Number(formData.budget.fixed);
  return Number.isFinite(fixed) && fixed
    ? `${formatCurrency(fixed)} total`
    : 'GH₵0 total';
};

const JobPreview = ({ snapshot }) => {
  const theme = useTheme();
  const budgetPreview = useMemo(() => getBudgetPreview(snapshot), [snapshot]);
  const durationPreview = snapshot.duration || 'N/A';
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
      <Typography variant="h6">{snapshot.title}</Typography>
      <Typography variant="subtitle1" color="text.secondary">
        {snapshot.location}
      </Typography>
      <Chip label={snapshot.category} sx={{ my: 1 }} />
      <Typography variant="body1" sx={{ mt: 2 }}>
        {snapshot.description}
      </Typography>
      <Box sx={{ mt: 2 }}>
        {snapshot.skills.length > 0 ? (
          snapshot.skills.map((skill, index) => (
            <Chip
              key={`${skill}-${index}`}
              label={skill}
              sx={{ mr: 1, mb: 1 }}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Add skills so qualified workers can find this job faster.
          </Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Budget:</strong> {budgetPreview}
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Expected Duration:</strong> {durationPreview}
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Location:</strong> {snapshot.locationType}
            {snapshot.locationType !== 'remote'
              ? ` (${snapshot.location || ''})`
              : ''}
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            <strong>Requirements:</strong> {snapshot.requirements}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

const REQUIRED_LABEL_SX = {
  '& .MuiInputLabel-root': {
    color: (theme) => theme.palette.text.primary,
    '& .MuiInputLabel-asterisk': {
      color: (theme) => theme.palette.error.main,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: (theme) => theme.palette.text.primary,
  },
};

const JobPostingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const hirerJobsByStatus = useSelector((state) => state.hirer?.jobs);
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
  const [stepAttempts, setStepAttempts] = useState({});

  useEffect(() => {
    if (!isEditMode) return;
    if (!hirerJobsByStatus || typeof hirerJobsByStatus !== 'object') return;

    const allJobs = Object.values(hirerJobsByStatus).flatMap((v) =>
      Array.isArray(v) ? v : [],
    );
    const existing = allJobs.find((j) => String(j?.id) === String(jobId));
    if (!existing) return;

    const locationType =
      existing?.location?.type || existing?.locationType || 'remote';
    const locationAddress =
      typeof existing?.location === 'string'
        ? existing.location
        : existing?.location?.address || existing?.location?.text || '';

    const durationValue =
      typeof existing?.duration === 'string'
        ? existing.duration
        : existing?.duration?.value && existing?.duration?.unit
          ? `${existing.duration.value} ${existing.duration.unit}`
          : '';

    setFormData((prev) => ({
      ...prev,
      title: existing?.title || prev.title,
      category: existing?.category || prev.category,
      skills: Array.isArray(existing?.skills)
        ? existing.skills
        : typeof existing?.skills === 'string'
          ? existing.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : prev.skills,
      description: existing?.description || prev.description,
      requirements: existing?.requirements || prev.requirements,
      paymentType: existing?.paymentType || prev.paymentType,
      budget:
        (existing?.paymentType || prev.paymentType) === 'hourly'
          ? {
            ...prev.budget,
            min: String(existing?.budget?.min ?? existing?.budget ?? ''),
            max: String(existing?.budget?.max ?? existing?.budget ?? ''),
            fixed: '',
          }
          : {
            ...prev.budget,
            fixed: String(existing?.budget?.amount ?? existing?.budget ?? ''),
            min: '',
            max: '',
          },
      duration: durationValue || prev.duration,
      locationType,
      location: locationAddress,
    }));
  }, [isEditMode, hirerJobsByStatus, jobId]);
  const previewSnapshot = useMemo(() => {
    const normalized = normalizeDescription(formData.description || '');
    const cleanSkills = Array.isArray(formData.skills)
      ? formData.skills
        .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
        .filter(Boolean)
        .slice(0, 8)
      : [];
    const safeRequirements = normalizeDescription(formData.requirements);
    const safeLocation = normalizeDescription(formData.location);
    const safeTitle = normalizeDescription(formData.title);
    const safeDuration = normalizeDescription(formData.duration);

    return {
      title: safeTitle || 'Job Title',
      category: formData.category || 'Category',
      description: normalized || 'Job description will appear here.',
      requirements:
        safeRequirements ||
        (cleanSkills.length
          ? `Explain why ${cleanSkills[0]} experience matters for this job.`
          : 'Share certifications, tools, or safety expectations.'),
      skills: cleanSkills,
      paymentType: formData.paymentType,
      budget: formData.budget,
      duration: safeDuration,
      locationType: formData.locationType,
      location:
        formData.locationType === 'remote'
          ? safeLocation || 'Remote collaboration'
          : safeLocation || 'Add the job site or landmark',
    };
  }, [formData]);

  const normalizedDescription = useMemo(
    () => normalizeDescription(formData.description || ''),
    [formData.description],
  );
  const descriptionLength = normalizedDescription.length;
  const descriptionRemaining = Math.max(
    0,
    DESCRIPTION_MIN_CHARS - descriptionLength,
  );
  const descriptionTooLong = descriptionLength > DESCRIPTION_MAX_CHARS;
  const descriptionProgress = Math.min(
    100,
    Math.round((descriptionLength / DESCRIPTION_MIN_CHARS) * 100),
  );

  const getFieldError = (field, data = formData) => {
    switch (field) {
      case 'title':
        return normalizeDescription(data.title)
          ? ''
          : 'Job title is required.';
      case 'category':
        return data.category ? '' : 'Select a category to continue.';
      case 'description': {
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
        const trimmed = normalizeDescription(data.location);
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
        ...fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
      }));
      setStepAttempts((prev) => ({ ...prev, [activeStep]: true }));
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
        const attempted = requiredSteps.reduce(
          (acc, step) => ({ ...acc, [step]: true }),
          {},
        );
        setStepAttempts((prev) => ({ ...prev, ...attempted }));
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

    const action = isEditMode
      ? updateHirerJob({ jobId, updates: payload })
      : createHirerJob(payload);

    dispatch(action)
      .unwrap()
      .then(() => setSubmitSuccess(true))
      .catch(() => { });
  };

  // Determine if Next button should be disabled
  const currentStepFields = getStepFields(activeStep);
  const currentStepErrors = validateStep(activeStep);
  const hasCurrentStepErrors = Object.keys(currentStepErrors).length > 0;
  const stepHasTouchedField = currentStepFields.some(
    (field) => touchedFields[field],
  );
  const showStepErrors =
    (stepAttempts[activeStep] || stepHasTouchedField) && hasCurrentStepErrors;

  if (submitSuccess) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 }, textAlign: 'center' }}>
        <CheckCircle color="success" sx={{ fontSize: { xs: 60, md: 80 }, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Job Updated Successfully!' : 'Job Posted Successfully!'}
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
              sx={REQUIRED_LABEL_SX}
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
              sx={REQUIRED_LABEL_SX}
            >
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleChange}
                onBlur={() => markFieldTouched('category')}
                displayEmpty
                renderValue={(selected) =>
                  selected ? selected : 'Select a category'
                }
                sx={{
                  '& .MuiSelect-select.Mui-disabled': {
                    color: 'text.disabled',
                  },
                  '& .MuiSelect-select': {
                    color: formData.category
                      ? 'text.primary'
                      : 'text.secondary',
                  },
                }}
              >
                <MenuItem value="" disabled>
                  Select a category
                </MenuItem>
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
              sx={REQUIRED_LABEL_SX}
              onBlur={() => markFieldTouched('description')}
              error={Boolean(
                touchedFields.description && fieldErrors.description,
              )}
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
                'Plumbing',
                'Electrical',
                'Carpentry',
                'Construction',
                'Painting',
                'Welding',
                'Masonry',
                'HVAC',
                'Roofing',
                'Flooring',
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
            <FormControl component="fieldset" sx={REQUIRED_LABEL_SX}>
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
                      (touchedFields['budget.min'] &&
                        fieldErrors['budget.min']) ||
                      'Lowest hourly rate you are willing to pay'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">GH₵</InputAdornment>
                      ),
                    }}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                    sx={REQUIRED_LABEL_SX}
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
                      (touchedFields['budget.max'] &&
                        fieldErrors['budget.max']) ||
                      'Highest hourly rate for this project'
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">GH₵</InputAdornment>
                      ),
                    }}
                    fullWidth
                    margin="normal"
                    type="number"
                    required
                    sx={REQUIRED_LABEL_SX}
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
                    touchedFields['budget.fixed'] &&
                    fieldErrors['budget.fixed'],
                  )}
                  helperText={
                    (touchedFields['budget.fixed'] &&
                      fieldErrors['budget.fixed']) ||
                    'Total amount you plan to spend on this job'
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">GH₵</InputAdornment>
                    ),
                  }}
                  fullWidth
                  margin="normal"
                  type="number"
                  required
                  sx={REQUIRED_LABEL_SX}
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
                sx={REQUIRED_LABEL_SX}
              />
            </Box>
          </>
        );
      case 3:
        return (
          <>
            <FormControl component="fieldset" sx={REQUIRED_LABEL_SX}>
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
              sx={REQUIRED_LABEL_SX}
            />
          </>
        );
      case 4:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Review & Publish
            </Typography>
            <JobPreview snapshot={previewSnapshot} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Helmet>
        <title>{isEditMode ? 'Edit Job' : 'Post a Job'} | Kelmah</title>
      </Helmet>

      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom>
          {isEditMode ? 'Edit Job' : 'Post a Job'}
        </Typography>
        {!isMobile && (
          <Typography variant="body1" color="text.secondary">
            Create a detailed job posting to find the perfect talent for your
            project
          </Typography>
        )}
      </Box>

      <Stepper
        activeStep={activeStep}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        sx={{
          mb: { xs: 2, md: 4 },
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.75rem', md: '0.875rem' },
          },
        }}
      >
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
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            {showStepErrors && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Complete these before continuing
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                  {Object.entries(currentStepErrors).map(([field, message]) => (
                    <Typography component="li" variant="body2" key={field}>
                      {message}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}
            {getStepContent(activeStep)}
          </Paper>
        </Grid>
        {!isMobile && (
          <Grid item xs={12} md={4}>
            <JobPreview snapshot={previewSnapshot} />
          </Grid>
        )}
      </Grid>

      {activeStep !== 5 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            justifyContent: 'space-between',
            gap: 1,
            mb: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBack />}
            disabled={activeStep === 0}
            sx={{ minHeight: 44 }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(true)}
                  startIcon={<Save />}
                  sx={{ mr: 1, minHeight: 44, flex: { xs: 1, sm: 'none' } }}
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
                  sx={{ minHeight: 44, flex: { xs: 1, sm: 'none' } }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Post Job'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                disabled={isLoading}
                sx={{ minHeight: 44, width: { xs: '100%', sm: 'auto' } }}
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
