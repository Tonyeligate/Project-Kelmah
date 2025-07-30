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
  alpha,
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
import { styled, keyframes } from '@mui/material/styles';
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
  // animation: `${gradientShift} 15s ease infinite`,
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
    // animation: `${float} 20s ease-in-out infinite`,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState([500, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Enhanced Ghana-focused skilled trades jobs
  const sampleJobs = [
    {
      id: 1,
      title: "Senior Electrical Engineer - Commercial Projects",
      company: "PowerTech Solutions Ghana",
      location: "Accra, Greater Accra",
      budget: "GHS 3,500 - 5,500",
      type: "Full-time",
      category: "Electrical",
      urgent: true,
      verified: true,
      rating: 4.8,
      applicants: 12,
      description: "Seeking certified electrician for high-rise commercial installations. Must have 5+ years experience with industrial wiring and safety protocols.",
      skills: ["Electrical Installation", "Industrial Wiring", "Safety Protocols", "Circuit Design", "Maintenance"],
      requirements: ["Valid Electrical License", "5+ Years Experience", "Safety Certification"],
      benefits: ["Health Insurance", "Performance Bonus", "Transport Allowance"],
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      icon: ElectricalIcon,
      companyLogo: "/images/powertech-logo.png"
    },
    {
      id: 2,
      title: "Master Plumber - Residential & Commercial",
      company: "AquaFlow Ghana Limited",
      location: "Kumasi, Ashanti Region", 
      budget: "GHS 2,800 - 4,200",
      type: "Contract",
      category: "Plumbing",
      urgent: false,
      verified: true,
      rating: 4.9,
      applicants: 8,
      description: "Professional plumber needed for luxury residential and commercial plumbing systems. Experience with modern fixtures required.",
      skills: ["Pipe Installation", "Water Systems", "Drainage", "Fixture Installation", "Leak Detection"],
      requirements: ["Plumbing Certification", "3+ Years Experience", "Own Tools"],
      benefits: ["Project Bonus", "Material Allowance", "Training Opportunities"],
      postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      icon: PlumbingIcon,
      companyLogo: "/images/aquaflow-logo.png"
    },
    {
      id: 3,
      title: "Expert Carpenter - Custom Furniture Specialist",
      company: "WoodCraft Artisans Ltd",
      location: "Tema, Greater Accra",
      budget: "GHS 2,200 - 3,800", 
      type: "Part-time",
      category: "Carpentry",
      urgent: false,
      verified: true,
      rating: 4.7,
      applicants: 15,
      description: "Seeking master carpenter for high-end custom furniture and cabinet making. Must excel in traditional and modern woodworking techniques.",
      skills: ["Fine Woodworking", "Cabinet Making", "Furniture Design", "Tool Mastery", "Finishing"],
      requirements: ["Carpentry Certification", "Portfolio Required", "4+ Years Experience"],
      benefits: ["Flexible Hours", "Material Discount", "Skill Development"],
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      icon: CarpenterIcon,
      companyLogo: "/images/woodcraft-logo.png"
    },
    {
      id: 4,
      title: "HVAC Technician - Climate Control Systems",
      company: "CoolAir Ghana",
      location: "Accra, Greater Accra",
      budget: "GHS 2,800 - 4,500",
      type: "Full-time",
      category: "HVAC",
      urgent: true,
      verified: true,
      rating: 4.6,
      applicants: 7,
      description: "Install and maintain air conditioning systems in commercial buildings. Experience with energy-efficient systems preferred.",
      skills: ["HVAC Installation", "System Maintenance", "Refrigeration", "Energy Efficiency", "Troubleshooting"],
      requirements: ["HVAC License", "3+ Years Experience", "Transport Available"],
      benefits: ["Medical Cover", "Overtime Pay", "Equipment Provided"],
      postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      icon: HvacIcon,
      companyLogo: "/images/coolair-logo.png"
    },
    {
      id: 5,
      title: "Construction Supervisor - Building Projects",
      company: "BuildRight Construction",
      location: "Kumasi, Ashanti Region",
      budget: "GHS 4,200 - 6,500",
      type: "Full-time",
      category: "Construction",
      urgent: false,
      verified: true,
      rating: 4.8,
      applicants: 9,
      description: "Lead construction teams for residential and commercial building projects. Strong leadership and technical skills required.",
      skills: ["Project Management", "Team Leadership", "Quality Control", "Safety Management", "Cost Control"],
      requirements: ["Construction Management Degree", "5+ Years Experience", "Leadership Skills"],
      benefits: ["Car Allowance", "Profit Sharing", "Career Growth"],
      postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      icon: ConstructionIcon,
      companyLogo: "/images/buildright-logo.png"
    },
    {
      id: 6,
      title: "Professional Painter - Residential & Commercial",
      company: "ColorMaster Painters",
      location: "Tema, Greater Accra",
      budget: "GHS 1,800 - 2,800",
      type: "Contract",
      category: "Painting",
      urgent: false,
      verified: true,
      rating: 4.5,
      applicants: 11,
      description: "Skilled painter for interior and exterior painting projects. Experience with decorative finishes and modern techniques preferred.",
      skills: ["Interior Painting", "Exterior Painting", "Decorative Finishes", "Surface Preparation", "Color Consultation"],
      requirements: ["Painting Experience", "Own Equipment", "Quality Portfolio"],
      benefits: ["Material Discount", "Flexible Schedule", "Performance Bonus"],
      postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      icon: PaintIcon,
      companyLogo: "/images/colormaster-logo.png"
    }
  ];

  const tradeCategories = [
    { value: '', label: 'All Trades', icon: WorkIcon },
    { value: 'Electrical', label: 'Electrical Work', icon: ElectricalIcon },
    { value: 'Plumbing', label: 'Plumbing Services', icon: PlumbingIcon },
    { value: 'Carpentry', label: 'Carpentry & Woodwork', icon: CarpenterIcon },
    { value: 'HVAC', label: 'HVAC & Climate Control', icon: HvacIcon },
    { value: 'Construction', label: 'Construction & Building', icon: ConstructionIcon },
    { value: 'Painting', label: 'Painting & Decoration', icon: PaintIcon },
    { value: 'Roofing', label: 'Roofing Services', icon: RoofingIcon },
    { value: 'Masonry', label: 'Masonry & Stonework', icon: BuildIcon }
  ];

  const ghanaLocations = [
    { value: '', label: 'All Locations' },
    { value: 'Accra', label: 'Accra, Greater Accra' },
    { value: 'Kumasi', label: 'Kumasi, Ashanti Region' },
    { value: 'Tema', label: 'Tema, Greater Accra' },
    { value: 'Takoradi', label: 'Takoradi, Western Region' },
    { value: 'Cape Coast', label: 'Cape Coast, Central Region' },
    { value: 'Tamale', label: 'Tamale, Northern Region' },
    { value: 'Ho', label: 'Ho, Volta Region' },
    { value: 'Koforidua', label: 'Koforidua, Eastern Region' }
  ];

  const filteredJobs = sampleJobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || job.category === selectedCategory;
    const matchesLocation = !selectedLocation || job.location.includes(selectedLocation);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <Box sx={{ bgcolor: '#0a0a0a', minHeight: '100vh', color: 'white' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Helmet>
          <title>Find Skilled Trade Jobs - Kelmah | Ghana's Premier Job Platform</title>
          <meta name="description" content="Discover high-paying skilled trade opportunities across Ghana. Connect with top employers in electrical, plumbing, carpentry, HVAC, and construction." />
        </Helmet>
        
        {/* Hero Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #D4AF37 30%, #FFD700 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Find Your Next Trade Opportunity
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)', 
                mb: 4,
                maxWidth: 800,
                mx: 'auto'
              }}
            >
              Connect with Ghana's top employers and advance your skilled trades career
            </Typography>
            
            {/* Enhanced Search & Filter Section */}
            <Paper 
              elevation={8}
              sx={{ 
                p: 3, 
                maxWidth: 1000, 
                mx: 'auto', 
                mb: 4,
                bgcolor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212,175,55,0.2)'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jobs, skills, companies..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(212,175,55,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#D4AF37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#D4AF37',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.7)',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#D4AF37' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      displayEmpty
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(212,175,55,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#D4AF37',
                        },
                      }}
                    >
                      {tradeCategories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <category.icon sx={{ mr: 1, color: '#D4AF37' }} />
                            {category.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<SearchIcon />}
                    sx={{
                      bgcolor: '#D4AF37',
                      color: 'black',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#B8941F',
                      },
                    }}
                  >
                    Search Jobs
                  </Button>
                </Grid>
              </Grid>
              
              {/* Advanced Filters Toggle */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  startIcon={<FilterListIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ color: '#D4AF37' }}
                >
                  {showFilters ? 'Hide' : 'Show'} Advanced Filters
                </Button>
              </Box>
              
              {/* Advanced Filters */}
              <Collapse in={showFilters}>
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37' }}>
                          Location
                        </Typography>
                        <Select
                          value={selectedLocation}
                          onChange={(e) => setSelectedLocation(e.target.value)}
                          displayEmpty
                          sx={{
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(212,175,55,0.3)',
                            },
                          }}
                        >
                          {ghanaLocations.map((location) => (
                            <MenuItem key={location.value} value={location.value}>
                              {location.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37' }}>
                        Salary Range (GHS)
                      </Typography>
                      <Slider
                        value={budgetRange}
                        onChange={(e, newValue) => setBudgetRange(newValue)}
                        valueLabelDisplay="auto"
                        min={500}
                        max={10000}
                        step={100}
                        sx={{
                          color: '#D4AF37',
                          '& .MuiSlider-thumb': {
                            bgcolor: '#D4AF37',
                          },
                          '& .MuiSlider-track': {
                            bgcolor: '#D4AF37',
                          },
                          '& .MuiSlider-rail': {
                            bgcolor: 'rgba(212,175,55,0.3)',
                          },
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption">GHS {budgetRange[0]}</Typography>
                        <Typography variant="caption">GHS {budgetRange[1]}+</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37' }}>
                        Quick Filters
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          label="Urgent Jobs" 
                          variant="outlined" 
                          sx={{ 
                            borderColor: '#D4AF37', 
                            color: '#D4AF37',
                            '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                          }} 
                        />
                        <Chip 
                          label="Verified Companies" 
                          variant="outlined" 
                          sx={{ 
                            borderColor: '#D4AF37', 
                            color: '#D4AF37',
                            '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                          }} 
                        />
                        <Chip 
                          label="Full-time" 
                          variant="outlined" 
                          sx={{ 
                            borderColor: '#D4AF37', 
                            color: '#D4AF37',
                            '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                          }} 
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Paper>
          </Box>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212,175,55,0.2)'
                }}
              >
                <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                  {filteredJobs.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Available Jobs
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212,175,55,0.2)'
                }}
              >
                <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                  2,500+
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Active Employers
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212,175,55,0.2)'
                }}
              >
                <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                  15K+
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Skilled Workers
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(212,175,55,0.2)'
                }}
              >
                <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
                  98%
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Success Rate
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </motion.div>

        {/* Enhanced Jobs Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ color: '#D4AF37', fontWeight: 'bold' }}>
              Featured Opportunities
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={`${filteredJobs.length} Jobs Found`} 
                sx={{ 
                  bgcolor: 'rgba(212,175,55,0.2)', 
                  color: '#D4AF37',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {filteredJobs.map((job, index) => (
              <Grid item xs={12} md={6} lg={4} key={job.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      '&:hover': {
                        border: '1px solid #D4AF37',
                        boxShadow: '0 8px 32px rgba(212,175,55,0.3)',
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Job Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <job.icon sx={{ mr: 1, color: '#D4AF37', fontSize: 24 }} />
                          <Box>
                            <Typography variant="h6" component="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {job.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {job.company}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                          {job.urgent && (
                            <Chip 
                              label="URGENT" 
                              size="small" 
                              sx={{ 
                                bgcolor: '#ff4444', 
                                color: 'white',
                                fontWeight: 'bold',
                                mb: 1
                              }} 
                            />
                          )}
                          {job.verified && (
                            <Chip 
                              icon={<Verified sx={{ fontSize: 16 }} />}
                              label="Verified" 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(76,175,80,0.2)', 
                                color: '#4CAF50',
                                border: '1px solid #4CAF50'
                              }} 
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Job Details */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" sx={{ color: 'white' }}>{job.location}</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MonetizationOn fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" fontWeight="bold" sx={{ color: '#D4AF37' }}>
                            {job.budget}
                          </Typography>
                          <Chip 
                            label={job.type} 
                            size="small" 
                            sx={{ 
                              ml: 1, 
                              bgcolor: 'rgba(212,175,55,0.2)', 
                              color: '#D4AF37' 
                            }} 
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Star fontSize="small" sx={{ mr: 1, color: '#D4AF37' }} />
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {job.rating} Rating • {job.applicants} Applicants
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                        {job.description}
                      </Typography>
                      
                      {/* Skills */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: '#D4AF37', fontWeight: 'bold' }}>
                          Required Skills:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '0.75rem'
                              }}
                            />
                          ))}
                          {job.skills.length > 3 && (
                            <Chip 
                              label={`+${job.skills.length - 3} more`} 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(212,175,55,0.2)',
                                color: '#D4AF37'
                              }} 
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Deadlines */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Posted {formatDistanceToNow(job.postedDate, { addSuffix: true })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ff6b6b' }}>
                          Apply by {format(job.deadline, 'MMM dd')}
                        </Typography>
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button 
                        variant="contained" 
                        fullWidth
                        sx={{
                          bgcolor: '#D4AF37',
                          color: 'black',
                          fontWeight: 'bold',
                          '&:hover': {
                            bgcolor: '#B8941F',
                          },
                        }}
                      >
                        Apply Now
                      </Button>
                      <IconButton 
                        sx={{ 
                          color: '#D4AF37',
                          '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                        }}
                      >
                        <BookmarkBorder />
                      </IconButton>
                      <IconButton 
                        sx={{ 
                          color: '#D4AF37',
                          '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' }
                        }}
                      >
                        <Share />
                      </IconButton>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
        
        {/* Load More Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: '#D4AF37',
                color: '#D4AF37',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: '#B8941F',
                  bgcolor: 'rgba(212,175,55,0.1)',
                },
              }}
            >
              Load More Opportunities
            </Button>
          </Box>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Paper 
            sx={{ 
              mt: 8, 
              p: 4, 
              textAlign: 'center',
              bgcolor: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)'
            }}
          >
            <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 'bold', mb: 2 }}>
              Ready to Take Your Career to the Next Level?
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 600, mx: 'auto' }}>
              Join thousands of skilled professionals who've found their dream jobs through Kelmah. 
              Get personalized job recommendations and connect directly with employers.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                size="large"
                sx={{
                  bgcolor: '#D4AF37',
                  color: 'black',
                  fontWeight: 'bold',
                  px: 4,
                  '&:hover': {
                    bgcolor: '#B8941F',
                  },
                }}
              >
                Create Job Alert
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                sx={{
                  borderColor: '#D4AF37',
                  color: '#D4AF37',
                  px: 4,
                  '&:hover': {
                    borderColor: '#B8941F',
                    bgcolor: 'rgba(212,175,55,0.1)',
                  },
                }}
              >
                Upload CV
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default JobsPage;
