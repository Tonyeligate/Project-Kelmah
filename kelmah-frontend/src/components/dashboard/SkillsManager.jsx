import React, { useState } from 'react';
import {
    Box,
    Typography,
    Chip,
    TextField,
    Autocomplete,
    Rating,
    Card,
    CardContent,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    alpha
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon
} from '@mui/icons-material';

const SKILL_LEVELS = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Elementary' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Expert' }
];

function SkillsManager({ 
    skills = [], 
    onAddSkill, 
    onUpdateSkill, 
    onDeleteSkill,
    suggestedSkills = []
}) {
    const theme = useTheme();
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [newSkill, setNewSkill] = useState('');
    const [skillLevel, setSkillLevel] = useState(3);

    const handleOpenDialog = (skill = null) => {
        if (skill) {
            setSelectedSkill(skill);
            setNewSkill(skill.name);
            setSkillLevel(skill.level);
        } else {
            setSelectedSkill(null);
            setNewSkill('');
            setSkillLevel(3);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedSkill(null);
        setNewSkill('');
        setSkillLevel(3);
    };

    const handleSaveSkill = () => {
        if (!newSkill.trim()) return;

        const skillData = {
            name: newSkill.trim(),
            level: skillLevel
        };

        if (selectedSkill) {
            onUpdateSkill(selectedSkill.id, skillData);
        } else {
            onAddSkill(skillData);
        }

        handleCloseDialog();
    };

    const groupedSkills = skills.reduce((acc, skill) => {
        const level = SKILL_LEVELS.find(l => l.value === skill.level)?.label || 'Other';
        if (!acc[level]) acc[level] = [];
        acc[level].push(skill);
        return acc;
    }, {});

    return (
        <Box>
            <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2
            }}>
                <Typography variant="h6">
                    Skills & Expertise
                </Typography>
                <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ textTransform: 'none' }}
                >
                    Add Skill
                </Button>
            </Box>

            {Object.entries(groupedSkills).map(([level, levelSkills]) => (
                <Card key={level} sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography 
                            variant="subtitle2" 
                            color="text.secondary"
                            gutterBottom
                        >
                            {level}
                        </Typography>
                        <Box sx={{ 
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1
                        }}>
                            {levelSkills.map((skill) => (
                                <Chip
                                    key={skill.id}
                                    label={skill.name}
                                    onDelete={() => onDeleteSkill(skill.id)}
                                    onClick={() => handleOpenDialog(skill)}
                                    sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.2)
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            ))}

            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {selectedSkill ? 'Edit Skill' : 'Add New Skill'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Autocomplete
                            freeSolo
                            options={suggestedSkills}
                            value={newSkill}
                            onChange={(_, value) => setNewSkill(value || '')}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Skill Name"
                                    fullWidth
                                    onChange={(e) => setNewSkill(e.target.value)}
                                />
                            )}
                        />
                        <Box sx={{ mt: 3 }}>
                            <Typography 
                                variant="subtitle2" 
                                color="text.secondary"
                                gutterBottom
                            >
                                Proficiency Level
                            </Typography>
                            <Rating
                                value={skillLevel}
                                onChange={(_, value) => setSkillLevel(value)}
                                max={5}
                            />
                            <Typography 
                                variant="caption" 
                                color="text.secondary"
                            >
                                {SKILL_LEVELS.find(l => l.value === skillLevel)?.label}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveSkill}
                        disabled={!newSkill.trim()}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default SkillsManager;
