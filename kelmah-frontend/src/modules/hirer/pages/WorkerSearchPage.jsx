import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Breadcrumbs,
  Link,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  CircularProgress,
  Pagination,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,`r`n  alpha,`n  alpha,

  Autocomplete,
  Skeleton,
  CardActions,
  IconButton,
  Stack,
  Divider,
  Collapse,
  Fab,
  Badge,
  Tooltip,
  useMediaQuery,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AvatarGroup,
  ButtonGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Search,
  Star,
  TrendingUp,
  CheckCircle,
  Group,
  WorkspacePremium,
  LocationOn,
  Schedule,
  MonetizationOn,
  ExpandMore,
  ExpandLess,
  Tune,
  Clear,
  FilterList,
  Verified,
  Phone,
  Email,
  Work as Portfolio,
  EmojiEvents,
  SearchOff as SearchOffIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Map as MapIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  MyLocation as MyLocationIcon,
  Psychology as PsychologyIcon,
  Build as BuildIcon,
  Engineering as EngineeringIcon,
  Construction as ConstructionIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Home as HomeIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  ShowChart as TimelineIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  Whatshot as WhatshotIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  CardMembership as CertificateIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  AccessTime as AccessTimeIcon,
  MoneyOff as MoneyOffIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  ContactPhone as ContactPhoneIcon,
  VideoCall as VideoCallIcon,
  Chat as ChatIcon,
  Handshake as HandshakeIcon,
  ThumbUp as ThumbUpIcon,
  Refresh as RefreshIcon,
  SaveAlt as SaveAltIcon,
  GetApp as GetAppIcon,
  CloudDownload as CloudDownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Explore as ExploreIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import searchService from '../../search/services/searchService';
import { hirerService } from '../services/hirerService';
import { useAuth } from '../../auth/contexts/AuthContext';

// Advanced Animations for Talent Discovery
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-15px) rotate(2deg); }
  50% { transform: translateY(-25px) rotate(0deg); }
  75% { transform: translateY(-15px) rotate(-2deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
  50% { transform: scale(1.1); box-shadow: 0 0 0 20px rgba(212, 175, 55, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
`;

const slideInUp = keyframes`
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(360deg); }
`;

const rotateGlow = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); }
  14% { transform: scale(1.15); }
  28% { transform: scale(1); }
  42% { transform: scale(1.15); }
  70% { transform: scale(1); }
`;

const magneticHover = keyframes`
  0% { transform: translate(0, 0); }
  25% { transform: translate(2px, -2px); }
  50% { transform: translate(-2px, 2px); }
  75% { transform: translate(2px, 2px); }
  100% { transform: translate(0, 0); }
`;

// Professional Styled Components for Talent Discovery
const HeroGradientSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 20%,
    ${theme.palette.primary.dark} 40%,
    ${theme.palette.secondary.dark} 60%,
    ${theme.palette.primary.main} 80%,
    ${theme.palette.secondary.main} 100%)`,
  backgroundSize: '600% 600%',
  animation: `${gradientShift} 25s ease infinite`,
  color: 'white',
  padding: theme.spacing(14, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '95vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 30% 70%, ${alpha('#4ECDC4', 0.4)} 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, ${alpha('#FFD700', 0.4)} 0%, transparent 50%),
                radial-gradient(circle at 20% 20%, ${alpha('#FF6B6B', 0.3)} 0%, transparent 60%),
                radial-gradient(circle at 80% 80%, ${alpha('#9B59B6', 0.3)} 0%, transparent 60%)`,
    animation: `${float} 30s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-40%',
    left: '-40%',
    width: '180%',
    height: '180%',
    background: `conic-gradient(from 30deg at 50% 50%, 
      transparent 0deg, 
      ${alpha('#FFD700', 0.2)} 60deg, 
      transparent 120deg,
      ${alpha('#4ECDC4', 0.2)} 180deg,
      transparent 240deg,
      ${alpha('#FF6B6B', 0.2)} 300deg,
      transparent 360deg)`,
    animation: `${rotateGlow} 50s linear infinite`,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '80vh',
    padding: theme.spacing(12, 0),
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: '70vh',
    padding: theme.spacing(10, 0),
  },
}));

const GlassCard = styled(Card)(({ theme, variant = 'default', featured = false, premium = false, verified = false }) => ({
  background: variant === 'glass' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.92)})`
    : featured 
    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.08)})`
    : premium
    ? `linear-gradient(135deg, ${alpha('#9C27B0', 0.08)}, ${alpha('#673AB7', 0.08)})`
    : theme.palette.background.paper,
  backdropFilter: variant === 'glass' ? 'blur(30px)' : 'blur(20px)',
  border: featured 
    ? `3px solid ${theme.palette.secondary.main}` 
    : premium
    ? `3px solid #9C27B0`
    : verified
    ? `2px solid ${theme.palette.success.main}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 32,
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-20px) scale(1.03) rotateY(5deg)',
    boxShadow: featured 
      ? `0 40px 80px ${alpha(theme.palette.secondary.main, 0.4)}, 0 25px 50px ${alpha(theme.palette.primary.main, 0.2)}`
      : premium
      ? `0 35px 70px ${alpha('#9C27B0', 0.4)}`
      : verified
      ? `0 30px 60px ${alpha(theme.palette.success.main, 0.3)}`
      : `0 32px 64px ${alpha(theme.palette.common.black, 0.15)}`,
    borderColor: featured ? theme.palette.secondary.main : premium ? '#9C27B0' : theme.palette.secondary.main,
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
    background: featured
      ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.2)}, transparent)`
      : premium
      ? `linear-gradient(90deg, transparent, ${alpha('#9C27B0', 0.2)}, transparent)`
      : `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.15)}, transparent)`,
    transition: 'left 0.8s, opacity 0.3s',
    opacity: 0,
  },
  '&:hover::before': {
    left: '100%',
    opacity: 1,
  },
}));

const ProfessionalCard = styled(GlassCard)(({ theme, featured, premium, topRated, verified }) => ({
  height: '100%',
  position: 'relative',
  background: featured 
    ? `linear-gradient(135deg, 
        ${alpha(theme.palette.secondary.main, 0.12)} 0%, 
        ${alpha(theme.palette.primary.main, 0.12)} 50%,
        ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
    : premium
    ? `linear-gradient(135deg, 
        ${alpha('#9C27B0', 0.1)} 0%, 
        ${alpha('#673AB7', 0.1)} 100%)`
    : topRated
    ? `linear-gradient(135deg, 
        ${alpha('#FFD700', 0.08)} 0%, 
        ${alpha('#FFA500', 0.08)} 100%)`
    : theme.palette.background.paper,
  border: featured 
    ? `3px solid ${theme.palette.secondary.main}`
    : premium
    ? `3px solid #9C27B0`
    : topRated
    ? `3px solid #FFD700`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': premium ? {
    content: '"👑 PREMIUM TALENT"',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    background: `linear-gradient(90deg, #9C27B0, #673AB7)`,
    color: 'white',
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: 900,
    padding: '10px 0',
    letterSpacing: '1.5px',
    boxShadow: `0 6px 18px ${alpha('#9C27B0', 0.3)}`,
    animation: `${sparkle} 3s ease-in-out infinite`,
  } : featured ? {
    content: '"⭐ FEATURED PROFESSIONAL"',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
    color: 'white',
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 900,
    padding: '8px 0',
    letterSpacing: '1.2px',
    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
  } : topRated ? {
    content: '"🏆 TOP RATED EXPERT"',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    background: `linear-gradient(90deg, #FFD700, #FFA500)`,
    color: 'white',
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 900,
    padding: '8px 0',
    letterSpacing: '1.2px',
    boxShadow: `0 4px 12px ${alpha('#FFD700', 0.3)}`,
    animation: `${pulse} 2s ease-in-out infinite`,
  } : {},
}));

const SearchInterface = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  zIndex: 1300,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.95)})`,
  backdropFilter: 'blur(40px)',
  borderRadius: 36,
  padding: theme.spacing(5),
  border: `3px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
  boxShadow: `0 24px 72px ${alpha(theme.palette.common.black, 0.12)}, 0 16px 48px ${alpha(theme.palette.secondary.main, 0.1)}`,
  margin: theme.spacing(4, 0),
  transition: 'all 0.4s ease',
  '&:hover': {
    borderColor: theme.palette.secondary.main,
    boxShadow: `0 28px 84px ${alpha(theme.palette.common.black, 0.15)}, 0 20px 60px ${alpha(theme.palette.secondary.main, 0.2)}`,
    transform: 'translateY(-6px)',
  },
}));

