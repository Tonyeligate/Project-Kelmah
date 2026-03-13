// ARCHIVED PAGE: intentionally not route-mounted. Active profile flows are role-specific routes under /worker and /hirer.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  let content;

  if (loading) {
    content = (
      <ErrorBoundary>
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: { xs: 'center', md: 'flex-start' } }}>
                  <Skeleton variant="circular" width={isMobile ? 64 : 150} height={isMobile ? 64 : 150} />
                  <Box sx={{ flex: 1, width: '100%', textAlign: 'left' }}>
                    <Skeleton width="40%" height={32} sx={{ mb: 1 }} />
                    <Skeleton width="30%" height={24} sx={{ mb: 1 }} />
                    <Skeleton width="50%" height={24} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </ErrorBoundary>
    );
  } else if (!profile) {
    content = (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  } else {
    content = (
      <ErrorBoundary>
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
          <Grid container spacing={3}>
            {/* Profile Header */}
            <Grid item xs={12}>
              <Paper sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'flex-start', md: 'flex-start' } }}>
                  <ProfilePicture size={isMobile ? 64 : 150} />
                  <Box sx={{ flex: 1, width: '100%', textAlign: { xs: 'left', md: 'left' } }}>
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
                              placeholder="e.g. Kwame"
                              error={!formData.firstName}
                              helperText={!formData.firstName ? 'First name is required' : ''}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Last Name"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              placeholder="e.g. Asante"
                              error={!formData.lastName}
                              helperText={!formData.lastName ? 'Last name is required' : ''}
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
                          placeholder="e.g. kwame@email.com"
                          error={!formData.email}
                          helperText={!formData.email ? 'Email is required' : ''}
                        />
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          inputProps={{ inputMode: 'tel' }}
                          error={!formData.phone}
                          helperText={!formData.phone ? 'Phone is required' : ''}
                        />
                        <TextField
                          fullWidth
                          label="Location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="e.g. Accra, Greater Accra"
                          error={!formData.location}
                          helperText={!formData.location ? 'Location is required' : ''}
                        />
                        <TextField
                          fullWidth
                          label="Bio"
                          name="bio"
                          multiline
                          rows={4}
                          value={formData.bio}
                          onChange={handleChange}
                          placeholder="Tell hirers about yourself and your skills..."
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
                          <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ minHeight: 44 }}>
                            {isSaving ? 'Saving…' : 'Save'}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      // ...existing code...
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            {/* ...existing code... */}
          </Grid>
        </Container>
      </ErrorBoundary>
    );
  }
      setEditing(false);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating profile:', error);
      enqueueSnackbar('Failed to update profile. Please try again.', { variant: 'error' });
    } finally {
      setIsSaving(false);
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
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: { xs: 'center', md: 'flex-start' } }}>
                <Skeleton variant="circular" width={isMobile ? 64 : 150} height={isMobile ? 64 : 150} />
                <Box sx={{ flex: 1, width: '100%', textAlign: 'left' }}>
                  <Skeleton width="40%" height={32} sx={{ mb: 1 }} />
                  <Skeleton width="30%" height={24} sx={{ mb: 1 }} />
                  <Skeleton width="50%" height={24} />
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
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'flex-start', md: 'flex-start' } }}>
                <ProfilePicture size={isMobile ? 64 : 150} />
                <Box sx={{ flex: 1, width: '100%', textAlign: { xs: 'left', md: 'left' } }}>
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
                            placeholder="e.g. Kwame"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="e.g. Asante"
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
                        placeholder="e.g. kwame@email.com"
                      />
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        inputProps={{ inputMode: 'tel' }}
                      />
                      <TextField
                        fullWidth
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g. Accra, Greater Accra"
                      />
                      <TextField
                        fullWidth
                        label="Bio"
                        name="bio"
                        multiline
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell hirers about yourself and your skills..."
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
                        <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ minHeight: 44 }}>
                          {isSaving ? 'Saving…' : 'Save'}
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
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                        {profile?.location ? <Chip label={profile.location} size="small" /> : null}
                        {statistics ? <Chip label={`${statistics.jobsApplied || 0} jobs applied`} size="small" variant="outlined" /> : null}
                        {statistics ? <Chip label={`${statistics.offers || 0} offers`} size="small" variant="outlined" /> : null}
                      </Box>
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
                        variant="contained"
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Keep your skills, education, work history, and preferences up to date so hirers can trust your profile quickly.
              </Typography>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant={isMobile ? 'scrollable' : 'scrollable'}
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 700,
                    minHeight: 44,
                  },
                }}
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
                          key={`${skill}-${index}`}
                          label={skill}
                          onDelete={async () => {
                            try {
                              const currentSkills = Array.isArray(profile.skills)
                                ? profile.skills
                                : [];
                              const newSkills = currentSkills.filter(
                                (_, i) => i !== index,
                              );
                              await updateSkills(newSkills);
                              enqueueSnackbar('Skills updated', { variant: 'success' });
                            } catch (err) {
                              enqueueSnackbar('Failed to update skills', { variant: 'error' });
                            }
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
                      aria-labelledby="add-skill-dialog-title"
                    >
                      <DialogTitle id="add-skill-dialog-title">Add Skill</DialogTitle>
                      <DialogContent>
                        <TextField
                          autoFocus fullWidth label="Skill name" margin="dense"
                          value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="e.g. Carpentry"
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => { setAddSkillOpen(false); setNewSkill(''); }}>Cancel</Button>
                        <Button variant="contained" disabled={addingItem || !newSkill.trim()} onClick={async () => {
                          setAddingItem(true);
                          try {
                            const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
                            await updateSkills([...currentSkills, newSkill.trim()]);
                            enqueueSnackbar('Skills updated', { variant: 'success' });
                            setNewSkill(''); setAddSkillOpen(false);
                          } catch (err) {
                            enqueueSnackbar('Failed to update skills', { variant: 'error' });
                          } finally {
                            setAddingItem(false);
                          }
                        }}>Add</Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}

                {selectedTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Education
                    </Typography>
                    <List>
                      {profile.education?.map((edu, index) => (
                        <React.Fragment key={edu.degree + '-' + edu.institution + '-' + index}>
                          <ListItem>
                            <ListItemText
                              primary={edu.degree}
                              secondary={`${edu.institution} • ${edu.year}`}
                            />
                            <IconButton
                              aria-label="Delete education entry"
                              sx={{ minWidth: 44, minHeight: 44 }}
                              onClick={async () => {
                                try {
                                  const currentEducation = Array.isArray(
                                    profile.education,
                                  )
                                    ? profile.education
                                    : [];
                                  const newEducation = currentEducation.filter(
                                    (_, i) => i !== index,
                                  );
                                  await updateEducation(newEducation);
                                  enqueueSnackbar('Education updated', { variant: 'success' });
                                } catch (err) {
                                  enqueueSnackbar('Failed to update education', { variant: 'error' });
                                }
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
                      aria-labelledby="add-education-dialog-title"
                    >
                      <DialogTitle id="add-education-dialog-title">Add Education</DialogTitle>
                      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
                        <TextField autoFocus fullWidth label="Degree" value={newEdu.degree}
                          onChange={(e) => setNewEdu(p => ({ ...p, degree: e.target.value }))} placeholder="e.g. Senior High School" />
                        <TextField fullWidth label="Institution" value={newEdu.institution}
                          onChange={(e) => setNewEdu(p => ({ ...p, institution: e.target.value }))} placeholder="e.g. Accra Technical Institute" />
                        <TextField fullWidth label="Year" value={newEdu.year}
                          onChange={(e) => setNewEdu(p => ({ ...p, year: e.target.value }))
                          }
                          inputProps={{ inputMode: 'numeric' }} placeholder="e.g. 2020" />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => { setAddEduOpen(false); setNewEdu({ degree: '', institution: '', year: '' }); }}>Cancel</Button>
                        <Button variant="contained" disabled={addingItem || !newEdu.degree.trim() || !newEdu.institution.trim() || !newEdu.year.trim()}
                          onClick={async () => {
                            setAddingItem(true);
                            try {
                              const currentEducation = Array.isArray(profile.education) ? profile.education : [];
                              await updateEducation([...currentEducation, { ...newEdu }]);
                              enqueueSnackbar('Education updated', { variant: 'success' });
                              setNewEdu({ degree: '', institution: '', year: '' }); setAddEduOpen(false);
                            } catch (err) {
                              enqueueSnackbar('Failed to update education', { variant: 'error' });
                            } finally {
                              setAddingItem(false);
                            }
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
                        <React.Fragment key={exp.title + '-' + exp.company + '-' + index}>
                          <ListItem>
                            <ListItemText
                              primary={exp.title}
                              secondary={`${exp.company} • ${exp.duration}`}
                            />
                            <IconButton
                              aria-label="Delete experience entry"
                              sx={{ minWidth: 44, minHeight: 44 }}
                              onClick={async () => {
                                try {
                                  const currentExperience = Array.isArray(
                                    profile.experience,
                                  )
                                    ? profile.experience
                                    : [];
                                  const newExperience = currentExperience.filter(
                                    (_, i) => i !== index,
                                  );
                                  await updateExperience(newExperience);
                                  enqueueSnackbar('Experience updated', { variant: 'success' });
                                } catch (err) {
                                  enqueueSnackbar('Failed to update experience', { variant: 'error' });
                                }
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
                      aria-labelledby="add-experience-dialog-title"
                    >
                      <DialogTitle id="add-experience-dialog-title">Add Experience</DialogTitle>
                      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
                        <TextField autoFocus fullWidth label="Job Title" value={newExp.title}
                          onChange={(e) => setNewExp(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Carpenter" />
                        <TextField fullWidth label="Company" value={newExp.company}
                          onChange={(e) => setNewExp(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Asante Construction" />
                        <TextField fullWidth label="Duration (e.g. 2 years)" value={newExp.duration}
                          onChange={(e) => setNewExp(p => ({ ...p, duration: e.target.value }))} />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={() => { setAddExpOpen(false); setNewExp({ title: '', company: '', duration: '' }); }}>Cancel</Button>
                        <Button variant="contained" disabled={addingItem || !newExp.title.trim() || !newExp.company.trim() || !newExp.duration.trim()}
                          onClick={async () => {
                            setAddingItem(true);
                            try {
                              const currentExperience = Array.isArray(profile.experience) ? profile.experience : [];
                              await updateExperience([...currentExperience, { ...newExp }]);
                              enqueueSnackbar('Experience updated', { variant: 'success' });
                              setNewExp({ title: '', company: '', duration: '' }); setAddExpOpen(false);
                            } catch (err) {
                              enqueueSnackbar('Failed to update experience', { variant: 'error' });
                            } finally {
                              setAddingItem(false);
                            }
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
                          value={prefJobType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPrefJobType(val);
                            debouncedUpdatePreferences({
                              ...profile.preferences,
                              jobType: val,
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
                          value={prefLocation}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPrefLocation(val);
                            debouncedUpdatePreferences({
                              ...profile.preferences,
                              location: val,
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
                        <React.Fragment key={item.id || item._id || index}>
                          <ListItem>
                            <ListItemText
                              primary={item.title}
                              secondary={(() => {
                                try { return new Date(item.date).toLocaleDateString(); }
                                catch { return ''; }
                              })()}
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

  return (
    <>
      <Helmet><title>My Profile | Kelmah</title></Helmet>
      <ErrorBoundary>{content}</ErrorBoundary>
    </>
  );
};

export default ProfilePage;
