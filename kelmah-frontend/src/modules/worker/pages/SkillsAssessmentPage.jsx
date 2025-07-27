import React, { useState, useEffect, useCallback } from 'react';
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
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  TextField,
  Slider,
  Rating,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Breadcrumbs,
  Link,
  Snackbar,
  Fade,
  Grow,
  Slide,
  Zoom,
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
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Build as BuildIcon,
  Quiz as QuizIcon,
  Analytics as AnalyticsIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  Home as HomeIcon,
  WorkspacePremium as PremiumIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Lightbulb as LightbulbIcon,
  MenuBook as BookIcon,
  WorkspacePremium as CertificateIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { styled, keyframes } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from 'recharts';
import { useAuth } from '../../auth/contexts/AuthContext';
import workerService from '../services/workerService';

// Animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled Components
const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[20],
  },
}));

const TestCard = styled(GlassCard)(({ theme, difficulty }) => {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'beginner':
        return theme.palette.success.main;
      case 'intermediate':
        return theme.palette.warning.main;
      case 'advanced':
        return theme.palette.error.main;
      case 'expert':
        return theme.palette.primary.main;
      default:
        return theme.palette.info.main;
    }
  };

  return {
    position: 'relative',
    cursor: 'pointer',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: getDifficultyColor(),
    },
  };
});

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: 25,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

const ProgressRing = styled(Box)(({ theme, progress }) => ({
  position: 'relative',
  display: 'inline-flex',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    background: `conic-gradient(${theme.palette.primary.main} ${progress * 3.6}deg, ${alpha(theme.palette.primary.main, 0.1)} 0deg)`,
    mask: 'radial-gradient(circle at center, transparent 65%, black 65%)',
  },
}));

