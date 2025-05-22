import React from 'react';
import { 
    Box, 
    Typography, 
    LinearProgress, 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText,
    Button,
    useTheme,
    alpha
} from '@mui/material';
import {
    CheckCircle,
    RadioButtonUnchecked,
    Person,
    WorkOutline,
    School,
    Description,
    LocationOn
} from '@mui/icons-material';

function ProfileProgress({ profile }) {
    const theme = useTheme();
    
    const steps = [
        { 
            id: 'basic_info', 
            label: 'Basic Information', 
            icon: Person,
            completed: !!(profile?.first_name && profile?.last_name && profile?.email),
            action: 'Add basic information'
        },
        { 
            id: 'skills', 
            label: 'Skills & Expertise', 
            icon: WorkOutline,
            completed: !!(profile?.skills?.length > 0),
            action: 'Add your skills'
        },
        { 
            id: 'education', 
            label: 'Education & Certifications', 
            icon: School,
            completed: !!(profile?.education?.length > 0),
            action: 'Add education details'
        },
        { 
            id: 'bio', 
            label: 'Professional Bio', 
            icon: Description,
            completed: !!(profile?.bio?.length > 50),
            action: 'Write your bio'
        },
        { 
            id: 'location', 
            label: 'Location & Availability', 
            icon: LocationOn,
            completed: !!(profile?.location && profile?.availability),
            action: 'Set your location'
        }
    ];

    const completedSteps = steps.filter(step => step.completed).length;
    const progress = (completedSteps / steps.length) * 100;

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Profile Completion
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <LinearProgress 
                            variant="determinate" 
                            value={progress}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 4
                                }
                            }}
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {Math.round(progress)}%
                    </Typography>
                </Box>
            </Box>

            <List>
                {steps.map((step) => (
                    <ListItem 
                        key={step.id}
                        sx={{ 
                            py: 0.5,
                            opacity: step.completed ? 1 : 0.7
                        }}
                    >
                        <ListItemIcon>
                            {step.completed ? (
                                <CheckCircle color="success" />
                            ) : (
                                <RadioButtonUnchecked color="disabled" />
                            )}
                        </ListItemIcon>
                        <ListItemText 
                            primary={step.label}
                            secondary={!step.completed && (
                                <Button
                                    size="small"
                                    startIcon={<step.icon />}
                                    sx={{ mt: 0.5 }}
                                >
                                    {step.action}
                                </Button>
                            )}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

export default ProfileProgress;
