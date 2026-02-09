import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Skeleton,
  Alert,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Work as WorkIcon,
  MonetizationOn as EarningsIcon,
} from '@mui/icons-material';
import { useProfile } from '../hooks/useProfile';
import ProfilePicture from '../components/ProfilePicture';
import { useSelector } from 'react-redux';
import {
  selectProfile,
  selectProfileLoading,
  selectProfileError,
} from '../../../store/slices/profileSlice.js';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const ProfilePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    loadProfile,
    updateProfile,
    updateSkills,
    updateEducation,
    updateExperience,
    updatePreferences,
    statistics,
    activity,
  } = useProfile();

  const profile = useSelector(selectProfile);
  const loading = useSelector(selectProfileLoading);
  const error = useSelector(selectProfileError);
  const { user } = useSelector((state) => state.auth);

  const [selectedTab, setSelectedTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
  });

  // Inline add-item dialog state (replaces window.prompt)
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [addEduOpen, setAddEduOpen] = useState(false);
  const [newEdu, setNewEdu] = useState({ degree: '', institution: '', year: '' });
  const [addExpOpen, setAddExpOpen] = useState(false);
  const [newExp, setNewExp] = useState({ title: '', company: '', duration: '' });

  // Load profile on mount if not already loaded
  useEffect(() => {
    if (!profile && !loading) {
      loadProfile();
    }
  }, [profile, loading, loadProfile]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleEdit = () => {
    // ✅ FIXED: Add null-safety check to prevent crashes when profile is null
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRetryLoad = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  let content;

  if (loading) {
    content = (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'center', md: 'flex-start' } }}>
                <Skeleton variant="circular" width={isMobile ? 100 : 150} height={isMobile ? 100 : 150} />
                <Box sx={{ flex: 1, width: '100%', textAlign: { xs: 'center', md: 'left' } }}>
                  <Skeleton width="40%" height={32} sx={{ mb: 1, mx: { xs: 'auto', md: 0 } }} />
                  <Skeleton width="30%" height={24} sx={{ mb: 1, mx: { xs: 'auto', md: 0 } }} />
                  <Skeleton width="50%" height={24} sx={{ mx: { xs: 'auto', md: 0 } }} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  } else if (!profile) {
    content = (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Profile Unavailable
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            We couldn't load your profile information. Please check your
            connection and try again.
          </Typography>
          <Button variant="contained" onClick={handleRetryLoad}>
            Retry Loading Profile
          </Button>
        </Paper>
      </Container>
    );
  } else {
    content = (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'center', md: 'flex-start' } }}>
                <ProfilePicture size={isMobile ? 100 : 150} />
                <Box sx={{ flex: 1, width: '100%', textAlign: { xs: 'center', md: 'left' } }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {editing ? (
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                          />
                        </Grid>
                      </Grid>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        inputProps={{ style: { fontSize: 16 } }}
                      />
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        inputProps={{ style: { fontSize: 16 }, inputMode: 'tel' }}
                      />
                      <TextField
                        fullWidth
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                      />
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        multiline
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 2,
                          justifyContent: { sm: 'flex-end' },
                        }}
                      >
                        <Button onClick={handleCancel} sx={{ minHeight: 44 }}>Cancel</Button>
                        <Button variant="contained" onClick={handleSave} sx={{ minHeight: 44 }}>
                          Save
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h4" gutterBottom>
                        {/* ✅ FIXED: Add null-safety check to prevent crashes */}
                        {profile?.firstName || 'First'}{' '}
                        {profile?.lastName || 'Name'}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        gutterBottom
                      >
                        {profile?.email || 'email@example.com'}
                      </Typography>
                      {profile?.phone && (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          gutterBottom
                        >
                          {profile.phone}
                        </Typography>
                      )}
                      {profile?.location && (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          gutterBottom
                        >
                          {profile.location}
                        </Typography>
                      )}
                      {profile?.bio && (
                        <Typography variant="body1" sx={{ mt: 2 }}>
                          {profile.bio}
                        </Typography>
                      )}
                      <Button
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                        sx={{ mt: 2, minHeight: 44 }}
                      >
                        Edit Profile
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Profile Content */}
          <Grid item xs={12}>
            <Paper sx={{ p: { xs: 2, md: 3 } }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label="Skills" />
                <Tab label="Education" />
                <Tab label="Experience" />
                <Tab label="Preferences" />
                <Tab label="Activity" />
              </Tabs>

              <Box sx={{ mt: 3 }}>
                {selectedTab === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Skills
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.skills?.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          onDelete={() => {
                            const currentSkills = Array.isArray(profile.skills)
                              ? profile.skills
                              : [];
                            const newSkills = currentSkills.filter(
                              (_, i) => i !== index,
                            );
                            updateSkills(newSkills);
                          }}
                        />
                      ))}
                      <Chip
                        icon={<AddIcon />}
                        label="Add Skill"
                        onClick={() => setAddSkillOpen(true)}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    {/* Add Skill Dialog */}
                    <Dialog open={addSkillOpen} onClose={() => setAddSkillOpen(false)} fullWidth maxWidth="xs"
                      PaperProps={{ sx: { mx: 2, borderRadius: 2 } }}
                    >
                      <DialogTitle>Add Skill</DialogTitle>
                      <DialogContent>
                        <TextField
                          autoFocus fullWidth label="Skill name" margin="dense"
                          value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                          inputProps={{ style: { fontSize: 16 } }}
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => { setAddSkillOpen(false); setNewSkill(''); }}>Cancel</Button>
                        <Button variant="contained" disabled={!newSkill.trim()} onClick={() => {
                          const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
                          updateSkills([...currentSkills, newSkill.trim()]);
                          setNewSkill(''); setAddSkillOpen(false);
                        }}>Add</Button>
                      </DialogActions>
                    </Dialog>
                    </Box>
                  </Box>
                )}

                {selectedTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Education
                    </Typography>
                    <List>
                      {profile.education?.map((edu, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={edu.degree}
                              secondary={`${edu.institution} • ${edu.year}`}
                            />
                            <IconButton
                              aria-label="Delete education entry"
                              sx={{ minWidth: 44, minHeight: 44 }}
                              onClick={() => {
                                const currentEducation = Array.isArray(
                                  profile.education,
                                )
                                  ? profile.education
                                  : [];
                                const newEducation = currentEducation.filter(
                                  (_, i) => i !== index,
                                );
                                updateEducation(newEducation);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItem>
                          {index < profile.education.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setAddEduOpen(true)}
                    >
                      Add Education
                    </Button>
                    {/* Add Education Dialog */}
                    <Dialog open={addEduOpen} onClose={() => setAddEduOpen(false)} fullWidth maxWidth="xs"
                      PaperProps={{ sx: { mx: 2, borderRadius: 2 } }}
                    >
                      <DialogTitle>Add Education</DialogTitle>
                      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
                        <TextField autoFocus fullWidth label="Degree" value={newEdu.degree}
                          onChange={(e) => setNewEdu(p => ({ ...p, degree: e.target.value }))}
                          inputProps={{ style: { fontSize: 16 } }} />
                        <TextField fullWidth label="Institution" value={newEdu.institution}
                          onChange={(e) => setNewEdu(p => ({ ...p, institution: e.target.value }))}
                          inputProps={{ style: { fontSize: 16 } }} />
                        <TextField fullWidth label="Year" value={newEdu.year}
                          onChange={(e) => setNewEdu(p => ({ ...p, year: e.target.value }))}
                          inputProps={{ style: { fontSize: 16 }, inputMode: 'numeric' }} />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => { setAddEduOpen(false); setNewEdu({ degree: '', institution: '', year: '' }); }}>Cancel</Button>
                        <Button variant="contained" disabled={!newEdu.degree.trim() || !newEdu.institution.trim() || !newEdu.year.trim()}
                          onClick={() => {
                            const currentEducation = Array.isArray(profile.education) ? profile.education : [];
                            updateEducation([...currentEducation, { ...newEdu }]);
                            setNewEdu({ degree: '', institution: '', year: '' }); setAddEduOpen(false);
                          }}>Add</Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}

                {selectedTab === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Experience
                    </Typography>
                    <List>
                      {profile.experience?.map((exp, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={exp.title}
                              secondary={`${exp.company} • ${exp.duration}`}
                            />
                            <IconButton
                              aria-label="Delete experience entry"
                              sx={{ minWidth: 44, minHeight: 44 }}
                              onClick={() => {
                                const currentExperience = Array.isArray(
                                  profile.experience,
                                )
                                  ? profile.experience
                                  : [];
                                const newExperience = currentExperience.filter(
                                  (_, i) => i !== index,
                                );
                                updateExperience(newExperience);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItem>
                          {index < profile.experience.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setAddExpOpen(true)}
                    >
                      Add Experience
                    </Button>
                    {/* Add Experience Dialog */}
                    <Dialog open={addExpOpen} onClose={() => setAddExpOpen(false)} fullWidth maxWidth="xs"
                      PaperProps={{ sx: { mx: 2, borderRadius: 2 } }}
                    >
                      <DialogTitle>Add Experience</DialogTitle>
                      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
                        <TextField autoFocus fullWidth label="Job Title" value={newExp.title}
                          onChange={(e) => setNewExp(p => ({ ...p, title: e.target.value }))}
                          inputProps={{ style: { fontSize: 16 } }} />
                        <TextField fullWidth label="Company" value={newExp.company}
                          onChange={(e) => setNewExp(p => ({ ...p, company: e.target.value }))}
                          inputProps={{ style: { fontSize: 16 } }} />
                        <TextField fullWidth label="Duration (e.g. 2 years)" value={newExp.duration}
                          onChange={(e) => setNewExp(p => ({ ...p, duration: e.target.value }))}
                          inputProps={{ style: { fontSize: 16 } }} />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => { setAddExpOpen(false); setNewExp({ title: '', company: '', duration: '' }); }}>Cancel</Button>
                        <Button variant="contained" disabled={!newExp.title.trim() || !newExp.company.trim() || !newExp.duration.trim()}
                          onClick={() => {
                            const currentExperience = Array.isArray(profile.experience) ? profile.experience : [];
                            updateExperience([...currentExperience, { ...newExp }]);
                            setNewExp({ title: '', company: '', duration: '' }); setAddExpOpen(false);
                          }}>Add</Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}

                {selectedTab === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Preferences
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Job Preferences
                        </Typography>
                        <TextField
                          fullWidth
                          label="Preferred Job Type"
                          value={profile.preferences?.jobType || ''}
                          onChange={(e) => {
                            updatePreferences({
                              ...profile.preferences,
                              jobType: e.target.value,
                            });
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" gutterBottom>
                          Location Preferences
                        </Typography>
                        <TextField
                          fullWidth
                          label="Preferred Location"
                          value={profile.preferences?.location || ''}
                          onChange={(e) => {
                            updatePreferences({
                              ...profile.preferences,
                              location: e.target.value,
                            });
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {selectedTab === 4 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Recent Activity
                    </Typography>
                    <List>
                      {activity.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={item.title}
                              secondary={new Date(
                                item.date,
                              ).toLocaleDateString()}
                            />
                          </ListItem>
                          {index < activity.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Statistics */}
          {statistics && (
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={4} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        {statistics.jobsApplied}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Jobs Applied
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        {statistics.interviews}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Interviews
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        {statistics.offers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Job Offers
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    );
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
};

export default ProfilePage;
