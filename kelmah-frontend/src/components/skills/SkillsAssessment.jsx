import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Button,
    Stepper,
    Step,
    StepLabel,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    CircularProgress,
    Alert
} from '@mui/material';
import api from '../../api/axios';

function SkillsAssessment() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchAssessment();
    }, []);

    const fetchAssessment = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/skills/assessment');
            setAssessment(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const response = await api.post('/api/skills/assessment/submit', { answers });
            setResult(response.data);
        } catch (err) {
            setError('Failed to submit assessment');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!assessment) return null;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Skills Assessment
            </Typography>

            {!result ? (
                <>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body1" gutterBottom>
                            Question {currentQuestion + 1} of {assessment.questions.length}
                        </Typography>
                        
                        <FormControl component="fieldset">
                            <FormLabel component="legend">
                                {assessment.questions[currentQuestion].question}
                            </FormLabel>
                            <RadioGroup
                                value={answers[assessment.questions[currentQuestion].id] || ''}
                                onChange={(e) => handleAnswer(assessment.questions[currentQuestion].id, e.target.value)}
                            >
                                {assessment.questions[currentQuestion].options.map((option) => (
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

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            disabled={currentQuestion === 0}
                            onClick={() => setCurrentQuestion(prev => prev - 1)}
                        >
                            Previous
                        </Button>
                        {currentQuestion === assessment.questions.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length !== assessment.questions.length}
                            >
                                Submit Assessment
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={() => setCurrentQuestion(prev => prev + 1)}
                                disabled={!answers[assessment.questions[currentQuestion].id]}
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </>
            ) : (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Assessment Results
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Score: {result.score}%
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Level: {result.level}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => window.location.reload()}
                        sx={{ mt: 2 }}
                    >
                        Retake Assessment
                    </Button>
                </Box>
            )}
        </Paper>
    );
}

export default SkillsAssessment; 