import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const SkillsAssessment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skills, setSkills] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [formData, setFormData] = useState({
    skill: '',
    level: '',
    description: '',
    certificate: null
  });

  useEffect(() => {
    fetchSkills();
    fetchAvailableAssessments();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workers/${user.id}/skills`);
      const data = await response.json();
      setSkills(data);
      setError(null);
    } catch (err) {
      setError('Failed to load skills');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssessments = async () => {
    try {
      const response = await fetch('/api/assessments/available');
      const data = await response.json();
      setAvailableAssessments(data);
    } catch (err) {
      console.error('Failed to load available assessments:', err);
    }
  };

  const handleDialogOpen = (type, skill = null) => {
    setDialogType(type);
    if (skill) {
      setFormData({
        skill: skill.name,
        level: skill.level,
        description: skill.description,
        certificate: skill.certificate
      });
    } else {
      setFormData({
        skill: '',
        level: '',
        description: '',
        certificate: null
      });
    }
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setFormData({
      skill: '',
      level: '',
      description: '',
      certificate: null
    });
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleFileChange = (event) => {
    setFormData({
      ...formData,
      certificate: event.target.files[0]
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await fetch(`/api/workers/${user.id}/skills`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to save skill');
      }

      handleDialogClose();
      fetchSkills();
    } catch (err) {
      setError('Failed to save skill');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (skillId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workers/${user.id}/skills/${skillId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete skill');
      }

      fetchSkills();
    } catch (err) {
      setError('Failed to delete skill');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = (assessment) => {
    setActiveAssessment(assessment);
    setActiveStep(0);
    setAnswers([]);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      const index = newAnswers.findIndex(a => a.questionId === questionId);
      if (index >= 0) {
        newAnswers[index] = { questionId, answer };
      } else {
        newAnswers.push({ questionId, answer });
      }
      return newAnswers;
    });
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleAssessmentSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments/${activeAssessment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workerId: user.id,
          answers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      setActiveAssessment(null);
      setActiveStep(0);
      setAnswers([]);
      fetchSkills();
    } catch (err) {
      setError('Failed to submit assessment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSkillCard = (skill) => (
    <Card key={skill.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6">{skill.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Level: {skill.level}
            </Typography>
          </Box>
          <Chip
            icon={skill.verified ? <VerifiedIcon /> : <PendingIcon />}
            label={skill.verified ? 'Verified' : 'Pending'}
            color={skill.verified ? 'success' : 'warning'}
            size="small"
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" paragraph>
          {skill.description}
        </Typography>
        {skill.certificate && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Certificate
            </Typography>
            <Button
              size="small"
              startIcon={<UploadIcon />}
              href={skill.certificate}
              target="_blank"
            >
              View Certificate
            </Button>
          </Box>
        )}
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => handleDialogOpen('edit', skill)}
        >
          Edit
        </Button>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => handleDelete(skill.id)}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );

  const renderAssessment = () => {
    if (!activeAssessment) return null;

    const currentQuestion = activeAssessment.questions[activeStep];

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {activeAssessment.title}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(activeStep / activeAssessment.questions.length) * 100}
          sx={{ mb: 3 }}
        />
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Question {activeStep + 1} of {activeAssessment.questions.length}
          </Typography>
          <Typography variant="body1" paragraph>
            {currentQuestion.text}
          </Typography>
          {currentQuestion.type === 'multiple_choice' ? (
            <FormControl fullWidth>
              <RadioGroup
                value={answers.find(a => a.questionId === currentQuestion.id)?.answer || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={answers.find(a => a.questionId === currentQuestion.id)?.answer || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === activeAssessment.questions.length - 1 ? handleAssessmentSubmit : handleNext}
            disabled={!answers.find(a => a.questionId === currentQuestion.id)?.answer}
          >
            {activeStep === activeAssessment.questions.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Skills Assessment
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen('add')}
        >
          Add Skill
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeAssessment ? (
        renderAssessment()
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your Skills
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : skills.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  No skills added yet
                </Typography>
              ) : (
                <Box>
                  {skills.map(renderSkillCard)}
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Available Assessments
              </Typography>
              {availableAssessments.length === 0 ? (
                <Typography color="text.secondary" align="center">
                  No assessments available
                </Typography>
              ) : (
                <Box>
                  {availableAssessments.map((assessment) => (
                    <Card key={assessment.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6">{assessment.title}</Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {assessment.description}
                        </Typography>
                        <Typography variant="body2">
                          Questions: {assessment.questions.length}
                        </Typography>
                        <Typography variant="body2">
                          Time Limit: {assessment.timeLimit} minutes
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<AssessmentIcon />}
                          onClick={() => startAssessment(assessment)}
                        >
                          Start Assessment
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'add' ? 'Add New Skill' : 'Edit Skill'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skill Name"
                  value={formData.skill}
                  onChange={handleInputChange('skill')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={formData.level}
                    label="Level"
                    onChange={handleInputChange('level')}
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                    <MenuItem value="expert">Expert</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  Upload Certificate
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </Button>
                {formData.certificate && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formData.certificate.name}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.skill || !formData.level || !formData.description}
          >
            {dialogType === 'add' ? 'Add' : 'Update'} Skill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SkillsAssessment; 