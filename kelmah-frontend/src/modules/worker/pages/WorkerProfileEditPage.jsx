import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Box, Container, Typography, TextField, Button, Grid, Paper, Divider, MenuItem, FormControl, InputLabel, Select, Chip, OutlinedInput, Avatar, IconButton, Alert, Snackbar, Card, CardContent, InputAdornment, useTheme, Autocomplete, Switch, FormControlLabel, Skeleton, Tooltip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as CameraIcon,
  AddCircleOutline as AddIcon,
  Delete as DeleteIcon,
  BusinessCenter as BusinessIcon,
  LocationOn as LocationIcon,
  MonetizationOn as RateIcon,
  School as EducationIcon,
  Language as LanguageIcon,
  Description as DescriptionIcon,
  Build as SkillsIcon,
  Person as PersonIcon, // Fix: Added missing PersonIcon import
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  updateWorkerProfile,
  updateWorkerAvailability,
  fetchWorkerProfile,
} from '../services/workerSlice';
import { api } from '../../../services/apiClient';
import { Helmet } from 'react-helmet-async';
import fileUploadService from '../../common/services/fileUploadService';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { createFeatureLogger } from '@/modules/common/utils/devLogger';

const Input = styled('input')({
  display: 'none',
});

const DEFAULT_AVAILABLE_HOURS = {
  monday: { start: '09:00', end: '17:00', available: true },
  tuesday: { start: '09:00', end: '17:00', available: true },
  wednesday: { start: '09:00', end: '17:00', available: true },
  thursday: { start: '09:00', end: '17:00', available: true },
  friday: { start: '09:00', end: '17:00', available: true },
  saturday: { start: '09:00', end: '13:00', available: false },
  sunday: { start: '09:00', end: '13:00', available: false },
};

const workerDebugError = createFeatureLogger({
  flagName: 'VITE_DEBUG_WORKER',
  level: 'error',
});

const mapAvailabilityApiToForm = (data) => {
  const dayOrder = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  const availableHours = { ...DEFAULT_AVAILABLE_HOURS };
  const daySlots = Array.isArray(data?.daySlots) ? data.daySlots : [];

  daySlots.forEach((entry) => {
    const dayName = dayOrder[entry?.dayOfWeek];
    if (!dayName || !availableHours[dayName]) return;

    const firstSlot = Array.isArray(entry?.slots) ? entry.slots[0] : null;
    availableHours[dayName] = {
      ...availableHours[dayName],
      available: Boolean(firstSlot),
      start: firstSlot?.start || availableHours[dayName].start,
      end: firstSlot?.end || availableHours[dayName].end,
    };
  });

  return {
    availabilityStatus: data?.status || 'available',
    availableHours,
    pausedUntil: data?.pausedUntil ? String(data.pausedUntil).slice(0, 10) : '',
  };
};

const normalizeSkillName = (skill) => {
  if (typeof skill === 'string') {
    return skill.trim();
  }

  if (skill && typeof skill === 'object') {
    return String(skill.name || skill.skillName || skill.title || '').trim();
  }

  return String(skill || '').trim();
};