const TimerDisplay = styled(Box)(({ theme, urgent }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  padding: theme.spacing(1, 2),
  borderRadius: 20,
  background: urgent
    ? alpha(theme.palette.error.main, 0.1)
    : alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${urgent ? theme.palette.error.main : theme.palette.primary.main}`,
  ...(urgent && {
    animation: `${pulse} 1s infinite`,
  }),
}));

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SkillsAssessmentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assessmentInProgress, setAssessmentInProgress] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Test state
  const [currentStep, setCurrentStep] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testPaused, setPaused] = useState(false);

  // Dialog states
  const [startTestDialog, setStartTestDialog] = useState(false);
  const [confirmExitDialog, setConfirmExitDialog] = useState(false);
  const [resultsDialog, setResultsDialog] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Mock data for comprehensive skills assessment
  const mockData = {
    availableTests: [
      {
        id: 1,
        title: 'Electrical Systems Fundamentals',
        category: 'Electrical',
        difficulty: 'beginner',
        duration: 30,
        questions: 25,
        description:
          'Test your knowledge of basic electrical systems, wiring, and safety protocols.',
        skills: [
          'Circuit Analysis',
          'Wiring',
          'Safety Protocols',
          'Electrical Codes',
        ],
        certification: true,
        premium: false,
        rating: 4.8,
        completions: 1250,
        passingScore: 70,
      },
      {
        id: 2,
        title: 'Advanced Plumbing Techniques',
        category: 'Plumbing',
        difficulty: 'advanced',
        duration: 45,
        questions: 35,
        description:
          'Advanced plumbing systems, pipe fitting, and troubleshooting complex issues.',
        skills: [
          'Pipe Fitting',
          'Drain Systems',
          'Water Pressure',
          'Leak Detection',
        ],
        certification: true,
        premium: true,
        rating: 4.9,
        completions: 892,
        passingScore: 80,
      },
      {
        id: 3,
        title: 'Carpentry and Woodworking',
        category: 'Carpentry',
        difficulty: 'intermediate',
        duration: 40,
        questions: 30,
        description:
          'Comprehensive assessment of carpentry skills, tools, and techniques.',
        skills: ['Joinery', 'Tool Usage', 'Measurements', 'Wood Types'],
        certification: true,
        premium: false,
        rating: 4.7,
        completions: 1100,
        passingScore: 75,
      },
      {
        id: 4,
        title: 'HVAC Systems Mastery',
        category: 'HVAC',
        difficulty: 'expert',
        duration: 60,
        questions: 50,
        description:
          'Expert-level assessment covering complex HVAC systems and refrigeration.',
        skills: [
          'Refrigeration',
          'Air Conditioning',
          'Heating Systems',
          'Ventilation',
        ],
        certification: true,
        premium: true,
        rating: 4.9,
        completions: 567,
        passingScore: 85,
      },
    ],
    completedTests: [
      {
        id: 1,
        title: 'Electrical Systems Fundamentals',
        score: 85,
        maxScore: 100,
        completedAt: '2024-01-10T10:00:00Z',
        certificate: true,
        timeSpent: 28,
        correctAnswers: 21,
        totalQuestions: 25,
      },
      {
        id: 3,
        title: 'Carpentry and Woodworking',
        score: 78,
        maxScore: 100,
        completedAt: '2024-01-05T14:30:00Z',
        certificate: true,
        timeSpent: 35,
        correctAnswers: 23,
        totalQuestions: 30,
      },
    ],
    mySkills: [
      {
        name: 'Electrical Wiring',
        level: 85,
        verified: true,
        category: 'Electrical',
      },
      { name: 'Carpentry', level: 78, verified: true, category: 'Carpentry' },
      {
        name: 'Plumbing Basics',
        level: 65,
        verified: false,
        category: 'Plumbing',
      },
      {
        name: 'Safety Protocols',
        level: 92,
        verified: true,
        category: 'General',
      },
      {
        name: 'Tool Maintenance',
        level: 73,
        verified: false,
        category: 'General',
      },
    ],
    analytics: {
      totalTests: 12,
      avgScore: 81.5,
      totalTimeSpent: 420, // minutes
      certifications: 3,
      skillsVerified: 8,
      rankPercentile: 87,
      strengths: ['Electrical', 'Safety'],
      improvementAreas: ['Plumbing', 'HVAC'],
    },
  };

  // Sample test questions
  const sampleQuestions = [
    {
      id: 1,
      type: 'multiple-choice',
      question:
        'What is the standard voltage for household electrical outlets in the US?',
      options: ['110V', '120V', '220V', '240V'],
      correct: 1,
      explanation:
        '120V is the standard voltage for household outlets in the United States.',
      difficulty: 'easy',
    },
    {
      id: 2,
      type: 'multiple-choice',
      question: 'Which tool is primarily used for cutting copper pipes?',
      options: ['Hacksaw', 'Pipe cutter', 'Angle grinder', 'Reciprocating saw'],
      correct: 1,
      explanation:
        'A pipe cutter provides clean, straight cuts for copper pipes.',
      difficulty: 'medium',
    },
    {
      id: 3,
      type: 'true-false',
      question: 'GFCI outlets are required in all bathroom installations.',
      correct: true,
      explanation:
        'GFCI outlets are required in bathrooms to prevent electrical shock.',
      difficulty: 'easy',
    },
  ];

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
    if (timerActive && timeRemaining > 0 && !testPaused) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      submitTest(true); // Auto-submit when time expires
    }
    return () => clearInterval(timer);
  }, [timerActive, timeRemaining, testPaused]);

  const fetchSkillsData = useCallback(async () => {
    setLoading(true);
    try {
      // In real app, these would be API calls
      setTimeout(() => {
        setAvailableTests(mockData.availableTests);
        setCompletedTests(mockData.completedTests);
        setMySkills(mockData.mySkills);
        setAnalytics(mockData.analytics);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load skills data');
      setLoading(false);
    }
  }, []);

  const fetchTestDetails = useCallback(async (id) => {
    setLoading(true);
    try {
      const test = mockData.availableTests.find((t) => t.id === parseInt(id));
      if (test) {
        setCurrentTest({ ...test, questions: sampleQuestions });
        setAssessmentInProgress(true);
        setTimeRemaining(test.duration * 60); // Convert to seconds
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load test details');
      setLoading(false);
    }
  }, []);

  const startTest = (test) => {
    setCurrentTest({ ...test, questions: sampleQuestions });
    setStartTestDialog(true);
  };

  const confirmStartTest = () => {
    setStartTestDialog(false);
    setAssessmentInProgress(true);
    setTestStarted(true);
    setTimerActive(true);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeRemaining(currentTest.duration * 60);
    navigate(`/worker/skills/test/${currentTest.id}`);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < currentTest.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const pauseTest = () => {
    setPaused(true);
    setTimerActive(false);
  };

  const resumeTest = () => {
    setPaused(false);
    setTimerActive(true);
  };

  const exitTest = () => {
    setConfirmExitDialog(true);
  };

  const confirmExit = () => {
    setConfirmExitDialog(false);
    setAssessmentInProgress(false);
    setTestStarted(false);
    setTimerActive(false);
    setCurrentTest(null);
    navigate('/worker/skills');
  };

  const submitTest = useCallback(
    async (autoSubmit = false) => {
      setTimerActive(false);

      // Calculate results
      const correctAnswers = Object.entries(answers).reduce(
        (count, [questionId, answer]) => {
          const question = currentTest.questions.find(
            (q) => q.id === parseInt(questionId),
          );
          if (question && question.correct === answer) {
            return count + 1;
          }
          return count;
        },
        0,
      );

      const score = Math.round(
        (correctAnswers / currentTest.questions.length) * 100,
      );
      const timeSpent = currentTest.duration * 60 - timeRemaining;

      const results = {
        score,
        maxScore: 100,
        correctAnswers,
        totalQuestions: currentTest.questions.length,
        timeSpent: Math.round(timeSpent / 60), // Convert to minutes
        passed: score >= currentTest.passingScore,
        certificate:
          score >= currentTest.passingScore && currentTest.certification,
        autoSubmitted: autoSubmit,
      };

      setTestResults(results);
      setResultsDialog(true);
      setAssessmentInProgress(false);
      setTestStarted(false);

      // Update completed tests
      setCompletedTests((prev) => [
        ...prev,
        {
          ...currentTest,
          ...results,
          completedAt: new Date().toISOString(),
        },
      ]);
    },
    [answers, currentTest, timeRemaining],
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      case 'expert':
        return 'primary';
      default:
        return 'info';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return <StarIcon />;
      case 'intermediate':
        return <TrendingUpIcon />;
      case 'advanced':
        return <EmojiEventsIcon />;
      case 'expert':
        return <PremiumIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const renderAvailableTests = () => (
    <Grid container spacing={3}>
      {availableTests.map((test) => (
        <Grid item xs={12} sm={6} lg={4} key={test.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TestCard
              difficulty={test.difficulty}
              onClick={() => startTest(test)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${getDifficultyColor(test.difficulty)}.main`,
                      mr: 2,
                    }}
                  >
                    {getDifficultyIcon(test.difficulty)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={700} noWrap>
                      {test.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {test.category}
                    </Typography>
                  </Box>
                  {test.premium && <PremiumIcon color="warning" />}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, minHeight: 40 }}
                >
                  {test.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={
                      test.difficulty.charAt(0).toUpperCase() +
                      test.difficulty.slice(1)
                    }
                    color={getDifficultyColor(test.difficulty)}
                    size="small"
                  />
                  <Chip
                    icon={<TimerIcon />}
                    label={`${test.duration} min`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<QuizIcon />}
                    label={`${test.questions} questions`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating value={test.rating} size="small" readOnly />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      ({test.completions})
                    </Typography>
                  </Box>
                  {test.certification && (
                    <Chip
                      icon={<CertificateIcon />}
                      label="Certificate"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Passing Score: {test.passingScore}%
                </Typography>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2 }}>
                <AnimatedButton
                  variant="contained"
                  fullWidth
                  startIcon={<PlayIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    startTest(test);
                  }}
                >
                  Start Assessment
                </AnimatedButton>
              </CardActions>
            </TestCard>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );

  const renderMySkills = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        My Skills & Competencies
      </Typography>

      <Grid container spacing={3}>
        {mySkills.map((skill, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <GlassCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ flexGrow: 1 }}
                  >
                    {skill.name}
                  </Typography>
                  {skill.verified && (
                    <Tooltip title="Verified Skill">
                      <VerifiedIcon color="primary" />
                    </Tooltip>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {skill.category}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={skill.level}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {skill.level}%
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Proficiency Level
                </Typography>
              </CardContent>
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderCompletedTests = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Completed Assessments
      </Typography>

      <Grid container spacing={3}>
        {completedTests.map((test, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <GlassCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{ flexGrow: 1 }}
                  >
                    {test.title}
                  </Typography>
                  {test.certificate && <CertificateIcon color="primary" />}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ProgressRing progress={test.score}>
                    <CircularProgress
                      variant="determinate"
                      value={test.score}
                      size={60}
                      thickness={6}
                      sx={{
                        color:
                          test.score >= 80
                            ? 'success.main'
                            : test.score >= 60
                              ? 'warning.main'
                              : 'error.main',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {test.score}%
                      </Typography>
                    </Box>
                  </ProgressRing>

                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Score: {test.correctAnswers}/{test.totalQuestions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Time: {test.timeSpent} minutes
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(test.completedAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={
                      test.score >= 80
                        ? 'Excellent'
                        : test.score >= 60
                          ? 'Good'
                          : 'Needs Improvement'
                    }
                    color={
                      test.score >= 80
                        ? 'success'
                        : test.score >= 60
                          ? 'warning'
                          : 'error'
                    }
                    size="small"
                  />
                  {test.certificate && (
                    <Chip
                      label="Certified"
                      color="primary"
                      size="small"
                      icon={<CheckCircleIcon />}
                    />
                  )}
                </Box>
              </CardContent>

              <CardActions>
                <Button size="small" startIcon={<DownloadIcon />}>
                  Certificate
                </Button>
                <Button size="small" startIcon={<ShareIcon />}>
                  Share
                </Button>
              </CardActions>
            </GlassCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    const skillsData = mySkills.map((skill) => ({
      name: skill.name,
      level: skill.level,
      verified: skill.verified,
    }));

    return (
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Skills Analytics
        </Typography>

        <Grid container spacing={3}>
          {/* Summary Stats */}
          <Grid item xs={12} md={8}>
            <GlassCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Performance Overview
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight={700}>
                        {analytics.totalTests}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tests Taken
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="h4"
                        color="success.main"
                        fontWeight={700}
                      >
                        {analytics.avgScore}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="h4"
                        color="warning.main"
                        fontWeight={700}
                      >
                        {analytics.certifications}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Certificates
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="h4"
                        color="info.main"
                        fontWeight={700}
                      >
                        {analytics.rankPercentile}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Top Percentile
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </GlassCard>

            {/* Skills Chart */}
            <GlassCard>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Skills Breakdown
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="level" fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>

          {/* Improvement Areas */}
          <Grid item xs={12} md={4}>
            <GlassCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{ color: 'success.main' }}
                >
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Strengths
                </Typography>
                <List dense>
                  {analytics.strengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  gutterBottom
                  sx={{ color: 'warning.main' }}
                >
                  <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Growth Areas
                </Typography>
                <List dense>
                  {analytics.improvementAreas.map((area, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={area}
                        secondary="Consider taking assessment"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderTestInterface = () => {
    if (!currentTest || !testStarted) return null;

    const question = currentTest.questions[currentQuestion];
    const progress =
      ((currentQuestion + 1) / currentTest.questions.length) * 100;
    const timeUrgent = timeRemaining < 300; // Less than 5 minutes

    return (
      <Box>
        {/* Test Header */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5" fontWeight={700}>
              {currentTest.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TimerDisplay urgent={timeUrgent}>
                <TimerIcon />
                <Typography variant="h6" fontWeight={600}>
                  {formatTime(timeRemaining)}
                </Typography>
              </TimerDisplay>

              <Button
                variant="outlined"
                onClick={testPaused ? resumeTest : pauseTest}
                startIcon={testPaused ? <PlayIcon /> : <PauseIcon />}
              >
                {testPaused ? 'Resume' : 'Pause'}
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={exitTest}
                startIcon={<StopIcon />}
              >
                Exit
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestion + 1} of {currentTest.questions.length}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
        </Paper>

        {/* Question Content */}
        {!testPaused && (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {question.question}
                </Typography>

                {question.type === 'multiple-choice' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.id, parseInt(e.target.value))
                    }
                  >
                    {question.options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={index}
                        control={<Radio />}
                        label={option}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                )}

                {question.type === 'true-false' && (
                  <RadioGroup
                    value={
                      answers[question.id] !== undefined
                        ? answers[question.id].toString()
                        : ''
                    }
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value === 'true')
                    }
                  >
                    <FormControlLabel
                      value="true"
                      control={<Radio />}
                      label="True"
                    />
                    <FormControlLabel
                      value="false"
                      control={<Radio />}
                      label="False"
                    />
                  </RadioGroup>
                )}
              </CardContent>
            </GlassCard>
          </motion.div>
        )}

        {/* Pause Overlay */}
        {testPaused && (
          <GlassCard sx={{ textAlign: 'center', py: 8 }}>
            <PauseIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Test Paused
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Click Resume to continue your assessment
            </Typography>
            <AnimatedButton
              variant="contained"
              size="large"
              startIcon={<PlayIcon />}
              onClick={resumeTest}
            >
              Resume Test
            </AnimatedButton>
          </GlassCard>
        )}

        {/* Navigation */}
        {!testPaused && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              startIcon={<ArrowBackIcon />}
            >
              Previous
            </Button>

            <Typography variant="body2" color="text.secondary">
              {Object.keys(answers).length} of {currentTest.questions.length}{' '}
              answered
            </Typography>

            {currentQuestion === currentTest.questions.length - 1 ? (
              <AnimatedButton
                variant="contained"
                onClick={() => submitTest()}
                startIcon={<CheckIcon />}
                disabled={
                  Object.keys(answers).length < currentTest.questions.length
                }
              >
                Submit Test
              </AnimatedButton>
            ) : (
              <Button
                variant="contained"
                onClick={nextQuestion}
                endIcon={<ArrowForwardIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress size={60} thickness={4} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (assessmentInProgress && testStarted) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {renderTestInterface()}

        {/* Confirm Exit Dialog */}
        <Dialog
          open={confirmExitDialog}
          onClose={() => setConfirmExitDialog(false)}
        >
          <DialogTitle>Exit Assessment?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to exit this assessment? Your progress will
              be lost.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmExitDialog(false)}>Cancel</Button>
            <Button onClick={confirmExit} color="error">
              Exit
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>Skills Assessment - Professional Certification | Kelmah</title>
        <meta
          name="description"
          content="Take professional skills assessments to validate your expertise and earn certifications in electrical, plumbing, carpentry, HVAC and more."
        />
      </Helmet>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" component={RouterLink} to="/">
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link color="inherit" component={RouterLink} to="/worker/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">Skills Assessment</Typography>
        </Breadcrumbs>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Skills Assessment Center
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Validate your expertise and earn professional certifications
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
          >
            <Tab icon={<QuizIcon />} label="Available Tests" />
            <Tab icon={<BuildIcon />} label="My Skills" />
            <Tab icon={<EmojiEventsIcon />} label="Completed" />
            <Tab icon={<AnalyticsIcon />} label="Analytics" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {renderAvailableTests()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderMySkills()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderCompletedTests()}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {renderAnalytics()}
        </TabPanel>

        {/* Start Test Dialog */}
        <Dialog
          open={startTestDialog}
          onClose={() => setStartTestDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <QuizIcon />
              </Avatar>
              Start Assessment
            </Box>
          </DialogTitle>
          <DialogContent>
            {currentTest && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {currentTest.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {currentTest.description}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <TimerIcon color="primary" />
                      <Typography variant="h6">
                        {currentTest.duration} min
                      </Typography>
                      <Typography variant="caption">Duration</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <QuizIcon color="primary" />
                      <Typography variant="h6">
                        {currentTest.questions?.length || currentTest.questions}{' '}
                        questions
                      </Typography>
                      <Typography variant="caption">Questions</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Once you start, you cannot pause or restart the assessment.
                  Make sure you have enough time to complete it.
                </Alert>

                <Typography variant="body2" color="text.secondary">
                  Passing score: {currentTest.passingScore}%
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setStartTestDialog(false)}>Cancel</Button>
            <AnimatedButton
              variant="contained"
              onClick={confirmStartTest}
              startIcon={<PlayIcon />}
            >
              Start Assessment
            </AnimatedButton>
          </DialogActions>
        </Dialog>

        {/* Results Dialog */}
        <Dialog
          open={resultsDialog}
          onClose={() => setResultsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ textAlign: 'center' }}>
              {testResults?.passed ? (
                <CheckCircleIcon
                  sx={{ fontSize: 60, color: 'success.main', mb: 1 }}
                />
              ) : (
                <CancelIcon sx={{ fontSize: 60, color: 'error.main', mb: 1 }} />
              )}
              <Typography variant="h4" fontWeight={700}>
                {testResults?.passed
                  ? 'Congratulations!'
                  : 'Assessment Complete'}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {testResults && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h2"
                  fontWeight={700}
                  color="primary"
                  gutterBottom
                >
                  {testResults.score}%
                </Typography>

                <Typography variant="h6" gutterBottom>
                  {testResults.correctAnswers} out of{' '}
                  {testResults.totalQuestions} correct
                </Typography>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Completed in {testResults.timeSpent} minutes
                </Typography>

                {testResults.passed ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    You have successfully passed this assessment!
                    {testResults.certificate &&
                      ' Your certificate is ready for download.'}
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    You can retake this assessment after 24 hours to improve
                    your score.
                  </Alert>
                )}

                {testResults.autoSubmitted && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This assessment was automatically submitted due to time
                    expiration.
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
            {testResults?.certificate && (
              <Button startIcon={<DownloadIcon />} variant="outlined">
                Download Certificate
              </Button>
            )}
            <Button onClick={() => setResultsDialog(false)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                setResultsDialog(false);
                navigate('/worker/skills');
              }}
            >
              View All Assessments
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default SkillsAssessmentPage;
