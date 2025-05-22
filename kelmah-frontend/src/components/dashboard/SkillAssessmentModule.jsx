import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    CircularProgress,
    Alert,
    Chip,
    Rating,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    School,
    CheckCircle,
    Timer,
    Star,
    Assignment,
    EmojiEvents,
    TrendingUp,
    Help,
    PlayArrow,
    Refresh
} from '@mui/icons-material';

const difficultyColors = {
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#F44336'
};

const difficultyLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
};

function SkillAssessmentModule({ 
    skills = [], 
    completedAssessments = [], 
    loading = false,
    onStartAssessment,
    onRetakeAssessment
}) {
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [assessmentResult, setAssessmentResult] = useState(null);

    useEffect(() => {
        let timer;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleStartAssessment = (skill) => {
        setSelectedSkill(skill);
        setShowAssessmentDialog(true);
        setTimeLeft(skill.timeLimit * 60); // Convert minutes to seconds
        setCurrentQuestion(0);
        setAnswers({});
        setAssessmentResult(null);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        // In a real application, you would submit answers to the backend
        // For now, we'll simulate a result
        setAssessmentResult({
            score: 85,
            level: 'intermediate',
            feedback: 'Great job! You have demonstrated solid understanding of the fundamentals.',
            strengths: ['Problem-solving', 'Technical knowledge'],
            improvements: ['Advanced concepts', 'Best practices']
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    Skills Assessment Center
                </Typography>
                <Tooltip title="Complete assessments to verify your skills and increase job opportunities">
                    <IconButton size="small">
                        <Help />
                    </IconButton>
                </Tooltip>
            </Box>

            <Grid container spacing={3}>
                {skills.map((skill) => {
                    const completedAssessment = completedAssessments.find(
                        a => a.skillId === skill.id
                    );

                    return (
                        <Grid item xs={12} md={6} key={skill.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {skill.name}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                label={difficultyLabels[skill.difficulty]}
                                                size="small"
                                                sx={{
                                                    bgcolor: difficultyColors[skill.difficulty],
                                                    color: 'white'
                                                }}
                                            />
                                            <Chip
                                                icon={<Timer />}
                                                label={`${skill.timeLimit} mins`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<Assignment />}
                                                label={`${skill.questionCount} questions`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </Box>

                                    {completedAssessment ? (
                                        <>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Your Score
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="h4" color="primary">
                                                        {completedAssessment.score}%
                                                    </Typography>
                                                    <EmojiEvents 
                                                        color={completedAssessment.score >= 80 ? "primary" : "action"} 
                                                    />
                                                </Box>
                                                <Rating 
                                                    value={Math.round(completedAssessment.score / 20)} 
                                                    readOnly 
                                                    sx={{ mt: 1 }}
                                                />
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Refresh />}
                                                fullWidth
                                                onClick={() => onRetakeAssessment(skill.id)}
                                            >
                                                Retake Assessment
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                Verify your {skill.name} skills and showcase your expertise to potential employers.
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<PlayArrow />}
                                                fullWidth
                                                onClick={() => handleStartAssessment(skill)}
                                            >
                                                Start Assessment
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Assessment Dialog */}
            <Dialog
                open={showAssessmentDialog}
                onClose={() => setShowAssessmentDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {selectedSkill?.name} Assessment
                    {timeLeft !== null && (
                        <Typography variant="body2" color="text.secondary">
                            Time Remaining: {formatTime(timeLeft)}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    {assessmentResult ? (
                        <Box>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Typography variant="h4" color="primary" gutterBottom>
                                    {assessmentResult.score}%
                                </Typography>
                                <Typography variant="h6" gutterBottom>
                                    {assessmentResult.level.charAt(0).toUpperCase() + assessmentResult.level.slice(1)} Level
                                </Typography>
                                <Typography color="text.secondary">
                                    {assessmentResult.feedback}
                                </Typography>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Strengths
                                    </Typography>
                                    {assessmentResult.strengths.map((strength, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <CheckCircle color="success" sx={{ mr: 1 }} />
                                            <Typography>{strength}</Typography>
                                        </Box>
                                    ))}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                        Areas for Improvement
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {assessmentResult.improvements.map((improvement, index) => (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <TrendingUp color="primary" sx={{ mr: 1 }} />
                                                <Typography>{improvement}</Typography>
                                            </Box>
                                        ))}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                Question {currentQuestion + 1} of {selectedSkill?.questions?.length}
                            </Typography>
                            
                            <LinearProgress 
                                variant="determinate" 
                                value={(currentQuestion + 1) / selectedSkill?.questions?.length * 100}
                                sx={{ mb: 3 }}
                            />
                            
                            <FormControl component="fieldset">
                                <FormLabel component="legend">
                                    {selectedSkill?.questions?.[currentQuestion]?.question}
                                </FormLabel>
                                <RadioGroup
                                    value={answers[selectedSkill?.questions?.[currentQuestion]?.id] || ''}
                                    onChange={(e) => handleAnswer(selectedSkill?.questions?.[currentQuestion]?.id, e.target.value)}
                                >
                                    {selectedSkill?.questions?.[currentQuestion]?.options.map((option) => (
                                        <FormControlLabel
                                            key={option.id}
                                            value={option.id}
                                            control={<Radio />}
                                            label={option.text}
                                        />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {assessmentResult ? (
                        <Button onClick={() => setShowAssessmentDialog(false)}>
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button 
                                onClick={() => setCurrentQuestion(prev => prev - 1)}
                                disabled={currentQuestion === 0}
                            >
                                Previous
                            </Button>
                            {currentQuestion === selectedSkill?.questions?.length - 1 ? (
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={Object.keys(answers).length !== selectedSkill?.questions?.length}
                                >
                                    Submit Assessment
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                                    disabled={!answers[selectedSkill?.questions?.[currentQuestion]?.id]}
                                >
                                    Next
                                </Button>
                            )}
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

export default SkillAssessmentModule;
