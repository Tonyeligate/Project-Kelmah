import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  CircularProgress,
  Box,
  useTheme,
  Paper,
  Button,
  Stack,
  Avatar,
  Rating,
  Divider,
  alpha,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  InputAdornment,
  Skeleton,
  CardActions,
  Collapse,
  Fab,
  AvatarGroup,
  Stepper,
  Step,
  StepLabel,
  Breadcrumbs,
  Link,
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
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Star as StarIcon,
  Verified as VerifiedIcon,
  AccessTime as AccessTimeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Tune as TuneIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  FlashOn as ElectricalIcon,
  Whatshot as WhatshotIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingDown as TrendingDownIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineGraphIcon,
  Dashboard as DashboardIcon,
  MyLocation as MyLocationIcon,
  Map as MapIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ViewQuilt as ViewQuiltIcon,
  Sort as SortIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  SaveAlt as SaveAltIcon,
  NotificationsActive as NotificationsActiveIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Construction as ConstructionIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Handyman as CarpenterIcon,
  Thermostat as HvacIcon,
  Rocket as RocketIcon,
  Diamond as DiamondIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobs,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  selectJobFilters,
  setFilters,
  selectJobsPagination,
} from '../../jobs/services/jobSlice';
import { useAuth } from '../../auth/hooks/useAuth';

// Enhanced Animations with Worker-focused Themes
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-12px) rotate(1deg); }
  50% { transform: translateY(-18px) rotate(0deg); }
  75% { transform: translateY(-12px) rotate(-1deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(212, 175, 55, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
`;

const slideInFromLeft = keyframes`
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInFromRight = keyframes`
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

const rotateGlow = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); }
  14% { transform: scale(1.1); }
  28% { transform: scale(1); }
  42% { transform: scale(1.1); }
  70% { transform: scale(1); }
`;

// Professional Worker-focused Styled Components
const HeroGradientSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 25%,
    ${theme.palette.primary.dark} 50%,
    ${theme.palette.secondary.dark} 75%,
    ${theme.palette.primary.main} 100%)`,
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 20s ease infinite`,
  color: 'white',
  padding: theme.spacing(12, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '90vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 25% 75%, ${alpha('#4ECDC4', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 75% 25%, ${alpha('#FFD700', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, ${alpha('#FF6B6B', 0.2)} 0%, transparent 70%)`,
    animation: `${float} 25s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-30%',
    left: '-20%',
    width: '140%',
    height: '160%',
    background: `conic-gradient(from 45deg at 50% 50%, transparent 0deg, ${alpha('#FFD700', 0.15)} 90deg, transparent 180deg, ${alpha('#4ECDC4', 0.15)} 270deg, transparent 360deg)`,
    animation: `${rotateGlow} 40s linear infinite`,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '75vh',
    padding: theme.spacing(10, 0),
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: '65vh',
    padding: theme.spacing(8, 0),
  },
}));

const GlassCard = styled(Card)(({ theme, variant = 'default', featured = false, urgent = false }) => ({
  background: variant === 'glass' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.88)})`
    : featured 
    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.08)})`
    : urgent
    ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)}, ${alpha(theme.palette.warning.main, 0.05)})`
    : theme.palette.background.paper,
  backdropFilter: variant === 'glass' ? 'blur(25px)' : 'blur(15px)',
  border: featured 
    ? `3px solid ${theme.palette.secondary.main}` 
    : urgent
    ? `2px solid ${theme.palette.error.main}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 28,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-16px) scale(1.03)',
    boxShadow: featured 
      ? `0 35px 70px ${alpha(theme.palette.secondary.main, 0.4)}, 0 20px 40px ${alpha(theme.palette.primary.main, 0.2)}`
      : urgent
      ? `0 30px 60px ${alpha(theme.palette.error.main, 0.3)}`
      : `0 28px 56px ${alpha(theme.palette.common.black, 0.15)}`,
    borderColor: featured ? theme.palette.secondary.main : urgent ? theme.palette.error.main : theme.palette.secondary.main,
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
      ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.15)}, transparent)`
      : urgent
      ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.error.main, 0.15)}, transparent)`
      : `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)`,
    transition: 'left 0.7s, opacity 0.3s',
    opacity: 0,
  },
  '&:hover::before': {
    left: '100%',
    opacity: 1,
  },
}));

const JobOpportunityCard = styled(GlassCard)(({ theme, featured, urgent, premium, trending, matchScore }) => ({
  height: '100%',
  position: 'relative',
  background: featured 
    ? `linear-gradient(135deg, 
        ${alpha(theme.palette.secondary.main, 0.12)} 0%, 
        ${alpha(theme.palette.primary.main, 0.12)} 50%,
        ${alpha(theme.palette.secondary.main, 0.08)} 100%)`
    : premium
    ? `linear-gradient(135deg, 
        ${alpha('#9C27B0', 0.08)} 0%, 
        ${alpha('#673AB7', 0.08)} 100%)`
    : theme.palette.background.paper,
  border: featured 
    ? `3px solid ${theme.palette.secondary.main}`
    : premium
    ? `2px solid #9C27B0`
    : urgent
    ? `2px solid ${theme.palette.error.main}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': urgent ? {
    content: '"🚨 URGENT HIRING"',
    position: 'absolute',
    top: 25,
    right: -50,
    background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
    color: 'white',
    padding: '10px 60px',
    fontSize: '0.8rem',
    fontWeight: 900,
    transform: 'rotate(45deg)',
    letterSpacing: '1.5px',
    zIndex: 3,
    boxShadow: `0 6px 18px ${alpha(theme.palette.error.main, 0.4)}`,
    animation: `${heartbeat} 2s ease-in-out infinite`,
  } : {},
  '&::after': premium ? {
    content: '"👑 PREMIUM OPPORTUNITY"',
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
    content: '"⭐ FEATURED JOB"',
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
  } : {},
  ...(matchScore >= 90 && {
    '&::before': {
      content: '"🎯 PERFECT MATCH"',
      position: 'absolute',
      top: 15,
      left: 15,
      background: `linear-gradient(135deg, #4CAF50, #8BC34A)`,
      color: 'white',
      padding: '6px 12px',
      fontSize: '0.7rem',
      fontWeight: 800,
      borderRadius: '20px',
      zIndex: 3,
      animation: `${pulse} 2s ease-in-out infinite`,
    },
  }),
}));

