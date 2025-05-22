import React, { useState } from 'react';
import {
    Stepper, Step, StepLabel, Button, Typography,
    Box, Paper, TextField, Grid, Chip, Avatar,
    IconButton, CircularProgress
} from '@mui/material';
import {
    PhotoCamera, Add as AddIcon, Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSnackbar } from 'notistack';

const Input = styled('input')({
    display: 'none',
});

const steps = [
    {
        label: 'Basic Info',
        description: 'Let\'s start with your basic information'
    },
    {
        label: 'Skills & Experience',
        description: 'Tell us about your expertise'
    },
    {
        label: 'Education & Certifications',
        description: 'Share your educational background'
    },
    {
        label: 'Portfolio',
        description: 'Showcase your best work'
    }
];

function ProfileWizard({ onComplete }) {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const [formData, setFormData] = useState({
        basicInfo: {
            fullName: '',
            title: '',
            bio: '',
            location: '',
            avatar: null
        },
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        portfolio: []
    });

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prevStep) => prevStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const validateStep = (step) => {
        switch (step) {
            case 0:
                if (!formData.basicInfo.fullName || !formData.basicInfo.title) {
                    enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
                    return false;
                }
                return true;
            case 1:
                if (formData.skills.length === 0) {
                    enqueueSnackbar('Please add at least one skill', { variant: 'error' });
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleComplete = async () => {
        try {
            setLoading(true);
            await onComplete(formData);
            enqueueSnackbar('Profile setup completed successfully!', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error saving profile', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <BasicInfoForm 
                        formData={formData.basicInfo} 
                        setFormData={(data) => setFormData(prev => ({
                            ...prev,
                            basicInfo: data
                        }))}
                    />
                );
            case 1:
                return (
                    <SkillsExperienceForm 
                        formData={{ skills: formData.skills, experience: formData.experience }}
                        setFormData={(data) => setFormData(prev => ({
                            ...prev,
                            ...data
                        }))}
                    />
                );
            // Add other cases for remaining steps
            default:
                return null;
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel>
                            <Typography variant="subtitle2">{step.label}</Typography>
                            {activeStep === index && (
                                <Typography variant="caption" color="text.secondary">
                                    {step.description}
                                </Typography>
                            )}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button 
                    onClick={handleBack} 
                    disabled={activeStep === 0 || loading}
                >
                    Back
                </Button>
                <Box>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleComplete}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                        >
                            Complete Setup
                        </Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            onClick={handleNext}
                            disabled={loading}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

export default ProfileWizard; 