import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
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
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Rating,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Snackbar,
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Timer as TimerIcon,
  Build as BuildIcon,
  Quiz as QuizIcon,
  Analytics as AnalyticsIcon,
  Verified as VerifiedIcon,
  Home as HomeIcon,
  WorkspacePremium as PremiumIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Lightbulb as LightbulbIcon,
  WorkspacePremium as CertificateIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from 'recharts';
import PropTypes from 'prop-types';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';"
import workerService from '../services/workerService';
import {
  fallbackAvailableTests,
  fallbackCompletedAssessments,
  fallbackSkills,
  fallbackAnalytics,
} from '../utils/skillsAssessmentFallbacks';
import {
  normalizeSkillForDisplay,
  buildAssessmentsFromSkills,
  buildCompletedAssessments,
  buildAnalyticsSummary,
} from '../utils/skillsAssessmentTransforms';
import { createQuestionBank } from '../utils/skillsAssessmentQuestions';
import {
  getDifficultyColorKey,
  getDifficultyIcon,
  formatDifficultyLabel,
} from '../utils/skillsAssessmentDifficulty';
import {
  GlassCard,
  TestCard,
  AnimatedButton,
  ProgressRing,
  TimerDisplay,
} from '@/modules/worker/components/skillsAssessment/styled';

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

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