const SearchInterface = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  zIndex: 1200,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.95)})`,
  backdropFilter: 'blur(35px)',
  borderRadius: 32,
  padding: theme.spacing(4),
  border: `3px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
  boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.12)}, 0 12px 36px ${alpha(theme.palette.secondary.main, 0.1)}`,
  margin: theme.spacing(3, 0),
  transition: 'all 0.4s ease',
  '&:hover': {
    borderColor: theme.palette.secondary.main,
    boxShadow: `0 24px 72px ${alpha(theme.palette.common.black, 0.15)}, 0 16px 48px ${alpha(theme.palette.secondary.main, 0.2)}`,
    transform: 'translateY(-4px)',
  },
}));

const SkillChip = styled(Chip)(({ theme, level, isSelected }) => {
  const getSkillColor = () => {
    switch (level) {
      case 'expert': return theme.palette.error.main;
      case 'advanced': return theme.palette.warning.main;
      case 'intermediate': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  const skillColor = getSkillColor();

  return {
    borderRadius: 24,
    fontWeight: 700,
    fontSize: '0.85rem',
    minHeight: 36,
    background: isSelected 
      ? `linear-gradient(135deg, ${skillColor}, ${alpha(skillColor, 0.8)})`
      : alpha(skillColor, 0.1),
    color: isSelected ? 'white' : skillColor,
    border: `2px solid ${alpha(skillColor, isSelected ? 0 : 0.3)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
      background: isSelected 
        ? `linear-gradient(135deg, ${alpha(skillColor, 0.9)}, ${skillColor})`
        : alpha(skillColor, 0.2),
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: `0 8px 20px ${alpha(skillColor, 0.3)}`,
    },
    '&:active': {
      transform: 'translateY(0) scale(0.98)',
    },
  };
});

const AnimatedButton = styled(Button)(({ theme, variant = 'contained', size = 'medium', glowing = false }) => ({
  borderRadius: size === 'large' ? 32 : size === 'small' ? 20 : 28,
  padding: size === 'large' 
    ? theme.spacing(2.5, 6) 
    : size === 'small' 
    ? theme.spacing(1, 3) 
    : theme.spacing(1.5, 4),
  fontWeight: 900,
  fontSize: size === 'large' ? '1.2rem' : size === 'small' ? '0.85rem' : '1rem',
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: variant === 'contained' 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.dark} 100%)`
    : 'transparent',
  border: variant === 'outlined' 
    ? `3px solid ${theme.palette.secondary.main}` 
    : 'none',
  color: variant === 'contained' ? 'white' : theme.palette.secondary.main,
  boxShadow: variant === 'contained' 
    ? `0 10px 30px ${alpha(theme.palette.secondary.main, 0.3)}` 
    : 'none',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.03)',
    boxShadow: variant === 'contained' 
      ? `0 20px 50px ${alpha(theme.palette.secondary.main, 0.4)}` 
      : `0 12px 30px ${alpha(theme.palette.secondary.main, 0.2)}`,
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
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.5)}, transparent)`,
    transition: 'left 0.7s',
  },
  '&:active': {
    transform: 'translateY(-3px) scale(0.98)',
  },
  ...(glowing && {
    animation: `${pulse} 2s ease-in-out infinite`,
  }),
}));

const StatCard = styled(motion.div)(({ theme, gradient = 'primary' }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.88)})`,
  backdropFilter: 'blur(25px)',
  borderRadius: 28,
  padding: theme.spacing(4),
  textAlign: 'center',
  border: `3px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-12px) scale(1.08)',
    boxShadow: `0 25px 50px ${alpha(theme.palette.secondary.main, 0.3)}`,
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
    width: '120px',
    height: '120px',
    background: gradient === 'primary' 
      ? `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 70%)`
      : gradient === 'success'
      ? `radial-gradient(circle, ${alpha('#4CAF50', 0.2)} 0%, transparent 70%)`
      : `radial-gradient(circle, ${alpha('#FF5722', 0.2)} 0%, transparent 70%)`,
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.4s ease',
  },
}));

