import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  LinearProgress,
  CircularProgress,
  Stack,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  AvatarGroup,
  Container,
  useMediaQuery,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  BookmarkBorder as BookmarkIcon,
  FavoriteBorder as FavoriteIcon,
  ThumbUp as ThumbUpIcon,
  TrendingFlat as TrendingFlatIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  DonutLarge as DonutIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  Savings as SavingsIcon,
  LocalAtm as LocalAtmIcon,
  MonetizationOn as MonetizationOnIcon,
  PaymentIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
  Build as BuildIcon,
  GroupWork as GroupWorkIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Science as ScienceIcon,
  Architecture as ArchitectureIcon,
  Construction as ConstructionIcon,
  ElectricalServices as ElectricalServicesIcon,
  Plumbing as PlumbingIcon,
  Hvac as HvacIcon,
} from '@mui/icons-material';
import { styled, useTheme, keyframes } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  TreeMap,
  Sankey,
} from 'recharts';
import { Helmet } from 'react-helmet';

// Advanced animations for dashboard elements
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(1deg); }
  50% { transform: translateY(-15px) rotate(0deg); }
  75% { transform: translateY(-8px) rotate(-1deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(33, 150, 243, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.5); }
  50% { box-shadow: 0 0 40px rgba(33, 150, 243, 0.8), 0 0 60px rgba(33, 150, 243, 0.6); }
`;

const countUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const slideInRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const fadeInUp = keyframes`
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Enhanced styled components for dashboard
const DashboardContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.default, 0.95)} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 50%,
    ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 25% 25%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)`,
    pointerEvents: 'none',
    zIndex: 0,
  },
}));

const GlassCard = styled(Card)(({ theme, variant = 'default', elevated = false, interactive = false }) => ({
  background: variant === 'premium' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha('#9C27B0', 0.05)})`
    : variant === 'success'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha('#4CAF50', 0.05)})`
    : variant === 'warning'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha('#FF9800', 0.05)})`
    : variant === 'error'
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha('#F44336', 0.05)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(30px)',
  border: variant === 'premium' 
    ? `2px solid ${alpha('#9C27B0', 0.2)}`
    : variant === 'success'
    ? `2px solid ${alpha('#4CAF50', 0.2)}`
    : variant === 'warning'
    ? `2px solid ${alpha('#FF9800', 0.2)}`
    : variant === 'error'
    ? `2px solid ${alpha('#F44336', 0.2)}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 20,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  ...(elevated && {
    transform: 'translateY(-4px)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
  }),
  ...(interactive && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: variant === 'premium'
        ? `0 24px 48px ${alpha('#9C27B0', 0.25)}`
        : variant === 'success'
        ? `0 24px 48px ${alpha('#4CAF50', 0.25)}`
        : variant === 'warning'
        ? `0 24px 48px ${alpha('#FF9800', 0.25)}`
        : variant === 'error'
        ? `0 24px 48px ${alpha('#F44336', 0.25)}`
        : `0 24px 48px ${alpha(theme.palette.common.black, 0.15)}`,
      '&::before': {
        opacity: 1,
      },
    },
  }),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.08)}, transparent)`,
    transition: 'left 0.8s, opacity 0.3s',
    opacity: 0,
  },
  '&:hover::before': interactive ? {
    left: '100%',
    opacity: 1,
  } : {},
}));

const MetricCard = styled(motion.div)(({ theme, color = theme.palette.primary.main, gradient = false, glowing = false, size = 'medium' }) => ({
  background: gradient 
    ? `linear-gradient(135deg, ${alpha(color, 0.1)}, ${alpha(color, 0.2)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${alpha(color, 0.3)}`,
  borderRadius: size === 'large' ? 24 : size === 'small' ? 12 : 16,
  padding: theme.spacing(size === 'large' ? 4 : size === 'small' ? 2 : 3),
  textAlign: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  minHeight: size === 'large' ? 200 : size === 'small' ? 80 : 140,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.05)',
    boxShadow: `0 20px 40px ${alpha(color, 0.3)}`,
    borderColor: color,
    background: gradient 
      ? `linear-gradient(135deg, ${alpha(color, 0.15)}, ${alpha(color, 0.25)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(color, 0.05)})`,
    '&::after': {
      opacity: 1,
    },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '120px',
    height: '120px',
    background: `radial-gradient(circle, ${alpha(color, 0.2)} 0%, transparent 70%)`,
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.4s ease',
  },
  ...(glowing && {
    animation: `${glow} 3s ease-in-out infinite`,
  }),
}));