const SkillsAssessmentPage = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
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

  const fetchSkillsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const fallbackNormalizedSkills = fallbackSkills.map((skill, index) =>
      normalizeSkillForDisplay(skill, index),
    );

    try {
      const workerId = user?.id || user?._id || user?.userId;
      if (!workerId) {
        setMySkills(fallbackNormalizedSkills);
        setAvailableTests(fallbackAvailableTests.map((test) => ({ ...test })));
        setCompletedTests(
          fallbackCompletedAssessments.map((test) => ({ ...test })),
        );
        setAnalytics(fallbackAnalytics);
        setSnackbar((prev) => ({
          ...prev,
          open: true,
          message: 'Missing worker profile. Showing sample insights.',
          severity: 'warning',
        }));
        return;
      }

      const [credentialsResult, analyticsResult] = await Promise.allSettled([
        workerService.getMyCredentials(),
        workerService.getWorkerAnalytics(workerId),
      ]);

      const credentials =
        credentialsResult.status === 'fulfilled'
          ? credentialsResult.value
          : null;

      const credentialData = credentials?.data || credentials || {};
      const profileSkills = Array.isArray(credentialData?.skills)
        ? credentialData.skills
        : Array.isArray(credentialData?.skillSet)
          ? credentialData.skillSet
          : [];

      const normalizedSkills =
        profileSkills.length > 0
          ? profileSkills.map((skill, index) =>
              normalizeSkillForDisplay(skill, index),
            )
          : fallbackNormalizedSkills;

      const availableAssessments = buildAssessmentsFromSkills(normalizedSkills);
      const completedAssessments = buildCompletedAssessments(
        credentialData?.certifications || [],
      );

      const analyticsPayload =
        analyticsResult.status === 'fulfilled'
          ? analyticsResult.value?.data || analyticsResult.value
          : null;

      const analyticsSummary = buildAnalyticsSummary({
        skills: normalizedSkills,
        completedTests: completedAssessments,
        workerAnalytics: analyticsPayload,
      });

      setMySkills(normalizedSkills);
      setAvailableTests(
        availableAssessments.length > 0
          ? availableAssessments
          : fallbackAvailableTests.map((test) => ({ ...test })),
      );
      setCompletedTests(
        completedAssessments.length > 0
          ? completedAssessments
          : fallbackCompletedAssessments.map((test) => ({ ...test })),
      );
      setAnalytics(analyticsSummary);
    } catch (err) {
      console.error('Failed to load assessment data', err);
      setError('Failed to load assessment data. Showing sample insights.');
      setMySkills(fallbackNormalizedSkills);
      setAvailableTests(fallbackAvailableTests.map((test) => ({ ...test })));
      setCompletedTests(
        fallbackCompletedAssessments.map((test) => ({ ...test })),
      );
      setAnalytics(fallbackAnalytics);
      setSnackbar((prev) => ({
        ...prev,
        open: true,
        message: 'Using sample data due to connectivity issues.',
        severity: 'warning',
      }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTestDetails = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        const test = availableTests.find(
          (item) => String(item.id) === String(id),
        );
        if (!test) {
          setError('Selected assessment could not be found.');
          return;
        }

        const questions = createQuestionBank(test.skills?.[0] || test.title);

        setCurrentTest({ ...test, questions });
        setStartTestDialog(true);
        setAssessmentInProgress(false);
        setTestStarted(false);
        setTimerActive(false);
        setPaused(false);
        setTimeRemaining((test.duration || 30) * 60);
      } catch (err) {
        console.error('Failed to load test details', err);
        setError('Failed to load test details');
      } finally {
        setLoading(false);
      }
    },
    [availableTests],
  );

  const startTest = (test) => {
    const questions = createQuestionBank(test.skills?.[0] || test.title);
    setCurrentTest({ ...test, questions });
    setAssessmentInProgress(false);
    setTestStarted(false);
    setTimerActive(false);
    setPaused(false);
    setStartTestDialog(true);
    setTimeRemaining((test.duration || 30) * 60);
  };

  // Load initial data once credentials are resolved
  useEffect(() => {
    fetchSkillsData();
  }, [fetchSkillsData]);

  useEffect(() => {
    if (testId && availableTests.length > 0) {
      fetchTestDetails(testId);
    }
  }, [testId, availableTests, fetchTestDetails]);

  const confirmStartTest = () => {
    if (!currentTest) {
      setStartTestDialog(false);
      return;
    }

    setStartTestDialog(false);
    setAssessmentInProgress(true);
    setTestStarted(true);
    setTimerActive(true);
    setPaused(false);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeRemaining((currentTest.duration || 30) * 60);
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
    setPaused(false);
    setCurrentTest(null);
    navigate('/worker/skills');
  };

  const submitTest = useCallback(
    async (autoSubmit = false) => {
      setTimerActive(false);

      if (!currentTest || !Array.isArray(currentTest.questions)) {
        return;
      }

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
      const totalDurationSeconds = (currentTest.duration || 30) * 60;
      const timeSpent = totalDurationSeconds - timeRemaining;
      const passingScore = currentTest.passingScore ?? 70;

      const results = {
        score,
        maxScore: 100,
        correctAnswers,
        totalQuestions: currentTest.questions.length,
        timeSpent: Math.round(timeSpent / 60), // Convert to minutes
        passed: score >= passingScore,
        certificate: score >= passingScore && currentTest.certification,
        autoSubmitted: autoSubmit,
      };

      setTestResults(results);
      setResultsDialog(true);
      setAssessmentInProgress(false);
      setTestStarted(false);
      setPaused(false);

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
  }, [timerActive, timeRemaining, testPaused, submitTest]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAvailableTests = () => (
    <Grid container spacing={3}>
      {availableTests.map((test) => {
        const difficultyKey = getDifficultyColorKey(test.difficulty);
        const difficultyPalette =
          theme.palette[difficultyKey] || theme.palette.info;

        return (
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
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: difficultyPalette.main,
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

                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mb: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Chip
                      label={formatDifficultyLabel(test.difficulty)}
                      color={difficultyKey}
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
        );
      })}
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
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1, sm: 2 },
              mb: 2,
            }}
          >
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
              {currentTest.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <TimerDisplay urgent={timeUrgent}>
                <TimerIcon />
                <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight={600}>
                  {formatTime(timeRemaining)}
                </Typography>
              </TimerDisplay>

              <Button
                variant="outlined"
                onClick={testPaused ? resumeTest : pauseTest}
                startIcon={testPaused ? <PlayIcon /> : <PauseIcon />}
                sx={{ minHeight: 44 }}
              >
                {testPaused ? 'Resume' : 'Pause'}
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={exitTest}
                startIcon={<StopIcon />}
                sx={{ minHeight: 44 }}
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
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
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
              sx={{ minHeight: 44 }}
            >
              Previous
            </Button>

            {!isMobile && (
              <Typography variant="body2" color="text.secondary">
                {Object.keys(answers).length} of {currentTest.questions.length}{' '}
                answered
              </Typography>
            )}

            {currentQuestion === currentTest.questions.length - 1 ? (
              <AnimatedButton
                variant="contained"
                onClick={() => submitTest()}
                startIcon={<CheckIcon />}
                disabled={
                  Object.keys(answers).length < currentTest.questions.length
                }
                sx={{ minHeight: 44 }}
              >
                Submit Test
              </AnimatedButton>
            ) : (
              <Button
                variant="contained"
                onClick={nextQuestion}
                endIcon={<ArrowForwardIcon />}
                sx={{ minHeight: 44 }}
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
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
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
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (assessmentInProgress && testStarted) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
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

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Breadcrumbs sx={{ mb: 3, display: { xs: 'none', sm: 'block' } }}>
          <Link color="inherit" component={RouterLink} to="/">
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link color="inherit" component={RouterLink} to="/worker/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">Skills Assessment</Typography>
        </Breadcrumbs>

        <Box sx={{ mb: { xs: 2, md: 4 } }}>
          <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={700} gutterBottom>
            Skills Assessment Center
          </Typography>
          {!isMobile && (
            <Typography variant="h6" color="text.secondary">
              Validate your expertise and earn professional certifications
            </Typography>
          )}
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
            allowScrollButtonsMobile
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
          fullScreen={isMobile}
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
                  Once you start, the timer will begin counting down. You may
                  pause briefly, but the assessment cannot be restarted.
                  Make sure you have enough time to complete it.
                </Alert>

                <Typography variant="body2" color="text.secondary">
                  Passing score: {currentTest.passingScore}%
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setStartTestDialog(false)} sx={{ minHeight: 44 }}>Cancel</Button>
            <AnimatedButton
              variant="contained"
              onClick={confirmStartTest}
              startIcon={<PlayIcon />}
              sx={{ minHeight: 44 }}
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
          fullScreen={isMobile}
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
          <DialogActions sx={{ justifyContent: 'center', p: 3, flexWrap: 'wrap', gap: 1 }}>
            {testResults?.certificate && (
              <Button startIcon={<DownloadIcon />} variant="outlined" sx={{ minHeight: 44 }}>
                Download Certificate
              </Button>
            )}
            <Button onClick={() => setResultsDialog(false)} sx={{ minHeight: 44 }}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                setResultsDialog(false);
                navigate('/worker/skills');
              }}
              sx={{ minHeight: 44 }}
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