const InteractiveIcon = styled(Box)(({ theme, color = theme.palette.secondary.main, size = 'large' }) => ({
  color: color,
  fontSize: size === 'large' ? '4rem' : size === 'medium' ? '3rem' : '2rem',
  marginBottom: theme.spacing(2),
  transition: 'all 0.4s ease',
  filter: `drop-shadow(0 8px 16px ${alpha(color, 0.3)})`,
  '&:hover': {
    transform: 'scale(1.3) rotate(15deg)',
    filter: `drop-shadow(0 12px 24px ${alpha(color, 0.4)})`,
  },
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
    : `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 900,
}));

// Enhanced sample data with more creative and high-value job opportunities
const creativeJobOpportunities = [
  {
    id: 'dream-job-1',
    title: '🚀 SpaceX Starship Manufacturing Engineer',
    description: 'Join the mission to Mars! Work on cutting-edge spacecraft manufacturing using the most advanced materials and techniques. Be part of humanity\'s greatest adventure while building the vehicles that will take us to other planets.',
    company: {
      name: 'SpaceX',
      logo: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400',
      rating: 4.98,
      verified: true,
      size: 'Large Corporation',
      employees: '12,000+',
      industry: 'Aerospace & Defense',
    },
    budget: { min: 120, max: 180, currency: 'USD', type: 'hourly' },
    annualSalary: { min: 150000, max: 220000 },
    location: 'Hawthorne, CA',
    remote: false,
    jobType: 'full-time',
    experience: 'expert',
    skills: ['Aerospace Manufacturing', 'Precision Engineering', 'Welding', 'Quality Control', 'CAD Design'],
    urgency: 'high',
    postedDate: '2024-01-23',
    applicants: 8,
    views: 1240,
    featured: true,
    premium: true,
    trending: true,
    estimatedDuration: 'Career opportunity',
    benefits: ['Stock Options', 'Mars Mission Access', 'Cutting-edge Training', 'Health Insurance', 'Relocation Package'],
    requirements: ['Aerospace experience', 'Security clearance eligible', 'Advanced manufacturing skills'],
    tags: ['Space Technology', 'Mars Mission', 'Innovation', 'Career Defining'],
    workSchedule: 'Full-time with mission flexibility',
    responseTime: 'Responds within 2 hours',
    matchScore: 98,
    careerGrowth: 'Exceptional - Lead future missions',
    impactLevel: 'Global - Shape human spaceflight',
    learningOpportunities: ['Rocket Manufacturing', 'Advanced Materials', 'Grid Storage'],
  },
  {
    id: 'dream-job-2',
    title: '⚡ Tesla Gigafactory Battery Technology Specialist',
    description: 'Power the future of sustainable energy! Work with revolutionary battery technology that\'s changing the world. Install and maintain the most advanced energy storage systems while contributing to a carbon-neutral future.',
    company: {
      name: 'Tesla Energy',
      logo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      rating: 4.94,
      verified: true,
      size: 'Large Corporation',
      employees: '100,000+',
      industry: 'Clean Energy & Automotive',
    },
    budget: { min: 85, max: 125, currency: 'USD', type: 'hourly' },
    annualSalary: { min: 110000, max: 160000 },
    location: 'Austin, TX',
    remote: false,
    jobType: 'full-time',
    experience: 'senior',
    skills: ['Battery Technology', 'Electrical Systems', 'Renewable Energy', 'Industrial Automation', 'Safety Protocols'],
    urgency: 'medium',
    postedDate: '2024-01-22',
    applicants: 15,
    views: 2180,
    featured: true,
    premium: false,
    trending: true,
    estimatedDuration: 'Long-term career',
    benefits: ['Tesla Stock', 'Free Supercharging', 'Employee Vehicle Discount', 'Comprehensive Health'],
    requirements: ['Electrical certification', 'Clean energy experience', 'Safety training'],
    tags: ['Clean Energy', 'Innovation', 'Sustainability', 'Technology'],
    workSchedule: 'Standard with overtime opportunities',
    responseTime: 'Responds within 4 hours',
    matchScore: 94,
    careerGrowth: 'High - Lead energy revolution',
    impactLevel: 'Global - Combat climate change',
    learningOpportunities: ['Battery Tech', 'Grid Storage', 'Manufacturing'],
  },
  {
    id: 'dream-job-3',
    title: '🏗️ Apple Park Smart Building Systems Engineer',
    description: 'Design the future of workspaces! Work on the most advanced smart building systems in the world at Apple Park. Integrate cutting-edge IoT, AI, and sustainability technologies in an architectural masterpiece.',
    company: {
      name: 'Apple Facilities',
      logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
      rating: 4.92,
      verified: true,
      size: 'Large Corporation',
      employees: '150,000+',
      industry: 'Technology',
    },
    budget: { min: 95, max: 140, currency: 'USD', type: 'hourly' },
    annualSalary: { min: 125000, max: 180000 },
    location: 'Cupertino, CA',
    remote: false,
    jobType: 'contract',
    experience: 'senior',
    skills: ['Smart Building Tech', 'IoT Systems', 'HVAC Advanced', 'Building Automation', 'Sustainability'],
    urgency: 'low',
    postedDate: '2024-01-21',
    applicants: 22,
    views: 3450,
    featured: false,
    premium: true,
    trending: false,
    estimatedDuration: '12-18 months',
    benefits: ['Apple Benefits', 'Campus Access', 'Tech Training', 'Innovation Environment'],
    requirements: ['Smart building experience', 'Apple certification preferred', 'Portfolio required'],
    tags: ['Smart Buildings', 'Innovation', 'Technology', 'Sustainability'],
    workSchedule: 'Flexible with core hours',
    responseTime: 'Responds within 1 hour',
    matchScore: 91,
    careerGrowth: 'High - Pioneer smart buildings',
    impactLevel: 'Industry - Set new standards',
    learningOpportunities: ['AI Integration', 'Smart Systems', 'Green Tech'],
  },
  {
    id: 'dream-job-4',
    title: '🌊 Ocean Cleanup Project Marine Engineer',
    description: 'Save our oceans! Join the revolutionary Ocean Cleanup project building systems to remove plastic from our seas. Work on floating barriers, collection systems, and marine robotics that are healing our planet.',
    company: {
      name: 'The Ocean Cleanup',
      logo: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
      rating: 4.89,
      verified: true,
      size: 'Non-profit',
      employees: '100+',
      industry: 'Environmental Technology',
    },
    budget: { min: 75, max: 110, currency: 'USD', type: 'hourly' },
    annualSalary: { min: 95000, max: 140000 },
    location: 'Rotterdam, Netherlands',
    remote: true,
    jobType: 'contract',
    experience: 'mid',
    skills: ['Marine Engineering', 'Environmental Tech', 'Robotics', 'Materials Science', 'Project Management'],
    urgency: 'medium',
    postedDate: '2024-01-20',
    applicants: 31,
    views: 4200,
    featured: true,
    premium: false,
    trending: true,
    estimatedDuration: '2-3 years',
    benefits: ['Mission Impact', 'International Team', 'Travel Opportunities', 'Research Access'],
    requirements: ['Marine engineering background', 'Environmental passion', 'International experience'],
    tags: ['Environmental', 'Ocean Conservation', 'Innovation', 'Global Impact'],
    workSchedule: 'Flexible with field work',
    responseTime: 'Responds within 6 hours',
    matchScore: 87,
    careerGrowth: 'Medium - Environmental leadership',
    impactLevel: 'Global - Save marine ecosystems',
    learningOpportunities: ['Marine Tech', 'Environmental Systems', 'Global Collaboration'],
  },
];

const jobCategories = [
  { 
    name: 'Electrical', 
    icon: <ElectricalIcon />, 
    count: 18450, 
    color: '#FFD700', 
    trending: true,
    description: 'Smart systems, renewable energy & automation',
    avgSalary: '$85,000',
    growth: '+28%',
    demandLevel: 'Explosive',
    topSkills: ['Smart Home Tech', 'Solar Systems', 'Industrial Automation'],
  },
  { 
    name: 'Plumbing', 
    icon: <PlumbingIcon />, 
    count: 14240, 
    color: '#4A90E2', 
    hot: true,
    description: 'Water systems, green solutions & emergency response',
    avgSalary: '$78,000',
    growth: '+22%',
    demandLevel: 'Very High',
    topSkills: ['Green Plumbing', 'Emergency Repair', 'Water Treatment'],
  },
  { 
    name: 'Construction', 
    icon: <ConstructionIcon />, 
    count: 32890, 
    color: '#E74C3C',
    description: 'Smart buildings, infrastructure & sustainable construction',
    avgSalary: '$82,000',
    growth: '+18%',
    demandLevel: 'Very High',
    topSkills: ['Smart Buildings', 'Sustainable Construction', 'Project Management'],
  },
  { 
    name: 'HVAC', 
    icon: <SpeedIcon />, 
    count: 11560, 
    color: '#2ECC71',
    description: 'Climate control, energy efficiency & smart systems',
    avgSalary: '$80,000',
    growth: '+25%',
    demandLevel: 'High',
    topSkills: ['Smart Climate', 'Energy Efficiency', 'System Integration'],
  },
  { 
    name: 'Smart Tech', 
    icon: <HomeIcon />, 
    count: 8780, 
    color: '#9B59B6', 
    newest: true,
    description: 'IoT integration, automation & AI systems',
    avgSalary: '$95,000',
    growth: '+52%',
    demandLevel: 'Explosive',
    topSkills: ['IoT Systems', 'AI Integration', 'Home Automation'],
  },
  { 
    name: 'Design', 
    icon: <PsychologyIcon />, 
    count: 12340, 
    color: '#E67E22',
    description: 'Interior design, space planning & creative solutions',
    avgSalary: '$72,000',
    growth: '+19%',
    demandLevel: 'High',
    topSkills: ['Space Planning', '3D Design', 'Sustainable Design'],
  },
];

const workerStats = [
  { 
    icon: <WorkIcon sx={{ fontSize: 56 }} />, 
    value: '125,000+', 
    label: 'Dream Opportunities',
    subtitle: 'Updated every minute',
    color: '#FFD700',
    trend: '+23% this month',
    description: 'From entry-level to industry-leading positions',
    animation: pulse,
    gradient: 'primary',
  },
  { 
    icon: <AttachMoneyIcon sx={{ fontSize: 56 }} />, 
    value: '$145K', 
    label: 'Average Salary',
    subtitle: 'For skilled professionals',
    color: '#2ECC71',
    trend: '+18% year over year',
    description: 'Industry-leading compensation packages',
    animation: float,
    gradient: 'success',
  },
  { 
    icon: <TrendingUpIcon sx={{ fontSize: 56 }} />, 
    value: '3.2x', 
    label: 'Career Growth Rate',
    subtitle: 'Faster than other industries',
    color: '#3498DB',
    trend: 'Accelerating rapidly',
    description: 'Unmatched professional development',
    animation: shimmer,
    gradient: 'info',
  },
  { 
    icon: <StarIcon sx={{ fontSize: 56 }} />, 
    value: '4.92/5', 
    label: 'Worker Satisfaction',
    subtitle: 'Job fulfillment rating',
    color: '#E74C3C',
    trend: '+0.08 this quarter',
    description: 'Love what you do, every day',
    animation: sparkle,
    gradient: 'error',
  },
  { 
    icon: <RocketIcon sx={{ fontSize: 56 }} />, 
    value: '24hrs', 
    label: 'Average Hire Time',
    subtitle: 'From application to offer',
    color: '#9C27B0',
    trend: '67% faster',
    description: 'Lightning-fast job matching',
    animation: rotateGlow,
    gradient: 'primary',
  },
  { 
    icon: <DiamondIcon sx={{ fontSize: 56 }} />, 
    value: '89%', 
    label: 'Premium Job Rate',
    subtitle: 'High-quality opportunities',
    color: '#FF5722',
    trend: 'Industry leading',
    description: 'Exceptional career opportunities',
    animation: heartbeat,
    gradient: 'error',
  },
];

const JobSearchPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const heroRef = useRef(null);
  const searchRef = useRef(null);
  
  // Redux state with enhanced safety
  const jobs = useSelector(selectJobs) || [];
  const loading = useSelector(selectJobsLoading) || false;
  const error = useSelector(selectJobsError);
  const filters = useSelector(selectJobFilters) || {};
  const { currentPage = 1, totalPages = 0 } = useSelector(selectJobsPagination) || {};

  // Enhanced local state for better UX
  const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'grid');
  const [userPosition, setUserPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSampleData, setShowSampleData] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [filterDialog, setFilterDialog] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [salaryRange, setSalaryRange] = useState([0, 200]);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [jobType, setJobType] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
  const [careerInsights, setCareerInsights] = useState(null);
  const [skillGaps, setSkillGaps] = useState([]);
  const [animateCards, setAnimateCards] = useState(false);

  // Skill options for autocomplete
  const skillOptions = [
    'Electrical Wiring', 'Smart Home Integration', 'Solar Installation', 'Industrial Automation',
    'Plumbing Repair', 'Water Systems', 'Emergency Response', 'Green Plumbing',
    'Project Management', 'Construction', 'Renovation', 'Sustainable Building',
    'HVAC Systems', 'Climate Control', 'Energy Efficiency', 'Smart Climate',
    'Interior Design', 'Custom Furniture', 'Space Planning', '3D Design',
    'Carpentry', 'Woodworking', 'Cabinet Making', 'Custom Millwork',
    'IoT Systems', 'Home Automation', 'AI Integration', 'Smart Buildings',
    'Welding', 'Fabrication', 'Metal Working', 'Precision Manufacturing',
  ];

  // Get user location for personalized job matching
  useEffect(() => {
    if (navigator.geolocation && isAuthenticated()) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, [isAuthenticated]);

  // Responsive view mode adjustment
  useEffect(() => {
    if (isMobile && viewMode === 'grid') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);

  // Enhanced search with AI-powered matching
  const handleSearch = useCallback(async () => {
    setShowSampleData(false);
    setAnimateCards(true);
    
    const searchParams = {
      search: searchQuery.trim(),
      category: selectedCategory,
      sortBy,
      remote: onlyRemote,
      urgent: onlyUrgent,
      featured: onlyFeatured,
      experience: experienceLevel,
      jobType,
      minSalary: salaryRange[0],
      maxSalary: salaryRange[1],
      skills: selectedSkills,
      location: userPosition,
      page: 1,
    };

    try {
      const newFilters = { ...filters, ...searchParams };
      dispatch(setFilters(newFilters));
      dispatch(fetchJobs(newFilters));
      
      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'job_search', {
          search_term: searchQuery,
          category: selectedCategory,
          skills_count: selectedSkills.length,
          filters_applied: Object.keys(searchParams).filter(key => searchParams[key]).length,
        });
      }
      
      // Personalized recommendations based on user profile
      if (isAuthenticated() && user) {
        generatePersonalizedRecommendations();
        analyzeCareerGrowth();
        identifySkillGaps();
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [searchQuery, selectedCategory, sortBy, onlyRemote, onlyUrgent, onlyFeatured, experienceLevel, jobType, salaryRange, selectedSkills, userPosition, filters, dispatch, isAuthenticated, user]);

  // Generate personalized job recommendations
  const generatePersonalizedRecommendations = useCallback(() => {
    if (!user) return;
    
    // Mock AI-powered recommendations based on user profile
    const userSkills = user.skills || [];
    const userExperience = user.experience || 'mid';
    const userLocation = user.location || 'Remote';
    
    const recommendations = creativeJobOpportunities.filter(job => {
      const skillMatch = job.skills.some(skill => 
        userSkills.some(userSkill => 
          skill.toLowerCase().includes(userSkill.toLowerCase()) ||
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      const experienceMatch = job.experience === userExperience || 
        (userExperience === 'expert' && ['senior', 'mid'].includes(job.experience)) ||
        (userExperience === 'senior' && job.experience === 'mid');
      
      return skillMatch && experienceMatch;
    });
    
    setPersonalizedRecommendations(recommendations);
  }, [user]);

  // Analyze career growth opportunities
  const analyzeCareerGrowth = useCallback(() => {
    if (!user) return;
    
    const insights = {
      currentLevel: user.experience || 'mid',
      nextLevel: user.experience === 'entry' ? 'mid' : user.experience === 'mid' ? 'senior' : 'expert',
      avgSalaryIncrease: user.experience === 'entry' ? '35%' : user.experience === 'mid' ? '28%' : '22%',
      timeToPromotion: user.experience === 'entry' ? '18 months' : user.experience === 'mid' ? '2-3 years' : '3-5 years',
      recommendedSkills: ['Smart Home Tech', 'Project Management', 'Advanced Certification'],
      marketDemand: 'Very High',
      growthPotential: user.experience === 'entry' ? 'Excellent' : user.experience === 'mid' ? 'Strong' : 'Moderate',
    };
    
    setCareerInsights(insights);
  }, [user]);

  // Identify skill gaps for career advancement
  const identifySkillGaps = useCallback(() => {
    if (!user) return;
    
    const userSkills = user.skills || [];
    const demandedSkills = ['Smart Home Integration', 'IoT Systems', 'Project Management', 'Renewable Energy', 'AI Integration'];
    
    const gaps = demandedSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    setSkillGaps(gaps);
  }, [user]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('relevance');
    setOnlyRemote(false);
    setOnlyUrgent(false);
    setOnlyFeatured(false);
    setExperienceLevel('');
    setJobType('');
    setSalaryRange([0, 200]);
    setSelectedSkills([]);
    setShowSampleData(true);
    dispatch(setFilters({}));
  }, [dispatch]);

  const toggleSaveJob = useCallback((jobId) => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
    
    // TODO: Sync with backend API
  }, [isAuthenticated, navigate]);

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

  // Auto-save user preferences
  useEffect(() => {
    if (isAuthenticated()) {
      const preferences = {
        viewMode,
        sortBy,
        salaryRange,
        selectedSkills,
        experienceLevel,
        jobType,
      };
      localStorage.setItem('workerJobSearchPreferences', JSON.stringify(preferences));
    }
  }, [viewMode, sortBy, salaryRange, selectedSkills, experienceLevel, jobType, isAuthenticated]);

  // Load saved preferences
  useEffect(() => {
    if (isAuthenticated()) {
      try {
        const saved = localStorage.getItem('workerJobSearchPreferences');
        if (saved) {
          const preferences = JSON.parse(saved);
          setViewMode(preferences.viewMode || (isMobile ? 'list' : 'grid'));
          setSortBy(preferences.sortBy || 'relevance');
          setSalaryRange(preferences.salaryRange || [0, 200]);
          setSelectedSkills(preferences.selectedSkills || []);
          setExperienceLevel(preferences.experienceLevel || '');
          setJobType(preferences.jobType || '');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, [isAuthenticated, isMobile]);

  // Initialize personalized features for authenticated users
  useEffect(() => {
    if (isAuthenticated() && user && isInitialized) {
      generatePersonalizedRecommendations();
      analyzeCareerGrowth();
      identifySkillGaps();
    }
  }, [isAuthenticated, user, isInitialized, generatePersonalizedRecommendations, analyzeCareerGrowth, identifySkillGaps]);

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
                Find Your Dream Work
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
                🚀 Discover amazing opportunities in skilled trades
                <br />
                💰 Unlock your earning potential with top employers
                <br />
                🌟 Build your career with meaningful work
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 6 }}>
                <AnimatedButton
                  size="large"
                  startIcon={<SearchIcon />}
                  onClick={() => window.scrollTo({ 
                    top: heroRef.current?.offsetHeight || 600, 
                    behavior: 'smooth' 
                  })}
                >
                  Explore Opportunities
                </AnimatedButton>
                <AnimatedButton
                  variant="outlined"
                  size="large"
                  startIcon={<WorkspacePremiumIcon />}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: alpha('#ffffff', 0.1),
                    },
                  }}
                  onClick={() => navigate('/worker/profile')}
                >
                  Build Your Profile
                </AnimatedButton>
              </Stack>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, opacity: 0.8 }}>
                  🏆 Join professionals working with:
                </Typography>
                <Stack direction="row" spacing={3} sx={{ opacity: 0.7, flexWrap: 'wrap' }}>
                  {['Tesla', 'Apple', 'Google', 'Microsoft', 'SpaceX'].map((company) => (
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
                {workerStats.map((stat, index) => (
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
          🎯 Smart Job Discovery Engine
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs by title, company, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: theme.palette.secondary.main }} />
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
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="salary_high">Highest Salary</MenuItem>
                <MenuItem value="salary_low">Lowest Salary</MenuItem>
                <MenuItem value="match">Best Match</MenuItem>
                <MenuItem value="deadline">Deadline Soon</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyRemote}
                    onChange={(e) => setOnlyRemote(e.target.checked)}
                    color="secondary"
                  />
                }
                label="Remote Only"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyUrgent}
                    onChange={(e) => setOnlyUrgent(e.target.checked)}
                    color="error"
                  />
                }
                label="Urgent"
              />
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <AnimatedButton
                variant="contained"
                onClick={handleSearch}
                fullWidth
                startIcon={<SearchIcon />}
              >
                Find Jobs
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={experienceLevel}
                  label="Experience Level"
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="mid">Mid Level</MenuItem>
                  <MenuItem value="senior">Senior Level</MenuItem>
                  <MenuItem value="expert">Expert Level</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={jobType}
                  label="Job Type"
                  onChange={(e) => setJobType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="full-time">Full Time</MenuItem>
                  <MenuItem value="part-time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="freelance">Freelance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Hourly Rate: ${salaryRange[0]} - ${salaryRange[1]}</Typography>
              <Slider
                value={salaryRange}
                onChange={(e, newValue) => setSalaryRange(newValue)}
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
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={clearFilters} startIcon={<ClearIcon />} variant="outlined">
                  Clear All
                </Button>
                <AnimatedButton onClick={handleSearch} startIcon={<SearchIcon />}>
                  Apply Filters
                </AnimatedButton>
              </Stack>
            </Grid>
          </Grid>
        </Collapse>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            endIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
        🎯 Explore Job Categories
      </Typography>
      
      <Grid container spacing={3} justifyContent="center">
        {jobCategories.map((category, index) => (
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
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
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
                  label={`${category.count.toLocaleString()} jobs`}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box>
                  {category.trending && <Chip label="🔥" size="small" sx={{ m: 0.25 }} />}
                  {category.hot && <Chip label="💎" size="small" sx={{ m: 0.25 }} />}
                  {category.newest && <Chip label="✨" size="small" sx={{ m: 0.25 }} />}
                  {category.premium && <Chip label="👑" size="small" sx={{ m: 0.25 }} />}
                </Box>
              </GlassCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Container>
  );

  const renderJobCard = (job, index) => (
    <Grid item xs={12} sm={6} lg={viewMode === 'list' ? 12 : 4} key={job.id}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <JobOpportunityCard
          featured={job.featured}
          urgent={job.urgency === 'high'}
          premium={job.premium}
          trending={job.matchScore >= 90}
          matchScore={job.matchScore}
          elevation={job.featured ? 12 : 4}
        >
          <CardContent sx={{ 
            p: 3, 
            pt: job.featured && job.premium ? 7 : job.featured || job.premium ? 5 : 3,
            pb: 2
          }}>
            {/* Job Header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Avatar
                src={job.company.logo}
                sx={{
                  width: 60,
                  height: 60,
                  mr: 2,
                  border: `3px solid ${theme.palette.secondary.main}`,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
                }}
              />
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {job.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {job.company.name}
                  </Typography>
                  {job.company.verified && (
                    <VerifiedIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                  )}
                  <Rating value={job.company.rating} precision={0.1} size="small" readOnly />
                </Stack>
                
                {job.matchScore && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      Match Score:
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={job.matchScore}
                      sx={{ 
                        flexGrow: 1, 
                        mr: 1, 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.secondary.main, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: job.matchScore >= 90 ? theme.palette.success.main : 
                                   job.matchScore >= 70 ? theme.palette.warning.main : 
                                   theme.palette.error.main,
                          borderRadius: 4,
                        }
                      }}
                    />
                    <Typography variant="body2" fontWeight={600} color="secondary.main">
                      {job.matchScore}%
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <IconButton
                onClick={() => toggleSaveJob(job.id)}
                sx={{
                  color: savedJobs.includes(job.id)
                    ? theme.palette.secondary.main
                    : theme.palette.text.secondary,
                }}
              >
                {savedJobs.includes(job.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Box>

            {/* Job Description */}
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
              {job.description}
            </Typography>

            {/* Skills */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Required Skills
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {job.skills.slice(0, 4).map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: theme.palette.secondary.main,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}
                {job.skills.length > 4 && (
                  <Chip
                    label={`+${job.skills.length - 4} more`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>

            {/* Job Details Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700} color="secondary.main">
                    ${job.budget.min}-{job.budget.max}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    per {job.budget.type}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={600}>
                    {job.applicants}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    applicants
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Location & Details */}
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnIcon fontSize="small" color="secondary" />
                <Typography variant="body2">{job.location}</Typography>
                {job.remote && (
                  <Chip label="Remote" size="small" color="success" />
                )}
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <ScheduleIcon fontSize="small" color="secondary" />
                <Typography variant="body2">{job.estimatedDuration}</Typography>
              </Stack>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" color="secondary" />
                <Typography variant="body2">{job.responseTime}</Typography>
              </Stack>
            </Stack>

            {/* Tags */}
            {job.tags && (
              <Stack direction="row" spacing={0.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                {job.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Stack>
            )}

            {/* Benefits Preview */}
            {job.benefits && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Benefits & Perks
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {job.benefits.slice(0, 3).map((benefit) => (
                    <Chip
                      key={benefit}
                      label={benefit}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        fontSize: '0.7rem',
                      }}
                    />
                  ))}
                  {job.benefits.length > 3 && (
                    <Chip
                      label={`+${job.benefits.length - 3} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
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
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                View Details
              </AnimatedButton>
              <AnimatedButton
                variant="outlined"
                startIcon={<HandshakeIcon />}
                onClick={() => navigate(`/jobs/${job.id}/apply`)}
                sx={{
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                }}
              >
                Apply Now
              </AnimatedButton>
              <IconButton color="primary">
                <ShareIcon />
              </IconButton>
            </Stack>
          </CardActions>
        </JobOpportunityCard>
      </motion.div>
    </Grid>
  );

  const renderFeaturedJobs = () => (
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
          🌟 Premium Opportunities
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Hand-picked jobs from top employers with exceptional benefits
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {creativeJobOpportunities.map((job, index) => 
          renderJobCard(job, index)
        )}
      </Grid>
    </Container>
  );

  const renderMapView = () => (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ height: 600, borderRadius: 3, overflow: 'hidden' }}>
        <MapContainer
          center={userPosition || [39.8283, -98.5795]} // Center of USA if no user location
          zoom={userPosition ? 13 : 4}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
              {/* User Location Marker */}
              {userPosition && (
                <Marker position={userPosition}>
              <Popup>📍 You are here</Popup>
                </Marker>
              )}
          
          {/* Job Markers */}
          {(showSampleData ? creativeJobOpportunities : jobs)
            .filter(job => job.coordinates)
                .map((job) => (
                  <Marker
                    key={job.id}
                position={[job.coordinates?.lat || 37.7749, job.coordinates?.lng || -122.4194]}
                  >
                    <Popup>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {job.title}
                      </Typography>
                    <Typography variant="body2" gutterBottom>
                      {job.company?.name || 'Company Name'}
                    </Typography>
                    <Typography variant="body2" color="secondary.main" fontWeight="bold">
                      ${job.budget?.min}-{job.budget?.max}/{job.budget?.type}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ mt: 1 }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </Box>
    </Container>
  );

  // Mobile detection
  const isActualMobile = useMediaQuery('(max-width: 768px)');

  // Mobile job search template
  if (isActualMobile) {
    return (
      <>
        <Helmet>
          <title>Find Work - Kelmah</title>
          <meta name="description" content="Find vocational jobs - carpentry, plumbing, electrical work" />
        </Helmet>

        <Box
          sx={{
            minHeight: '100vh',
            backgroundColor: '#161513',
            color: 'white',
            fontFamily: 'Manrope, "Noto Sans", sans-serif',
          }}
        >
          {/* Mobile Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#161513',
              p: 2,
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={() => navigate('/worker/dashboard')}
                sx={{
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  color: '#FFD700',
                  width: 40,
                  height: 40,
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography
                sx={{
                  color: '#FFD700',
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                }}
              >
                Find Work
              </Typography>
            </Box>
            <IconButton
              sx={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: '#FFD700',
                width: 40,
                height: 40,
              }}
            >
              <FilterListIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Search Bar */}
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              placeholder="Search jobs (carpenter, plumber, electrician...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#24231e',
                  borderRadius: '12px',
                  '& fieldset': { borderColor: '#35332c' },
                  '&:hover fieldset': { borderColor: '#FFD700' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' },
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                  fontSize: '0.875rem',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#b2afa3',
                  opacity: 1,
                },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#b2afa3', mr: 1, fontSize: 20 }} />
                ),
              }}
            />
          </Box>

          {/* Quick Filters */}
          <Box sx={{ px: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              {['All Jobs', 'Carpenter', 'Plumber', 'Electrician', 'Mason'].map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  onClick={() => setSelectedCategory(filter === 'All Jobs' ? '' : filter)}
                  sx={{
                    backgroundColor: selectedCategory === (filter === 'All Jobs' ? '' : filter) 
                      ? '#FFD700' 
                      : '#35332c',
                    color: selectedCategory === (filter === 'All Jobs' ? '' : filter) 
                      ? '#161513' 
                      : 'white',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Job Results */}
          <Box sx={{ px: 2 }}>
            <Typography
              sx={{
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                mb: 2,
              }}
            >
              Available Jobs ({showSampleData ? '12' : jobs.length})
            </Typography>

            {/* Sample Job Cards */}
            {[
              {
                title: 'Residential Carpenter',
                company: 'Golden Gate Construction',
                location: 'East Legon, Accra',
                pay: 'GH₵150/day',
                type: 'Full-time',
                posted: '2 hours ago',
                description: 'Looking for experienced carpenter for residential project...',
              },
              {
                title: 'Plumbing Technician',
                company: 'AquaFlow Services',
                location: 'Asokwa, Kumasi',
                pay: 'GH₵120/day',
                type: 'Contract',
                posted: '4 hours ago',
                description: 'Emergency plumbing repairs and installations needed...',
              },
              {
                title: 'Electrical Installer',
                company: 'PowerTech Ghana',
                location: 'Industrial Area, Tema',
                pay: 'GH₵180/day',
                type: 'Full-time',
                posted: '1 day ago',
                description: 'Commercial electrical installation and maintenance...',
              },
            ].map((job, index) => (
              <Paper
                key={index}
                sx={{
                  backgroundColor: '#24231e',
                  borderRadius: '12px',
                  p: 2,
                  mb: 2,
                  border: '1px solid #35332c',
                }}
              >
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          mb: 0.5,
                        }}
                      >
                        {job.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#b2afa3',
                          fontSize: '0.875rem',
                          mb: 0.5,
                        }}
                      >
                        {job.company}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#9e9e9e',
                          fontSize: '0.75rem',
                          mb: 1,
                        }}
                      >
                        📍 {job.location} • {job.posted}
                      </Typography>
                    </Box>
                    <IconButton
                      sx={{
                        color: '#b2afa3',
                        '&:hover': { color: '#FFD700' },
                      }}
                    >
                      <BookmarkBorderIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip
                      label={job.type}
                      size="small"
                      sx={{
                        backgroundColor: '#FFD700',
                        color: '#161513',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        height: 20,
                      }}
                    />
                    <Chip
                      label={job.pay}
                      size="small"
                      sx={{
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        height: 20,
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      color: '#b2afa3',
                      fontSize: '0.8rem',
                      mb: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {job.description}
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: '#FFD700',
                      color: '#161513',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      borderRadius: '8px',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#FFC000',
                      },
                    }}
                  >
                    Apply Now
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Bottom spacing for nav */}
          <Box sx={{ height: '100px' }} />
        </Box>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Find Your Dream Job - Professional Opportunities for Workers | Kelmah</title>
        <meta name="description" content="Discover high-paying jobs in skilled trades. Find opportunities in electrical, plumbing, construction, HVAC, and specialized fields. Build your career with top employers." />
      </Helmet>

      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {renderHeroSection()}
        {renderSearchInterface()}
        {renderCategories()}
        
        {/* Content Area */}
        {viewMode === 'map' ? (
          renderMapView()
        ) : loading ? (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {Array.from(new Array(6)).map((_, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={idx}>
                  <Skeleton variant="rectangular" height={450} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          </Container>
        ) : showSampleData ? (
          renderFeaturedJobs()
        ) : (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
              Search Results ({jobs.length} jobs found)
            </Typography>
            <Grid container spacing={3}>
              {jobs.map((job, index) => renderJobCard(job, index))}
            </Grid>
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
            tooltipTitle="Refresh Jobs"
            onClick={handleSearch}
          />
          <SpeedDialAction
            icon={<BookmarkIcon />}
            tooltipTitle="Saved Jobs"
            onClick={() => navigate('/worker/saved-jobs')}
          />
          <SpeedDialAction
            icon={<NotificationsActiveIcon />}
            tooltipTitle="Job Alerts"
            onClick={() => navigate('/worker/job-alerts')}
          />
          <SpeedDialAction
            icon={<DashboardIcon />}
            tooltipTitle="Dashboard"
            onClick={() => navigate('/worker/dashboard')}
          />
        </SpeedDial>
    </Box>
    </>
  );
};

export default JobSearchPage;