const AnimatedButton = styled(Button)(({ theme, variant = 'contained', magnetic = false, size = 'medium', glowing = false }) => ({
  borderRadius: size === 'large' ? 32 : size === 'small' ? 16 : 24,
  padding: size === 'large' 
    ? theme.spacing(2.5, 6) 
    : size === 'small' 
    ? theme.spacing(1, 3) 
    : theme.spacing(1.5, 4),
  fontWeight: 800,
  fontSize: size === 'large' ? '1.2rem' : size === 'small' ? '0.9rem' : '1rem',
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  background: variant === 'contained' 
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
    : 'transparent',
  border: variant === 'outlined' 
    ? `2px solid ${theme.palette.secondary.main}` 
    : 'none',
  color: variant === 'contained' ? 'white' : theme.palette.secondary.main,
  boxShadow: variant === 'contained' 
    ? `0 8px 24px ${alpha(theme.palette.secondary.main, 0.3)}` 
    : 'none',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.05)',
    boxShadow: variant === 'contained' 
      ? `0 16px 40px ${alpha(theme.palette.secondary.main, 0.4)}` 
      : `0 12px 32px ${alpha(theme.palette.secondary.main, 0.2)}`,
    background: variant === 'outlined' 
      ? alpha(theme.palette.secondary.main, 0.1) 
      : `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
    '&::before': {
      left: '100%',
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.4)}, transparent)`,
    transition: 'left 0.6s',
  },
  '&:active': {
    transform: 'translateY(-3px) scale(1.02)',
  },
  ...(magnetic && {
    '&:hover': {
      animation: `${float} 0.6s ease-in-out infinite`,
    },
  }),
  ...(glowing && {
    animation: `${glow} 2s ease-in-out infinite`,
  }),
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(20px)',
  borderRadius: 20,
  padding: theme.spacing(3),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '20px 20px 0 0',
  },
}));

const QuickActionCard = styled(motion.div)(({ theme, color = theme.palette.primary.main }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(color, 0.05)})`,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${alpha(color, 0.2)}`,
  borderRadius: 16,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.03)',
    boxShadow: `0 16px 32px ${alpha(color, 0.2)}`,
    borderColor: color,
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(color, 0.1)})`,
    '&::before': {
      opacity: 1,
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(color, 0.1)}, transparent)`,
    transition: 'left 0.6s, opacity 0.3s',
    opacity: 0,
  },
  '&:hover::before': {
    left: '100%',
    opacity: 1,
  },
}));