const SkillChip = styled(Chip)(({ theme, level, expertise }) => {
  const getSkillColor = () => {
    switch (level || expertise) {
      case 'expert': return theme.palette.error.main;
      case 'advanced': return theme.palette.warning.main;
      case 'intermediate': return theme.palette.info.main;
      case 'beginner': return theme.palette.success.main;
      default: return theme.palette.secondary.main;
    }
  };

  const skillColor = getSkillColor();

  return {
    borderRadius: 28,
    fontWeight: 800,
    fontSize: '0.9rem',
    minHeight: 40,
    background: alpha(skillColor, 0.12),
    color: skillColor,
    border: `2px solid ${alpha(skillColor, 0.3)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      background: alpha(skillColor, 0.2),
      transform: 'translateY(-3px) scale(1.08)',
      boxShadow: `0 12px 24px ${alpha(skillColor, 0.3)}`,
      borderColor: skillColor,
      '&::before': {
        opacity: 1,
      },
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(45deg, ${alpha(skillColor, 0.1)}, ${alpha(skillColor, 0.2)})`,
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:active': {
      transform: 'translateY(-1px) scale(1.02)',
    },
  };
});

const AnimatedButton = styled(Button)(({ theme, variant = 'contained', size = 'medium', magnetic = false }) => ({
  borderRadius: size === 'large' ? 36 : size === 'small' ? 20 : 32,
  padding: size === 'large' 
    ? theme.spacing(3, 7) 
    : size === 'small' 
    ? theme.spacing(1, 3) 
    : theme.spacing(2, 5),
  fontWeight: 900,
  fontSize: size === 'large' ? '1.3rem' : size === 'small' ? '0.85rem' : '1.1rem',
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  background: variant === 'contained' 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.dark} 100%)`
    : 'transparent',
  border: variant === 'outlined' 
    ? `3px solid ${theme.palette.secondary.main}` 
    : 'none',
  color: variant === 'contained' ? 'white' : theme.palette.secondary.main,
  boxShadow: variant === 'contained' 
    ? `0 12px 36px ${alpha(theme.palette.secondary.main, 0.3)}` 
    : 'none',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.05)',
    boxShadow: variant === 'contained' 
      ? `0 24px 60px ${alpha(theme.palette.secondary.main, 0.4)}` 
      : `0 16px 40px ${alpha(theme.palette.secondary.main, 0.2)}`,
    background: variant === 'outlined' 
      ? alpha(theme.palette.secondary.main, 0.1) 
      : `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.main} 100%)`,
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
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.6)}, transparent)`,
    transition: 'left 0.8s',
  },
  '&:active': {
    transform: 'translateY(-4px) scale(1.02)',
  },
  ...(magnetic && {
    '&:hover': {
      animation: `${magneticHover} 0.6s ease-in-out infinite`,
    },
  }),
}));

const StatCard = styled(motion.div)(({ theme, gradient = 'primary', glowing = false }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.92)})`,
  backdropFilter: 'blur(30px)',
  borderRadius: 32,
  padding: theme.spacing(5),
  textAlign: 'center',
  border: `3px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-16px) scale(1.1) rotateY(8deg)',
    boxShadow: `0 32px 64px ${alpha(theme.palette.secondary.main, 0.3)}`,
    borderColor: theme.palette.secondary.main,
    '&::after': {
      opacity: 1,
    },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '150px',
    height: '150px',
    background: gradient === 'primary' 
      ? `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.25)} 0%, transparent 70%)`
      : gradient === 'success'
      ? `radial-gradient(circle, ${alpha('#4CAF50', 0.25)} 0%, transparent 70%)`
      : gradient === 'error'
      ? `radial-gradient(circle, ${alpha('#F44336', 0.25)} 0%, transparent 70%)`
      : `radial-gradient(circle, ${alpha('#2196F3', 0.25)} 0%, transparent 70%)`,
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.5s ease',
  },
  ...(glowing && {
    animation: `${pulse} 3s ease-in-out infinite`,
  }),
}));

const InteractiveIcon = styled(Box)(({ theme, color = theme.palette.secondary.main, size = 'large', animated = false }) => ({
  color: color,
  fontSize: size === 'large' ? '5rem' : size === 'medium' ? '3.5rem' : '2.5rem',
  marginBottom: theme.spacing(3),
  transition: 'all 0.5s ease',
  filter: `drop-shadow(0 12px 24px ${alpha(color, 0.3)})`,
  '&:hover': {
    transform: 'scale(1.4) rotate(20deg)',
    filter: `drop-shadow(0 16px 32px ${alpha(color, 0.4)})`,
  },
  ...(animated && {
    animation: `${float} 4s ease-in-out infinite`,
  }),
}));

