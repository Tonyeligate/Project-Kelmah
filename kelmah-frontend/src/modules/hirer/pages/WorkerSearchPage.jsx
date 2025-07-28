import React, { useState, useEffect, useRef } from 'react';
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
  useTheme,
  alpha,
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import searchService from '../../search/services/searchService';
import { hirerService } from '../services/hirerService';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const heroRef = useRef(null);

  // State management
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    skills: [],
    minRating: 0,
    location: '',
    workMode: '',
    priceRange: [0, 200],
    availability: '',
    experience: '',
    certifications: false,
    verified: false,
  });

  const [savedWorkers, setSavedWorkers] = useState([]);
  const [results, setResults] = useState({ workers: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [showSampleData, setShowSampleData] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterDialog, setFilterDialog] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const skillOptions = [
    'Electrical Wiring', 'Smart Home Integration', 'Solar Installation',
    'Plumbing Repair', 'Water Systems', 'Emergency Response',
    'Project Management', 'Construction', 'Renovation',
    'HVAC Systems', 'Climate Control', 'Energy Efficiency',
    'Interior Design', 'Custom Furniture', 'Space Planning',
    'Carpentry', 'Woodworking', 'Cabinet Making',
  ];

  // Handle search
  const handleSearch = async (page = 1) => {
    setLoading(true);
    setShowSampleData(false);
    try {
      const params = { 
        page, 
        category: selectedCategory,
        sortBy,
        ...searchParams 
      };
      const response = await searchService.searchWorkers(params);
      const workers = response.results || response.workers || response;
      const pagination = response.meta?.pagination || response.pagination || {};
      setResults({ workers, pagination });
    } catch (error) {
      console.error('Error searching workers:', error);
      setResults({ workers: [], pagination: {} });
    } finally {
      setLoading(false);
    }
  };

  // Toggle save worker
  const handleToggleSaveWorker = async (workerId) => {
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
  };

  const clearFilters = () => {
    setSearchParams({
      searchTerm: '',
      skills: [],
      minRating: 0,
      location: '',
      workMode: '',
      priceRange: [0, 200],
      availability: '',
      experience: '',
      certifications: false,
      verified: false,
    });
    setSelectedCategory('');
    setSortBy('relevance');
    setShowSampleData(true);
    setResults({ workers: [], pagination: {} });
  };

  const renderHeroSection = () => (
    <HeroGradientSection ref={heroRef}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  fontWeight: 900,
                  mb: 3,
                  background: 'linear-gradient(135deg, #FFD700, #FFA500, #FF6B6B)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                Find Elite Talent
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
                  fontWeight: 400,
                  mb: 4,
                  opacity: 0.9,
                  lineHeight: 1.4,
                }}
              >
                🎯 Connect with verified professionals
                <br />
                💎 Discover exceptional skilled craftspeople
                <br />
                ⚡ Build your dream team today
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 6 }}>
                <AnimatedButton
                  size="large"
                  startIcon={<Search />}
                  onClick={() => window.scrollTo({ 
                    top: heroRef.current?.offsetHeight || 600, 
                    behavior: 'smooth' 
                  })}
                >
                  Explore Talent
                </AnimatedButton>
                <AnimatedButton
                  variant="outlined"
                  size="large"
                  startIcon={<HandshakeIcon />}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: alpha('#ffffff', 0.1),
                    },
                  }}
                  onClick={() => navigate('/post-job')}
                >
                  Post a Project
                </AnimatedButton>
              </Stack>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, opacity: 0.8 }}>
                  🏆 Trusted by leading companies:
                </Typography>
                <Stack direction="row" spacing={3} sx={{ opacity: 0.7 }}>
                  {['Tesla', 'Apple', 'Google', 'Microsoft'].map((company) => (
                    <Typography key={company} variant="h6" fontWeight={300}>
                      {company}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Grid container spacing={3}>
                {platformStats.map((stat, index) => (
                  <Grid item xs={6} key={index}>
                    <StatCard
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                    >
                      <Box sx={{ color: stat.color, mb: 2 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" fontWeight={900} sx={{ color: stat.color, mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color="white" sx={{ mb: 0.5 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ mb: 1 }}>
                        {stat.subtitle}
                      </Typography>
                      <Chip
                        label={stat.trend}
                        size="small"
                        sx={{
                          bgcolor: alpha('#ffffff', 0.2),
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </StatCard>
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <SearchInterface elevation={12}>
        <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 4, color: theme.palette.secondary.main }}>
          🔍 Advanced Talent Discovery
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search professionals by name, skills, or expertise..."
              value={searchParams.searchTerm}
              onChange={(e) => setSearchParams(prev => ({ ...prev, searchTerm: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: theme.palette.secondary.main }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  '& fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.3) },
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                },
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Location (City, State, Remote)"
              value={searchParams.location}
              onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn sx={{ color: theme.palette.secondary.main }} />
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
                  borderRadius: 3,
                  '& fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.3) },
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 3,
                  '& fieldset': { borderColor: alpha(theme.palette.secondary.main, 0.3) },
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                <MenuItem value="relevance">Most Relevant</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="experience">Most Experienced</MenuItem>
                <MenuItem value="price_low">Lowest Rate</MenuItem>
                <MenuItem value="price_high">Highest Rate</MenuItem>
                <MenuItem value="response_time">Fastest Response</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <AnimatedButton
                variant="contained"
                onClick={handleSearch}
                fullWidth
                startIcon={<Search />}
              >
                Find Talent
              </AnimatedButton>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newView) => newView && setViewMode(newView)}
                size="small"
              >
                <ToggleButton value="grid">
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
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        <Collapse in={showAdvancedFilters}>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                options={skillOptions}
                value={searchParams.skills}
                onChange={(event, newSkills) => 
                  setSearchParams(prev => ({ ...prev, skills: newSkills }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Required Skills" placeholder="Select skills" />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Hourly Rate Range: ${searchParams.priceRange[0]} - ${searchParams.priceRange[1]}</Typography>
              <Slider
                value={searchParams.priceRange}
                onChange={(e, newValue) => setSearchParams(prev => ({ ...prev, priceRange: newValue }))}
                valueLabelDisplay="auto"
                min={0}
                max={300}
                step={5}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 100, label: '$100' },
                  { value: 200, label: '$200' },
                  { value: 300, label: '$300+' },
                ]}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Minimum Rating: {searchParams.minRating}⭐</Typography>
              <Slider
                value={searchParams.minRating}
                onChange={(e, newValue) => setSearchParams(prev => ({ ...prev, minRating: newValue }))}
                step={0.5}
                marks
                min={0}
                max={5}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchParams.verified}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, verified: e.target.checked }))}
                      color="secondary"
                    />
                  }
                  label="Verified Only"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={searchParams.certifications}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, certifications: e.target.checked }))}
                      color="secondary"
                    />
                  }
                  label="Certified Professionals"
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1}>
                <Button onClick={clearFilters} startIcon={<Clear />} variant="outlined">
                  Clear All
                </Button>
                <AnimatedButton onClick={handleSearch} startIcon={<Search />}>
                  Apply Filters
                </AnimatedButton>
              </Stack>
            </Grid>
          </Grid>
        </Collapse>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            endIcon={showAdvancedFilters ? <ExpandLess /> : <ExpandMore />}
            sx={{ color: theme.palette.secondary.main }}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </Button>
        </Box>
      </SearchInterface>
    </Container>
  );

  const renderCategories = () => (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Typography
        variant="h3"
        fontWeight={700}
        textAlign="center"
        sx={{ mb: 6, color: theme.palette.secondary.main }}
      >
        🎯 Browse by Expertise
      </Typography>
      
      <Grid container spacing={3}>
        {talentCategories.map((category, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={category.name}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <GlassCard
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: selectedCategory === category.name 
                    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.1)})`
                    : 'background.paper',
                  border: selectedCategory === category.name 
                    ? `2px solid ${theme.palette.secondary.main}`
                    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
                onClick={() => setSelectedCategory(category.name === selectedCategory ? '' : category.name)}
              >
                <Box sx={{ color: category.color, mb: 2, fontSize: 48 }}>
                  {category.icon}
                </Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {category.description}
                </Typography>
                <Chip
                  label={`${category.count.toLocaleString()} professionals`}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box>
                  {category.trending && <Chip label="🔥 Trending" size="small" sx={{ m: 0.25 }} />}
                  {category.hot && <Chip label="💎 Hot" size="small" sx={{ m: 0.25 }} />}
                  {category.newest && <Chip label="✨ New" size="small" sx={{ m: 0.25 }} />}
                  {category.premium && <Chip label="👑 Premium" size="small" sx={{ m: 0.25 }} />}
                </Box>
              </GlassCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>
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
        <title>Find Elite Professionals - Skilled Talent Discovery | Kelmah</title>
        <meta name="description" content="Discover and hire verified professionals in construction, electrical, plumbing, HVAC, and specialized trades. Connect with elite talent for your projects." />
      </Helmet>

      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {renderHeroSection()}
        {renderSearchInterface()}
        {renderCategories()}
        
        {loading ? (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {Array.from(new Array(8)).map((_, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={idx}>
                  <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          </Container>
        ) : showSampleData ? (
          renderFeaturedProfessionals()
        ) : (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
              Search Results ({results.workers.length} professionals found)
            </Typography>
            <Grid container spacing={3}>
              {results.workers.map((professional, index) => 
                renderProfessionalCard(professional, index)
              )}
            </Grid>
            
            {results.pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination
                  count={results.pagination.totalPages}
                  page={results.pagination.currentPage}
                  onChange={(e, page) => handleSearch(page)}
                  color="secondary"
                  size="large"
                />
              </Box>
            )}
          </Container>
        )}

        {/* Floating Actions */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<RefreshIcon />}
            tooltipTitle="Refresh Results"
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
        </SpeedDial>
      </Box>
    </>
  );
};

export default WorkerSearchPage;