const NotificationBadge = styled(Badge)(({ theme, variant = 'default' }) => ({
  '& .MuiBadge-badge': {
    background: variant === 'urgent' 
      ? `linear-gradient(135deg, #FF4444, #FF6B6B)`
      : variant === 'important'
      ? `linear-gradient(135deg, #FFA726, #FFB74D)`
      : variant === 'success'
      ? `linear-gradient(135deg, #66BB6A, #81C784)`
      : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    color: 'white',
    fontWeight: 800,
    fontSize: '0.75rem',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    animation: variant === 'urgent' ? `${pulse} 2s ease-in-out infinite` : 'none',
    boxShadow: `0 4px 12px ${alpha(
      variant === 'urgent' ? '#FF4444' :
      variant === 'important' ? '#FFA726' :
      variant === 'success' ? '#66BB6A' :
      theme.palette.primary.main, 0.4
    )}`,
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`dashboard-tabpanel-${index}`}
    aria-labelledby={`dashboard-tab-${index}`}
    {...other}
  >
    {value === index && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    )}
  </div>
); 

const EnhancedDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Enhanced state management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [realtimeData, setRealtimeData] = useState({});
  const [chartFilters, setChartFilters] = useState({});
  const [expandedMetric, setExpandedMetric] = useState(null);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  // Mock comprehensive dashboard data
  const mockDashboardData = {
    overview: {
      totalEarnings: { value: 247500, change: 18.5, trend: 'up' },
      activeProjects: { value: 23, change: 12.3, trend: 'up' },
      completedJobs: { value: 156, change: 8.7, trend: 'up' },
      clientRating: { value: 4.97, change: 2.1, trend: 'up' },
      responseTime: { value: 4.2, change: -15.2, trend: 'down' },
      successRate: { value: 99.2, change: 1.8, trend: 'up' },
      repeatClients: { value: 87, change: 5.4, trend: 'up' },
      monthlyRevenue: { value: 42500, change: 23.1, trend: 'up' },
    },
    earnings: {
      monthly: [
        { month: 'Jan', amount: 32000, projects: 12, hours: 180 },
        { month: 'Feb', amount: 38500, projects: 15, hours: 220 },
        { month: 'Mar', amount: 45200, projects: 18, hours: 260 },
        { month: 'Apr', amount: 41800, projects: 16, hours: 240 },
        { month: 'May', amount: 48900, projects: 19, hours: 280 },
        { month: 'Jun', amount: 42500, projects: 17, hours: 250 },
      ],
      weekly: [
        { week: 'Week 1', amount: 12500, projects: 4 },
        { week: 'Week 2', amount: 15200, projects: 6 },
        { week: 'Week 3', amount: 8900, projects: 3 },
        { week: 'Week 4', amount: 18400, projects: 7 },
      ],
      categories: [
        { name: 'Smart Buildings', value: 35, amount: 87500, color: '#2196F3' },
        { name: 'IoT Systems', value: 25, amount: 62500, color: '#4CAF50' },
        { name: 'Consulting', value: 20, amount: 50000, color: '#FF9800' },
        { name: 'Emergency Repairs', value: 15, amount: 37500, color: '#F44336' },
        { name: 'Training', value: 5, amount: 12500, color: '#9C27B0' },
      ],
    },
    projects: {
      active: [
        {
          id: 1,
          title: 'Tesla Gigafactory Automation',
          client: 'Tesla Inc.',
          progress: 78,
          deadline: '2024-02-15',
          value: 45000,
          status: 'on_track',
          priority: 'high',
          team: ['John D.', 'Sarah M.', 'Mike R.'],
          nextMilestone: 'System Integration Testing',
        },
        {
          id: 2,
          title: 'Smart City Infrastructure',
          client: 'Singapore Government',
          progress: 45,
          deadline: '2024-03-20',
          value: 120000,
          status: 'at_risk',
          priority: 'critical',
          team: ['Emily S.', 'David L.', 'Anna K.', 'Tom W.'],
          nextMilestone: 'Phase 2 Design Review',
        },
        {
          id: 3,
          title: 'Renewable Energy Integration',
          client: 'Green Energy Corp',
          progress: 92,
          deadline: '2024-01-30',
          value: 28000,
          status: 'ahead',
          priority: 'medium',
          team: ['Lisa P.', 'Chris H.'],
          nextMilestone: 'Final Deployment',
        },
      ],
      completed: [
        {
          id: 4,
          title: 'SpaceX Mars Habitat Systems',
          client: 'SpaceX',
          completedDate: '2024-01-10',
          value: 75000,
          rating: 5.0,
          feedback: 'Exceptional work on Mars habitat life support systems.',
        },
        {
          id: 5,
          title: 'Apple Campus Smart Grid',
          client: 'Apple Inc.',
          completedDate: '2023-12-20',
          value: 95000,
          rating: 4.9,
          feedback: 'Revolutionary energy management implementation.',
        },
      ],
    },
    performance: {
      skills: [
        { name: 'IoT Integration', score: 98, trend: 'up', projects: 45 },
        { name: 'Smart Buildings', score: 96, trend: 'up', projects: 38 },
        { name: 'Project Management', score: 94, trend: 'stable', projects: 52 },
        { name: 'Team Leadership', score: 92, trend: 'up', projects: 41 },
        { name: 'Innovation', score: 97, trend: 'up', projects: 29 },
      ],
      ratings: {
        technical: 4.98,
        communication: 4.95,
        timeline: 4.97,
        quality: 4.99,
        collaboration: 4.93,
      },
      growth: [
        { month: 'Jan', technical: 4.85, communication: 4.82, quality: 4.88 },
        { month: 'Feb', technical: 4.89, communication: 4.87, quality: 4.91 },
        { month: 'Mar', technical: 4.93, communication: 4.90, quality: 4.94 },
        { month: 'Apr', technical: 4.95, communication: 4.92, quality: 4.96 },
        { month: 'May', technical: 4.97, communication: 4.94, quality: 4.98 },
        { month: 'Jun', technical: 4.98, communication: 4.95, quality: 4.99 },
      ],
    },
    analytics: {
      clientSources: [
        { source: 'Direct Referrals', count: 45, value: 125000 },
        { source: 'Platform Search', count: 38, value: 98000 },
        { source: 'Previous Clients', count: 52, value: 156000 },
        { source: 'Professional Network', count: 21, value: 67500 },
      ],
      projectTypes: [
        { type: 'New Construction', percentage: 35, growth: 12.5 },
        { type: 'Retrofits', percentage: 28, growth: 8.3 },
        { type: 'Maintenance', percentage: 20, growth: -2.1 },
        { type: 'Emergency', percentage: 12, growth: 15.7 },
        { type: 'Consulting', percentage: 5, growth: 22.4 },
      ],
    },
    notifications: [
      {
        id: 1,
        type: 'urgent',
        title: 'Project Deadline Approaching',
        message: 'Tesla Gigafactory project milestone due in 3 days',
        time: '5 min ago',
        action: 'View Project',
      },
      {
        id: 2,
        type: 'important',
        title: 'New High-Value Opportunity',
        message: 'Microsoft Azure Data Center - $150K project available',
        time: '1 hour ago',
        action: 'View Details',
      },
      {
        id: 3,
        type: 'success',
        title: 'Payment Received',
        message: '$25,000 payment for SpaceX project received',
        time: '2 hours ago',
        action: 'View Transaction',
      },
      {
        id: 4,
        type: 'default',
        title: 'New Message',
        message: 'Client feedback on Singapore Smart City project',
        time: '4 hours ago',
        action: 'Read Message',
      },
    ],
    quickActions: [
      { id: 1, title: 'Find New Projects', icon: <SearchIcon />, color: '#2196F3', count: 247 },
      { id: 2, title: 'Update Portfolio', icon: <EditIcon />, color: '#4CAF50', count: null },
      { id: 3, title: 'Client Messages', icon: <MessageIcon />, color: '#FF9800', count: 12 },
      { id: 4, title: 'Schedule Meeting', icon: <ScheduleIcon />, color: '#9C27B0', count: null },
      { id: 5, title: 'Generate Report', icon: <AssessmentIcon />, color: '#F44336', count: null },
      { id: 6, title: 'Skill Assessment', icon: <SchoolIcon />, color: '#00BCD4', count: 3 },
    ],
  };

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        newNotifications: Math.floor(Math.random() * 5),
        ongoingProjects: Math.floor(Math.random() * 50) + 100,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Data fetching simulation
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setDashboardData(mockDashboardData);
        setNotifications(mockDashboardData.notifications);
        setQuickActions(mockDashboardData.quickActions);
      } catch (error) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleQuickAction = (action) => {
    switch (action.id) {
      case 1:
        navigate('/find-work');
        break;
      case 2:
        navigate('/profile/portfolio');
        break;
      case 3:
        navigate('/messages');
        break;
      case 4:
        navigate('/schedule');
        break;
      case 5:
        setExportDialog(true);
        break;
      case 6:
        navigate('/skills-assessment');
        break;
      default:
        break;
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🔐 Please Sign In
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Access your personalized dashboard by signing in to your account.
        </Typography>
        <AnimatedButton
          variant="contained"
          size="large"
          onClick={() => navigate('/login')}
          magnetic
        >
          Sign In to Dashboard
        </AnimatedButton>
      </Container>
    );
  }

  if (loading) {
    return (
      <DashboardContainer>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <CircularProgress size={80} thickness={4} sx={{ mb: 4 }} />
              <Typography variant="h4" fontWeight={800} gutterBottom>
                🚀 Loading Your Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Preparing your personalized insights and analytics...
              </Typography>
            </motion.div>
          </Box>
        </Container>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            ⚠️ Dashboard Error
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            {error}
          </Typography>
          <AnimatedButton
            variant="contained"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            magnetic
          >
            Retry Loading
          </AnimatedButton>
        </Container>
      </DashboardContainer>
    );
  }

  // Enhanced overview section with real-time metrics
  const renderOverviewMetrics = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {[
        {
          title: 'Total Earnings',
          value: `$${dashboardData.overview.totalEarnings.value.toLocaleString()}`,
          change: dashboardData.overview.totalEarnings.change,
          icon: <MoneyIcon />,
          color: '#4CAF50',
          trend: dashboardData.overview.totalEarnings.trend,
          subtitle: 'This year',
        },
        {
          title: 'Active Projects',
          value: dashboardData.overview.activeProjects.value,
          change: dashboardData.overview.activeProjects.change,
          icon: <WorkIcon />,
          color: '#2196F3',
          trend: dashboardData.overview.activeProjects.trend,
          subtitle: 'In progress',
        },
        {
          title: 'Client Rating',
          value: `${dashboardData.overview.clientRating.value}/5.0`,
          change: dashboardData.overview.clientRating.change,
          icon: <StarIcon />,
          color: '#FFD700',
          trend: dashboardData.overview.clientRating.trend,
          subtitle: 'Average rating',
        },
        {
          title: 'Response Time',
          value: `${dashboardData.overview.responseTime.value}h`,
          change: dashboardData.overview.responseTime.change,
          icon: <SpeedIcon />,
          color: '#FF9800',
          trend: dashboardData.overview.responseTime.trend,
          subtitle: 'Average response',
        },
        {
          title: 'Success Rate',
          value: `${dashboardData.overview.successRate.value}%`,
          change: dashboardData.overview.successRate.change,
          icon: <CheckIcon />,
          color: '#9C27B0',
          trend: dashboardData.overview.successRate.trend,
          subtitle: 'Project completion',
        },
        {
          title: 'Monthly Revenue',
          value: `$${dashboardData.overview.monthlyRevenue.value.toLocaleString()}`,
          change: dashboardData.overview.monthlyRevenue.change,
          icon: <TrendingUpIcon />,
          color: '#00BCD4',
          trend: dashboardData.overview.monthlyRevenue.trend,
          subtitle: 'This month',
        },
      ].map((metric, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={metric.title}>
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <MetricCard
              color={metric.color}
              gradient
              glowing={index === 0}
              size="medium"
              onClick={() => setExpandedMetric(metric)}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Box sx={{ color: metric.color, fontSize: '2.5rem', mb: 1 }}>
                {metric.icon}
              </Box>
              
              <Typography 
                variant="h3" 
                fontWeight={900} 
                color={metric.color} 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.8rem', md: '2.2rem' },
                  animation: `${countUp} 0.8s ease-out`,
                }}
              >
                {metric.value}
              </Typography>
              
              <Typography 
                variant="h6" 
                fontWeight={800} 
                gutterBottom
                sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
              >
                {metric.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                {metric.trend === 'up' ? (
                  <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: '1.2rem', mr: 0.5 }} />
                ) : metric.trend === 'down' ? (
                  <TrendingDownIcon sx={{ color: '#F44336', fontSize: '1.2rem', mr: 0.5 }} />
                ) : (
                  <TrendingFlatIcon sx={{ color: '#FFA726', fontSize: '1.2rem', mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  fontWeight={700}
                  sx={{ 
                    color: metric.trend === 'up' ? '#4CAF50' : 
                           metric.trend === 'down' ? '#F44336' : '#FFA726'
                  }}
                >
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </Typography>
              </Box>
              
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                {metric.subtitle}
              </Typography>
            </MetricCard>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );

  // Enhanced earnings chart
  const renderEarningsChart = () => (
    <GlassCard variant="default" elevated>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            📈 Earnings Analytics
          </Typography>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon sx={{ animation: refreshing ? `${shimmer} 1s ease-in-out infinite` : 'none' }} />
            </IconButton>
          </Stack>
        </Box>

        <ChartContainer sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dashboardData.earnings.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
              <XAxis 
                dataKey="month" 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                fontWeight={600}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={12}
                fontWeight={600}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  borderRadius: 12,
                  fontWeight: 600,
                }}
                labelStyle={{ fontWeight: 800, color: theme.palette.text.primary }}
              />
              <Legend />
              <Bar 
                dataKey="amount" 
                fill={theme.palette.primary.main}
                radius={[4, 4, 0, 0]}
                name="Earnings ($)"
              />
              <Line 
                type="monotone" 
                dataKey="projects" 
                stroke={theme.palette.secondary.main}
                strokeWidth={3}
                dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 6 }}
                name="Projects"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </GlassCard>
  );

  // Enhanced project cards
  const renderActiveProjects = () => (
    <GlassCard variant="default" elevated>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            🚀 Active Projects
          </Typography>
          <AnimatedButton
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')}
          >
            New Project
          </AnimatedButton>
        </Box>

        <Stack spacing={3}>
          {dashboardData.projects.active.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <GlassCard 
                variant={
                  project.status === 'at_risk' ? 'error' :
                  project.status === 'ahead' ? 'success' : 'default'
                }
                interactive
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={800} gutterBottom>
                        {project.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {project.client}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={project.priority}
                        size="small"
                        color={
                          project.priority === 'critical' ? 'error' :
                          project.priority === 'high' ? 'warning' : 'default'
                        }
                        sx={{ fontWeight: 700, textTransform: 'uppercase' }}
                      />
                      <Typography variant="h6" fontWeight={800} color="success.main">
                        ${project.value.toLocaleString()}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Progress: {project.progress}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Due: {new Date(project.deadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.grey[300], 0.3),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: project.status === 'at_risk' ? '#F44336' :
                                   project.status === 'ahead' ? '#4CAF50' : theme.palette.primary.main,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Next: {project.nextMilestone}
                      </Typography>
                    </Box>
                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28 } }}>
                      {project.team.map((member, idx) => (
                        <Avatar key={idx} sx={{ bgcolor: theme.palette.secondary.main, fontSize: '0.75rem' }}>
                          {member.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                  </Box>
                </CardContent>
              </GlassCard>
            </motion.div>
          ))}
        </Stack>
      </CardContent>
    </GlassCard>
  );

  // Performance analytics
  const renderPerformanceAnalytics = () => (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <GlassCard variant="default" elevated>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              🎯 Skills Performance
            </Typography>
            
            <Stack spacing={3}>
              {dashboardData.performance.skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" fontWeight={700}>
                        {skill.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={800} color="primary.main">
                          {skill.score}/100
                        </Typography>
                        {skill.trend === 'up' ? (
                          <TrendingUpIcon sx={{ color: '#4CAF50', fontSize: '1rem' }} />
                        ) : skill.trend === 'down' ? (
                          <TrendingDownIcon sx={{ color: '#F44336', fontSize: '1rem' }} />
                        ) : (
                          <TrendingFlatIcon sx={{ color: '#FFA726', fontSize: '1rem' }} />
                        )}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={skill.score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.grey[300], 0.2),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {skill.projects} projects completed
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </CardContent>
        </GlassCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <GlassCard variant="default" elevated>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              ⭐ Rating Breakdown
            </Typography>
            
            <Stack spacing={2}>
              {Object.entries(dashboardData.performance.ratings).map(([category, rating], index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}>
                    <Typography variant="body1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                      {category}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={rating} precision={0.1} size="small" readOnly />
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {rating}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </CardContent>
        </GlassCard>
      </Grid>
    </Grid>
  );

  // Quick actions section
  const renderQuickActions = () => (
    <GlassCard variant="default" elevated>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 3 }}>
          ⚡ Quick Actions
        </Typography>
        
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={6} sm={4} md={2} key={action.id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <QuickActionCard
                  color={action.color}
                  onClick={() => handleQuickAction(action)}
                >
                  <NotificationBadge 
                    badgeContent={action.count} 
                    variant={action.id === 2 ? 'urgent' : 'default'}
                    sx={{ mb: 2 }}
                  >
                    <Box sx={{ color: action.color, fontSize: '2.5rem' }}>
                      {action.icon}
                    </Box>
                  </NotificationBadge>
                  
                  <Typography 
                    variant="body2" 
                    fontWeight={700} 
                    textAlign="center"
                    sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' } }}
                  >
                    {action.title}
                  </Typography>
                </QuickActionCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </GlassCard>
  );

  // Notifications section
  const renderNotifications = () => (
    <GlassCard variant="default" elevated>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>
            🔔 Recent Notifications
          </Typography>
          <AnimatedButton
            variant="outlined"
            size="small"
            onClick={() => navigate('/notifications')}
          >
            View All
          </AnimatedButton>
        </Box>

        <Stack spacing={2}>
          {notifications.slice(0, 4).map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(
                  notification.type === 'urgent' ? '#FF4444' :
                  notification.type === 'important' ? '#FFA726' :
                  notification.type === 'success' ? '#66BB6A' :
                  theme.palette.primary.main, 0.05
                ),
                border: `1px solid ${alpha(
                  notification.type === 'urgent' ? '#FF4444' :
                  notification.type === 'important' ? '#FFA726' :
                  notification.type === 'success' ? '#66BB6A' :
                  theme.palette.primary.main, 0.2
                )}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(
                    notification.type === 'urgent' ? '#FF4444' :
                    notification.type === 'important' ? '#FFA726' :
                    notification.type === 'success' ? '#66BB6A' :
                    theme.palette.primary.main, 0.1
                  ),
                  transform: 'translateX(4px)',
                },
              }}>
                <Box sx={{ 
                  color: notification.type === 'urgent' ? '#FF4444' :
                         notification.type === 'important' ? '#FFA726' :
                         notification.type === 'success' ? '#66BB6A' :
                         theme.palette.primary.main,
                  fontSize: '1.5rem',
                  mt: 0.5,
                }}>
                  {notification.type === 'urgent' ? <WarningIcon /> :
                   notification.type === 'important' ? <InfoIcon /> :
                   notification.type === 'success' ? <CheckIcon /> :
                   <NotificationsIcon />}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={800} gutterBottom>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {notification.message}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {notification.time}
                    </Typography>
                    <Button
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        color: notification.type === 'urgent' ? '#FF4444' :
                               notification.type === 'important' ? '#FFA726' :
                               notification.type === 'success' ? '#66BB6A' :
                               theme.palette.primary.main,
                      }}
                    >
                      {notification.action}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Stack>
      </CardContent>
    </GlassCard>
  );

  return (
    <>
      <Helmet>
        <title>Professional Dashboard - Analytics & Insights | Kelmah</title>
        <meta name="description" content="Comprehensive dashboard with real-time analytics, project management, earnings tracking, and performance insights for professional growth." />
        <meta name="keywords" content="dashboard, analytics, project management, earnings, performance, professional insights" />
        <meta property="og:title" content="Professional Dashboard - Advanced Analytics | Kelmah" />
        <meta property="og:description" content="Track your professional growth with comprehensive analytics, real-time insights, and advanced project management tools." />
        <link rel="canonical" href="https://kelmah.com/dashboard" />
      </Helmet>

      <DashboardContainer>
        <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Box sx={{ mb: 6 }}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography 
                    variant="h2" 
                    fontWeight={900}
                    sx={{ 
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2,
                    }}
                  >
                    Welcome back, {user?.firstName || 'Professional'}! 🚀
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: { xs: '1.1rem', md: '1.3rem' },
                      mb: 3,
                    }}
                  >
                    Here's your comprehensive performance overview and insights
                  </Typography>
                  
                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={`💰 $${dashboardData.overview.monthlyRevenue.value.toLocaleString()} this month`}
                      sx={{ 
                        bgcolor: alpha('#4CAF50', 0.1), 
                        color: '#4CAF50', 
                        fontWeight: 800,
                        fontSize: '0.9rem',
                      }}
                    />
                    <Chip
                      label={`⭐ ${dashboardData.overview.clientRating.value}/5.0 rating`}
                      sx={{ 
                        bgcolor: alpha('#FFD700', 0.1), 
                        color: '#FF8F00', 
                        fontWeight: 800,
                        fontSize: '0.9rem',
                      }}
                    />
                    <Chip
                      label={`🚀 ${dashboardData.overview.activeProjects.value} active projects`}
                      sx={{ 
                        bgcolor: alpha('#2196F3', 0.1), 
                        color: '#2196F3', 
                        fontWeight: 800,
                        fontSize: '0.9rem',
                      }}
                    />
                  </Stack>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                      <AnimatedButton
                        variant="contained"
                        size="large"
                        startIcon={<AnalyticsIcon />}
                        onClick={() => setExportDialog(true)}
                        magnetic
                      >
                        Generate Report
                      </AnimatedButton>
                      <AnimatedButton
                        variant="outlined"
                        size="large"
                        startIcon={<SettingsIcon />}
                        onClick={() => setSettingsDialog(true)}
                      >
                        Settings
                      </AnimatedButton>
                    </Stack>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Last updated: {new Date().toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Paper 
              elevation={8} 
              sx={{ 
                borderRadius: 4, 
                overflow: 'hidden',
                bgcolor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                mb: 4,
              }}
            >
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                variant={isMobile ? "scrollable" : "fullWidth"}
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    minHeight: 64,
                    '&.Mui-selected': {
                      color: theme.palette.secondary.main,
                    },
                  },
                  '& .MuiTabs-indicator': {
                    height: 4,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              >
                <Tab label="📊 Overview" />
                <Tab label="💰 Earnings" />
                <Tab label="🚀 Projects" />
                <Tab label="📈 Performance" />
                <Tab label="⚡ Actions" />
              </Tabs>
            </Paper>
          </motion.div>

          {/* Tab Content */}
          <TabPanel value={tabValue} index={0}>
            {renderOverviewMetrics()}
            <Grid container spacing={4}>
              <Grid item xs={12} lg={8}>
                {renderEarningsChart()}
              </Grid>
              <Grid item xs={12} lg={4}>
                {renderNotifications()}
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {renderEarningsChart()}
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <GlassCard variant="success" elevated>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight={800} gutterBottom>
                        📊 Earnings by Category
                      </Typography>
                      <ChartContainer sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dashboardData.earnings.categories}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}%`}
                            >
                              {dashboardData.earnings.categories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </GlassCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <GlassCard variant="premium" elevated>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight={800} gutterBottom>
                        💎 Premium Insights
                      </Typography>
                      <Stack spacing={3}>
                        {dashboardData.earnings.categories.map((category, index) => (
                          <Box key={category.name} sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            bgcolor: alpha(category.color, 0.1),
                            border: `1px solid ${alpha(category.color, 0.3)}`,
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body1" fontWeight={800}>
                                {category.name}
                              </Typography>
                              <Typography variant="h6" fontWeight={800} sx={{ color: category.color }}>
                                ${category.amount.toLocaleString()}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={category.value}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(category.color, 0.2),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: category.color,
                                },
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </GlassCard>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {renderActiveProjects()}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {renderPerformanceAnalytics()}
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            {renderQuickActions()}
          </TabPanel>
        </Container>

        {/* Export Dialog */}
        <Dialog
          open={exportDialog}
          onClose={() => setExportDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.95)})`,
              backdropFilter: 'blur(30px)',
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
            <Typography variant="h4" fontWeight={800}>
              📊 Export Dashboard Report
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Generate a comprehensive report of your dashboard analytics and performance metrics.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select defaultValue="comprehensive" label="Report Type">
                    <MenuItem value="comprehensive">Comprehensive Report</MenuItem>
                    <MenuItem value="earnings">Earnings Only</MenuItem>
                    <MenuItem value="projects">Projects Only</MenuItem>
                    <MenuItem value="performance">Performance Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select defaultValue="pdf" label="Format">
                    <MenuItem value="pdf">PDF Report</MenuItem>
                    <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                    <MenuItem value="csv">CSV Data</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 0 }}>
            <AnimatedButton
              variant="outlined"
              onClick={() => setExportDialog(false)}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                setExportDialog(false);
                // Handle export logic
              }}
              magnetic
            >
              Generate Report
            </AnimatedButton>
          </DialogActions>
        </Dialog>
      </DashboardContainer>
    </>
  );
};

export default EnhancedDashboard; 