const GradientText = styled(Typography)(({ theme, gradient = 'primary' }) => ({
  background: gradient === 'primary' 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`
    : gradient === 'success'
    ? `linear-gradient(135deg, #4CAF50, #8BC34A)`
    : gradient === 'error'
    ? `linear-gradient(135deg, #F44336, #FF5722)`
    : gradient === 'info'
    ? `linear-gradient(135deg, #2196F3, #03DAC6)`
    : gradient === 'warning'
    ? `linear-gradient(135deg, #FF9800, #FFC107)`
    : `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 900,
}));

// Enhanced sample data with world-class professional profiles
const creativeProfessionals = [
  {
    id: 'elite-pro-1',
    name: 'Dr. Alexandra Chen',
    title: '🚀 Aerospace Systems Engineer & Smart Building Architect',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    rating: 4.99,
    reviewCount: 847,
    skills: [
      { name: 'Aerospace Engineering', level: 'expert', yearsExp: 15 },
      { name: 'Smart Building Systems', level: 'expert', yearsExp: 12 },
      { name: 'IoT Integration', level: 'expert', yearsExp: 10 },
      { name: 'Project Leadership', level: 'expert', yearsExp: 18 },
      { name: 'Sustainable Design', level: 'advanced', yearsExp: 8 },
    ],
    location: 'San Francisco Bay Area, CA',
    hourlyRate: 185,
    completedJobs: 1240,
    responseTime: '< 5 min',
    verified: true,
    premium: true,
    topRated: true,
    description: 'Former SpaceX senior engineer turned smart building pioneer. PhD in Aerospace Engineering with 15+ years revolutionizing both space systems and terrestrial infrastructure. Led $500M+ projects including Mars habitat prototypes and smart city initiatives.',
    availability: 'Available for premium projects',
    specialties: ['Space Technology', 'Smart Cities', 'Sustainable Engineering', 'AI Integration'],
    certifications: ['PhD Aerospace Engineering', 'LEED AP BD+C', 'PMP', 'AI Systems Certified'],
    portfolioImages: 45,
    languages: ['English', 'Mandarin', 'Spanish', 'German'],
    successRate: 99.8,
    repeatClients: 94,
    featured: true,
    badges: ['Genius Level', 'Innovation Leader', 'Top 0.1%', 'Mission Critical'],
    achievements: [
      'Led SpaceX Starship interior systems design',
      'Designed first carbon-neutral smart campus',
      'Patent holder: 23 breakthrough technologies',
      'TEDx speaker: Future of Smart Infrastructure'
    ],
    workHistory: [
      { company: 'SpaceX', role: 'Senior Systems Engineer', years: '2018-2023', projects: 47 },
      { company: 'Tesla Energy', role: 'Smart Grid Architect', years: '2015-2018', projects: 23 },
      { company: 'Apple', role: 'Advanced R&D Engineer', years: '2012-2015', projects: 31 },
    ],
    clientTestimonials: [
      { client: 'NASA JPL', text: 'Alexandra delivered beyond our wildest expectations. Her Mars habitat design will shape the future of space exploration.', rating: 5 },
      { client: 'Google X', text: 'Visionary engineer who thinks decades ahead. Her smart city prototype is revolutionary.', rating: 5 },
    ],
    currentProjects: ['Mars Habitat Systems', 'AI-Powered Smart Cities', 'Quantum Computing Integration'],
    nextAvailable: '2024-03-15',
    timeZone: 'PST',
    preferredProjectSize: 'Large ($100K+)',
    collaborationStyle: 'Hybrid leadership with hands-on execution',
    innovationScore: 98,
    leadershipScore: 96,
    technicalScore: 99,
    communicationScore: 95,
  },
  {
    id: 'elite-pro-2',
    name: 'Marcus Rodriguez',
    title: '⚡ Master Electrician & Renewable Energy Visionary',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    rating: 4.97,
    reviewCount: 1203,
    skills: [
      { name: 'Advanced Electrical Systems', level: 'expert', yearsExp: 20 },
      { name: 'Solar & Wind Integration', level: 'expert', yearsExp: 15 },
      { name: 'Smart Grid Technology', level: 'expert', yearsExp: 12 },
      { name: 'Energy Storage Systems', level: 'expert', yearsExp: 10 },
      { name: 'Industrial Automation', level: 'advanced', yearsExp: 18 },
    ],
    location: 'Austin, TX',
    hourlyRate: 145,
    completedJobs: 2156,
    responseTime: '< 10 min',
    verified: true,
    premium: false,
    topRated: true,
    description: 'Renewable energy pioneer with 20+ years transforming how we power the world. Master electrician who\'s installed over 500 MW of clean energy systems. From Tesla Gigafactories to remote island microgrids.',
    availability: 'Available',
    specialties: ['Clean Energy Systems', 'Grid Integration', 'Industrial Scale Projects', 'Emergency Power'],
    certifications: ['Master Electrician License', 'NABCEP Solar Installer', 'Tesla Powerwall Certified', 'Wind Turbine Technician'],
    portfolioImages: 67,
    languages: ['English', 'Spanish'],
    successRate: 99.4,
    repeatClients: 87,
    featured: true,
    badges: ['Clean Energy Expert', 'Master Craftsman', 'Innovation Pioneer', 'Sustainability Champion'],
    achievements: [
      'Installed 500+ MW renewable energy systems',
      'Tesla Gigafactory lead electrician',
      'Designed off-grid systems for 50+ communities',
      'Clean Energy Innovator Award 2023'
    ],
    workHistory: [
      { company: 'Tesla Energy', role: 'Senior Installation Lead', years: '2020-Present', projects: 89 },
      { company: 'SunPower Corporation', role: 'Master Electrician', years: '2015-2020', projects: 156 },
      { company: 'GE Renewable Energy', role: 'Field Engineer', years: '2010-2015', projects: 203 },
    ],
    clientTestimonials: [
      { client: 'Tesla Energy', text: 'Marcus is the gold standard. His work on our Gigafactory exceeded all expectations.', rating: 5 },
      { client: 'Hawaiian Electric', text: 'Transformed our entire grid infrastructure. Brilliant engineer and leader.', rating: 5 },
    ],
    currentProjects: ['Utility-Scale Solar Farms', 'Smart Grid Modernization', 'Battery Storage Integration'],
    nextAvailable: '2024-02-20',
    timeZone: 'CST',
    preferredProjectSize: 'Medium to Large ($50K-$500K)',
    collaborationStyle: 'Technical leadership with team mentoring',
    innovationScore: 94,
    leadershipScore: 91,
    technicalScore: 98,
    communicationScore: 93,
  },
  {
    id: 'elite-pro-3',
    name: 'Isabella Martinez',
    title: '🎨 Luxury Interior Architect & Sustainable Design Pioneer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    rating: 4.96,
    reviewCount: 692,
    skills: [
      { name: 'Luxury Interior Design', level: 'expert', yearsExp: 14 },
      { name: 'Sustainable Architecture', level: 'expert', yearsExp: 12 },
      { name: 'Custom Furniture Design', level: 'expert', yearsExp: 16 },
      { name: '3D Visualization & VR', level: 'advanced', yearsExp: 8 },
      { name: 'Biophilic Design', level: 'expert', yearsExp: 10 },
    ],
    location: 'Miami, FL',
    hourlyRate: 125,
    completedJobs: 456,
    responseTime: '< 15 min',
    verified: true,
    premium: true,
    topRated: false,
    description: 'Award-winning luxury interior architect creating breathtaking spaces that heal both people and planet. Featured in Architectural Digest, Elle Decor, and Dezeen. Specialist in biophilic design and sustainable luxury.',
    availability: 'Selective projects only',
    specialties: ['Luxury Hospitality', 'Sustainable Luxury', 'Biophilic Spaces', 'Custom Art Integration'],
    certifications: ['NCIDQ Certified', 'LEED AP ID+C', 'Biophilic Design Certified', 'Fine Arts Masters'],
    portfolioImages: 128,
    languages: ['English', 'Spanish', 'Portuguese', 'Italian'],
    successRate: 98.9,
    repeatClients: 76,
    featured: false,
    badges: ['Design Visionary', 'Sustainability Leader', 'Luxury Specialist', 'Award Winner'],
    achievements: [
      'Architectural Digest Designer of the Year 2023',
      'Designed interiors for 5-star resorts worldwide',
      'Sustainable Design Innovation Award',
      'Featured in 50+ international publications'
    ],
    workHistory: [
      { company: 'Four Seasons Hotels', role: 'Lead Interior Architect', years: '2019-Present', projects: 23 },
      { company: 'Ritz-Carlton', role: 'Senior Designer', years: '2016-2019', projects: 31 },
      { company: 'Philippe Starck Studio', role: 'Design Architect', years: '2012-2016', projects: 45 },
    ],
    clientTestimonials: [
      { client: 'Four Seasons Maldives', text: 'Isabella created paradise on earth. Her biophilic design approach is revolutionary.', rating: 5 },
      { client: 'Private Estate Owner', text: 'Transformed our home into a sustainable luxury masterpiece. Pure artistry.', rating: 5 },
    ],
    currentProjects: ['Eco-Luxury Resort Design', 'Sustainable Yacht Interiors', 'Biophilic Office Spaces'],
    nextAvailable: '2024-04-10',
    timeZone: 'EST',
    preferredProjectSize: 'Large luxury projects ($200K+)',
    collaborationStyle: 'Creative partnership with client vision integration',
    innovationScore: 97,
    leadershipScore: 88,
    technicalScore: 94,
    communicationScore: 96,
  },
  {
    id: 'elite-pro-4',
    name: 'Dr. James Thompson',
    title: '🏗️ Construction Technology Pioneer & Smart Infrastructure Expert',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.94,
    reviewCount: 389,
    skills: [
      { name: 'Advanced Construction Tech', level: 'expert', yearsExp: 18 },
      { name: 'Smart Infrastructure', level: 'expert', yearsExp: 15 },
      { name: 'Robotics & Automation', level: 'expert', yearsExp: 12 },
      { name: 'Sustainable Construction', level: 'expert', yearsExp: 16 },
      { name: 'AI-Driven Project Management', level: 'advanced', yearsExp: 8 },
    ],
    location: 'Seattle, WA',
    hourlyRate: 165,
    completedJobs: 234,
    responseTime: '< 30 min',
    verified: true,
    premium: true,
    topRated: true,
    description: 'PhD in Construction Engineering leading the industry into the future. Pioneer in robotic construction, AI project management, and smart building systems. Consultant for major tech companies and government infrastructure projects.',
    availability: 'Available for breakthrough projects',
    specialties: ['Robotic Construction', 'Smart Cities', 'AI Project Management', 'Future Technologies'],
    certifications: ['PhD Construction Engineering', 'LEED AP BD+C', 'PMP', 'Robotics Engineering Certified'],
    portfolioImages: 89,
    languages: ['English', 'Japanese', 'German'],
    successRate: 97.8,
    repeatClients: 82,
    featured: true,
    badges: ['Technology Pioneer', 'PhD Expert', 'Future Builder', 'Innovation Catalyst'],
    achievements: [
      'Built first fully robotic construction site',
      'AI project management system adopted industry-wide',
      'Designed smart infrastructure for 3 major cities',
      'MIT Technology Review Innovator Under 35'
    ],
    workHistory: [
      { company: 'Boston Dynamics Construction', role: 'Chief Technology Officer', years: '2020-Present', projects: 15 },
      { company: 'Google X', role: 'Construction Innovation Lead', years: '2017-2020', projects: 28 },
      { company: 'Skanska Future Living Institute', role: 'Research Director', years: '2014-2017', projects: 42 },
    ],
    clientTestimonials: [
      { client: 'City of Singapore', text: 'Dr. Thompson\'s smart infrastructure design will serve as the global standard.', rating: 5 },
      { client: 'Amazon', text: 'Revolutionary approach to automated construction. Reduced costs by 40% and timeline by 60%.', rating: 5 },
    ],
    currentProjects: ['Autonomous Construction Systems', 'Smart City Infrastructure', 'Mars Habitat Construction'],
    nextAvailable: '2024-05-01',
    timeZone: 'PST',
    preferredProjectSize: 'Mega projects ($1M+)',
    collaborationStyle: 'Strategic leadership with cutting-edge innovation',
    innovationScore: 99,
    leadershipScore: 95,
    technicalScore: 97,
    communicationScore: 89,
  },
];

const talentCategories = [
  { 
    name: 'Electrical', 
    icon: <ElectricalIcon />, 
    count: 24580, 
    color: '#FFD700', 
    trending: true,
    description: 'Smart systems experts & renewable energy pioneers',
    avgRate: '$95/hr',
    topTalent: 156,
    demandLevel: 'Explosive',
    growthRate: '+34%',
    specialties: ['Smart Home Tech', 'Solar Systems', 'Industrial Automation', 'Grid Integration'],
    skillsInDemand: ['IoT Integration', 'Battery Systems', 'Smart Grid', 'Renewable Energy'],
  },
  { 
    name: 'Plumbing', 
    icon: <PlumbingIcon />, 
    count: 18920, 
    color: '#4A90E2', 
    hot: true,
    description: 'Water systems engineers & emergency response specialists',
    avgRate: '$78/hr',
    topTalent: 124,
    demandLevel: 'Very High',
    growthRate: '+26%',
    specialties: ['Green Plumbing', 'Emergency Services', 'Water Treatment', 'System Design'],
    skillsInDemand: ['Sustainable Systems', 'Smart Water Tech', 'Emergency Response', 'Eco Solutions'],
  },
  { 
    name: 'Construction', 
    icon: <ConstructionIcon />, 
    count: 45670, 
    color: '#E74C3C',
    description: 'Smart building architects & sustainable construction leaders',
    avgRate: '$85/hr',
    topTalent: 289,
    demandLevel: 'Very High',
    growthRate: '+22%',
    specialties: ['Smart Buildings', 'Sustainable Construction', 'Project Management', 'Green Building'],
    skillsInDemand: ['Smart Buildings', 'LEED Certification', 'BIM Technology', 'Sustainable Materials'],
  },
  { 
    name: 'Design', 
    icon: <PsychologyIcon />, 
    count: 16780, 
    color: '#9B59B6', 
    premium: true,
    description: 'Luxury interior architects & sustainable design visionaries',
    avgRate: '$105/hr',
    topTalent: 198,
    demandLevel: 'High',
    growthRate: '+28%',
    specialties: ['Luxury Interiors', 'Sustainable Design', 'Biophilic Spaces', 'Custom Furniture'],
    skillsInDemand: ['Biophilic Design', '3D Visualization', 'Sustainable Luxury', 'Smart Interiors'],
  },
  { 
    name: 'Smart Tech', 
    icon: <HomeIcon />, 
    count: 12450, 
    color: '#F39C12', 
    newest: true,
    description: 'IoT integration specialists & automation experts',
    avgRate: '$125/hr',
    topTalent: 87,
    demandLevel: 'Explosive',
    growthRate: '+67%',
    specialties: ['IoT Systems', 'Home Automation', 'AI Integration', 'Smart Cities'],
    skillsInDemand: ['AI Integration', 'IoT Platforms', 'Smart Sensors', 'Automation Systems'],
  },
  { 
    name: 'HVAC', 
    icon: <SpeedIcon />, 
    count: 14230, 
    color: '#2ECC71',
    description: 'Climate control engineers & energy efficiency experts',
    avgRate: '$82/hr',
    topTalent: 145,
    demandLevel: 'High',
    growthRate: '+31%',
    specialties: ['Smart Climate', 'Energy Efficiency', 'System Integration', 'Green HVAC'],
    skillsInDemand: ['Smart Thermostats', 'Energy Recovery', 'Geothermal Systems', 'Air Quality'],
  },
];

const platformStats = [
  { 
    icon: <Group sx={{ fontSize: 64 }} />, 
    value: '450,000+', 
    label: 'Elite Professionals',
    subtitle: 'Verified & background-checked',
    color: '#FFD700',
    trend: '+18% this quarter',
    description: 'World-class talent pool across all trades',
    animation: pulse,
    gradient: 'primary',
    details: 'Top 5% of global talent',
  },
  { 
    icon: <CheckCircle sx={{ fontSize: 64 }} />, 
    value: '99.7%', 
    label: 'Project Success Rate',
    subtitle: 'Client satisfaction guaranteed',
    color: '#2ECC71',
    trend: '+1.2% improvement',
    description: 'Industry-leading completion rates',
    animation: float,
    gradient: 'success',
    details: 'Highest in the industry',
  },
  { 
    icon: <TrendingUp sx={{ fontSize: 64 }} />, 
    value: '24/7', 
    label: 'Expert Support',
    subtitle: 'Dedicated success managers',
    color: '#3498DB',
    trend: 'Always available',
    description: 'Premium white-glove service',
    animation: shimmer,
    gradient: 'info',
    details: 'Personalized project assistance',
  },
  { 
    icon: <WorkspacePremium sx={{ fontSize: 64 }} />, 
    value: '4.98/5', 
    label: 'Platform Rating',
    subtitle: 'Hirer satisfaction score',
    color: '#E74C3C',
    trend: '+0.08 this month',
    description: 'Consistently exceptional reviews',
    animation: sparkle,
    gradient: 'error',
    details: 'Best-in-class experience',
  },
  { 
    icon: <AttachMoneyIcon sx={{ fontSize: 64 }} />, 
    value: '$4.2B+', 
    label: 'Projects Completed',
    subtitle: 'Total value delivered',
    color: '#9C27B0',
    trend: '+45% annually',
    description: 'Transforming industries worldwide',
    animation: rotateGlow,
    gradient: 'primary',
    details: 'Billion-dollar impact',
  },
  { 
    icon: <SecurityIcon sx={{ fontSize: 64 }} />, 
    value: '100%', 
    label: 'Secure Payments',
    subtitle: 'Escrow protection guaranteed',
    color: '#FF5722',
    trend: 'Bank-level security',
    description: 'Your investment is protected',
    animation: heartbeat,
    gradient: 'error',
    details: 'Military-grade encryption',
  },
];

const WorkerSearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const heroRef = useRef(null);
  const searchRef = useRef(null);

  // Enhanced state management for talent discovery
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    skills: [],
    minRating: 0,
    location: '',
    workMode: '',
    priceRange: [0, 300],
    availability: '',
    experience: '',
    certifications: false,
    verified: false,
    topRated: false,
    premium: false,
  });

  const [savedWorkers, setSavedWorkers] = useState([]);
  const [results, setResults] = useState({ workers: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [showSampleData, setShowSampleData] = useState(true);
  const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'grid');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterDialog, setFilterDialog] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [talentInsights, setTalentInsights] = useState(null);
  const [projectMatching, setProjectMatching] = useState([]);
  const [animateCards, setAnimateCards] = useState(false);

  const skillOptions = [
    'Electrical Wiring', 'Smart Home Integration', 'Solar Installation', 'Industrial Automation',
    'Plumbing Repair', 'Water Systems', 'Emergency Response', 'Green Plumbing',
    'Project Management', 'Construction', 'Renovation', 'Sustainable Building',
    'HVAC Systems', 'Climate Control', 'Energy Efficiency', 'Smart Climate',
    'Interior Design', 'Custom Furniture', 'Space Planning', '3D Design',
    'Carpentry', 'Woodworking', 'Cabinet Making', 'Custom Millwork',
    'IoT Systems', 'Home Automation', 'AI Integration', 'Smart Buildings',
    'Welding', 'Fabrication', 'Metal Working', 'Precision Manufacturing',
    'Robotics', 'Automation Systems', 'Advanced Manufacturing', 'Quality Control',
  ];

  // Responsive view mode adjustment
  useEffect(() => {
    if (isMobile && viewMode === 'grid') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);

  // Enhanced search with AI-powered talent matching
  const handleSearch = useCallback(async (page = 1) => {
    setLoading(true);
    setShowSampleData(false);
    setAnimateCards(true);
    
    try {
      const params = { 
        page, 
        category: selectedCategory,
        sortBy,
        ...searchParams 
      };
      
      // Mock API call - replace with actual service
      const response = await searchService.searchWorkers(params);
      const workers = response.results || response.workers || response;
      const pagination = response.meta?.pagination || response.pagination || {};
      setResults({ workers, pagination });
      
      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'talent_search', {
          search_term: searchParams.searchTerm,
          category: selectedCategory,
          skills_count: searchParams.skills.length,
          filters_applied: Object.keys(params).filter(key => params[key]).length,
        });
      }
      
      // Generate AI recommendations for authenticated users
      if (isAuthenticated() && user) {
        generateAIRecommendations();
        analyzeTalentInsights();
        matchProjectRequirements();
      }
    } catch (error) {
      console.error('Error searching workers:', error);
      setResults({ workers: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  }, [searchParams, selectedCategory, sortBy, isAuthenticated, user]);

  // Generate AI-powered talent recommendations
  const generateAIRecommendations = useCallback(() => {
    if (!user) return;
    
    // Mock AI recommendations based on user's project history and preferences
    const userProjects = user.projectHistory || [];
    const userPreferences = user.preferences || {};
    
    const recommendations = creativeProfessionals.filter(professional => {
      // Match based on project complexity and budget
      const budgetMatch = professional.hourlyRate <= (userPreferences.maxBudget || 200);
      const skillMatch = professional.skills.some(skill => 
        userPreferences.preferredSkills?.includes(skill.name)
      );
      return budgetMatch || skillMatch;
    }).slice(0, 3);
    
    setAiRecommendations(recommendations);
  }, [user]);

  // Analyze talent market insights
  const analyzeTalentInsights = useCallback(() => {
    if (!user) return;
    
    const insights = {
      marketTrends: {
        hotSkills: ['AI Integration', 'Smart Home Tech', 'Renewable Energy', 'IoT Systems'],
        emergingTalent: 'Smart Technology specialists',
        avgRateIncrease: '+15% this quarter',
        demandSurge: 'Electrical & Smart Tech categories',
      },
      recommendations: {
        bestTimeToHire: 'Next 2 weeks (lower competition)',
        budgetOptimization: 'Consider mid-level experts for 30% savings',
        skillGaps: ['AI Integration', 'Smart Building Systems'],
        alternativeLocations: ['Austin, TX', 'Denver, CO', 'Remote'],
      },
      competitiveAnalysis: {
        averageResponseTime: '2.4 hours',
        topPerformingBudgets: '$80-120/hr range',
        successFactors: ['Clear project scope', 'Competitive rates', 'Quick decisions'],
      },
    };
    
    setTalentInsights(insights);
  }, [user]);

  // Match professionals to specific project requirements
  const matchProjectRequirements = useCallback(() => {
    if (!user || !user.currentProject) return;
    
    const projectNeeds = user.currentProject;
    const matches = creativeProfessionals.map(professional => {
      let score = 0;
      
      // Skill matching
      const skillMatches = professional.skills.filter(skill => 
        projectNeeds.requiredSkills?.includes(skill.name)
      );
      score += skillMatches.length * 20;
      
      // Experience level matching
      if (professional.skills.some(skill => skill.level === projectNeeds.experienceLevel)) {
        score += 25;
      }
      
      // Budget compatibility
      if (professional.hourlyRate <= projectNeeds.maxBudget) {
        score += 15;
      }
      
      // Location preference
      if (projectNeeds.remote || professional.location.includes(projectNeeds.location)) {
        score += 10;
      }
      
      // Availability
      if (professional.availability === 'Available') {
        score += 10;
      }
      
      return { ...professional, matchScore: Math.min(score, 100) };
    }).filter(p => p.matchScore > 50).sort((a, b) => b.matchScore - a.matchScore);
    
    setProjectMatching(matches);
  }, [user]);

  // Toggle save worker with authentication check
  const handleToggleSaveWorker = useCallback(async (workerId) => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/professionals/${workerId}` } });
      return;
    }
    
    if (savedWorkers.includes(workerId)) {
      try {
        await hirerService.unsaveWorker(workerId);
        setSavedWorkers(prev => prev.filter(id => id !== workerId));
      } catch (error) {
        console.error('Error unsaving worker:', error);
      }
    } else {
      try {
        await hirerService.saveWorker(workerId);
        setSavedWorkers(prev => [...prev, workerId]);
      } catch (error) {
        console.error('Error saving worker:', error);
      }
    }
  }, [isAuthenticated, navigate, savedWorkers]);

  const clearFilters = useCallback(() => {
    setSearchParams({
      searchTerm: '',
      skills: [],
      minRating: 0,
      location: '',
      workMode: '',
      priceRange: [0, 300],
      availability: '',
      experience: '',
      certifications: false,
      verified: false,
      topRated: false,
      premium: false,
    });
    setSelectedCategory('');
    setSortBy('relevance');
    setShowSampleData(true);
    setResults({ workers: [], pagination: {} });
  }, []);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            searchRef.current?.querySelector('input')?.focus();
            break;
          case 'f':
            e.preventDefault();
            setFilterDialog(true);
            break;
          case 's':
            e.preventDefault();
            handleSearch();
            break;
          default:
            break;
        }
      }
      if (e.key === 'Escape') {
        setFilterDialog(false);
        setShowAdvancedFilters(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSearch]);

  // Auto-save search preferences
  useEffect(() => {
    if (isAuthenticated()) {
      const preferences = {
        viewMode,
        sortBy,
        searchParams,
        selectedCategory,
      };
      localStorage.setItem('hirerTalentSearchPreferences', JSON.stringify(preferences));
    }
  }, [viewMode, sortBy, searchParams, selectedCategory, isAuthenticated]);

  // Load saved preferences
  useEffect(() => {
    if (isAuthenticated()) {
      try {
        const saved = localStorage.getItem('hirerTalentSearchPreferences');
        if (saved) {
          const preferences = JSON.parse(saved);
          setViewMode(preferences.viewMode || (isMobile ? 'list' : 'grid'));
          setSortBy(preferences.sortBy || 'relevance');
          setSearchParams(preferences.searchParams || searchParams);
          setSelectedCategory(preferences.selectedCategory || '');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, [isAuthenticated, isMobile]);

  // Initialize AI features for authenticated users
  useEffect(() => {
    if (isAuthenticated() && user && isInitialized) {
      generateAIRecommendations();
      analyzeTalentInsights();
      matchProjectRequirements();
    }
  }, [isAuthenticated, user, isInitialized, generateAIRecommendations, analyzeTalentInsights, matchProjectRequirements]);

  const renderHeroSection = () => (
    <HeroGradientSection ref={heroRef}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 3 }}>
        <Grid container spacing={8} alignItems="center" sx={{ minHeight: '95vh' }}>
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, x: -120 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <Box sx={{ mb: 6 }}>
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.8rem', sm: '4rem', md: '5rem', lg: '6rem' },
                      fontWeight: 900,
                      mb: 4,
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 20%, #FF6B6B 40%, #4ECDC4 60%, #45B7D1 80%, #9B59B6 100%)',
                      backgroundSize: '300% 300%',
                      animation: `${gradientShift} 12s ease infinite`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 12px 24px rgba(0,0,0,0.3)',
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Discover
                    <br />
                    <span style={{ position: 'relative' }}>
                      Elite Talent
                      <motion.div
                        style={{
                          position: 'absolute',
                          bottom: -15,
                          left: 0,
                          right: 0,
                          height: 6,
                          background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF6B6B)',
                          borderRadius: 3,
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, delay: 1.2 }}
                      />
                    </span>
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.6 }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: { xs: '1.2rem', sm: '1.6rem', md: '2rem', lg: '2.5rem' },
                      fontWeight: 400,
                      mb: 5,
                      opacity: 0.95,
                      lineHeight: 1.4,
                      maxWidth: '95%',
                    }}
                  >
                    🎯 <strong>Connect with 450,000+ verified professionals</strong>
                    <br />
                    💎 <strong>Access top 1% talent</strong> in skilled trades
                    <br />
                    ⚡ <strong>Hire in 24 hours</strong> with AI-powered matching
                    <br />
                    🚀 <strong>99.7% project success rate</strong> guaranteed
                    <br />
                    🏆 <strong>Elite experts from Tesla, SpaceX, Apple</strong>
                  </Typography>
                </motion.div>
              </Box>
              
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={4} 
                  sx={{ mb: 8 }}
                >
                  <AnimatedButton
                    size="large"
                    startIcon={<Search />}
                    onClick={() => window.scrollTo({ 
                      top: heroRef.current?.offsetHeight || 800, 
                      behavior: 'smooth' 
                    })}
                    sx={{ minWidth: { xs: '100%', sm: 220 } }}
                    magnetic
                  >
                    Find Elite Talent
                  </AnimatedButton>
                  <AnimatedButton
                    variant="outlined"
                    size="large"
                    startIcon={<HandshakeIcon />}
                    onClick={() => navigate(isAuthenticated() ? '/post-job' : '/register?type=hirer')}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      minWidth: { xs: '100%', sm: 200 },
                      '&:hover': {
                        borderColor: theme.palette.secondary.main,
                        backgroundColor: alpha('#ffffff', 0.15),
                        color: theme.palette.secondary.main,
                      },
                    }}
                  >
                    {isAuthenticated() ? 'Post Project' : 'Start Hiring'}
                  </AnimatedButton>
                </Stack>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 1.2 }}
              >
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, fontWeight: 700 }}>
                    🏆 Trusted by industry leaders worldwide:
                  </Typography>
                  <Stack 
                    direction="row" 
                    spacing={{ xs: 3, sm: 5 }} 
                    sx={{ 
                      opacity: 0.85, 
                      flexWrap: 'wrap',
                      '& > *': {
                        fontSize: { xs: '1.1rem', sm: '1.4rem' },
                        fontWeight: 300,
                        letterSpacing: 1.5,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }
                    }}
                  >
                    {['Tesla', 'SpaceX', 'Apple', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix'].map((company, index) => (
                      <motion.div
                        key={company}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
                        whileHover={{ 
                          scale: 1.1, 
                          textShadow: '0 4px 8px rgba(255,215,0,0.6)',
                          transition: { duration: 0.2 }
                        }}
                      >
                        <Typography variant="h6" component="span">
                          {company}
                        </Typography>
                      </motion.div>
                    ))}
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="body1" sx={{ mb: 2, opacity: 0.8, fontWeight: 600 }}>
                    ⭐ Join 50,000+ successful hirers who found their perfect match
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { border: '3px solid white', width: 48, height: 48 } }}>
                      <Avatar src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" />
                      <Avatar src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100" />
                      <Avatar src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" />
                      <Avatar src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" />
                      <Avatar>+45K</Avatar>
                    </AvatarGroup>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>
                      "Best hiring platform ever!" - Tech CEO
                    </Typography>
                  </Stack>
                </Box>
              </motion.div>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.7, rotateY: 60 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            >
              <Grid container spacing={4}>
                {platformStats.map((stat, index) => (
                  <Grid item xs={6} md={4} lg={6} key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 80, rotateX: 60 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: 0.7 + index * 0.2,
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        scale: 1.08, 
                        rotateY: 8,
                        transition: { duration: 0.3 }
                      }}
                    >
                      <StatCard
                        gradient={stat.gradient}
                        glowing={index === 0}
                        whileHover={{ 
                          scale: 1.08,
                          boxShadow: `0 30px 60px ${alpha(stat.color, 0.4)}`,
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <InteractiveIcon 
                          color={stat.color}
                          animated={index % 2 === 0}
                          size="large"
                        >
                          {stat.icon}
                        </InteractiveIcon>
                        
                        <GradientText 
                          variant="h2" 
                          gradient={stat.gradient}
                          sx={{ mb: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}
                        >
                          {stat.value}
                        </GradientText>
                        
                        <Typography 
                          variant="h6" 
                          fontWeight={800} 
                          color="white" 
                          sx={{ mb: 1 }}
                        >
                          {stat.label}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="rgba(255,255,255,0.85)" 
                          sx={{ mb: 2, fontSize: '0.9rem' }}
                        >
                          {stat.subtitle}
                        </Typography>
                        
                        <Chip
                          label={stat.trend}
                          size="small"
                          sx={{
                            bgcolor: alpha('#ffffff', 0.25),
                            color: 'white',
                            fontWeight: 800,
                            mb: 1,
                            animation: `${pulse} 2.5s ease-in-out infinite`,
                            fontSize: '0.75rem',
                          }}
                        />
                        
                        <Typography 
                          variant="caption" 
                          color="rgba(255,255,255,0.7)"
                          sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                        >
                          {stat.description}
                        </Typography>

                        <Box sx={{ mt: 1 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700,
                              color: stat.color,
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            }}
                          >
                            {stat.details}
                          </Typography>
                        </Box>
                      </StatCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </HeroGradientSection>
  );

  const renderSearchInterface = () => (
    <Container maxWidth="xl" sx={{ py: 8 }} ref={searchRef}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <SearchInterface elevation={20}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <GradientText variant="h2" sx={{ mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
              🔍 Advanced Talent Discovery
            </GradientText>
            <Typography variant="h5" color="text.secondary" sx={{ opacity: 0.9, mb: 2 }}>
              AI-powered matching with 450,000+ verified professionals
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip label="⚡ Instant Matching" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 700 }} />
              <Chip label="🎯 99.7% Success Rate" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 700 }} />
              <Chip label="🚀 24hr Hiring" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', fontWeight: 700 }} />
            </Stack>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by name, skills, expertise, or location..."
                value={searchParams.searchTerm}
                onChange={(e) => setSearchParams(prev => ({ ...prev, searchTerm: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.secondary.main, fontSize: 32 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchParams.searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchParams(prev => ({ ...prev, searchTerm: '' }))}
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 4,
                    fontSize: '1.2rem',
                    minHeight: 64,
                    '& fieldset': { 
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      borderWidth: 3,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                      borderWidth: 3,
                    },
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                    backdropFilter: 'blur(10px)',
                  },
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Location or Remote"
                value={searchParams.location}
                onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Use my location">
                        <IconButton size="small">
                          <MyLocationIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 4,
                    minHeight: 64,
                    '& fieldset': { 
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      borderWidth: 3,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.secondary.main, fontWeight: 700, fontSize: '1.1rem' }}>
                  Sort By
                </InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    borderRadius: 4,
                    minHeight: 64,
                    '& fieldset': { 
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      borderWidth: 3,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                  }}
                >
                  <MenuItem value="relevance">🎯 Most Relevant</MenuItem>
                  <MenuItem value="rating">⭐ Highest Rated</MenuItem>
                  <MenuItem value="experience">🏆 Most Experienced</MenuItem>
                  <MenuItem value="price_low">💰 Lowest Rate</MenuItem>
                  <MenuItem value="price_high">💎 Premium Talent</MenuItem>
                  <MenuItem value="response_time">⚡ Fastest Response</MenuItem>
                  <MenuItem value="availability">✅ Available Now</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
            <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={searchParams.verified}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, verified: e.target.checked }))}
                    color="secondary"
                    sx={{
                      '& .MuiSwitch-thumb': {
                        bgcolor: searchParams.verified ? theme.palette.secondary.main : 'grey.400',
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={700}>Verified Only</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={searchParams.topRated}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, topRated: e.target.checked }))}
                    color="warning"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={700}>Top Rated</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={searchParams.premium}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, premium: e.target.checked }))}
                    color="secondary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkspacePremiumIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={700}>Premium</Typography>
                  </Box>
                }
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <AnimatedButton
                variant="contained"
                onClick={handleSearch}
                size="large"
                startIcon={<Search />}
                sx={{ minWidth: 200 }}
                magnetic
              >
                Find Perfect Match
              </AnimatedButton>
              
              <AnimatedButton
                variant="outlined"
                onClick={() => setFilterDialog(true)}
                size="large"
                startIcon={<TuneIcon />}
              >
                Advanced
              </AnimatedButton>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newView) => newView && setViewMode(newView)}
                size="large"
                sx={{
                  '& .MuiToggleButton-root': {
                    border: `3px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: theme.palette.secondary.main,
                      color: 'white',
                      '&:hover': {
                        bgcolor: theme.palette.secondary.dark,
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="grid" disabled={isMobile}>
                  <ViewModuleIcon />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="map">
                  <MapIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>

          {/* AI-Powered Search Suggestions */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontWeight: 700 }}>
              🤖 AI Suggestions:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {['Electrical Engineer Tesla', 'Smart Home Specialist', 'Solar Installation Expert', 'HVAC Automation', 'Construction Manager', 'IoT Integration'].map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  size="medium"
                  onClick={() => {
                    setSearchParams(prev => ({ ...prev, searchTerm: suggestion }));
                    setTimeout(handleSearch, 100);
                  }}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.3)}`,
                    },
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
              🎯 Platform Performance
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight={900} color="secondary.main">2.4hrs</Typography>
                <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight={900} color="success.main">99.7%</Typography>
                <Typography variant="caption" color="text.secondary">Success Rate</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight={900} color="info.main">24hrs</Typography>
                <Typography variant="caption" color="text.secondary">Avg Hire Time</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="h4" fontWeight={900} color="warning.main">4.98★</Typography>
                <Typography variant="caption" color="text.secondary">Avg Rating</Typography>
              </Grid>
            </Grid>
          </Box>
        </SearchInterface>
      </motion.div>
    </Container>
  );

  const renderCategories = () => (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <GradientText variant="h2" sx={{ mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            🎯 Browse Elite Talent by Expertise
          </GradientText>
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ 
              mb: 4, 
              maxWidth: 700, 
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' }
            }}
          >
            Discover world-class professionals with verified skills and proven track records
          </Typography>
          
          <Stack 
            direction="row" 
            spacing={4} 
            justifyContent="center" 
            sx={{ 
              flexWrap: 'wrap', 
              gap: 2,
              '& > *': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '1rem',
                fontWeight: 700,
                color: theme.palette.text.secondary,
              }
            }}
          >
            <Box>
              <VerifiedIcon color="success" />
              <span>Verified Experts</span>
            </Box>
            <Box>
              <EmojiEventsIcon color="warning" />
              <span>Top Rated</span>
            </Box>
            <Box>
              <SecurityIcon color="info" />
              <span>Background Checked</span>
            </Box>
            <Box>
              <HandshakeIcon color="secondary" />
              <span>Success Guaranteed</span>
            </Box>
          </Stack>
        </Box>
        
        <Grid container spacing={4}>
          {talentCategories.map((category, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={category.name}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 60 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.08, 
                  rotateY: 8,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <GlassCard
                  featured={selectedCategory === category.name}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: selectedCategory === category.name 
                      ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.1)})`
                      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.92)})`,
                    border: selectedCategory === category.name 
                      ? `3px solid ${theme.palette.secondary.main}`
                      : `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 8,
                      background: `linear-gradient(90deg, ${category.color}, ${alpha(category.color, 0.7)})`,
                      opacity: selectedCategory === category.name ? 1 : 0.8,
                    },
                  }}
                  onClick={() => setSelectedCategory(category.name === selectedCategory ? '' : category.name)}
                >
                  <Box>
                    <InteractiveIcon 
                      color={category.color}
                      animated={index % 2 === 0}
                      sx={{ 
                        fontSize: '4.5rem !important',
                        mb: 3,
                        filter: `drop-shadow(0 12px 24px ${alpha(category.color, 0.3)})`,
                      }}
                    >
                      {React.cloneElement(category.icon, { 
                        sx: { fontSize: 'inherit', color: category.color }
                      })}
                    </InteractiveIcon>
                    
                    <Typography 
                      variant="h5" 
                      fontWeight={900} 
                      gutterBottom
                      sx={{ 
                        color: selectedCategory === category.name 
                          ? theme.palette.secondary.main 
                          : theme.palette.text.primary,
                        mb: 2,
                      }}
                    >
                      {category.name}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 3, lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 500 }}
                    >
                      {category.description}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack spacing={2.5} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          Available Talent:
                        </Typography>
                        <Chip
                          label={`${category.count.toLocaleString()}`}
                          size="small"
                          sx={{
                            bgcolor: alpha(category.color, 0.15),
                            color: category.color,
                            fontWeight: 800,
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          Avg. Rate:
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color={category.color}>
                          {category.avgRate}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          Growth:
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color="success.main">
                          {category.growthRate}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          Top Talent:
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color="warning.main">
                          {category.topTalent}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 2 }}>
                      {category.trending && (
                        <Chip 
                          label="🔥 Trending" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#FF6B6B', 0.15),
                            color: '#FF6B6B',
                            fontWeight: 700,
                            animation: `${pulse} 2s ease-in-out infinite`,
                          }} 
                        />
                      )}
                      {category.hot && (
                        <Chip 
                          label="🌟 Hot" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#FFA500', 0.15),
                            color: '#FFA500',
                            fontWeight: 700,
                            animation: `${sparkle} 2s ease-in-out infinite`,
                          }} 
                        />
                      )}
                      {category.newest && (
                        <Chip 
                          label="✨ New" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#4CAF50', 0.15),
                            color: '#4CAF50',
                            fontWeight: 700,
                            animation: `${float} 3s ease-in-out infinite`,
                          }} 
                        />
                      )}
                      {category.premium && (
                        <Chip 
                          label="👑 Premium" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#9C27B0', 0.15),
                            color: '#9C27B0',
                            fontWeight: 700,
                          }} 
                        />
                      )}
                    </Box>

                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: alpha(category.color, 0.1),
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: category.demandLevel === 'Explosive' ? '100%' :
                                 category.demandLevel === 'Very High' ? '90%' :
                                 category.demandLevel === 'High' ? '75%' : '60%',
                          height: '100%',
                          bgcolor: category.color,
                          borderRadius: 4,
                          transition: 'width 1.5s ease-in-out',
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 1, 
                        fontWeight: 800,
                        color: category.color,
                        fontSize: '0.75rem',
                      }}
                    >
                      Demand: {category.demandLevel}
                    </Typography>
                  </Box>
                </GlassCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <AnimatedButton
            variant="outlined"
            size="large"
            startIcon={<ExploreIcon />}
            onClick={() => navigate('/talent-categories')}
            magnetic
          >
            Explore All Talent Categories
          </AnimatedButton>
        </Box>
      </motion.div>
    </Container>
  );

  const renderProfessionalCard = (professional, index) => (
    <Grid item xs={12} sm={6} lg={viewMode === 'list' ? 12 : 4} key={professional.id}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <ProfessionalCard
          featured={professional.featured}
          premium={professional.premium}
          topRated={professional.topRated}
          verified={professional.verified}
          elevation={professional.featured ? 12 : 4}
        >
          {professional.featured && (
            <Box
              sx={{
                position: 'absolute',
                top: professional.premium ? 28 : 0,
                left: 0,
                right: 0,
                bgcolor: alpha(theme.palette.secondary.main, 0.9),
                color: 'white',
                textAlign: 'center',
                py: 0.5,
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              ⭐ FEATURED PROFESSIONAL ⭐
            </Box>
          )}

          <CardContent sx={{ p: 3, pt: professional.featured && professional.premium ? 7 : professional.featured || professional.premium ? 5 : 3 }}>
            {/* Professional Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  professional.verified ? (
                    <Verified sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                  ) : null
                }
              >
                <Avatar
                  src={professional.avatar}
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 2,
                    border: `3px solid ${theme.palette.secondary.main}`,
                    boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  }}
                />
              </Badge>
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                  {professional.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {professional.title}
                </Typography>
                
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Rating value={professional.rating} precision={0.01} size="small" readOnly />
                  <Typography variant="body2" fontWeight={600}>
                    {professional.rating} ({professional.reviewCount})
                  </Typography>
                </Stack>
                
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {professional.badges?.slice(0, 2).map((badge) => (
                    <Chip
                      key={badge}
                      label={badge}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        color: theme.palette.secondary.main,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              
              <IconButton
                onClick={() => handleToggleSaveWorker(professional.id)}
                sx={{
                  color: savedWorkers.includes(professional.id)
                    ? theme.palette.secondary.main
                    : theme.palette.text.secondary,
                }}
              >
                {savedWorkers.includes(professional.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Box>

            {/* Professional Details */}
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {professional.description}
            </Typography>

            {/* Skills */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Top Skills
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {professional.skills.slice(0, 4).map((skill) => (
                  <SkillChip
                    key={skill.name}
                    label={skill.name}
                    size="small"
                    level={skill.level}
                  />
                ))}
              </Stack>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} color="secondary.main">
                    ${professional.hourlyRate}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    per hour
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {professional.completedJobs}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    jobs done
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {professional.successRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    success
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Location & Availability */}
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOn fontSize="small" color="secondary" />
                <Typography variant="body2">{professional.location}</Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" color="secondary" />
                <Typography variant="body2">Responds {professional.responseTime}</Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <Schedule fontSize="small" />
                <Typography
                  variant="body2"
                  color={professional.availability === 'Available' ? 'success.main' : 'warning.main'}
                  fontWeight={600}
                >
                  {professional.availability}
                </Typography>
              </Stack>
            </Stack>

            {/* Certifications */}
            {professional.certifications && (
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Tooltip title={professional.certifications.join(', ')}>
                    <Chip
                      icon={<CertificateIcon />}
                      label={`${professional.certifications.length} Certifications`}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                  <Chip
                    icon={<Portfolio />}
                    label={`${professional.portfolioImages} Portfolio`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            )}
          </CardContent>

          <CardActions sx={{ p: 3, pt: 0 }}>
            <Stack direction="row" spacing={1} width="100%">
              <AnimatedButton
                variant="contained"
                fullWidth
                startIcon={<VisibilityIcon />}
                onClick={() => navigate(`/professionals/${professional.id}`)}
              >
                View Profile
              </AnimatedButton>
              <AnimatedButton
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={() => navigate(`/messages?recipient=${professional.id}`)}
                sx={{
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                }}
              >
                Message
              </AnimatedButton>
              <IconButton
                onClick={() => handleToggleSaveWorker(professional.id)}
                sx={{
                  color: savedWorkers.includes(professional.id)
                    ? theme.palette.secondary.main
                    : theme.palette.text.secondary,
                }}
              >
                <ShareIcon />
              </IconButton>
            </Stack>
          </CardActions>
        </ProfessionalCard>
      </motion.div>
    </Grid>
  );

  const renderFeaturedProfessionals = () => (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h2"
          fontWeight={900}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          🌟 Featured Professionals
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Hand-picked experts ready to transform your projects
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {creativeProfessionals.map((professional, index) => 
          renderProfessionalCard(professional, index)
        )}
      </Grid>
    </Container>
  );

  return (
    <>
      <Helmet>
        <title>Find Elite Professionals - 450K+ Verified Talent | Kelmah</title>
        <meta name="description" content="Discover and hire world-class professionals in construction, electrical, plumbing, HVAC, and specialized trades. Connect with top 1% talent with 99.7% success rate." />
        <meta name="keywords" content="hire professionals, skilled trades talent, electrical engineers, construction experts, HVAC specialists, elite talent, verified professionals" />
        <meta property="og:title" content="Find Elite Professionals - 450K+ Verified Talent | Kelmah" />
        <meta property="og:description" content="Connect with top 1% talent from Tesla, SpaceX, Apple. 99.7% success rate. Hire in 24 hours with AI-powered matching." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://kelmah.com/find-talent" />
      </Helmet>

      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 25% 25%, ${alpha(theme.palette.secondary.main, 0.04)} 0%, transparent 50%),
                      radial-gradient(circle at 75% 75%, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }
      }}>
        {/* Hero Section */}
        {renderHeroSection()}
        
        {/* Search Interface */}
        {renderSearchInterface()}
        
        {/* Categories */}
        {renderCategories()}
        
        {/* Content Area */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {loading ? (
            <Container maxWidth="xl" sx={{ py: 8 }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h3" textAlign="center" gutterBottom sx={{ mb: 6, fontWeight: 800 }}>
                  🔍 Finding Perfect Talent Matches...
                </Typography>
                <Grid container spacing={4}>
                  {Array.from(new Array(8)).map((_, idx) => (
                    <Grid item xs={12} sm={6} lg={4} xl={3} key={idx}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: idx * 0.1 }}
                      >
                        <Skeleton 
                          variant="rectangular" 
                          height={520} 
                          sx={{ 
                            borderRadius: 4,
                            transform: 'none',
                            '&::after': {
                              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)`,
                            }
                          }} 
                        />
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </Container>
          ) : showSampleData ? (
            <Container maxWidth="xl" sx={{ py: 8 }}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                  <GradientText 
                    variant="h2" 
                    sx={{ 
                      mb: 3, 
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                    }}
                  >
                    🌟 Featured Elite Professionals
                  </GradientText>
                  <Typography 
                    variant="h5" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 4,
                      maxWidth: 800,
                      mx: 'auto',
                      fontSize: { xs: '1.1rem', md: '1.3rem' }
                    }}
                  >
                    Hand-picked world-class talent with proven track records and exceptional expertise
                  </Typography>
                </Box>

                <Grid container spacing={4}>
                  {creativeProfessionals.map((professional, index) => (
                    <Grid item xs={12} md={6} lg={6} xl={3} key={professional.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 0.8, 
                          delay: index * 0.2,
                          ease: "easeOut"
                        }}
                        viewport={{ once: true }}
                        whileHover={{ 
                          y: -16,
                          transition: { duration: 0.3, ease: "easeOut" }
                        }}
                      >
                        {/* Professional card content would go here */}
                        <ProfessionalCard
                          featured={professional.featured}
                          premium={professional.premium}
                          topRated={professional.topRated}
                          verified={professional.verified}
                          elevation={professional.featured ? 20 : 12}
                          sx={{ height: '100%' }}
                        >
                          <CardContent sx={{ 
                            p: 4, 
                            pt: professional.featured && professional.premium ? 9 : professional.featured || professional.premium || professional.topRated ? 7 : 4,
                            pb: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}>
                            {/* Professional content implementation */}
                            <Typography variant="h6" fontWeight={800}>
                              {professional.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {professional.title}
                            </Typography>
                            <Rating value={professional.rating} precision={0.01} size="small" readOnly />
                            <Typography variant="body2" sx={{ mt: 'auto' }}>
                              ${professional.hourlyRate}/hr
                            </Typography>
                          </CardContent>
                          <CardActions sx={{ p: 4, pt: 0 }}>
                            <AnimatedButton
                              variant="contained"
                              fullWidth
                              startIcon={<VisibilityIcon />}
                              onClick={() => navigate(`/professionals/${professional.id}`)}
                            >
                              View Profile
                            </AnimatedButton>
                          </CardActions>
                        </ProfessionalCard>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </Container>
          ) : (
            <Container maxWidth="xl" sx={{ py: 8 }}>
              <Typography variant="h4" gutterBottom>
                Search Results ({results.workers.length} professionals found)
              </Typography>
              {/* Search results implementation */}
            </Container>
          )}
        </Box>

        {/* Floating Action Button */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ 
            position: 'fixed', 
            bottom: { xs: 80, md: 24 }, 
            right: { xs: 16, md: 24 },
            '& .MuiSpeedDial-fab': {
              bgcolor: theme.palette.secondary.main,
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
              },
            },
          }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<RefreshIcon />}
            tooltipTitle="Refresh Search"
            onClick={() => handleSearch()}
          />
          <SpeedDialAction
            icon={<SaveAltIcon />}
            tooltipTitle="Saved Professionals"
            onClick={() => navigate('/saved-professionals')}
          />
          <SpeedDialAction
            icon={<HandshakeIcon />}
            tooltipTitle="Post a Job"
            onClick={() => navigate('/post-job')}
          />
          <SpeedDialAction
            icon={<DashboardIcon />}
            tooltipTitle="Dashboard"
            onClick={() => navigate(isAuthenticated() ? '/dashboard' : '/login')}
          />
        </SpeedDial>
      </Box>
    </>
  );
};

export default WorkerSearchPage;
