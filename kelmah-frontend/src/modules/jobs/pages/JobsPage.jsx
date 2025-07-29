import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Skeleton,
  Pagination,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Stack,
  Rating,
  Divider,

  Grow,
  Collapse,
  Fab,
  Badge,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
  Autocomplete,
  InputAdornment,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  ToggleButton,
  ToggleButtonGroup,
  Zoom,
  Fade,
  Slide,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CheckCircle,
  Group,
  WorkspacePremium,
  LocationOn,
  Schedule,
  MonetizationOn,
  Business,
  Star,
  Verified,
  AccessTime,
  ExpandMore,
  ExpandLess,
  Tune,
  Clear,
  BookmarkBorder,
  Bookmark,
  Share,
  Visibility,
  Work as WorkIcon,
  Apartment as ApartmentIcon,
  FlashOn as FlashOnIcon,
  TrendingUp as TrendingIcon,
  LocalOffer as LocalOfferIcon,
  FilterAlt as FilterAltIcon,
  Sort as SortIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  ViewQuilt as ViewQuiltIcon,
  Map as MapIcon,
  MyLocation as MyLocationIcon,
  Refresh as RefreshIcon,
  SaveAlt as SaveAltIcon,
  NotificationsActive as NotificationsActiveIcon,
  TrendingDown as TrendingDownIcon,
  AutoAwesome as AutoAwesomeIcon,
  Whatshot as WhatshotIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Handshake as HandshakeIcon,
  EmojiEvents as EmojiEventsIcon,
  ShowChart as TimelineIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  CenterFocusStrong as CenterFocusStrongIcon,
  Layers as LayersIcon,
  Psychology as PsychologyIcon,
  Engineering as EngineeringIcon,
  Construction as ConstructionIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Handyman as CarpenterIcon,
  Thermostat as HvacIcon,
  RoofingSharp as RoofingIcon,
  FormatPaint as PaintIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  StarBorder as StarBorderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  Explore as ExploreIcon,
  Rocket as RocketIcon,
  Diamond as DiamondIcon,
  LocalFireDepartment as FireIcon,
  Bolt as BoltIcon,
  AutoGraph as GraphIcon,
  Psychology as BrainIcon,
  Architecture as ArchitectureIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, keyframes, alpha } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet';
import useAuth from '../../auth/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchJobs,
  setFilters,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  selectJobFilters,
  selectJobsPagination,
} from '../services/jobSlice';
import JobCard from '../components/common/JobCard';
import { useNavigate } from 'react-router-dom';

// Advanced Animations with Smooth Transitions
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-15px) rotate(0deg); }
  75% { transform: translateY(-10px) rotate(-1deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
`;

const slideInFromBottom = keyframes`
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
`;

const rotateGlow = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Professional Styled Components with Premium Feel
const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 25%,
    ${theme.palette.primary.dark} 50%,
    ${theme.palette.secondary.main} 75%,
    ${theme.palette.primary.main} 100%)`,
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 15s ease infinite`,
  color: 'white',
  padding: theme.spacing(12, 0),
  position: 'relative',
  overflow: 'hidden',
  minHeight: '85vh',
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 80%, ${alpha('#FFD700', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, ${alpha('#FFA500', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, ${alpha('#FF6B6B', 0.2)} 0%, transparent 50%)`,
    animation: `${float} 20s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${alpha('#FFD700', 0.1)} 60deg, transparent 120deg)`,
    animation: `${rotateGlow} 30s linear infinite`,
  },
  [theme.breakpoints.down('md')]: {
    minHeight: '70vh',
    padding: theme.spacing(8, 0),
  },
  [theme.breakpoints.down('sm')]: {
    minHeight: '60vh',
    padding: theme.spacing(6, 0),
  },
}));

const GlassCard = styled(Card)(({ theme, variant = 'default', featured = false }) => ({
  background: variant === 'glass' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`
    : featured 
    ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`
    : theme.palette.background.paper,
  backdropFilter: variant === 'glass' ? 'blur(20px)' : 'blur(10px)',
  border: featured 
    ? `2px solid ${theme.palette.secondary.main}` 
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 24,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: featured 
      ? `0 32px 64px ${alpha(theme.palette.secondary.main, 0.4)}, 0 16px 32px ${alpha(theme.palette.primary.main, 0.2)}`
      : `0 24px 48px ${alpha(theme.palette.common.black, 0.15)}`,
    borderColor: theme.palette.secondary.main,
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
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)`,
    transition: 'left 0.6s',
    opacity: 0,
  },
  '&:hover::before': {
    left: '100%',
    opacity: 1,
  },
}));

const StatCard = styled(motion.div)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`,
  backdropFilter: 'blur(20px)',
  borderRadius: 24,
  padding: theme.spacing(4),
  textAlign: 'center',
  border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.05)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.secondary.main, 0.3)}`,
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
    width: '100px',
    height: '100px',
    background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 70%)`,
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
}));

