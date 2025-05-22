import React from 'react';
import {
    Alert,
    AlertTitle,
    Button,
    Box,
    Stepper,
    Step,
    StepLabel,
    Typography
} from '@mui/material';
import { VerifiedUser, Warning } from '@mui/icons-material';

function VerificationBanner({ verificationStatus, onStartVerification }) {
    const steps = ['Basic Info', 'ID Verification', 'Skills Assessment', 'Profile Review'];

    if (verificationStatus === 'verified') {
        return (
            <Alert 
                icon={<VerifiedUser fontSize="inherit" />} 
                severity="success"
                sx={{ mb: 3 }}
            >
                <AlertTitle>Verified Profile</AlertTitle>
                Your profile is verified and you can now apply for jobs and receive offers.
            </Alert>
        );
    }

    return (
        <Box sx={{ mb: 3 }}>
            <Alert 
                severity="warning"
                action={
                    <Button 
                        color="inherit" 
                        size="small" 
                        onClick={onStartVerification}
                    >
                        Start Verification
                    </Button>
                }
            >
                <AlertTitle>Profile Verification Required</AlertTitle>
                Complete profile verification to unlock all features and increase your chances of getting hired.
            </Alert>
            
            <Stepper 
                activeStep={verificationStatus === 'not_started' ? 0 : 1} 
                sx={{ mt: 2 }}
            >
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
}

export default VerificationBanner; 