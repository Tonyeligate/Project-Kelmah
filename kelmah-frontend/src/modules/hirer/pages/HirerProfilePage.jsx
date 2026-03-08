import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Apartment as ApartmentIcon,
  Edit as EditIcon,
  LocationOn as LocationOnIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
  WorkOutline as WorkOutlineIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import ProfilePicture from '../../profile/components/ProfilePicture';
import { useProfile } from '../../profile/hooks/useProfile';
import {
  selectProfile,
  selectProfileError,
  selectProfileLoading,
} from '../../../store/slices/profileSlice.js';

const getDisplayName = (profile, user) => {
  const firstName = profile?.firstName || user?.firstName || '';
  const lastName = profile?.lastName || user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || user?.name || profile?.companyName || 'Hiring Account';
};

const getCompanyName = (profile, user) =>
  profile?.companyName ||
  profile?.company ||
  user?.companyName ||
  user?.company ||
  'Kelmah Client';

const toActivityLines = (activity = []) => {
  if (!Array.isArray(activity) || activity.length === 0) {
    return [];
  }

  return activity.slice(0, 5).map((item, index) => ({
    id: item?._id || item?.id || `activity-${index}`,
    primary:
      item?.title ||
      item?.label ||
      item?.action ||
      item?.description ||
      item?.message ||
      'Account activity recorded',
    secondary:
      item?.timestamp ||
      item?.createdAt ||
      item?.date ||
      item?.type ||
      'Recently updated',
  }));
};

const HirerProfilePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state) => state.auth);
  const profile = useSelector(selectProfile);
  const loading = useSelector(selectProfileLoading);
  const error = useSelector(selectProfileError);
  const hasLoadedRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    location: '',
    bio: '',
  });

  const {
    loadProfile,
    updateProfile,
    loadStatistics,
    loadActivity,
    statistics,
    activity,
  } = useProfile({ autoInitialize: false });

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;
    loadProfile();
    loadStatistics();
    loadActivity();
  }, [loadActivity, loadProfile, loadStatistics]);

  const handleStartEdit = () => {
    setFormData({
      firstName: profile?.firstName || user?.firstName || '',
      lastName: profile?.lastName || user?.lastName || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || profile?.phoneNumber || user?.phone || '',
      companyName: getCompanyName(profile, user),
      location: profile?.location || user?.location || '',
      bio: profile?.bio || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        ...formData,
        company: formData.companyName,
      });
      enqueueSnackbar('Hirer profile updated successfully', {
        variant: 'success',
      });
      setEditing(false);
    } catch (saveError) {
      enqueueSnackbar(
        saveError?.message || 'Unable to update your hirer profile right now.',
        { variant: 'error' },
      );
    } finally {
      setSaving(false);
    }
  };

  const profileSummary = useMemo(
    () => ({
      jobsPosted:
        statistics?.jobsPosted ||
        statistics?.totalJobsPosted ||
        statistics?.activeJobs ||
        statistics?.jobs ||
        0,
      hires:
        statistics?.successfulHires ||
        statistics?.offers ||
        statistics?.contracts ||
        0,
      reviews:
        statistics?.reviewsGiven || statistics?.reviews || 0,
    }),
    [statistics],
  );

  const activityItems = useMemo(() => toActivityLines(activity), [activity]);

  if (loading && !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Skeleton variant="rounded" height={220} sx={{ mb: 3, borderRadius: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Helmet>
        <title>Hirer Profile | Kelmah</title>
      </Helmet>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <ProfilePicture size={96} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {getDisplayName(profile, user)}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  <Chip icon={<ApartmentIcon />} label={getCompanyName(profile, user)} />
                  {(profile?.location || user?.location) && (
                    <Chip
                      icon={<LocationOnIcon />}
                      label={profile?.location || user?.location}
                      variant="outlined"
                    />
                  )}
                  <Chip icon={<PersonAddAlt1Icon />} label="Hirer account" variant="outlined" />
                </Stack>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {profile?.email || user?.email || 'No email on file'}
                </Typography>
                <Typography color="text.secondary">
                  {profile?.bio || 'Tell workers about your business, how you hire, and the kind of projects you post on Kelmah.'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleStartEdit}
                sx={{ minHeight: 44 }}
              >
                Edit hirer profile
              </Button>
              <Button href="/hirer/find-talent" variant="outlined" sx={{ minHeight: 44 }}>
                Find talent
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Business profile
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Keep your hiring identity current so workers know who they are meeting and what type of jobs you post.
              </Typography>

              {editing ? (
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First name"
                        value={formData.firstName}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, firstName: event.target.value }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last name"
                        value={formData.lastName}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, lastName: event.target.value }))
                        }
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    fullWidth
                    label="Company or business name"
                    value={formData.companyName}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, companyName: event.target.value }))
                    }
                  />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, email: event.target.value }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={formData.phone}
                        onChange={(event) =>
                          setFormData((prev) => ({ ...prev, phone: event.target.value }))
                        }
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, location: event.target.value }))
                    }
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="About your hiring needs"
                    helperText="Share the type of jobs you post, your preferred work style, or any details that help workers trust your requests."
                    value={formData.bio}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, bio: event.target.value }))
                    }
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
                    <Button onClick={() => setEditing(false)} sx={{ minHeight: 44 }}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                      sx={{ minHeight: 44 }}
                    >
                      {saving ? 'Saving…' : 'Save profile'}
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Primary contact
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {profile?.email || user?.email || 'Not provided'}
                    </Typography>
                    <Typography color="text.secondary">
                      {profile?.phone || profile?.phoneNumber || user?.phone || 'No phone number added yet'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Hiring summary
                    </Typography>
                    <Typography>
                      {profile?.bio || 'Add a short introduction so workers understand your business, preferred communication style, and job expectations.'}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Hiring snapshot
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Jobs posted
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {profileSummary.jobsPosted}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Hires / offers
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {profileSummary.hires}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Reviews / feedback
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {profileSummary.reviews}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Recent activity
                </Typography>
                {activityItems.length > 0 ? (
                  <List disablePadding>
                    {activityItems.map((item, index) => (
                      <ListItem
                        key={item.id}
                        disableGutters
                        sx={{ alignItems: 'flex-start', pb: index === activityItems.length - 1 ? 0 : 1.5 }}
                      >
                        <ListItemText
                          primary={item.primary}
                          secondary={item.secondary}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    Activity will appear here after you post jobs, shortlist workers, or update your hiring settings.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Recommended next step
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Keep your account aligned with your current jobs so workers see a trustworthy business profile before they respond.
                </Typography>
                <Button
                  href="/hirer/quick-hire"
                  variant="outlined"
                  startIcon={<WorkOutlineIcon />}
                  sx={{ minHeight: 44 }}
                >
                  Create quick-hire request
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HirerProfilePage;