const FloatingSearchBar = styled(Paper)(({ theme }) => ({
  position: 'sticky',
  top: theme.spacing(2),
  zIndex: 1100,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.95)})`,
  backdropFilter: 'blur(30px)',
  borderRadius: 32,
  padding: theme.spacing(3),
  border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
  boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 8px 24px ${alpha(theme.palette.secondary.main, 0.1)}`,
  margin: theme.spacing(2, 0),
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.secondary.main,
    boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.15)}, 0 12px 32px ${alpha(theme.palette.secondary.main, 0.2)}`,
  },
}));

const CategoryChip = styled(Chip)(({ theme, selected, trending, hot, newest }) => ({
  borderRadius: 28,
  padding: theme.spacing(1.5, 2.5),
  margin: theme.spacing(0.5),
  fontWeight: 700,
  fontSize: '0.95rem',
  minHeight: 48,
  background: selected 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
  color: selected ? 'white' : theme.palette.text.primary,
  border: `2px solid ${selected ? 'transparent' : alpha(theme.palette.secondary.main, 0.3)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.05)',
    boxShadow: `0 12px 24px ${alpha(theme.palette.secondary.main, 0.4)}`,
    borderColor: theme.palette.secondary.main,
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
    background: trending 
      ? `linear-gradient(45deg, ${alpha('#FF6B6B', 0.2)}, ${alpha('#FFD700', 0.2)})`
      : hot 
      ? `linear-gradient(45deg, ${alpha('#FF4500', 0.2)}, ${alpha('#FFA500', 0.2)})`
      : newest 
      ? `linear-gradient(45deg, ${alpha('#4CAF50', 0.2)}, ${alpha('#8BC34A', 0.2)})`
      : 'transparent',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  ...(trending && {
    '&::after': {
      content: '"🔥"',
      position: 'absolute',
      top: -4,
      right: -4,
      fontSize: '1.2rem',
      animation: `${sparkle} 2s ease-in-out infinite`,
    },
  }),
  ...(hot && {
    '&::after': {
      content: '"💎"',
      position: 'absolute',
      top: -4,
      right: -4,
      fontSize: '1.2rem',
      animation: `${pulse} 2s ease-in-out infinite`,
    },
  }),
  ...(newest && {
    '&::after': {
      content: '"✨"',
      position: 'absolute',
      top: -4,
      right: -4,
      fontSize: '1.2rem',
      animation: `${float} 3s ease-in-out infinite`,
    },
  }),
}));

const AnimatedButton = styled(Button)(({ theme, variant = 'contained', size = 'medium' }) => ({
  borderRadius: size === 'large' ? 32 : size === 'small' ? 20 : 28,
  padding: size === 'large' 
    ? theme.spacing(2, 5) 
    : size === 'small' 
    ? theme.spacing(1, 2.5) 
    : theme.spacing(1.5, 4),
  fontWeight: 800,
  fontSize: size === 'large' ? '1.1rem' : size === 'small' ? '0.85rem' : '1rem',
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: variant === 'contained' 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.dark} 100%)`
    : 'transparent',
  border: variant === 'outlined' 
    ? `2px solid ${theme.palette.secondary.main}` 
    : 'none',
  color: variant === 'contained' ? 'white' : theme.palette.secondary.main,
  boxShadow: variant === 'contained' 
    ? `0 8px 24px ${alpha(theme.palette.secondary.main, 0.3)}` 
    : 'none',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: variant === 'contained' 
      ? `0 16px 40px ${alpha(theme.palette.secondary.main, 0.4)}` 
      : `0 8px 24px ${alpha(theme.palette.secondary.main, 0.2)}`,
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
    background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.4)}, transparent)`,
    transition: 'left 0.6s',
  },
  '&:active': {
    transform: 'translateY(-2px) scale(0.98)',
  },
}));

const PremiumJobCard = styled(GlassCard)(({ theme, featured, urgent, premium, trending }) => ({
  height: '100%',
  position: 'relative',
  background: featured 
    ? `linear-gradient(135deg, 
        ${alpha(theme.palette.secondary.main, 0.08)} 0%, 
        ${alpha(theme.palette.primary.main, 0.08)} 50%,
        ${alpha(theme.palette.secondary.main, 0.12)} 100%)`
    : theme.palette.background.paper,
  border: featured 
    ? `3px solid ${theme.palette.secondary.main}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': urgent ? {
    content: '"🚨 URGENT HIRING"',
    position: 'absolute',
    top: 20,
    right: -45,
    background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
    color: 'white',
    padding: '8px 50px',
    fontSize: '0.75rem',
    fontWeight: 800,
    transform: 'rotate(45deg)',
    letterSpacing: '1px',
    zIndex: 2,
    boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.4)}`,
    animation: `${pulse} 2s ease-in-out infinite`,
  } : {},
  '&::after': premium ? {
    content: '"👑 PREMIUM OPPORTUNITY"',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
    color: 'white',
    textAlign: 'center',
    fontSize: '0.8rem',
    fontWeight: 800,
    padding: '8px 0',
    letterSpacing: '1px',
    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
  } : {},
}));

const InteractiveIcon = styled(Box)(({ theme, color = theme.palette.secondary.main }) => ({
  color: color,
  fontSize: '3rem',
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.2) rotate(10deg)',
    filter: 'drop-shadow(0 8px 16px rgba(212, 175, 55, 0.3))',
  },
}));