const normalizeSkillsForForm = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  const seen = new Set();

  return skills
    .map((skill) => normalizeSkillName(skill))
    .filter((name) => {
      if (!name) {
        return false;
      }

      const key = name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const normalizeSuggestionText = (suggestion) => {
  if (typeof suggestion === 'string') {
    return suggestion.trim();
  }

  if (suggestion && typeof suggestion === 'object') {
    return String(
      suggestion.message || suggestion.text || suggestion.label || '',
    ).trim();
  }

  return String(suggestion || '').trim();
};

const WorkerProfileEditPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMobile = useBreakpointDown('md');

  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector((state) => state.auth);
  const user = normalizeUser(rawUser);
  // loading and error are objects with domain keys; access specific flags to avoid passing objects into UI props
  const { profile, loading, error } = useSelector((state) => state.worker);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [undoSkillSnackbar, setUndoSkillSnackbar] = useState({ open: false, skill: null });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    bio: '',
    hourlyRate: '',
    experience: '',
    skills: [],
    education: [],
    languages: [],
    location: '',
    phone: '',
    profileImage: null,
    portfolio: [],
    availabilityStatus: 'available',
    availableHours: {
      ...DEFAULT_AVAILABLE_HOURS,
    },
    pausedUntil: '',
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [newSkill, setNewSkill] = useState('');
  const [newEducation, setNewEducation] = useState({
    degree: '',
    institution: '',
    year: '',
  });
  const [newLanguage, setNewLanguage] = useState({
    language: '',
    proficiency: 'Beginner',
  });
  const [expandedOptionalSections, setExpandedOptionalSections] = useState({
    education: false,
    languages: false,
    portfolio: false,
  });

  // Profile completeness
  const [completeness, setCompleteness] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // If navigated with ?section=availability, auto-scroll/focus availability section
  const availabilityRef = React.useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section === 'availability' && availabilityRef.current) {
      availabilityRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [location.search]);

  useEffect(() => {
    const fetchCompleteness = async () => {
      try {
        const id = user?.id;
        if (!id) return;
        const resp = await api.get(`/users/workers/${id}/completeness`);
        const json = resp.data;
        if (json?.success) {
          setCompleteness(json.data?.completion ?? 0);
          setSuggestions(json.data?.suggestions ?? []);
        }
      } catch (_) {
        // Non-critical: silently ignored to avoid blocking primary UX
        // Profile completeness is supplementary — the edit form works without it
      }
    };
    fetchCompleteness();
  }, [user]);

  // Load profile data when component mounts
  useEffect(() => {
    const id = user?.id;
    if (!id) return;
    dispatch(fetchWorkerProfile(id))
      .unwrap()
      .then((profile) => {
        // Populate form with existing profile data
        setFormData({
          firstName: profile.firstName || user?.firstName || '',
          lastName: profile.lastName || user?.lastName || '',
          title: profile.title || '',
          bio: profile.bio || '',
          hourlyRate: profile.hourlyRate || '',
          experience: profile.experience || '',
          skills: normalizeSkillsForForm(profile.skills),
          education: Array.isArray(profile.education) ? profile.education : [],
          languages: Array.isArray(profile.languages) ? profile.languages : [],
          location: profile.location || '',
          phone: profile.phone || '',
          profileImage: null, // Will be populated only when user changes it
          portfolio: Array.isArray(profile.portfolio) ? profile.portfolio : [],
          availabilityStatus: profile?.availability?.status || 'available',
          availableHours: DEFAULT_AVAILABLE_HOURS,
          pausedUntil: '',
        });

        setImagePreview(profile.profilePicture || profile.profileImageUrl || null);
        setInitialLoading(false);
      })
      .catch((err) => {
        workerDebugError('Error loading profile:', err);
        setInitialLoading(false);
        setSnackbar({
          open: true,
          message: 'Failed to load profile. Please try again.',
          severity: 'error',
        });
      });
  }, [dispatch, user]);

  // Load availability (authoritative from API)
  useEffect(() => {
    const id = user?.id;
    if (!id) return;
    (async () => {
      try {
        const resp = await api.get(`/users/workers/${id}/availability`);
        const data = resp.data?.data || resp.data;
        if (data) {
          const mappedAvailability = mapAvailabilityApiToForm(data);
          setFormData((prev) => ({
            ...prev,
            availabilityStatus:
              mappedAvailability.availabilityStatus || prev.availabilityStatus,
            availableHours: mappedAvailability.availableHours || prev.availableHours,
            pausedUntil: mappedAvailability.pausedUntil,
          }));
        }
      } catch (e) {
        workerDebugError('Error loading availability:', e);
        setSnackbar({
          open: true,
          message: 'Could not load your availability settings. The form may show defaults.',
          severity: 'warning',
        });
      }
    })();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Please select an image file.', severity: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Image must be under 5 MB.', severity: 'error' });
        return;
      }
      setFormData((prev) => ({
        ...prev,
        profileImage: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Skills handling
  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
    setUndoSkillSnackbar({ open: true, skill: skillToRemove });
  };

  const handleUndoRemoveSkill = () => {
    if (undoSkillSnackbar.skill) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, undoSkillSnackbar.skill],
      }));
    }
    setUndoSkillSnackbar({ open: false, skill: null });
  };

  // Education handling
  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setNewEducation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddEducation = () => {
    if (newEducation.degree && newEducation.institution) {
      setFormData((prev) => ({
        ...prev,
        education: [...prev.education, { ...newEducation }],
      }));
      setNewEducation({ degree: '', institution: '', year: '' });
    }
  };

  const handleRemoveEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // Language handling
  const handleLanguageChange = (e) => {
    const { name, value } = e.target;
    setNewLanguage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddLanguage = () => {
    if (newLanguage.language) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, { ...newLanguage }],
      }));
      setNewLanguage({ language: '', proficiency: 'Beginner' });
    }
  };

  const handleRemoveLanguage = (index) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  // Portfolio handling
  const handleAddPortfolioItem = () => {
    setFormData((prev) => ({
      ...prev,
      portfolio: [
        ...prev.portfolio,
        { title: '', description: '', image: null, imagePreview: null },
      ],
    }));
  };

  const handleRemovePortfolioItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index),
    }));
  };

  const handlePortfolioItemChange = (index, field, value) => {
    const updatedPortfolio = [...formData.portfolio];
    updatedPortfolio[index] = {
      ...updatedPortfolio[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      portfolio: updatedPortfolio,
    }));
  };

  const handlePortfolioImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Please select an image file (JPG, PNG, WebP).', severity: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Portfolio image must be under 5 MB.', severity: 'error' });
        return;
      }
      const updatedPortfolio = [...formData.portfolio];
      updatedPortfolio[index] = {
        ...updatedPortfolio[index],
        image: file,
      };

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        updatedPortfolio[index].imagePreview = reader.result;
        setFormData((prev) => ({
          ...prev,
          portfolio: updatedPortfolio,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const profilePayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      title: formData.title,
      bio: formData.bio,
      hourlyRate: formData.hourlyRate,
      experience: formData.experience,
      skills: normalizeSkillsForForm(formData.skills),
      education: Array.isArray(formData.education) ? formData.education : [],
      languages: Array.isArray(formData.languages) ? formData.languages : [],
      location: formData.location,
      phone: formData.phone,
      portfolio: Array.isArray(formData.portfolio)
        ? formData.portfolio.map((item) => ({
          title: item?.title || '',
          description: item?.description || '',
          imageUrl:
            typeof item?.imageUrl === 'string' ? item.imageUrl : '',
        }))
        : [],
    };

    try {
      const id = user?.id;

      // Upload profile image if user selected a new one
      if (formData.profileImage instanceof File) {
        try {
          const uploadedImage = await fileUploadService.uploadFile(
            formData.profileImage,
            'profile-pictures',
            'user',
          );
          profilePayload.profilePicture = uploadedImage.url;
          profilePayload.profilePictureMetadata = {
            publicId: uploadedImage.publicId || null,
            resourceType: uploadedImage.resourceType || null,
            thumbnailUrl: uploadedImage.thumbnailUrl || null,
            width: uploadedImage.width || null,
            height: uploadedImage.height || null,
            duration: uploadedImage.duration || null,
            format: uploadedImage.format || null,
          };
        } catch (imgErr) {
          workerDebugError('Image upload failed:', imgErr);
          // Continue with profile save even if image upload fails
        }
      }

      await dispatch(
        updateWorkerProfile({ workerId: id, profileData: profilePayload }),
      ).unwrap();
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success',
      });

      // Navigate back to profile page after successful update
      setTimeout(() => {
        navigate('/worker/profile');
      }, 2000);
    } catch (err) {
      workerDebugError('Error updating profile:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update profile. Please try again.',
        severity: 'error',
      });
    }
  };

  // Availability handlers
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  const handleAvailabilityStatusChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, availabilityStatus: value }));
  };

  const handleDayToggle = (day, checked) => {
    setFormData((prev) => ({
      ...prev,
      availableHours: {
        ...prev.availableHours,
        [day]: { ...prev.availableHours[day], available: checked },
      },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availableHours: {
        ...prev.availableHours,
        [day]: { ...prev.availableHours[day], [field]: value },
      },
    }));
  };

  const handleSaveAvailability = async () => {
    try {
      const id = user?.id;
      await dispatch(
        updateWorkerAvailability({
          workerId: id,
          availabilityData: {
            availabilityStatus: formData.availabilityStatus,
            availableHours: formData.availableHours,
            pausedUntil: formData.pausedUntil || null,
          },
        }),
      ).unwrap();
      setSnackbar({
        open: true,
        message: 'Availability updated!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update availability. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleCancel = () => {
    navigate('/worker/profile');
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const toggleOptionalSection = (section) => (_, isExpanded) => {
    setExpandedOptionalSections((prev) => ({
      ...prev,
      [section]: isExpanded,
    }));
  };

  const checklistItems = [
    {
      label: 'Full name',
      done: Boolean(formData.firstName.trim() && formData.lastName.trim()),
    },
    {
      label: 'Professional title',
      done: Boolean(formData.title.trim()),
    },
    {
      label: 'Short bio',
      done: Boolean(formData.bio.trim().length >= 60),
    },
    {
      label: 'At least 3 skills',
      done: Array.isArray(formData.skills) && formData.skills.length >= 3,
    },
    {
      label: 'Location and phone',
      done: Boolean(formData.location.trim() && formData.phone.trim()),
    },
  ];

  const completedChecklistCount = checklistItems.filter((item) => item.done).length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Helmet><title>Edit Profile | Kelmah</title></Helmet>

      {/* Loading skeleton for initial profile fetch */}
      {initialLoading ? (
        <Box>
          <Skeleton variant="text" width="60%" height={48} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={24} sx={{ mb: 4 }} />
          <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={300} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={200} />
        </Box>
      ) : (
      <>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom fontWeight="bold">
          Edit Your Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete your profile details, then save to help hirers trust your experience.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Quick profile checklist ({completedChecklistCount}/{checklistItems.length})
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Fill the core fields first, then save. Optional sections can wait.
          </Typography>
          <Typography variant="body2">
            {checklistItems.map((item) => `${item.done ? '[done]' : '[todo]'} ${item.label}`).join(' | ')}
          </Typography>
        </Alert>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Undo skill removal snackbar */}
      <Snackbar
        open={undoSkillSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setUndoSkillSnackbar({ open: false, skill: null })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={`"${undoSkillSnackbar.skill}" removed`}
        action={
          <Button color="warning" size="small" onClick={handleUndoRemoveSkill}>
            UNDO
          </Button>
        }
      />

      {error?.profile && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {String(error.profile)}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Availability */}
        <Paper
          elevation={3}
          sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}
          ref={availabilityRef}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.primary.main }}
          >
            Availability
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id="availability-status-label">Status</InputLabel>
                <Select
                  labelId="availability-status-label"
                  label="Status"
                  value={formData.availabilityStatus}
                  onChange={handleAvailabilityStatusChange}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="busy">Busy</MenuItem>
                  <MenuItem value="unavailable">Unavailable</MenuItem>
                  <MenuItem value="vacation">On Vacation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Paused Until"
                type="date"
                value={formData.pausedUntil}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, pausedUntil: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {days.map((day) => {
              const d = formData.availableHours?.[day] || {
                start: '09:00',
                end: '17:00',
                available: false,
              };
              const label = day.charAt(0).toUpperCase() + day.slice(1);
              return (
                <Grid item xs={12} md={6} key={day}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1">{label}</Typography>
                      <Tooltip title="Toggle availability for this day">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!d.available}
                              onChange={(e) =>
                                handleDayToggle(day, e.target.checked)
                              }
                              inputProps={{ 'aria-label': 'Toggle availability' }}
                            />
                          }
                          label={d.available ? 'Available' : 'Off'}
                        />
                      </Tooltip>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Start"
                          type="time"
                          value={d.start}
                          onChange={(e) =>
                            handleTimeChange(day, 'start', e.target.value)
                          }
                          fullWidth
                          disabled={!d.available}
                          inputProps={{ step: 300 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="End"
                          type="time"
                          value={d.end}
                          onChange={(e) =>
                            handleTimeChange(day, 'end', e.target.value)
                          }
                          fullWidth
                          disabled={!d.available}
                          inputProps={{ step: 300 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Tip: Set unavailable days to Off and adjust time ranges for each
              workday.
            </Typography>
            <Button
              variant="contained"
              onClick={handleSaveAvailability}
              disabled={!!loading?.availability}
              aria-label="Save availability settings"
            >
              {loading?.availability ? 'Saving...' : 'Save Availability'}
            </Button>
          </Box>
        </Paper>
        {/* Profile Completeness */}
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.primary.main }}
          >
            Profile Completeness
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {completeness ?? 0}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Improve your chances by completing the items below.
            </Typography>
          </Box>
          {suggestions?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {Array.isArray(suggestions) &&
                suggestions
                  .map((suggestion, index) => ({
                    key: suggestion?.id || suggestion?.code || `suggestion-${index}`,
                    label: normalizeSuggestionText(suggestion),
                  }))
                  .filter((item) => item.label)
                  .map((item) => (
                    <Chip key={item.key} label={item.label} sx={{ mr: 1, mb: 1 }} />
                  ))}
            </Box>
          )}
        </Paper>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.primary.main }}
          >
            Basic Information
          </Typography>

          {/* Profile Image */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Avatar
              src={imagePreview}
              alt={`${formData.firstName} ${formData.lastName}`}
              sx={{ width: { xs: 100, md: 150 }, height: { xs: 100, md: 150 }, mb: 2 }}
            />
            <label htmlFor="profile-image">
              <Input
                accept="image/*"
                id="profile-image"
                type="file"
                inputProps={{ 'aria-label': 'Upload profile picture' }}
                onChange={handleImageChange}
              />
              <Button
                component="span"
                variant="outlined"
                startIcon={<CameraIcon />}
              >
                Change Profile Picture
              </Button>
            </label>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                placeholder="e.g. Kwame"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                placeholder="e.g. Asante"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Professional Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g. Senior Plumber, Experienced Electrician"
                helperText="Use the trade title hirers will search for."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State/Province, Country"
                helperText="Add your main service area so nearby hirers can find you quickly."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 024 123 4567"
                inputProps={{ inputMode: 'tel' }}
                helperText="Add a number hirers can call quickly after shortlisting you."
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Professional Info */}
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.primary.main }}
          >
            Professional Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Rate ($)"
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                placeholder="e.g. 50"
                inputProps={{ inputMode: 'decimal' }}
                helperText="Set a realistic starting rate. You can still negotiate later."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RateIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Years of Experience"
                name="experience"
                type="number"
                value={formData.experience}
                onChange={handleInputChange}
                inputProps={{ inputMode: 'numeric' }}
                helperText="Hirers trust profiles more when experience is clearly stated."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Tell potential clients about yourself, your experience, and why they should hire you."
                inputProps={{ maxLength: 600 }}
                helperText={`${formData.bio.length}/600 characters. Tell hirers what you do best.`}
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ alignSelf: 'flex-start', mt: 1.5 }}
                    >
                      <DescriptionIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Skills */}
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4, borderRadius: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.primary.main }}
          >
            Skills
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', mb: 2 }}>
              <TextField
                fullWidth
                label="Add a Skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="e.g. Plumbing, Electrical Installation, Carpentry"
                helperText="Add at least 3 core skills. Press Enter or click Add skill."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SkillsIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleAddSkill}
                sx={{ ml: 1 }}
                startIcon={<AddIcon />}
              >
                Add skill
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Array.isArray(formData.skills) &&
                formData.skills.map((skill, index) => {
                  const skillName = normalizeSkillName(skill);
                  if (!skillName) {
                    return null;
                  }

                  return (
                  <Chip
                    key={`${skillName}-${index}`}
                    label={skillName}
                    onDelete={() => handleRemoveSkill(skillName)}
                    color="primary"
                    variant="outlined"
                  />
                  );
                })}
            </Box>
          </Box>
        </Paper>

        {/* Education */}
        <Accordion
          disableGutters
          elevation={3}
          expanded={expandedOptionalSections.education}
          onChange={toggleOptionalSection('education')}
          sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="optional-education-content"
            id="optional-education-header"
            sx={{ px: { xs: 2, md: 3 } }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                Education & Certifications (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add credentials that boost trust after core profile fields are complete.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Degree/Certification"
                name="degree"
                value={newEducation.degree}
                onChange={handleEducationChange}
                placeholder="e.g. Certified Plumber, Electrical Engineer"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EducationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Institution"
                name="institution"
                value={newEducation.institution}
                onChange={handleEducationChange}
                placeholder="e.g. Trade School, University"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Year"
                name="year"
                value={newEducation.year}
                onChange={handleEducationChange}
                placeholder="e.g. 2018"
                inputProps={{ inputMode: 'numeric' }}
              />
            </Grid>
            <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'stretch' }}>
              <Button
                variant="contained"
                onClick={handleAddEducation}
                fullWidth
                sx={{ height: '100%', minHeight: 48, minWidth: 48 }}
                aria-label="Add education entry"
              >
                <AddIcon />
              </Button>
            </Grid>
          </Grid>

          {formData.education.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Added Education & Certifications
              </Typography>

              {Array.isArray(formData.education) &&
                formData.education.map((edu, index) => (
                  <Card key={edu.degree + '-' + edu.institution + '-' + index} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1">
                            {edu.degree}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {edu.institution} {edu.year && `(${edu.year})`}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleRemoveEducation(index)}
                          color="error"
                          aria-label="Remove education entry"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}
          </AccordionDetails>
        </Accordion>

        {/* Languages */}
        <Accordion
          disableGutters
          elevation={3}
          expanded={expandedOptionalSections.languages}
          onChange={toggleOptionalSection('languages')}
          sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="optional-languages-content"
            id="optional-languages-header"
            sx={{ px: { xs: 2, md: 3 } }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                Languages (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Include languages you can work in to widen your job opportunities.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Language"
                name="language"
                value={newLanguage.language}
                onChange={handleLanguageChange}
                placeholder="e.g. English, Spanish, French"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LanguageIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth>
                <InputLabel id="language-proficiency-label">
                  Proficiency
                </InputLabel>
                <Select
                  labelId="language-proficiency-label"
                  name="proficiency"
                  value={newLanguage.proficiency}
                  onChange={handleLanguageChange}
                  label="Proficiency"
                >
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                  <MenuItem value="Native">Native/Fluent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'stretch' }}>
              <Button
                variant="contained"
                onClick={handleAddLanguage}
                fullWidth
                sx={{ height: '100%', minHeight: 48, minWidth: 48 }}
                aria-label="Add language entry"
              >
                <AddIcon />
              </Button>
            </Grid>
          </Grid>

          {formData.languages.length > 0 && (
            <Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Added Languages
              </Typography>

              {Array.isArray(formData.languages) &&
                formData.languages.map((lang, index) => (
                  <Card key={lang.language + '-' + lang.proficiency + '-' + index} variant="outlined" sx={{ mb: 1 }}>
                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1">
                            {lang.language}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lang.proficiency}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleRemoveLanguage(index)}
                          color="error"
                          aria-label="Remove language entry"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}
          </AccordionDetails>
        </Accordion>

        {/* Portfolio */}
        <Accordion
          disableGutters
          elevation={3}
          expanded={expandedOptionalSections.portfolio}
          onChange={toggleOptionalSection('portfolio')}
          sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="optional-portfolio-content"
            id="optional-portfolio-header"
            sx={{ px: { xs: 2, md: 3 } }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                Portfolio (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add photos or samples of past work to increase hirer confidence.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>

          <Button
            variant="outlined"
            onClick={handleAddPortfolioItem}
            startIcon={<AddIcon />}
            sx={{ mb: 3 }}
          >
            Add portfolio item
          </Button>

          <Grid container spacing={3}>
            {Array.isArray(formData.portfolio) &&
              formData.portfolio.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={item.id || item._id || item.url || index}>
                  <Card variant="outlined" sx={{ position: 'relative' }}>
                    <CardContent>
                      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Portfolio Item #{index + 1}
                        </Typography>
                        <IconButton
                          onClick={() => handleRemovePortfolioItem(index)}
                          color="error"
                          aria-label="Remove portfolio item"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <TextField
                        fullWidth
                        label="Title"
                        value={item.title || ''}
                        onChange={(e) =>
                          handlePortfolioItemChange(
                            index,
                            'title',
                            e.target.value,
                          )
                        }
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        label="Description"
                        value={item.description || ''}
                        onChange={(e) =>
                          handlePortfolioItemChange(
                            index,
                            'description',
                            e.target.value,
                          )
                        }
                        multiline
                        rows={2}
                        sx={{ mb: 2 }}
                      />

                      <Box sx={{ textAlign: 'center' }}>
                        {item.imagePreview || item.image ? (
                          <Box
                            component="img"
                            src={item.imagePreview || item.image}
                            alt={item.title}
                            sx={{
                              width: '100%',
                              height: 150,
                              objectFit: 'cover',
                              mb: 2,
                              borderRadius: 1,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: 150,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 2,
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              No image added yet
                            </Typography>
                          </Box>
                        )}

                        <label htmlFor={`portfolio-image-${index}`}>
                          <Input
                            accept="image/*"
                            id={`portfolio-image-${index}`}
                            type="file"
                            inputProps={{ 'aria-label': `Upload image for portfolio item ${index + 1}` }}
                            onChange={(e) =>
                              handlePortfolioImageChange(e, index)
                            }
                          />
                          <Button
                            component="span"
                            variant="outlined"
                            size="small"
                            startIcon={<CameraIcon />}>
                            {item.imagePreview || item.image
                              ? 'Change image'
                              : 'Add image'}
                          </Button>
                        </label>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Action buttons */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'space-between', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            size="large"
            sx={{ minHeight: 44 }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            size="large"
            disabled={!!loading?.profile}
            aria-label="Save worker profile changes"
            sx={{ minHeight: 44 }}
          >
            {loading?.profile ? 'Saving...' : 'Save changes'}
          </Button>
        </Box>
      </form>
      </>
      )}
    </Container>
  );
};

export default WorkerProfileEditPage;

