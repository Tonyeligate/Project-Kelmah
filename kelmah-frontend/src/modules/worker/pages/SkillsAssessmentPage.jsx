import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container,
  Grid,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Divider,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Help as HelpIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Timer as TimerIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import SkillsAssessment from '../components/SkillsAssessment';
import { useAuth } from '../../auth/contexts/AuthContext';
import axios from '../../common/services/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`skills-tabpanel-${index}`}
      aria-labelledby={`skills-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SkillsAssessmentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessmentInProgress, setAssessmentInProgress] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Load initial data
  useEffect(() => {
    if (!testId) {
      fetchSkillsData();
    } else {
      fetchTestDetails(testId);
    }
  }, [testId]);
  
  // Timer effect
  useEffect(() => {
    let timer;
    if (timerActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      submitTest(true); // Auto-submit when time expires
    }
    
    return () => clearInterval(timer);
  }, [timerActive, timeRemaining]);
  
  // Fetch skills data (available tests, completed tests, user skills)
  const fetchSkillsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [availableResponse, skillsResponse, completedResponse] = await Promise.all([
        axios.get(`${API_URL}/worker/skills/available-tests`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/worker/${user.id}/skills`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/worker/${user.id}/skills/completed-tests`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setAvailableTests(availableResponse.data.data);
      setMySkills(skillsResponse.data.data);
      setCompletedTests(completedResponse.data.data);
      
    } catch (err) {
      console.error('Error fetching skills data:', err);
      setError('Failed to load skills data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch test details
  const fetchTestDetails = async (testId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/worker/skills/tests/${testId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setCurrentTest(response.data.data);
      setTimeRemaining(response.data.data.timeLimit * 60); // Convert minutes to seconds
      setAssessmentInProgress(true);
      
    } catch (err) {
      console.error('Error fetching test details:', err);
      setError('Failed to load test. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Start a skills test
  const startTest = async (testId) => {
    navigate(`/worker/skills/test/${testId}`);
  };
  
  // Handle question answer
  const handleAnswer = (questionId, answerId) => {
    setAnswers({
      ...answers,
      [questionId]: answerId
    });
  };
  
  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestion < currentTest.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };
  
  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };
  
  // Begin the test (start timer)
  const beginTest = () => {
    setCurrentStep(1);
    setTimerActive(true);
  };
  
  // Submit test answers
  const submitTest = async (isAutoSubmit = false) => {
    setLoading(true);
    setError(null);
    setTimerActive(false);
    
    try {
      const response = await axios.post(
        `${API_URL}/worker/skills/tests/${currentTest.id}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setCurrentStep(2);
      setCurrentTest({
        ...currentTest,
        result: response.data.data
      });
      
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Return to skills dashboard
  const returnToDashboard = () => {
    navigate('/worker/skills');
    setAssessmentInProgress(false);
    setCurrentTest(null);
  };
  
  // Render the test taking interface
  const renderTestInterface = () => {
    if (!currentTest) return null;
    
    if (currentStep === 0) {
      // Test introduction
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              {currentTest.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {currentTest.skillCategory}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body1" paragraph>
              {currentTest.description}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', my: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <TimerIcon color="primary" sx={{ mr: 1 }} />
              <Typography>
                Time Limit: <strong>{currentTest.timeLimit} minutes</strong>
              </Typography>
            </Box>
            
            <Typography variant="body2" paragraph>
              This assessment contains {currentTest.questions.length} questions. 
              You must answer at least {currentTest.passingScore}% correctly to earn this skill certification.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={returnToDashboard}
                startIcon={<ArrowBackIcon />}
              >
                Return to Dashboard
              </Button>
              
              <Button
                variant="contained"
                onClick={beginTest}
                endIcon={<ArrowForwardIcon />}
              >
                Begin Test
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    } else if (currentStep === 1) {
      // Test questions
      const question = currentTest.questions[currentQuestion];
      
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Question {currentQuestion + 1} of {currentTest.questions.length}
              </Typography>
              
              <Chip
                icon={<TimerIcon />}
                label={`Time Remaining: ${formatTime(timeRemaining)}`}
                color={timeRemaining < 60 ? "error" : "default"}
                variant="outlined"
              />
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={(currentQuestion + 1) / currentTest.questions.length * 100}
              sx={{ mb: 3 }}
            />
            
            <Typography variant="h6" gutterBottom>
              {question.text}
            </Typography>
            
            {question.image && (
              <Box sx={{ my: 2, textAlign: 'center' }}>
                <img 
                  src={question.image} 
                  alt={`Question ${currentQuestion + 1}`} 
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              {question.options.map((option) => (
                <Box
                  key={option.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: answers[question.id] === option.id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: answers[question.id] === option.id ? 'primary.light' : 'background.paper',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: answers[question.id] === option.id ? 'primary.light' : 'action.hover'
                    }
                  }}
                  onClick={() => handleAnswer(question.id, option.id)}
                >
                  <Typography>
                    {option.text}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={prevQuestion}
                startIcon={<ArrowBackIcon />}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion < currentTest.questions.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={nextQuestion}
                  endIcon={<ArrowForwardIcon />}
                  disabled={!answers[question.id]}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => submitTest()}
                  endIcon={<CheckIcon />}
                  disabled={!answers[question.id]}
                >
                  Submit Test
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      );
    } else if (currentStep === 2) {
      // Test results
      const { result } = currentTest;
      const passed = result.score >= currentTest.passingScore;
      
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Paper sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                {passed ? 'Congratulations!' : 'Assessment Completed'}
              </Typography>
              
              <Typography variant="h5" color={passed ? 'success.main' : 'text.secondary'}>
                {passed ? 'You Passed!' : 'Not Passed'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Box sx={{ 
                position: 'relative', 
                display: 'inline-flex',
                width: 160,
                height: 160
              }}>
                <CircularProgress
                  variant="determinate"
                  value={result.score}
                  size={160}
                  thickness={4}
                  color={passed ? "success" : "error"}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4">{result.score}%</Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body1">
                You answered {result.correctAnswers} out of {currentTest.questions.length} questions correctly.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Passing score: {currentTest.passingScore}%
              </Typography>
            </Box>
            
            {passed && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1">
                  You've earned the {currentTest.skillCategory} certification!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This skill will now appear on your profile, and you can apply for jobs requiring this skill.
                </Typography>
              </Alert>
            )}
            
            {!passed && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body1">
                  You can retake this assessment in 14 days.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Review the skill materials and try again later.
                </Typography>
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                onClick={returnToDashboard}
                endIcon={<ArrowForwardIcon />}
              >
                Return to Skills Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }
  };
  
  // Render available tests
  const renderAvailableTests = () => {
    if (availableTests.length === 0) {
      return (
        <Alert severity="info">
          No skills tests are currently available for your profile. Check back later or update your skills interests.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {availableTests.map((test) => (
          <Grid item xs={12} sm={6} md={4} key={test.id}>
            <Card elevation={2}>
              <CardMedia
                component="img"
                height="140"
                image={test.imageUrl || 'https://via.placeholder.com/300x140?text=Skill+Test'}
                alt={test.title}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {test.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {test.skillCategory}
                </Typography>
                <Typography variant="body2" paragraph>
                  {test.description.substring(0, 120)}...
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TimerIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {test.timeLimit} minutes
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small"
                  onClick={() => startTest(test.id)}
                >
                  Start Assessment
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render my skills
  const renderMySkills = () => {
    if (mySkills.length === 0) {
      return (
        <Alert severity="info">
          You haven't earned any skill certifications yet. Take an assessment to add skills to your profile.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {mySkills.map((skill) => (
          <Grid item xs={12} sm={6} md={4} key={skill.id}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6" component="div">
                  {skill.name}
                </Typography>
              </Box>
              
              <Chip 
                label={`Level: ${skill.level}`} 
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" paragraph>
                {skill.description}
              </Typography>
              
              <Box sx={{ mt: 'auto' }}>
                <Typography variant="caption" display="block" color="text.secondary">
                  Verified: {new Date(skill.verifiedAt).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Expires: {new Date(skill.expiresAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render completed tests
  const renderCompletedTests = () => {
    if (completedTests.length === 0) {
      return (
        <Alert severity="info">
          You haven't completed any assessments yet.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {completedTests.map((test) => (
          <Grid item xs={12} key={test.id}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    {test.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {test.skillCategory}
                  </Typography>
                </Box>
                
                <Chip 
                  label={`${test.score}%`} 
                  color={test.passed ? "success" : "error"}
                  sx={{ fontSize: '1rem', height: 36, width: 70 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Completed: {new Date(test.completedAt).toLocaleDateString()}
                </Typography>
                
                {test.passed && (
                  <Chip 
                    label="Passed" 
                    size="small"
                    color="success"
                    sx={{ ml: 2 }}
                  />
                )}
                
                {!test.passed && (
                  <Chip 
                    label="Failed" 
                    size="small"
                    color="error"
                    sx={{ ml: 2 }}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading && !currentTest) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button 
          variant="contained"
          onClick={() => navigate('/worker/dashboard')}
        >
          Return to Dashboard
        </Button>
      </Container>
    );
  }
  
  if (assessmentInProgress) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {renderTestInterface()}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Skills Assessment Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Take assessments to verify your skills and stand out to hirers.
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          aria-label="skills assessment tabs"
        >
          <Tab icon={<AssignmentIcon />} label="Available Tests" />
          <Tab icon={<SchoolIcon />} label="My Skills" />
          <Tab icon={<EmojiEventsIcon />} label="Completed Tests" />
        </Tabs>
      </Paper>
      
      <TabPanel value={tabValue} index={0}>
        {renderAvailableTests()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {renderMySkills()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {renderCompletedTests()}
      </TabPanel>
      
      <Box sx={{ mt: 4 }}>
        <SkillsAssessment />
      </Box>
    </Container>
  );
};

export default SkillsAssessmentPage; 


