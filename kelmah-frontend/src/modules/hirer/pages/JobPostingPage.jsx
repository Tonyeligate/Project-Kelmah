/* eslint-disable react/prop-types */
// IconButton focus-visible styling is enforced globally via MuiIconButton theme overrides.
import { useEffect, useMemo, useState } from 'react';
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
  Switch,
  Divider,
  Slider,
} from '@mui/material';
import {
  Work,
  Description,
  AttachMoney,
  LocationOn,
  Publish,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Save,
  AddPhotoAlternate,
  Close,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import {
  createHirerJob,
  updateHirerJob,
  selectHirerLoading,
  selectHirerError,
} from '../services/hirerSlice';
import fileUploadService from '../../common/services/fileUploadService';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Z_INDEX,
  STICKY_CTA_HEIGHT,
} from '../../../constants/layout';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { formatGhanaCurrency } from '@/utils/formatters';
import PageCanvas from '@/modules/common/components/PageCanvas';
import useKeyboardVisible from '../../../hooks/useKeyboardVisible';
import { withBottomNavSafeArea } from '@/utils/safeArea';
const steps = [
  { label: 'Job Details', icon: <Work /> },
  { label: 'Description & Skills', icon: <Description /> },
  { label: 'Budget & Scope', icon: <AttachMoney /> },
  { label: 'Location & Visibility', icon: <LocationOn /> },
  { label: 'Review & Publish', icon: <Publish /> },
];

const DESCRIPTION_MIN_CHARS = 120;
const DESCRIPTION_MAX_CHARS = 1200;
const JOB_POST_DRAFT_STORAGE_PREFIX = 'kelmah.hirer.job-posting.draft.v1';
const JOB_CATEGORY_OPTIONS = [
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
];
const STEP_COACHING = [
  {
    title: 'Step 1 tip',
    body: 'Use the exact task name workers search for, then pick the closest trade category.',
  },
  {
    title: 'Step 2 tip',
    body: 'Explain the problem, expected finish, and safety needs in plain words.',
  },
  {
    title: 'Step 3 tip',
    body: 'Set a realistic budget range so serious workers can apply faster.',
  },
  {
    title: 'Step 4 tip',
    body: 'Add a landmark or city and choose who should see this posting.',
  },
  {
    title: 'Step 5 tip',
    body: 'Review the checklist before publishing to avoid delays from incomplete details.',
  },
];

