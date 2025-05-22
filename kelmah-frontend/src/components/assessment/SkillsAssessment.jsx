import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    Assessment,
    CheckCircle,
    Error,
    Timer,
    EmojiEvents,
    Psychology
} from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const SkillsAssessment = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [assessments, setAssessments] = useState([]);
    const [currentTest, setCurrentTest] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [testDialog, setTestDialog] = useState(false);
    const [resultsDialog, setResultsDialog] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const skillCategories = [
        { id: 'technical', name: 'Technical Skills', icon: <Psychology /> },
        { id: 'soft', name: 'Soft Skills', icon: <EmojiEvents /> },
        { id: 'language', name: 'Language Proficiency', icon: <Assessment /> }
    ];

    useEffect(() => {
        fetchAssessments();
    }, []);

    useEffect(() => {
        let timer;
        if (timeLeft > 0 && testDialog) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTestSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft, testDialog]);

    const fetchAssessments = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/worker/assessments`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setAssessments(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load assessments. Please try again later.');
            setLoading(false);
        }
    };

    const startTest = async (category) => {
        try {
            const response = await axios.post(
                `${BACKEND_URL}/worker/assessments/start`,
                { category },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            setCurrentTest(response.data.data);
            setAnswers({});
            setTimeLeft(response.data.data.timeLimit);
            setTestDialog(true);
        } catch (err) {
            setError('Failed to start test. Please try again.');
        }
    };

    const handleAnswerSelect = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleTestSubmit = async () => {
        try {
            const response = await axios.post(
                `${BACKEND_URL}/worker/assessments/submit`,
                {
                    testId: currentTest.id,
                    answers
                },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            setTestResult(response.data.data);
            setTestDialog(false);
            setResultsDialog(true);
            fetchAssessments();
        } catch (err) {
            setError('Failed to submit test. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const renderTestDialog = () => (
        <Dialog
            open={testDialog}
            onClose={() => setTestDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timer color="primary" />
                    <Typography variant="h6">
                        {currentTest?.category} Assessment
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Time Remaining: {formatTime(timeLeft)}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={(timeLeft / currentTest?.timeLimit) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

                {currentTest?.questions.map((question, index) => (
                    <Box key={question.id} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            {index + 1}. {question.text}
                        </Typography>
                        <FormControl component="fieldset">
                            <RadioGroup
                                value={answers[question.id] || ''}
                                onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                            >
                                {question.options.map((option) => (
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
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setTestDialog(false)}>Cancel</Button>
                <Button
                    onClick={handleTestSubmit}
                    variant="contained"
                    color="primary"
                >
                    Submit Test
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderResultsDialog = () => (
        <Dialog
            open={resultsDialog}
            onClose={() => setResultsDialog(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment color="primary" />
                    <Typography variant="h6">Test Results</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" gutterBottom>
                        {testResult?.score}%
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {testResult?.score >= 70
                            ? 'Congratulations! You passed the assessment.'
                            : 'Keep practicing! You can retake this test in 24 hours.'}
                    </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Performance Breakdown:
                    </Typography>
                    {testResult?.categoryScores.map((category) => (
                        <Box key={category.name} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{category.name}</Typography>
                                <Typography variant="body2">{category.score}%</Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={category.score}
                                sx={{ height: 6, borderRadius: 3 }}
                            />
                        </Box>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setResultsDialog(false)}>Close</Button>
            </DialogActions>
        </Dialog>
    );

    const renderAssessmentList = () => (
        <Grid container spacing={3}>
            {skillCategories.map((category) => {
                const assessment = assessments.find(a => a.category === category.id);
                return (
                    <Grid item xs={12} md={4} key={category.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    {category.icon}
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        {category.name}
                                    </Typography>
                                </Box>
                                {assessment ? (
                                    <>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Chip
                                                label={`Score: ${assessment.score}%`}
                                                color={assessment.score >= 70 ? 'success' : 'warning'}
                                                size="small"
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Last taken: {new Date(assessment.lastTaken).toLocaleDateString()}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => startTest(category.id)}
                                            disabled={!assessment.canRetake}
                                        >
                                            {assessment.canRetake ? 'Retake Test' : 'Test Locked'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => startTest(category.id)}
                                    >
                                        Take Test
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Typography variant="h5" gutterBottom>
                Skills Assessment
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Take assessments to showcase your skills and improve your job matching.
            </Typography>

            {renderAssessmentList()}
            {renderTestDialog()}
            {renderResultsDialog()}
        </Box>
    );
};

export default SkillsAssessment; 