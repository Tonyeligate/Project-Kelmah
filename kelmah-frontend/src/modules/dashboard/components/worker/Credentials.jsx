import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import DashboardCard from '../common/DashboardCard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import GppBadIcon from '@mui/icons-material/GppBad';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// Temporarily comment out API import until workers service is implemented  
// import workersApi from '../../../../api/services/workersApi';

const Credentials = () => {
  const [skills, setSkills] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifiedSkillIds, setVerifiedSkillIds] = useState(
    skills.filter((s) => s.verified).map((s) => s.name),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    'Upload Documentation',
    'Verification Review',
    'Skills Assessment',
    'Certification',
  ];

  // Fetch skills and licenses
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setIsLoading(true);
        const response = await workersApi.getSkillsAndLicenses();

        // Handle both API response formats
        const data = response.data || response;
        const skills = data.skills || [];
        const licenses = data.licenses || [];

        setSkills(skills);
        setLicenses(licenses);
        setVerifiedSkillIds(skills.filter((s) => s.verified).map((s) => s.id));
        setError(null);
      } catch (err) {
        console.error('Error fetching credentials:', err);
        setError('Failed to load credentials');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  const handleGetVerified = (skill) => {
    setActiveSkill(skill);
    setDialogOpen(true);
    setActiveStep(0);
    setIsComplete(false);
  };

  const handleCloseDialog = () => {
    if (!isProcessing) {
      setDialogOpen(false);
    }
  };

  const handleNextStep = async () => {
    if (activeStep === steps.length - 1) {
      // Final step - submit verification request
      setIsProcessing(true);

      try {
        // Send verification request to API
        await workersApi.requestSkillVerification(activeSkill.id, {
          // Include verification data if needed
          documentUrls: [], // Would be populated in a real implementation
          notes: 'Verification requested through worker dashboard',
        });

        setIsComplete(true);

        // Add to verified skills (in a real app, this would be pending until approved)
        setVerifiedSkillIds((prev) => [...prev, activeSkill.id]);

        // Update skills list
        setSkills((prev) =>
          prev.map((skill) =>
            skill.id === activeSkill.id
              ? { ...skill, verified: true, verificationStatus: 'pending' }
              : skill,
          ),
        );
      } catch (err) {
        console.error('Error requesting verification:', err);
        // Handle error (would show error message in real implementation)
      } finally {
        setIsProcessing(false);
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  if (isLoading) {
    return (
      <DashboardCard title="Credentials & Skills">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Credentials & Skills">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Box>
      </DashboardCard>
    );
  }

  // Recalculate which skills are verified based on our state
  const verifiedSkills = skills.filter((s) =>
    verifiedSkillIds.includes(s.name),
  );
  const unverifiedSkills = skills.filter(
    (s) => !verifiedSkillIds.includes(s.name),
  );

  return (
    <DashboardCard title="Credentials & Skills">
      {/* Verified Skills Section */}
      {verifiedSkills.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Verified Skills
          </Typography>
          <List dense sx={{ p: 0 }}>
            {verifiedSkills.map((skill, index) => (
              <ListItem key={index} sx={{ p: 0 }}>
                <ListItemIcon sx={{ minWidth: 36, color: 'success.main' }}>
                  <VerifiedUserIcon />
                </ListItemIcon>
                <ListItemText
                  primary={skill.name}
                  sx={{
                    '& .MuiListItemText-primary': { fontWeight: 'medium' },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Unverified Skills Section */}
      {unverifiedSkills.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Unverified Skills
          </Typography>
          <List dense sx={{ p: 0 }}>
            {unverifiedSkills.map((skill, index) => (
              <ListItem key={index} sx={{ p: 0, opacity: 0.7 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <GppBadIcon />
                </ListItemIcon>
                <ListItemText primary={skill.name} />
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<AddTaskIcon />}
                  sx={{ ml: 1, borderRadius: '20px' }}
                  onClick={() => handleGetVerified(skill)}
                >
                  Get Verified
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Licenses Section */}
      {licenses.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Licenses
            </Typography>
            <List dense sx={{ p: 0 }}>
              {licenses.map((license, index) => (
                <ListItem key={index} sx={{ p: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36, color: 'success.main' }}>
                    <WorkspacePremiumIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={license.name}
                    secondary={`Expires: ${license.expiry}`}
                    sx={{
                      '& .MuiListItemText-primary': { fontWeight: 'medium' },
                      '& .MuiListItemText-secondary': {
                        fontSize: '0.85rem',
                        fontWeight: 'medium',
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </>
      )}

      {/* Verification Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isComplete ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'success.main',
              }}
            >
              <CheckCircleIcon sx={{ mr: 1 }} />
              Verification Complete
            </Box>
          ) : (
            `Get ${activeSkill?.name} Verified`
          )}
        </DialogTitle>
        <DialogContent>
          {isComplete ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleIcon
                sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Congratulations!
              </Typography>
              <Typography variant="body1">
                Your {activeSkill?.name} skill has been verified. This
                verification will be visible to potential hirers.
              </Typography>
            </Box>
          ) : (
            <>
              <Stepper activeStep={activeStep} sx={{ my: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <Typography sx={{ mt: 2, mb: 1 }}>
                {activeStep === 0 &&
                  'Upload documents that prove your qualifications for this skill.'}
                {activeStep === 1 &&
                  'Our team will review your documentation for accuracy and completeness.'}
                {activeStep === 2 &&
                  'Complete a brief assessment to demonstrate your proficiency.'}
                {activeStep === 3 &&
                  'Final review and certification of your skill.'}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {isComplete ? (
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCloseDialog}
                disabled={isProcessing}
                startIcon={<CloseIcon />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNextStep}
                variant="contained"
                color="primary"
                disabled={isProcessing}
                endIcon={isProcessing ? <CircularProgress size={24} /> : null}
              >
                {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </DashboardCard>
  );
};

Credentials.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      verified: PropTypes.bool,
    }),
  ),
  licenses: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      expiry: PropTypes.string.isRequired,
    }),
  ),
};

export default Credentials;