const formatDraftSavedTime = (timestamp) => {
  if (!timestamp) {
    return 'just now';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const createDefaultFormData = () => ({
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
  visibility: 'public',
  biddingEnabled: false,
  biddingMaxBidders: 5,
  coverImage: '',
});

const toSafeText = (value = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const normalizeDescription = (value = '') =>
  toSafeText(value).replace(/\s+/g, ' ').trim();

const formatCurrency = (value) => {
  const numeric = Number(value);
  return formatGhanaCurrency(Number.isFinite(numeric) ? numeric : 0);
};

const getBudgetPreview = (formData) => {
  if (formData.paymentType === 'hourly') {
    const min = Number(formData.budget.min);
    const max = Number(formData.budget.max);
    if (Number.isFinite(min) && Number.isFinite(max) && min && max) {
      return `${formatCurrency(min)} - ${formatCurrency(max)} / hr`;
    }
    if (Number.isFinite(min) && min) {
      return `From ${formatCurrency(min)} / hr`;
    }
    if (Number.isFinite(max) && max) {
      return `Up to ${formatCurrency(max)} / hr`;
    }
    return `${formatCurrency(0)} / hr`;
  }
  const fixed = Number(formData.budget.fixed);
  return Number.isFinite(fixed) && fixed
    ? `${formatCurrency(fixed)} total`
    : `${formatCurrency(0)} total`;
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
      {snapshot.coverImage && (
        <Box
          component="img"
          src={snapshot.coverImage}
          alt="Cover"
          sx={{
            width: '100%',
            maxHeight: 180,
            objectFit: 'cover',
            borderRadius: 1.5,
            mb: 2,
          }}
        />
      )}
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
            <strong>Visibility:</strong>{' '}
            {snapshot.visibility === 'private'
              ? '🔒 Private (invite only)'
              : '🌐 Public (visible to all workers)'}
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
  const isMobile = useBreakpointDown('md');
  const { isKeyboardVisible } = useKeyboardVisible();
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const localDraftStorageKey = isEditMode
    ? null
    : `${JOB_POST_DRAFT_STORAGE_PREFIX}:new`;
  const hirerJobsByStatus = useSelector((state) => state.hirer?.jobs);
  const isLoading = useSelector(selectHirerLoading('jobs'));
  const error = useSelector(selectHirerError('jobs'));
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(createDefaultFormData);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [stepAttempts, setStepAttempts] = useState({});
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');

  useEffect(() => {
    if (!isEditMode) return;
    if (!hirerJobsByStatus || typeof hirerJobsByStatus !== 'object') return;

    const allJobs = Object.values(hirerJobsByStatus).flatMap((v) =>
      Array.isArray(v) ? v : [],
    );
    const existing = allJobs.find(
      (j) => String(j?.id || j?._id) === String(jobId),
    );
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
          ? existing.skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
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
      visibility: existing?.visibility || 'public',
    }));
  }, [isEditMode, hirerJobsByStatus, jobId]);

  useEffect(() => {
    if (!localDraftStorageKey) {
      return;
    }

    try {
      const stored = window.localStorage.getItem(localDraftStorageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      if (parsed?.formData && typeof parsed.formData === 'object') {
        setFormData((prev) => ({
          ...prev,
          ...parsed.formData,
          skills: Array.isArray(parsed.formData.skills)
            ? parsed.formData.skills
            : prev.skills,
          budget: {
            ...prev.budget,
            ...(parsed.formData.budget || {}),
          },
        }));
      }

      if (typeof parsed?.activeStep === 'number') {
        setActiveStep(Math.max(0, Math.min(parsed.activeStep, steps.length - 1)));
      }

      if (parsed?.savedAt) {
        setLastDraftSavedAt(parsed.savedAt);
      }

      setDraftRestored(true);
    } catch {
      // Ignore local draft parsing issues silently.
    }
  }, [localDraftStorageKey]);

  useEffect(() => {
    if (!localDraftStorageKey || submitSuccess) {
      return;
    }

    try {
      const savedAt = Date.now();
      const payload = {
        formData,
        activeStep,
        savedAt,
      };
      window.localStorage.setItem(localDraftStorageKey, JSON.stringify(payload));
      setLastDraftSavedAt(savedAt);
    } catch {
      // Ignore local storage write failures.
    }
  }, [activeStep, formData, localDraftStorageKey, submitSuccess]);

  const hasUnsavedChanges = useMemo(() => {
    if (isEditMode || submitSuccess) {
      return false;
    }

    return Boolean(
      normalizeDescription(formData.title) ||
        formData.category ||
        formData.skills.length > 0 ||
        normalizeDescription(formData.description) ||
        normalizeDescription(formData.requirements) ||
        normalizeDescription(formData.duration) ||
        normalizeDescription(formData.location) ||
        String(formData.budget.min || '').trim() ||
        String(formData.budget.max || '').trim() ||
        String(formData.budget.fixed || '').trim() ||
        formData.locationType !== 'remote' ||
        formData.visibility !== 'public' ||
        formData.biddingEnabled ||
        Boolean(coverImageFile) ||
        Boolean(coverImagePreview) ||
        activeStep > 0,
    );
  }, [
    activeStep,
    coverImageFile,
    coverImagePreview,
    formData,
    isEditMode,
    submitSuccess,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!draftRestored) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setDraftRestored(false);
    }, 6000);

    return () => clearTimeout(timeoutId);
  }, [draftRestored]);

  const clearLocalDraft = () => {
    if (!localDraftStorageKey) {
      return;
    }

    try {
      window.localStorage.removeItem(localDraftStorageKey);
    } catch {
      // Ignore local storage cleanup failures.
    }

    setLastDraftSavedAt(null);
    setDraftRestored(false);
  };

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
      visibility: formData.visibility || 'public',
      coverImage: coverImagePreview,
    };
  }, [formData, coverImagePreview]);

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
  const normalizedCategoryQuery = categoryQuery.trim().toLowerCase();
  const filteredCategoryOptions = useMemo(() => {
    if (!normalizedCategoryQuery) {
      return JOB_CATEGORY_OPTIONS;
    }

    return JOB_CATEGORY_OPTIONS.filter((category) =>
      category.toLowerCase().includes(normalizedCategoryQuery),
    );
  }, [normalizedCategoryQuery]);

  const categoryOptionsForMenu = useMemo(() => {
    if (!formData.category) {
      return filteredCategoryOptions;
    }

    if (filteredCategoryOptions.includes(formData.category)) {
      return filteredCategoryOptions;
    }

    return [formData.category, ...filteredCategoryOptions];
  }, [filteredCategoryOptions, formData.category]);

  const publishReadinessChecks = useMemo(() => {
    const titleIsClear = normalizeDescription(formData.title).length >= 12;
    const hasCategory = Boolean(formData.category);
    const hasDescription =
      descriptionLength >= DESCRIPTION_MIN_CHARS && !descriptionTooLong;
    const budgetReady =
      formData.paymentType === 'hourly'
        ? Number(formData.budget.min || 0) > 0 &&
          Number(formData.budget.max || 0) >= Number(formData.budget.min || 0)
        : Number(formData.budget.fixed || 0) > 0;
    const hasDuration = Boolean(String(formData.duration || '').trim());
    const hasLocation = Boolean(normalizeDescription(formData.location));
    const hasRequirementsContext =
      formData.skills.length > 0 ||
      Boolean(normalizeDescription(formData.requirements || ''));

    return [
      {
        key: 'title',
        label: 'Job title is clear and specific',
        passed: titleIsClear,
      },
      {
        key: 'category',
        label: 'Trade category is selected',
        passed: hasCategory,
      },
      {
        key: 'description',
        label: 'Description has enough detail for workers',
        passed: hasDescription,
      },
      {
        key: 'budget',
        label: 'Budget and duration are set',
        passed: budgetReady && hasDuration,
      },
      {
        key: 'location',
        label: 'Location and visibility are confirmed',
        passed: hasLocation,
      },
      {
        key: 'requirements',
        label: 'Skills or requirements are included',
        passed: hasRequirementsContext,
      },
    ];
  }, [
    descriptionLength,
    descriptionTooLong,
    formData.budget.fixed,
    formData.budget.max,
    formData.budget.min,
    formData.category,
    formData.duration,
    formData.location,
    formData.paymentType,
    formData.requirements,
    formData.skills.length,
    formData.title,
  ]);
  const incompletePublishChecksCount = publishReadinessChecks.filter(
    (check) => !check.passed,
  ).length;

  const getFieldError = (field, data = formData) => {
    switch (field) {
      case 'title':
        return normalizeDescription(data.title) ? '' : 'Job title is required.';
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

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({
        ...prev,
        coverImage: 'Please select a valid image file.',
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        coverImage: 'Image must be under 5MB.',
      }));
      return;
    }
    setFieldErrors((prev) => {
      const rest = { ...prev };
      delete rest.coverImage;
      return rest;
    });
    const reader = new FileReader();
    reader.onload = () => {
      setCoverImagePreview(reader.result);
      setCoverImageFile(file);
      setFormData((prev) => ({ ...prev, coverImage: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCoverImage = () => {
    setCoverImagePreview('');
    setCoverImageFile(null);
    setFormData((prev) => ({ ...prev, coverImage: '' }));
  };

  const handleSubmit = async (asDraft = false) => {
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
    // Append freeform requirements to description so the text is preserved in the job.
    // The backend auto-generates structured requirements from skills/category for matching.
    const requirementsText = normalizeDescription(formData.requirements || '');
    const fullDescription = requirementsText
      ? `${normalizedDescription}\n\nRequirements:\n${requirementsText}`
      : normalizedDescription;

    let uploadedCoverImage = null;
    if (coverImageFile instanceof File) {
      try {
        uploadedCoverImage = await fileUploadService.uploadFile(
          coverImageFile,
          'jobs/covers',
          'user',
        );
      } catch (uploadError) {
        setFieldErrors((prev) => ({
          ...prev,
          submit:
            uploadError?.message ||
            'Failed to upload the cover image. Please try again.',
        }));
        return;
      }
    }

    const payload = {
      title: formData.title,
      description: fullDescription,
      category: formData.category,
      skills: formData.skills,
      paymentType: formData.paymentType,
      budget:
        formData.paymentType === 'hourly'
          ? {
              min: Number(formData.budget.min || 0),
              max: Number(formData.budget.max || 0),
            }
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
      visibility: formData.visibility || 'public',
      status: asDraft ? 'draft' : 'open',
      ...((uploadedCoverImage?.url ||
        (!coverImageFile && formData.coverImage)) && {
        coverImage: uploadedCoverImage?.url || formData.coverImage,
      }),
      ...(uploadedCoverImage && {
        coverImageMetadata: {
          publicId: uploadedCoverImage.publicId || null,
          resourceType: uploadedCoverImage.resourceType || null,
          thumbnailUrl: uploadedCoverImage.thumbnailUrl || null,
          width: uploadedCoverImage.width || null,
          height: uploadedCoverImage.height || null,
          duration: uploadedCoverImage.duration || null,
          format: uploadedCoverImage.format || null,
        },
      }),
      ...(formData.biddingEnabled && {
        bidding: {
          maxBidders: Number(formData.biddingMaxBidders) || 5,
          minBidAmount:
            formData.paymentType === 'hourly'
              ? Number(formData.budget.min || 0)
              : Math.round(Number(formData.budget.fixed || 0) * 0.7),
          maxBidAmount:
            formData.paymentType === 'hourly'
              ? Number(formData.budget.max || 0)
              : Number(formData.budget.fixed || 0),
          bidDeadline: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          bidStatus: 'open',
        },
      }),
    };

    const action = isEditMode
      ? updateHirerJob({ jobId, updates: payload })
      : createHirerJob(payload);

    dispatch(action)
      .unwrap()
      .then(() => {
        setSubmitSuccess(true);
        clearLocalDraft();
      })
      .catch((err) => {
        setFieldErrors((prev) => ({
          ...prev,
          submit:
            err?.message || err || 'Failed to submit job. Please try again.',
        }));
      });
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
  const stepProgressPercent =
    steps.length > 1 ? Math.round((activeStep / (steps.length - 1)) * 100) : 0;

  if (submitSuccess) {
    return (
      <Container
        maxWidth="md"
        sx={{ py: { xs: 3, md: 5 }, textAlign: 'center' }}
      >
        <CheckCircle
          color="success"
          sx={{ fontSize: { xs: 60, md: 80 }, mb: 2 }}
        />
        <Typography variant="h4" gutterBottom>
          {isEditMode
            ? 'Job Updated Successfully!'
            : 'Job Posted Successfully!'}
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
            setCoverImagePreview('');
            setCoverImageFile(null);
            setFieldErrors({});
            setTouchedFields({});
            setStepAttempts({});
            setFormData(createDefaultFormData());
            clearLocalDraft();
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
              placeholder="e.g. Plumber needed for kitchen leak repair"
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
                'Keep it short and specific so workers understand the task quickly'
              }
            />
            <TextField
              label="Find Trade Category"
              placeholder="Type plumbing, electrical, carpentry..."
              value={categoryQuery}
              onChange={(event) => setCategoryQuery(event.target.value)}
              fullWidth
              margin="normal"
              helperText={
                normalizedCategoryQuery
                  ? `${filteredCategoryOptions.length} matching categories`
                  : 'Type a keyword to filter categories faster'
              }
            />
            <FormControl
              fullWidth
              margin="normal"
              error={Boolean(touchedFields.category && fieldErrors.category)}
              sx={REQUIRED_LABEL_SX}
            >
              <InputLabel id="job-category-label" shrink={Boolean(formData.category)}>
                Category
              </InputLabel>
              <Select
                labelId="job-category-label"
                name="category"
                value={formData.category}
                label="Category"
                onChange={handleChange}
                onBlur={() => markFieldTouched('category')}
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
                {categoryOptionsForMenu.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
                {categoryOptionsForMenu.length === 0 && (
                  <MenuItem value="__no-category-match" disabled>
                    No category matches "{categoryQuery.trim()}"
                  </MenuItem>
                )}
              </Select>
              <FormHelperText>
                {(touchedFields.category && fieldErrors.category) ||
                  (normalizedCategoryQuery
                    ? 'Pick the closest trade match from the filtered list'
                    : 'Choose the main trade for this work')}
              </FormHelperText>
            </FormControl>

            {/* Cover Image Upload */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Cover Image (optional)
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                Add a clear site or project photo so workers understand the task
                faster
              </Typography>
              {coverImagePreview ? (
                <Box sx={{ position: 'relative', maxWidth: 400 }}>
                  <Box
                    component="img"
                    src={coverImagePreview}
                    alt="Cover preview"
                    sx={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveCoverImage}
                    aria-label="Remove cover image"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                      '&:focus-visible': {
                        outline: '3px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AddPhotoAlternate />}
                  sx={{ textTransform: 'none' }}
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    aria-label="Upload job cover image"
                    onChange={handleCoverImageChange}
                  />
                </Button>
              )}
            </Box>
          </>
        );
      case 1:
        return (
          <>
            <TextField
              name="description"
              label="Job Description"
              placeholder="Describe the work, tools, timeline, and result you expect"
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
              placeholder="e.g. Must have own tools, 3+ years experience"
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
                  helperText="Add up to five key skills so qualified workers can find this job"
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
                  label="Pay per hour"
                />
                <FormControlLabel
                  value="fixed"
                  control={<Radio />}
                  label="Fixed total amount"
                />
              </RadioGroup>
            </FormControl>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              {formData.paymentType === 'hourly' ? (
                <>
                  <TextField
                    name="budget.min"
                    label="Min Rate"
                    placeholder="e.g. 50"
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
                    placeholder="e.g. 200"
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
                  placeholder="e.g. 5000"
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

            {/* Bidding Section */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" gutterBottom>
              Bidding
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.biddingEnabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      biddingEnabled: e.target.checked,
                    }))
                  }
                  color="primary"
                />
              }
              label="Enable bidding so workers can send price offers"
            />
            {formData.biddingEnabled && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Maximum bidders allowed (1–10)
                </Typography>
                <Slider
                  value={formData.biddingMaxBidders}
                  onChange={(_, val) =>
                    setFormData((prev) => ({ ...prev, biddingMaxBidders: val }))
                  }
                  min={1}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 300 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Workers will submit bids within your budget range. You choose
                  the best one.
                </Typography>
              </Box>
            )}
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
              placeholder="e.g. Accra, East Legon"
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
            <FormControl component="fieldset" sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Job Visibility
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Control who can see your job posting on Kelmah.
              </Typography>
              <RadioGroup
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="public"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Public
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Visible to all workers on Kelmah
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="private"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Private
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only workers you invite can see and apply
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </>
        );
      case 4:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Review & Publish
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.04),
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Confidence Checklist
              </Typography>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {publishReadinessChecks.map((check) => (
                  <Box
                    component="li"
                    key={check.key}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}
                  >
                    {check.passed ? (
                      <CheckCircle color="success" sx={{ fontSize: 18 }} />
                    ) : (
                      <Close color="error" sx={{ fontSize: 18 }} />
                    )}
                    <Typography variant="body2">{check.label}</Typography>
                  </Box>
                ))}
              </Box>
              {incompletePublishChecksCount > 0 && (
                <Alert severity="warning" sx={{ mt: 1.5, mb: 0 }}>
                  Complete {incompletePublishChecksCount} more checklist
                  {incompletePublishChecksCount > 1 ? ' items' : ' item'} to
                  improve matching speed after publish.
                </Alert>
              )}
            </Paper>
            <Alert severity="info" sx={{ mb: 2 }}>
              Kelmah reviews posts for safety and clarity before broad worker
              distribution. Most approved jobs receive the first worker response
              within 10-30 minutes during active hours.
            </Alert>
            <JobPreview snapshot={previewSnapshot} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <PageCanvas
      disableContainer
      sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 }, overflowX: 'clip' }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, md: 4 },
          pb: isMobile ? `${STICKY_CTA_HEIGHT + 16}px` : undefined,
          width: '100%',
          minWidth: 0,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {draftRestored && !isEditMode && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            onClose={() => setDraftRestored(false)}
            action={
              <Button color="inherit" size="small" onClick={clearLocalDraft}>
                Clear Draft
              </Button>
            }
          >
            Restored your unfinished job draft from this device.
          </Alert>
        )}
        {!isEditMode && lastDraftSavedAt && hasUnsavedChanges && (
          <Alert
            severity="success"
            icon={false}
            sx={{ mb: 2, py: 0.5 }}
            action={
              <Button color="inherit" size="small" onClick={clearLocalDraft}>
                Remove Local Draft
              </Button>
            }
          >
            Draft auto-saved at {formatDraftSavedTime(lastDraftSavedAt)}.
          </Alert>
        )}
        <Helmet>
          <title>{isEditMode ? 'Edit Job' : 'Post a Job'} | Kelmah</title>
        </Helmet>

        <Box sx={{ mb: { xs: 2, md: 4 } }}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            component="h1"
            gutterBottom
          >
            {isEditMode ? 'Edit Job' : 'Post a Job'}
          </Typography>
          {!isMobile && (
            <Typography variant="body1" color="text.secondary">
              Share clear details, budget, and location so the right workers can
              apply quickly.
            </Typography>
          )}
        </Box>

        {isMobile ? (
          <Paper sx={{ p: 1.5, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Step {activeStep + 1} of {steps.length}
            </Typography>
            <Typography variant="subtitle2" sx={{ mt: 0.35, mb: 0.9 }}>
              {steps[activeStep]?.label}
            </Typography>
            <LinearProgress variant="determinate" value={stepProgressPercent} />
          </Paper>
        ) : (
          <Stepper
            activeStep={activeStep}
            orientation="horizontal"
            sx={{
              mb: { xs: 2, md: 4 },
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              },
            }}
          >
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel icon={step.icon}>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
              {!!STEP_COACHING[activeStep] && (
                <Alert severity="info" icon={false} sx={{ mb: 2, py: 0.7 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {STEP_COACHING[activeStep].title}
                  </Typography>
                  <Typography variant="body2">
                    {STEP_COACHING[activeStep].body}
                  </Typography>
                </Alert>
              )}
              {showStepErrors && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Complete these before continuing
                  </Typography>
                  <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                    {Object.entries(currentStepErrors).map(
                      ([field, message]) => (
                        <Typography component="li" variant="body2" key={field}>
                          {message}
                        </Typography>
                      ),
                    )}
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

        {fieldErrors.submit && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() =>
              setFieldErrors((prev) => {
                const rest = { ...prev };
                delete rest.submit;
                return rest;
              })
            }
          >
            {fieldErrors.submit}
          </Alert>
        )}

        {!isMobile && activeStep !== 5 && (
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

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: { xs: 'stretch', sm: 'flex-end' },
              }}
            >
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
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : isEditMode ? (
                      'Save Changes'
                    ) : (
                      'Post Job'
                    )}
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

        {/* Sticky bottom action bar for mobile */}
        {isMobile && activeStep !== 5 && !isKeyboardVisible && (
          <Box
            sx={{
              position: 'fixed',
              bottom: { xs: withBottomNavSafeArea(0), md: 0 },
              left: 0,
              right: 0,
              zIndex: Z_INDEX.stickyCta,
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
              px: 2,
              py: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1,
              boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBack />}
              disabled={activeStep === 0}
              sx={{ minHeight: 44, flex: 1 }}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  sx={{ minHeight: 44, flex: 1 }}
                >
                  Save Draft
                </Button>
                <Button
                variant="contained"
                onClick={() => handleSubmit(false)}
                endIcon={<Publish />}
                disabled={isLoading}
                color="primary"
                sx={{ minHeight: 44, flex: 1 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : isEditMode ? (
                  'Save'
                ) : (
                  'Post Job'
                )}
              </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                disabled={isLoading}
                sx={{ minHeight: 44, flex: 1 }}
              >
                Next
              </Button>
            )}
          </Box>
        )}
      </Container>
    </PageCanvas>
  );
};

export default JobPostingPage;
