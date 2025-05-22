import React from 'react';
import { 
    Paper, 
    Typography, 
    Box, 
    LinearProgress, 
    Button,
    Tooltip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

function SkillsProgress({ skills }) {
    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Skills & Expertise
                </Typography>
                <Button 
                    startIcon={<AddIcon />}
                    size="small"
                    variant="outlined"
                >
                    Add Skill
                </Button>
            </Box>

            {skills?.map((skill) => (
                <Box key={skill.name} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                            {skill.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {skill.level}/5
                        </Typography>
                    </Box>
                    <Tooltip title={`${skill.completedJobs} jobs completed`}>
                        <LinearProgress 
                            variant="determinate" 
                            value={(skill.level / 5) * 100}
                            sx={{ height: 8, borderRadius: 5 }}
                        />
                    </Tooltip>
                </Box>
            ))}
        </Paper>
    );
}

export default SkillsProgress; 