const GradientText = styled(Typography)(({ theme, gradient = 'primary' }) => ({
  background: gradient === 'primary' 
    ? `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`
    : gradient === 'success'
    ? `linear-gradient(135deg, #4CAF50, #8BC34A)`
    : gradient === 'error'
    ? `linear-gradient(135deg, #F44336, #FF5722)`
    : `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 900,
}));

// Enhanced sample data with more creative and diverse job opportunities
const enhancedSampleJobs = [
  {
    id: 'premium-1',
    title: '🏗️ Smart City Infrastructure Project - Lead Engineer',
    description: 'Join the future of urban development! Lead a revolutionary smart city project integrating IoT sensors, sustainable energy systems, and cutting-edge construction techniques. Work with international teams on a $50M+ project that will redefine modern city living.',
    budget: { min: 85000, max: 120000, currency: 'USD', type: 'project' },
    location: 'Dubai, UAE',
    jobType: 'contract',
    experience: 'expert',
    skills: ['Smart City Technology', 'IoT Integration', 'Project Management', 'Sustainable Construction', 'Team Leadership'],
    urgency: 'high',
    postedDate: '2024-01-22',
    applicants: 18,
    views: 2340,
    featured: true,
    premium: true,
    trending: true,
    client: {
      name: 'Future Cities International',
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      rating: 4.95,
      jobsPosted: 23,
      verified: true,
      companyType: 'Technology & Construction',
      employees: '1000+',
    },
    estimatedDuration: '18-24 months',
    benefits: ['Health Insurance', 'Housing Allowance', 'Visa Sponsorship', 'Performance Bonus', 'Professional Development'],
    tags: ['International', 'High-Tech', 'Premium Project', 'Career Defining'],
    requirements: ['15+ years experience', 'International project experience', 'Smart city certifications', 'Multilingual preferred'],
    salaryRange: { min: 85000, max: 120000 },
    workEnvironment: 'On-site with international travel',
    companyBenefits: ['Stock Options', 'Relocation Package', 'Family Support'],
    projectHighlights: ['World\'s first fully integrated smart district', 'Sustainable energy systems', 'AI-powered infrastructure'],
  },
  {
    id: 'featured-2',
    title: '⚡ Tesla Gigafactory Electrical Systems Specialist',
    description: 'Be part of the electric revolution! Install and maintain cutting-edge electrical systems in Tesla\'s newest Gigafactory. Work with the most advanced manufacturing equipment and renewable energy systems while contributing to sustainable transportation.',
    budget: { min: 65000, max: 95000, currency: 'USD', type: 'annual' },
    location: 'Austin, Texas',
    jobType: 'full-time',
    experience: 'senior',
    skills: ['Industrial Electrical', 'Tesla Systems', 'Renewable Energy', 'Manufacturing Equipment', 'Safety Protocols'],
    urgency: 'medium',
    postedDate: '2024-01-21',
    applicants: 34,
    views: 1890,
    featured: true,
    premium: false,
    trending: true,
    client: {
      name: 'Tesla Manufacturing',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
      rating: 4.92,
      jobsPosted: 45,
      verified: true,
      companyType: 'Automotive & Energy',
      employees: '10000+',
    },
    estimatedDuration: 'Permanent position',
    benefits: ['Tesla Stock Options', 'Full Medical Coverage', 'Employee Vehicle Discount', 'Professional Training'],
    tags: ['Tesla', 'Green Energy', 'Innovation', 'Full-Time'],
    requirements: ['Tesla certification preferred', '8+ years industrial electrical', 'Clean background check'],
    workEnvironment: 'State-of-the-art manufacturing facility',
    companyBenefits: ['Free Supercharging', 'Gym Membership', 'Cafeteria'],
  },
  {
    id: 'creative-3',
    title: '🎨 Luxury Resort Spa Design & Construction',
    description: 'Create a world-class wellness sanctuary! Design and build a stunning spa complex featuring natural materials, water features, meditation spaces, and therapeutic environments. This is your chance to create something truly extraordinary.',
    budget: { min: 45000, max: 75000, currency: 'USD', type: 'project' },
    location: 'Maldives',
    jobType: 'contract',
    experience: 'mid',
    skills: ['Luxury Construction', 'Spa Design', 'Natural Materials', 'Water Features', 'Wellness Architecture'],
    urgency: 'low',
    postedDate: '2024-01-20',
    applicants: 28,
    views: 3200,
    featured: false,
    premium: true,
    trending: false,
    client: {
      name: 'Paradise Resorts Group',
      avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400',
      rating: 4.88,
      jobsPosted: 12,
      verified: true,
      companyType: 'Hospitality & Wellness',
      employees: '500+',
    },
    estimatedDuration: '8-12 months',
    benefits: ['Accommodation Provided', 'Meals Included', 'Travel Allowance', 'Portfolio Enhancement'],
    tags: ['Luxury', 'International', 'Creative', 'Wellness'],
    requirements: ['Luxury project experience', 'Portfolio required', 'Passport ready'],
    workEnvironment: 'Tropical paradise setting',
    companyBenefits: ['Resort Access', 'Spa Services', 'Cultural Experiences'],
  },
  {
    id: 'innovative-4',
    title: '🚀 Space Technology Manufacturing Facility',
    description: 'Build the future of space exploration! Construct specialized manufacturing facilities for spacecraft components and satellite systems. Work with aerospace-grade materials and precision engineering in a cutting-edge environment.',
    budget: { min: 95000, max: 140000, currency: 'USD', type: 'annual' },
    location: 'Cape Canaveral, FL',
    jobType: 'full-time',
    experience: 'expert',
    skills: ['Aerospace Construction', 'Precision Engineering', 'Clean Room Technology', 'Quality Systems', 'Security Clearance'],
    urgency: 'high',
    postedDate: '2024-01-19',
    applicants: 15,
    views: 1560,
    featured: true,
    premium: true,
    trending: true,
    client: {
      name: 'SpaceX Manufacturing',
      avatar: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400',
      rating: 4.97,
      jobsPosted: 8,
      verified: true,
      companyType: 'Aerospace',
      employees: '5000+',
    },
    estimatedDuration: 'Long-term career opportunity',
    benefits: ['Security Clearance Bonus', 'Space Program Access', 'Cutting-edge Training', 'Stock Options'],
    tags: ['Space Tech', 'High Security', 'Innovation', 'Career Growth'],
    requirements: ['Security clearance eligible', 'Aerospace experience', 'Precision manufacturing background'],
    workEnvironment: 'High-tech aerospace facility',
    companyBenefits: ['Launch Viewing Access', 'Space Memorabilia', 'Technical Conferences'],
  },
];

const categoryData = [
  { 
    name: 'Electrical', 
    icon: <ElectricalIcon />, 
    count: 15420, 
    color: '#FFD700', 
    trending: true,
    description: 'Smart systems, renewable energy & power solutions',
    growth: '+23%',
    avgSalary: '$75,000',
    demandLevel: 'Very High'
  },
  { 
    name: 'Plumbing', 
    icon: <PlumbingIcon />, 
    count: 12890, 
    color: '#4A90E2', 
    hot: true,
    description: 'Water systems, emergency repairs & green solutions',
    growth: '+18%',
    avgSalary: '$68,000',
    demandLevel: 'High'
  },
  { 
    name: 'Construction', 
    icon: <ConstructionIcon />, 
    count: 28560, 
    color: '#E74C3C',
    description: 'Building, renovation & infrastructure projects',
    growth: '+15%',
    avgSalary: '$72,000',
    demandLevel: 'Very High'
  },
  { 
    name: 'HVAC', 
    icon: <HvacIcon />, 
    count: 9340, 
    color: '#2ECC71',
    description: 'Climate control, energy efficiency & smart systems',
    growth: '+20%',
    avgSalary: '$70,000',
    demandLevel: 'High'
  },
  { 
    name: 'Carpentry', 
    icon: <CarpenterIcon />, 
    count: 14230, 
    color: '#8B4513', 
    premium: true,
    description: 'Custom woodwork, furniture & architectural details',
    growth: '+12%',
    avgSalary: '$65,000',
    demandLevel: 'Moderate'
  },
  { 
    name: 'Smart Home', 
    icon: <HomeIcon />, 
    count: 6780, 
    color: '#9B59B6', 
    newest: true,
    description: 'IoT integration, automation & tech installation',
    growth: '+45%',
    avgSalary: '$85,000',
    demandLevel: 'Explosive'
  },
  { 
    name: 'Solar Energy', 
    icon: <WhatshotIcon />, 
    count: 4560, 
    color: '#F39C12', 
    trending: true,
    description: 'Solar installation, battery systems & green tech',
    growth: '+38%',
    avgSalary: '$78,000',
    demandLevel: 'Very High'
  },
  { 
    name: 'Design', 
    icon: <PsychologyIcon />, 
    count: 8920, 
    color: '#E67E22',
    description: 'Interior design, space planning & creative solutions',
    growth: '+16%',
    avgSalary: '$62,000',
    demandLevel: 'High'
  },
];

const platformMetrics = [
  { 
    icon: <WorkIcon sx={{ fontSize: 56 }} />, 
    value: '125,000+', 
    label: 'Active Opportunities',
    subtitle: 'Updated every minute',
    color: '#FFD700',
    trend: '+18% this month',
    description: 'From entry-level to executive positions',
    animation: pulse,
  },
  { 
    icon: <CheckCircle sx={{ fontSize: 56 }} />, 
    value: '99.2%', 
    label: 'Success Rate',
    subtitle: 'Completed projects',
    color: '#2ECC71',
    trend: '+2.3% improvement',
    description: 'Industry-leading completion rate',
    animation: float,
  },
  { 
    icon: <Group sx={{ fontSize: 56 }} />, 
    value: '450K+', 
    label: 'Skilled Professionals',
    subtitle: 'Verified experts worldwide',
    color: '#3498DB',
    trend: '+12% growth',
    description: 'Background-checked talent pool',
    animation: shimmer,
  },
  { 
    icon: <Star sx={{ fontSize: 56 }} />, 
    value: '4.95/5', 
    label: 'Platform Rating',
    subtitle: 'Client satisfaction score',
    color: '#E74C3C',
    trend: '+0.05 this quarter',
    description: 'Consistently excellent reviews',
    animation: sparkle,
  },
  { 
    icon: <AttachMoneyIcon sx={{ fontSize: 56 }} />, 
    value: '$2.8B+', 
    label: 'Total Earnings',
    subtitle: 'Paid to professionals',
    color: '#9C27B0',
    trend: '+34% annually',
    description: 'Life-changing income opportunities',
    animation: rotateGlow,
  },
  { 
    icon: <TrendingUpIcon sx={{ fontSize: 56 }} />, 
    value: '156%', 
    label: 'Career Growth',
    subtitle: 'Average salary increase',
    color: '#FF5722',
    trend: 'Year over year',
    description: 'Accelerated professional development',
    animation: gradientShift,
  },
];

const JobsPage = () => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Redux state with safe defaults
  const filters = useSelector(selectJobFilters) || {};
  const { currentPage = 1, totalPages = 0 } = useSelector(selectJobsPagination) || {};
  const jobs = useSelector(selectJobs) || [];
  const loading = useSelector(selectJobsLoading) || false;
  const error = useSelector(selectJobsError);

  // Enhanced local state
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showSampleData, setShowSampleData] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);
  const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'grid');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 150000]);
  const [sortBy, setSortBy] = useState('relevance');
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [jobType, setJobType] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [animateCards, setAnimateCards] = useState(false);
  
  const heroRef = useRef(null);
  const searchRef = useRef(null);

  // Responsive view mode adjustment
  useEffect(() => {
    if (isMobile && viewMode === 'grid') {
      setViewMode('list');
    }
  }, [isMobile, viewMode]);

  // Enhanced search functionality
  const handleSearch = useCallback(() => {
    const newFilters = {
      ...filters,
      page: 1,
      search: searchQuery.trim(),
      category: selectedCategory,
      minBudget: priceRange[0],
      maxBudget: priceRange[1],
      sortBy,
      remote: onlyRemote,
      urgent: onlyUrgent,
      featured: onlyFeatured,
      experience: experienceLevel,
      jobType,
      skills: selectedSkills,
    };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
    setAnimateCards(true);
    
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'job_search', {
        search_term: searchQuery,
        category: selectedCategory,
        filters_applied: Object.keys(newFilters).length,
      });
    }
  }, [filters, searchQuery, selectedCategory, priceRange, sortBy, onlyRemote, onlyUrgent, onlyFeatured, experienceLevel, jobType, selectedSkills, dispatch]);

  const handlePageChange = useCallback((event, value) => {
    const newFilters = { ...filters, page: value };
    dispatch(setFilters(newFilters));
    dispatch(fetchJobs(newFilters));
    setShowSampleData(false);
    window.scrollTo({ top: searchRef.current?.offsetTop || 0, behavior: 'smooth' });
  }, [filters, dispatch]);

  const handleCategorySelect = useCallback((category) => {
    const newCategory = category === selectedCategory ? '' : category;
    setSelectedCategory(newCategory);
    
    // Auto-search when category is selected
    setTimeout(() => {
      const newFilters = {
        ...filters,
        page: 1,
        category: newCategory,
        search: searchQuery.trim(),
      };
      dispatch(setFilters(newFilters));
      dispatch(fetchJobs(newFilters));
      setShowSampleData(false);
    }, 300);
  }, [selectedCategory, filters, searchQuery, dispatch]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange([0, 150000]);
    setSortBy('relevance');
    setOnlyRemote(false);
    setOnlyUrgent(false);
    setOnlyFeatured(false);
    setExperienceLevel('');
    setJobType('');
    setSelectedSkills([]);
    setShowSampleData(true);
    
    // Clear Redux filters
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
    
    // TODO: Sync with backend
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
          default:
            break;
        }
      }
      if (e.key === 'Escape') {
        setFilterDialog(false);
        setShowFilters(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Auto-save search preferences
  useEffect(() => {
    const preferences = {
      viewMode,
      sortBy,
      priceRange,
      selectedSkills,
    };
    localStorage.setItem('jobSearchPreferences', JSON.stringify(preferences));
  }, [viewMode, sortBy, priceRange, selectedSkills]);

  // Load saved preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jobSearchPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        setViewMode(preferences.viewMode || (isMobile ? 'list' : 'grid'));
        setSortBy(preferences.sortBy || 'relevance');
        setPriceRange(preferences.priceRange || [0, 150000]);
        setSelectedSkills(preferences.selectedSkills || []);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [isMobile]);

  const renderHeroSection = () => (
    <HeroSection ref={heroRef}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 3 }}>
        <Grid container spacing={6} alignItems="center" sx={{ minHeight: '85vh' }}>
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Box sx={{ mb: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
                      fontWeight: 900,
                      mb: 3,
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF6B6B 50%, #4ECDC4 75%, #45B7D1 100%)',
                      backgroundSize: '200% 200%',
                      animation: `${gradientShift} 8s ease infinite`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 8px 16px rgba(0,0,0,0.3)',
                      lineHeight: 1.1,
                    }}
                  >
                    Discover Your
                    <br />
                    <span style={{ position: 'relative' }}>
                      Dream Career
                      <motion.div
                        style={{
                          position: 'absolute',
                          bottom: -10,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                          borderRadius: 2,
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                      />
                    </span>
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.8rem', lg: '2.2rem' },
                      fontWeight: 400,
                      mb: 4,
                      opacity: 0.95,
                      lineHeight: 1.5,
                      maxWidth: '90%',
                    }}
                  >
                    🚀 <strong>Join 450,000+ professionals</strong> building the future
                    <br />
                    💰 <strong>Earn up to $150K+</strong> in skilled trades
                    <br />
                    🌟 <strong>Work on cutting-edge projects</strong> worldwide
                    <br />
                    ⚡ <strong>Get hired in 24 hours</strong> or less
                  </Typography>
                </motion.div>
              </Box>
              
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={3} 
                  sx={{ mb: 6 }}
                >
                  <AnimatedButton
                    size="large"
                    startIcon={<SearchIcon />}
                    onClick={() => window.scrollTo({ 
                      top: heroRef.current?.offsetHeight || 700, 
                      behavior: 'smooth' 
                    })}
                    sx={{ minWidth: { xs: '100%', sm: 200 } }}
                  >
                    Explore 125K+ Jobs
                  </AnimatedButton>
                  <AnimatedButton
                    variant="outlined"
                    size="large"
                    startIcon={<WorkspacePremium />}
                    onClick={() => navigate(isAuthenticated() ? '/post-job' : '/register?type=hirer')}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      minWidth: { xs: '100%', sm: 180 },
                      '&:hover': {
                        borderColor: theme.palette.secondary.main,
                        backgroundColor: alpha('#ffffff', 0.15),
                        color: theme.palette.secondary.main,
                      },
                    }}
                  >
                    {isAuthenticated() ? 'Post a Job' : 'Hire Talent'}
                  </AnimatedButton>
                </Stack>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, fontWeight: 600 }}>
                    🏆 Trusted by industry leaders:
                  </Typography>
                  <Stack 
                    direction="row" 
                    spacing={{ xs: 2, sm: 4 }} 
                    sx={{ 
                      opacity: 0.8, 
                      flexWrap: 'wrap',
                      '& > *': {
                        fontSize: { xs: '1rem', sm: '1.2rem' },
                        fontWeight: 300,
                        letterSpacing: 1,
                      }
                    }}
                  >
                    {['Tesla', 'Apple', 'Google', 'SpaceX', 'Microsoft', 'Amazon'].map((company, index) => (
                      <motion.div
                        key={company}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                      >
                        <Typography variant="h6" component="span">
                          {company}
                        </Typography>
                      </motion.div>
                    ))}
                  </Stack>
                </Box>
              </motion.div>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 45 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              <Grid container spacing={3}>
                {platformMetrics.map((metric, index) => (
                  <Grid item xs={6} md={4} lg={6} key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 50, rotateX: 45 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ 
                        duration: 0.6, 
                        delay: 0.5 + index * 0.15,
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        rotateY: 5,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <StatCard
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: `0 25px 50px ${alpha(metric.color, 0.3)}`,
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <InteractiveIcon color={metric.color}>
                          {metric.icon}
                        </InteractiveIcon>
                        
                        <GradientText variant="h3" sx={{ mb: 1 }}>
                          {metric.value}
                        </GradientText>
                        
                        <Typography 
                          variant="h6" 
                          fontWeight={700} 
                          color="white" 
                          sx={{ mb: 0.5 }}
                        >
                          {metric.label}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="rgba(255,255,255,0.8)" 
                          sx={{ mb: 2 }}
                        >
                          {metric.subtitle}
                        </Typography>
                        
                        <Chip
                          label={metric.trend}
                          size="small"
                          sx={{
                            bgcolor: alpha('#ffffff', 0.2),
                            color: 'white',
                            fontWeight: 700,
                            mb: 1,
                            animation: `${pulse} 2s ease-in-out infinite`,
                          }}
                        />
                        
                        <Typography 
                          variant="caption" 
                          color="rgba(255,255,255,0.7)"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {metric.description}
                        </Typography>
                      </StatCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </HeroSection>
  );

  const renderSearchInterface = () => (
    <Container maxWidth="xl" sx={{ py: 6 }} ref={searchRef}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <FloatingSearchBar elevation={16}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <GradientText variant="h3" sx={{ mb: 2 }}>
              🎯 Smart Job Discovery Engine
            </GradientText>
            <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.8 }}>
              Find your perfect opportunity with AI-powered matching
            </Typography>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by job title, company, skills, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 4,
                    fontSize: '1.1rem',
                    '& fieldset': { 
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                      borderWidth: 2,
                    },
                    bgcolor: alpha(theme.palette.background.default, 0.7),
                    backdropFilter: 'blur(10px)',
                  },
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}>
                  Sort By
                </InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    '& fieldset': { 
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                      borderWidth: 2,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.secondary.main,
                    },
                    bgcolor: alpha(theme.palette.background.default, 0.7),
                  }}
                >
                  <MenuItem value="relevance">🎯 Most Relevant</MenuItem>
                  <MenuItem value="newest">🆕 Newest First</MenuItem>
                  <MenuItem value="salary_high">💰 Highest Salary</MenuItem>
                  <MenuItem value="salary_low">💵 Lowest Salary</MenuItem>
                  <MenuItem value="deadline">⏰ Deadline Soon</MenuItem>
                  <MenuItem value="featured">⭐ Featured Jobs</MenuItem>
                  <MenuItem value="trending">🔥 Trending Now</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={onlyRemote}
                      onChange={(e) => setOnlyRemote(e.target.checked)}
                      color="secondary"
                      sx={{
                        '& .MuiSwitch-thumb': {
                          bgcolor: onlyRemote ? theme.palette.secondary.main : 'grey.400',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PublicIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={600}>Remote Only</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={onlyUrgent}
                      onChange={(e) => setOnlyUrgent(e.target.checked)}
                      color="error"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FireIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={600}>Urgent</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={onlyFeatured}
                      onChange={(e) => setOnlyFeatured(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon fontSize="small" />
                      <Typography variant="body2" fontWeight={600}>Featured</Typography>
                    </Box>
                  }
                />
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Stack direction="row" spacing={2}>
              <AnimatedButton
                variant="contained"
                onClick={handleSearch}
                size="large"
                startIcon={<SearchIcon />}
                sx={{ minWidth: 180 }}
              >
                Find Perfect Jobs
              </AnimatedButton>
              
              <AnimatedButton
                variant="outlined"
                onClick={() => setFilterDialog(true)}
                size="large"
                startIcon={<TuneIcon />}
              >
                Advanced Filters
              </AnimatedButton>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Clear all filters">
                <IconButton
                  onClick={clearFilters}
                  sx={{
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
              
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newView) => newView && setViewMode(newView)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
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

          {/* Quick Search Suggestions */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              🔥 Trending Searches:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {['Electrical Engineer', 'Smart Home Tech', 'Solar Installation', 'HVAC Specialist', 'Construction Manager', 'Plumbing Expert'].map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  size="small"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setTimeout(handleSearch, 100);
                  }}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </FloatingSearchBar>
      </motion.div>
    </Container>
  );

  const renderCategories = () => (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <GradientText variant="h2" sx={{ mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            🎯 Explore Career Opportunities
          </GradientText>
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ 
              mb: 4, 
              maxWidth: 600, 
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' }
            }}
          >
            Discover high-demand careers with competitive salaries and growth potential
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
                fontWeight: 600,
                color: theme.palette.text.secondary,
              }
            }}
          >
            <Box>
              <TrendingUpIcon color="success" />
              <span>Growing Industries</span>
            </Box>
            <Box>
              <AttachMoneyIcon color="primary" />
              <span>Competitive Salaries</span>
            </Box>
            <Box>
              <GraphIcon color="secondary" />
              <span>Career Growth</span>
            </Box>
            <Box>
              <VerifiedIcon color="info" />
              <span>Verified Opportunities</span>
            </Box>
          </Stack>
        </Box>
        
        <Grid container spacing={4} justifyContent="center">
          {categoryData.map((category, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={category.name}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <GlassCard
                  featured={selectedCategory === category.name}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: selectedCategory === category.name 
                      ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.1)})`
                      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.85)})`,
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
                      height: 6,
                      background: `linear-gradient(90deg, ${category.color}, ${alpha(category.color, 0.7)})`,
                      opacity: selectedCategory === category.name ? 1 : 0.7,
                    },
                  }}
                  onClick={() => handleCategorySelect(category.name)}
                >
                  <Box>
                    <InteractiveIcon 
                      color={category.color}
                      sx={{ 
                        fontSize: '4rem !important',
                        mb: 3,
                        filter: `drop-shadow(0 8px 16px ${alpha(category.color, 0.3)})`,
                      }}
                    >
                      {React.cloneElement(category.icon, { 
                        sx: { fontSize: 'inherit', color: category.color }
                      })}
                    </InteractiveIcon>
                    
                    <Typography 
                      variant="h5" 
                      fontWeight={800} 
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
                      sx={{ mb: 3, lineHeight: 1.6, fontSize: '0.95rem' }}
                    >
                      {category.description}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack spacing={2} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Available Jobs:
                        </Typography>
                        <Chip
                          label={`${category.count.toLocaleString()}`}
                          size="small"
                          sx={{
                            bgcolor: alpha(category.color, 0.1),
                            color: category.color,
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Avg. Salary:
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color={category.color}>
                          {category.avgSalary}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Growth:
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {category.growth}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 2 }}>
                      {category.trending && (
                        <Chip 
                          label="🔥 Trending" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#FF6B6B', 0.1),
                            color: '#FF6B6B',
                            fontWeight: 600,
                            animation: `${pulse} 2s ease-in-out infinite`,
                          }} 
                        />
                      )}
                      {category.hot && (
                        <Chip 
                          label="💎 Hot" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#FFA500', 0.1),
                            color: '#FFA500',
                            fontWeight: 600,
                            animation: `${sparkle} 2s ease-in-out infinite`,
                          }} 
                        />
                      )}
                      {category.newest && (
                        <Chip 
                          label="✨ New" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#4CAF50', 0.1),
                            color: '#4CAF50',
                            fontWeight: 600,
                            animation: `${float} 3s ease-in-out infinite`,
                          }} 
                        />
                      )}
                      {category.premium && (
                        <Chip 
                          label="👑 Premium" 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha('#9C27B0', 0.1),
                            color: '#9C27B0',
                            fontWeight: 600,
                          }} 
                        />
                      )}
                    </Box>

                    <Box
                      sx={{
                        width: '100%',
                        height: 6,
                        bgcolor: alpha(category.color, 0.1),
                        borderRadius: 3,
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
                          borderRadius: 3,
                          transition: 'width 1s ease-in-out',
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 1, 
                        fontWeight: 600,
                        color: category.color,
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

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <AnimatedButton
            variant="outlined"
            size="large"
            startIcon={<ExploreIcon />}
            onClick={() => navigate('/categories')}
          >
            Explore All Categories
          </AnimatedButton>
        </Box>
      </motion.div>
    </Container>
  );

  const renderFeaturedJobs = () => (
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
            🌟 Premium Opportunities
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
            Hand-picked premium jobs from top employers with exceptional benefits and career growth potential
          </Typography>
          
          <Stack 
            direction="row" 
            spacing={3} 
            justifyContent="center" 
            sx={{ 
              flexWrap: 'wrap', 
              gap: 2,
              mb: 4,
              '& > *': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                fontWeight: 600,
              }
            }}
          >
            <Box>
              <DiamondIcon />
              <span>Premium Benefits</span>
            </Box>
            <Box>
              <RocketIcon />
              <span>Fast-Track Hiring</span>
            </Box>
            <Box>
              <BoltIcon />
              <span>Instant Matching</span>
            </Box>
          </Stack>
        </Box>

        <Grid container spacing={4}>
          {enhancedSampleJobs.map((job, index) => (
            <Grid item xs={12} md={6} lg={6} xl={4} key={job.id}>
              <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -12,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                <PremiumJobCard
                  featured={job.featured}
                  urgent={job.urgency === 'high'}
                  premium={job.premium}
                  trending={job.trending}
                  elevation={job.featured ? 16 : 8}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ 
                    p: 4, 
                    pt: job.featured && job.premium ? 8 : job.featured || job.premium ? 6 : 4,
                    pb: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* Job Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                      <Avatar
                        src={job.client.avatar}
                        sx={{
                          width: 70,
                          height: 70,
                          mr: 2,
                          border: `3px solid ${theme.palette.secondary.main}`,
                          boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.3)}`,
                        }}
                      />
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800} gutterBottom>
                          {job.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {job.client.name}
                          </Typography>
                          {job.client.verified && (
                            <Verified sx={{ fontSize: 18, color: theme.palette.secondary.main }} />
                          )}
                          <Chip
                            label={job.client.companyType}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Stack>
                        
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Rating value={job.client.rating} precision={0.01} size="small" readOnly />
                          <Typography variant="body2" fontWeight={600}>
                            {job.client.rating} ({job.client.jobsPosted} jobs)
                          </Typography>
                        </Stack>
                      </Box>
                      
                      <IconButton
                        onClick={() => toggleSaveJob(job.id)}
                        sx={{
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: savedJobs.includes(job.id)
                            ? theme.palette.secondary.main
                            : theme.palette.text.secondary,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.secondary.main, 0.2),
                            transform: 'scale(1.1)',
                          },
                        }}
                      >
                        {savedJobs.includes(job.id) ? <Bookmark /> : <BookmarkBorder />}
                      </IconButton>
                    </Box>

                    {/* Job Description */}
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '0.95rem',
                      }}
                    >
                      {job.description}
                    </Typography>

                    {/* Skills */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: theme.palette.secondary.main }}>
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
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.secondary.main, 0.2),
                                transform: 'translateY(-1px)',
                              },
                            }}
                          />
                        ))}
                        {job.skills.length > 4 && (
                          <Chip
                            label={`+${job.skills.length - 4} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Stack>
                    </Box>

                    {/* Job Details Grid */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                          <GradientText variant="h5" gradient="success" sx={{ fontWeight: 900 }}>
                            ${job.budget.min.toLocaleString()}
                          </GradientText>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Starting {job.budget.type}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                          <Typography variant="h5" fontWeight={900} color="info.main">
                            {job.applicants}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            applicants
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Location & Details */}
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOn fontSize="small" color="secondary" />
                        <Typography variant="body2" fontWeight={600}>{job.location}</Typography>
                        {job.workEnvironment && (
                          <Chip 
                            label={job.workEnvironment} 
                            size="small" 
                            color="info"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Schedule fontSize="small" color="secondary" />
                        <Typography variant="body2" fontWeight={600}>{job.estimatedDuration}</Typography>
                      </Stack>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTime fontSize="small" color="secondary" />
                        <Typography variant="body2" fontWeight={600}>
                          Posted {formatDistanceToNow(new Date(job.postedDate))} ago
                        </Typography>
                      </Stack>
                    </Stack>

                    {/* Benefits Preview */}
                    {job.benefits && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: theme.palette.secondary.main }}>
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
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            />
                          ))}
                          {job.benefits.length > 3 && (
                            <Chip
                              label={`+${job.benefits.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )}

                    {/* Tags */}
                    {job.tags && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 0.5 }}>
                        {job.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              borderColor: theme.palette.secondary.main,
                              color: theme.palette.secondary.main,
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 4, pt: 0, mt: 'auto' }}>
                    <Stack direction="row" spacing={1} width="100%">
                      <AnimatedButton
                        variant="contained"
                        fullWidth
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        size="large"
                      >
                        View Details
                      </AnimatedButton>
                      <AnimatedButton
                        variant="outlined"
                        startIcon={<HandshakeIcon />}
                        onClick={() => navigate(isAuthenticated() ? `/jobs/${job.id}/apply` : '/login')}
                        sx={{ minWidth: 120 }}
                      >
                        Apply Now
                      </AnimatedButton>
                      <IconButton
                        color="primary"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                      >
                        <Share />
                      </IconButton>
                    </Stack>
                  </CardActions>
                </PremiumJobCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <AnimatedButton
            variant="contained"
            size="large"
            startIcon={<ExploreIcon />}
            onClick={() => {
              setShowSampleData(false);
              handleSearch();
            }}
          >
            Explore All Premium Jobs
          </AnimatedButton>
        </Box>
      </motion.div>
    </Container>
  );

  return (
    <>
      <Helmet>
        <title>Find Your Dream Job - 125K+ Premium Opportunities | Kelmah</title>
        <meta name="description" content="Discover amazing job opportunities in skilled trades, technology, and construction. Connect with top employers, earn competitive salaries, and advance your career with Kelmah's professional job marketplace." />
        <meta name="keywords" content="jobs, careers, skilled trades, electrical, plumbing, construction, HVAC, technology jobs, premium opportunities" />
        <meta property="og:title" content="Find Your Dream Job - 125K+ Premium Opportunities | Kelmah" />
        <meta property="og:description" content="Join 450,000+ professionals building the future. Earn up to $150K+ in skilled trades with cutting-edge projects worldwide." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://kelmah.com/jobs" />
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
          background: `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%)`,
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
                <Typography variant="h4" textAlign="center" gutterBottom sx={{ mb: 6 }}>
                  🔍 Finding Perfect Matches...
                </Typography>
                <Grid container spacing={4}>
                  {Array.from(new Array(6)).map((_, idx) => (
                    <Grid item xs={12} sm={6} lg={4} key={idx}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                      >
                        <Skeleton 
                          variant="rectangular" 
                          height={450} 
                          sx={{ 
                            borderRadius: 3,
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
            renderFeaturedJobs()
          ) : (
            <Container maxWidth="xl" sx={{ py: 8 }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                      🎯 Search Results
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Found <strong>{jobs.length.toLocaleString()}</strong> opportunities matching your criteria
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      View:
                    </Typography>
                    <ToggleButtonGroup
                      value={viewMode}
                      exclusive
                      onChange={(e, newView) => newView && setViewMode(newView)}
                      size="small"
                    >
                      <ToggleButton value="grid" disabled={isMobile}>
                        <ViewModuleIcon />
                      </ToggleButton>
                      <ToggleButton value="list">
                        <ViewListIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Box>

                <Grid container spacing={4}>
                  <AnimatePresence>
                    {jobs.map((job, index) => (
                      <Grid 
                        item 
                        xs={12} 
                        sm={viewMode === 'list' ? 12 : 6} 
                        lg={viewMode === 'list' ? 12 : 4} 
                        key={job.id}
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 50, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -50, scale: 0.9 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          layout
                        >
                          <JobCard 
                            job={job} 
                            viewMode={viewMode}
                            onSave={() => toggleSaveJob(job.id)}
                            isSaved={savedJobs.includes(job.id)}
                          />
                        </motion.div>
                      </Grid>
                    ))}
                  </AnimatePresence>
                </Grid>
                
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="secondary"
                        size="large"
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            '&.Mui-selected': {
                              bgcolor: theme.palette.secondary.main,
                              color: 'white',
                              '&:hover': {
                                bgcolor: theme.palette.secondary.dark,
                              },
                            },
                          },
                        }}
                      />
                    </motion.div>
                  </Box>
                )}
              </motion.div>
            </Container>
          )}
        </Box>

        {/* Advanced Filters Dialog */}
        <Dialog
          open={filterDialog}
          onClose={() => setFilterDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: { 
              borderRadius: isMobile ? 0 : 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
              backdropFilter: 'blur(20px)',
            }
          }}
        >
          <DialogTitle sx={{ pb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: theme.palette.secondary.main }}>
                  🎯 Advanced Job Filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Refine your search to find the perfect opportunity
                </Typography>
              </Box>
              {isMobile && (
                <IconButton onClick={() => setFilterDialog(false)}>
                  <CloseIcon />
                </IconButton>
              )}
            </Stack>
          </DialogTitle>
          
          <DialogContent sx={{ pb: 2 }}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom fontWeight={600}>
                  💰 Budget Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200000}
                  step={5000}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 50000, label: '$50K' },
                    { value: 100000, label: '$100K' },
                    { value: 150000, label: '$150K' },
                    { value: 200000, label: '$200K+' },
                  ]}
                  sx={{
                    '& .MuiSlider-thumb': {
                      bgcolor: theme.palette.secondary.main,
                    },
                    '& .MuiSlider-track': {
                      bgcolor: theme.palette.secondary.main,
                    },
                    '& .MuiSlider-rail': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.3),
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={experienceLevel}
                    label="Experience Level"
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="entry">🌱 Entry Level (0-2 years)</MenuItem>
                    <MenuItem value="mid">🚀 Mid Level (2-5 years)</MenuItem>
                    <MenuItem value="senior">⭐ Senior Level (5-10 years)</MenuItem>
                    <MenuItem value="expert">👑 Expert Level (10+ years)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    value={jobType}
                    label="Job Type"
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="full-time">💼 Full Time</MenuItem>
                    <MenuItem value="part-time">⏰ Part Time</MenuItem>
                    <MenuItem value="contract">📋 Contract</MenuItem>
                    <MenuItem value="freelance">🎯 Freelance</MenuItem>
                    <MenuItem value="internship">🎓 Internship</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Vue.js']}
                  value={selectedSkills}
                  onChange={(event, newSkills) => setSelectedSkills(newSkills)}
                  renderInput={(params) => (
                    <TextField {...params} label="Required Skills" placeholder="Select skills" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={option}
                        sx={{
                          borderColor: theme.palette.secondary.main,
                          color: theme.palette.secondary.main,
                        }}
                      />
                    ))
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <AnimatedButton 
              onClick={clearFilters} 
              startIcon={<Clear />}
              variant="outlined"
              sx={{ minWidth: 120 }}
            >
              Clear All
            </AnimatedButton>
            <AnimatedButton
              onClick={() => {
                handleSearch();
                setFilterDialog(false);
              }}
              startIcon={<SearchIcon />}
              sx={{ minWidth: 140 }}
            >
              Apply Filters
            </AnimatedButton>
          </DialogActions>
        </Dialog>

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
            tooltipTitle="Refresh Jobs"
            onClick={handleSearch}
          />
          <SpeedDialAction
            icon={<BookmarkBorder />}
            tooltipTitle="Saved Jobs"
            onClick={() => navigate('/jobs/saved')}
          />
          <SpeedDialAction
            icon={<NotificationsActiveIcon />}
            tooltipTitle="Job Alerts"
            onClick={() => navigate('/job-alerts')}
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

export default JobsPage;
