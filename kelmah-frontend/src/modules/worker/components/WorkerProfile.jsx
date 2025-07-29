import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import workerService from '../services/workerService';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  IconButton,
  LinearProgress,
  Tabs,
  Tab,
  Stack,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Skeleton,
  CircularProgress,
  Container,
  useMediaQuery,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fade,
  Grow,
  Slide,
  Zoom,
} from '@mui/material';
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Verified as VerifiedIcon,
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  Upload as UploadIcon,
  MoreVert as MoreIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  GetApp as GetAppIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  BusinessCenter as BusinessCenterIcon,
  LocalOffer as LocalOfferIcon,
  CalendarToday as CalendarTodayIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  GroupWork as GroupWorkIcon,
  Home as HomeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { styled, useTheme, keyframes } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';

// Advanced animations for professional showcase
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(1deg); }
  50% { transform: translateY(-20px) rotate(0deg); }
  75% { transform: translateY(-10px) rotate(-1deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(33, 150, 243, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(360deg); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const magneticHover = keyframes`
  0% { transform: translate(0, 0); }
  25% { transform: translate(2px, -2px); }
  50% { transform: translate(-2px, 2px); }
  75% { transform: translate(2px, 2px); }
  100% { transform: translate(0, 0); }
`;

// Enhanced styled components for professional presentation
const ProfileHeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main} 0%, 
    ${theme.palette.secondary.main} 25%,
    ${theme.palette.primary.dark} 50%,
    ${theme.palette.secondary.dark} 75%,
    ${theme.palette.primary.main} 100%)`,
  backgroundSize: '400% 400%',
  animation: `${gradientShift} 20s ease infinite`,
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  minHeight: { xs: '70vh', md: '80vh' },
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 30% 70%, ${alpha('#4ECDC4', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 70% 30%, ${alpha('#FFD700', 0.3)} 0%, transparent 50%),
                radial-gradient(circle at 20% 20%, ${alpha('#FF6B6B', 0.2)} 0%, transparent 60%)`,
    animation: `${float} 25s ease-in-out infinite`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `conic-gradient(from 45deg at 50% 50%, 
      transparent 0deg, 
      ${alpha('#FFD700', 0.15)} 60deg, 
      transparent 120deg,
      ${alpha('#4ECDC4', 0.15)} 180deg,
      transparent 240deg,
      ${alpha('#FF6B6B', 0.15)} 300deg,
      transparent 360deg)`,
    animation: `${sparkle} 40s linear infinite`,
  },
}));

const GlassCard = styled(Card)(({ theme, premium = false, featured = false, elevated = false }) => ({
  background: premium 
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha('#9C27B0', 0.05)})`
    : featured
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.secondary.main, 0.05)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(30px)',
  border: premium 
    ? `3px solid ${alpha('#9C27B0', 0.3)}`
    : featured 
    ? `3px solid ${alpha(theme.palette.secondary.main, 0.3)}`
    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 24,
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  ...(elevated && {
    transform: 'translateY(-8px)',
    boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.15)}`,
  }),
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: premium
      ? `0 32px 64px ${alpha('#9C27B0', 0.3)}`
      : featured
      ? `0 32px 64px ${alpha(theme.palette.secondary.main, 0.3)}`
      : `0 28px 56px ${alpha(theme.palette.common.black, 0.15)}`,
    borderColor: premium ? '#9C27B0' : featured ? theme.palette.secondary.main : theme.palette.secondary.light,
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
    background: premium
      ? `linear-gradient(90deg, transparent, ${alpha('#9C27B0', 0.1)}, transparent)`
      : featured
      ? `linear-gradient(90deg, transparent, ${alpha(theme.palette.secondary.main, 0.1)}, transparent)`
      : `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.08)}, transparent)`,
    transition: 'left 0.8s, opacity 0.3s',
    opacity: 0,
  },
  '&:hover::before': {
    left: '100%',
    opacity: 1,
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme, size = 'large', verified = false, premium = false }) => ({
  width: size === 'large' ? 200 : size === 'medium' ? 120 : 80,
  height: size === 'large' ? 200 : size === 'medium' ? 120 : 80,
  border: verified || premium 
    ? `6px solid ${premium ? '#9C27B0' : theme.palette.success.main}`
    : `4px solid ${theme.palette.background.paper}`,
  boxShadow: verified || premium
    ? `0 20px 40px ${alpha(premium ? '#9C27B0' : theme.palette.success.main, 0.4)}`
    : theme.shadows[20],
  margin: 'auto',
  background: premium 
    ? `linear-gradient(135deg, #9C27B0, #673AB7)`
    : verified
    ? `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
    : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  fontSize: size === 'large' ? '4rem' : size === 'medium' ? '2.5rem' : '1.5rem',
  fontWeight: 700,
  position: 'relative',
  '&::after': verified || premium ? {
    content: premium ? '"👑"' : '"✓"',
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: size === 'large' ? 48 : 32,
    height: size === 'large' ? 48 : 32,
    background: premium ? '#9C27B0' : theme.palette.success.main,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size === 'large' ? '1.5rem' : '1rem',
    color: 'white',
    fontWeight: 900,
    border: `3px solid ${theme.palette.background.paper}`,
    boxShadow: theme.shadows[8],
  } : {},
}));

const SkillChip = styled(Chip)(({ theme, level, expertise, category }) => {
  const getSkillColor = () => {
    switch (level || expertise) {
      case 'expert': return '#E74C3C';
      case 'advanced': return '#F39C12';
      case 'intermediate': return '#3498DB';
      case 'beginner': return '#27AE60';
      default: return theme.palette.secondary.main;
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'technical': return '#9B59B6';
      case 'soft': return '#1ABC9C';
      case 'leadership': return '#E67E22';
      case 'certification': return '#34495E';
      default: return theme.palette.primary.main;
    }
  };

  const skillColor = getSkillColor();
  const catColor = getCategoryColor();
  const finalColor = category ? catColor : skillColor;

  return {
    borderRadius: 24,
    fontWeight: 800,
    fontSize: '0.95rem',
    minHeight: 44,
    background: `linear-gradient(135deg, ${alpha(finalColor, 0.15)}, ${alpha(finalColor, 0.25)})`,
    color: finalColor,
    border: `2px solid ${alpha(finalColor, 0.4)}`,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(finalColor, 0.25)}, ${alpha(finalColor, 0.35)})`,
      transform: 'translateY(-4px) scale(1.1)',
      boxShadow: `0 16px 32px ${alpha(finalColor, 0.4)}`,
      borderColor: finalColor,
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
      background: `linear-gradient(45deg, ${alpha(finalColor, 0.1)}, ${alpha(finalColor, 0.2)})`,
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:active': {
      transform: 'translateY(-2px) scale(1.05)',
    },
  };
});

const MetricCard = styled(motion.div)(({ theme, color = theme.palette.primary.main, gradient = false, glowing = false }) => ({
  background: gradient 
    ? `linear-gradient(135deg, ${alpha(color, 0.1)}, ${alpha(color, 0.2)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(20px)',
  border: `2px solid ${alpha(color, 0.3)}`,
  borderRadius: 20,
  padding: theme.spacing(3),
  textAlign: 'center',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  minHeight: 140,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.05)',
    boxShadow: `0 24px 48px ${alpha(color, 0.3)}`,
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
    width: '100px',
    height: '100px',
    background: `radial-gradient(circle, ${alpha(color, 0.2)} 0%, transparent 70%)`,
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.4s ease',
  },
  ...(glowing && {
    animation: `${pulse} 3s ease-in-out infinite`,
  }),
}));

const AnimatedButton = styled(Button)(({ theme, variant = 'contained', magnetic = false, size = 'medium' }) => ({
  borderRadius: size === 'large' ? 32 : 24,
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
      animation: `${magneticHover} 0.6s ease-in-out infinite`,
    },
  }),
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`profile-tabpanel-${index}`}
    aria-labelledby={`profile-tab-${index}`}
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

const WorkerProfile = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Enhanced state management
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [contactDialog, setContactDialog] = useState(false);
  const [portfolioDialog, setPortfolioDialog] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [expandedSection, setExpandedSection] = useState('overview');
  const [showFullBio, setShowFullBio] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  
  const heroRef = useRef(null);
  const profileRef = useRef(null);

  // Enhanced worker data with comprehensive information
  const enhancedWorker = worker || {
    id: workerId || 'sample-worker',
    name: 'Dr. Alexandra Chen',
    title: '🚀 Senior Aerospace Engineer & Smart Building Architect',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    rating: 4.99,
    reviewCount: 847,
    location: 'San Francisco Bay Area, CA',
    hourlyRate: 185,
    completedJobs: 1240,
    responseTime: '< 5 min',
    verified: true,
    premium: true,
    topRated: true,
    badges: ['Genius Level', 'Innovation Leader', 'Top 0.1%', 'Mission Critical'],
    bio: `Former SpaceX senior engineer turned smart building pioneer. PhD in Aerospace Engineering with 15+ years revolutionizing both space systems and terrestrial infrastructure. Led $500M+ projects including Mars habitat prototypes and smart city initiatives.

I specialize in bridging the gap between cutting-edge aerospace technology and practical smart building solutions. My unique background allows me to bring space-grade precision and innovation to earthly infrastructure challenges.

My passion lies in creating sustainable, intelligent buildings that not only serve human needs but also contribute to a better planet. Every project is an opportunity to push the boundaries of what's possible in construction and engineering.`,
    skills: [
      { name: 'Aerospace Engineering', level: 'expert', years: 15, category: 'technical' },
      { name: 'Smart Building Systems', level: 'expert', years: 12, category: 'technical' },
      { name: 'IoT Integration', level: 'expert', years: 10, category: 'technical' },
      { name: 'Project Leadership', level: 'expert', years: 18, category: 'leadership' },
      { name: 'Sustainable Design', level: 'advanced', years: 8, category: 'technical' },
      { name: 'Team Management', level: 'expert', years: 16, category: 'leadership' },
      { name: 'Innovation Strategy', level: 'expert', years: 14, category: 'leadership' },
      { name: 'Client Relations', level: 'advanced', years: 12, category: 'soft' },
    ],
    certifications: [
      { name: 'PhD Aerospace Engineering', issuer: 'MIT', year: 2008, verified: true },
      { name: 'LEED AP BD+C', issuer: 'USGBC', year: 2015, verified: true },
      { name: 'PMP Certification', issuer: 'PMI', year: 2018, verified: true },
      { name: 'AI Systems Certified', issuer: 'Stanford', year: 2022, verified: true },
    ],
    portfolio: [
      {
        id: 1,
        title: 'SpaceX Starship Interior Systems',
        description: 'Revolutionary interior design for Mars missions',
        image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600',
        category: 'Aerospace',
        year: 2023,
        client: 'SpaceX',
        value: '$50M+',
        featured: true,
      },
      {
        id: 2,
        title: 'Tesla Gigafactory Smart Systems',
        description: 'Integrated IoT and automation for sustainable manufacturing',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600',
        category: 'Smart Buildings',
        year: 2022,
        client: 'Tesla',
        value: '$25M+',
        featured: true,
      },
      {
        id: 3,
        title: 'Singapore Smart City Prototype',
        description: 'Next-generation urban infrastructure planning',
        image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=600',
        category: 'Urban Planning',
        year: 2023,
        client: 'Singapore Government',
        value: '$100M+',
        featured: true,
      },
    ],
    workHistory: [
      {
        company: 'SpaceX',
        role: 'Senior Systems Engineer',
        period: '2018 - 2023',
        description: 'Led interior systems design for Starship and Dragon capsules',
        projects: 47,
        achievements: ['Mars habitat prototype', 'Crew safety systems', 'Life support integration'],
      },
      {
        company: 'Tesla Energy',
        role: 'Smart Grid Architect',
        period: '2015 - 2018',
        description: 'Designed intelligent energy systems and grid integration',
        projects: 23,
        achievements: ['Gigafactory automation', 'Grid-scale storage', 'Smart home integration'],
      },
      {
        company: 'Apple',
        role: 'Advanced R&D Engineer',
        period: '2012 - 2015',
        description: 'Future technology research and development',
        projects: 31,
        achievements: ['IoT protocols', 'Smart building standards', 'Energy efficiency systems'],
      },
    ],
    testimonials: [
      {
        client: 'Elon Musk, SpaceX',
        text: 'Alexandra delivered beyond our wildest expectations. Her Mars habitat design will shape the future of space exploration.',
        rating: 5,
        project: 'Starship Interior Systems',
        date: '2023',
      },
      {
        client: 'Dr. Sarah Johnson, Google X',
        text: 'Visionary engineer who thinks decades ahead. Her smart city prototype is revolutionary.',
        rating: 5,
        project: 'Smart City Initiative',
        date: '2023',
      },
    ],
    achievements: [
      'Led SpaceX Starship interior systems design',
      'Designed first carbon-neutral smart campus',
      'Patent holder: 23 breakthrough technologies',
      'TEDx speaker: Future of Smart Infrastructure',
      'MIT Technology Review Innovator Under 35',
      'Clean Energy Innovation Award 2023',
    ],
    availability: {
      status: 'Available for premium projects',
      nextAvailable: '2024-03-15',
      preferredProjectSize: 'Large ($100K+)',
      workingHours: 'Mon-Fri, 9AM-6PM PST',
      timezone: 'PST',
      remote: true,
      travel: 'Available globally',
    },
    languages: ['English (Native)', 'Mandarin (Fluent)', 'Spanish (Conversational)', 'German (Basic)'],
    specialties: ['Space Technology', 'Smart Cities', 'Sustainable Engineering', 'AI Integration'],
    currentProjects: ['Mars Habitat Systems', 'AI-Powered Smart Cities', 'Quantum Computing Integration'],
    collaborationStyle: 'Hybrid leadership with hands-on execution',
    preferredClients: ['Fortune 500', 'Government Agencies', 'Research Institutions', 'Startups with vision'],
    successMetrics: {
      successRate: 99.8,
      repeatClients: 94,
      onTimeDelivery: 98.5,
      budgetAccuracy: 96.2,
      clientSatisfaction: 4.99,
      innovationScore: 98,
      leadershipScore: 96,
      technicalScore: 99,
      communicationScore: 95,
    },
  };

  const statsData = stats || {
    totalEarnings: '$2.4M+',
    projectsCompleted: enhancedWorker.completedJobs,
    clientsServed: 342,
    successRate: enhancedWorker.successMetrics.successRate,
    avgRating: enhancedWorker.rating,
    responseTime: enhancedWorker.responseTime,
    repeatClients: enhancedWorker.successMetrics.repeatClients,
    onTimeDelivery: enhancedWorker.successMetrics.onTimeDelivery,
  };

  // Enhanced data fetching
  useEffect(() => {
    const fetchWorkerData = async () => {
      if (!workerId || workerId === 'sample-worker') {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [workerData, availabilityData, statsData] = await Promise.all([
          workerService.getWorkerById(workerId),
          workerService.getWorkerAvailability(workerId),
          workerService.getWorkerStats(workerId),
        ]);
        
        setWorker(workerData);
        setAvailability(availabilityData);
        setStats(statsData);
        
        // Check if bookmarked
        if (isAuthenticated()) {
          const bookmarkStatus = await workerService.checkBookmarkStatus(workerId);
          setIsBookmarked(bookmarkStatus.isBookmarked);
        }
      } catch (error) {
        console.error('Error fetching worker data:', error);
        setError('Failed to load worker profile');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerData();
  }, [workerId, isAuthenticated]);

  // Enhanced bookmark handling
  const handleBookmark = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/professionals/${workerId}` } });
      return;
    }

    try {
      if (isBookmarked) {
        await workerService.removeBookmark(workerId);
        setIsBookmarked(false);
      } else {
        await workerService.bookmarkWorker(workerId);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
    }
  };

  // Enhanced contact handling
  const handleContact = () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/professionals/${workerId}` } });
      return;
    }
    setContactDialog(true);
  };

  const handleHire = () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/professionals/${workerId}` } });
      return;
    }
    navigate(`/hire/${workerId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
          {Array.from(new Array(6)).map((_, idx) => (
            <Grid item xs={12} md={6} lg={4} key={idx}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <AnimatedButton onClick={() => navigate('/find-talent')} size="large">
          Browse Other Professionals
        </AnimatedButton>
      </Container>
    );
  }

  if (!worker) {
  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Worker profile not found.
        </Alert>
      </Container>
    );
  }

  const renderProfileHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard sx={{ mb: 4, overflow: 'visible', position: 'relative' }}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            height: 200,
            position: 'relative',
            borderRadius: '16px 16px 0 0',
          }}
        >
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1,
              }}
            >
            <IconButton
              onClick={handleBookmark}
                sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: theme.palette.background.paper },
              }}
            >
              {isBookmarked ? (
                <BookmarkIcon color="primary" />
              ) : (
                <BookmarkBorderIcon />
              )}
            </IconButton>
              <IconButton
              onClick={() => handleShare()}
                sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: theme.palette.background.paper },
                }}
              >
              <ShareIcon />
              </IconButton>
            {isOwner && (
              <IconButton
                onClick={() => navigate('/worker/profile/edit')}
          sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  '&:hover': { bgcolor: theme.palette.background.paper },
                }}
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <CardContent sx={{ pt: 0, pb: 4 }}>
          <Box sx={{ textAlign: 'center', mt: -10 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
                enhancedWorker.verified ? (
                  <Tooltip title="Verified Professional">
                    <VerifiedIcon
                    sx={{
                        width: 40,
                        height: 40,
                        color: theme.palette.success.main,
                        bgcolor: theme.palette.background.paper,
                        borderRadius: '50%',
                        p: 0.5,
                      }}
                    />
                  </Tooltip>
              ) : null
            }
          >
            <ProfileAvatar
                src={enhancedWorker.avatar}
                alt={`${enhancedWorker.name}`}
            >
                {enhancedWorker.name?.charAt(0)}
                {enhancedWorker.name?.charAt(1)}
            </ProfileAvatar>
          </Badge>

            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ mt: 2, mb: 1, color: theme.palette.text.primary }}
            >
              {enhancedWorker.name}
              {enhancedWorker.is_online && (
                <Chip
                  label="Online"
                  size="small"
                  color="success"
                  sx={{ ml: 2, fontWeight: 600 }}
                />
              )}
            </Typography>

            <Typography
              variant="h5"
              color="primary"
              gutterBottom
              fontWeight={600}
              sx={{ mb: 2 }}
            >
              {enhancedWorker.title}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating
                value={enhancedWorker.rating || 0}
                  precision={0.1}
                readOnly
                  size="large"
              />
                <Typography variant="h6" fontWeight={600}>
                  {enhancedWorker.rating?.toFixed(1) || '0.0'}
                </Typography>
              <Typography variant="body1" color="text.secondary">
                ({enhancedWorker.testimonials.length} reviews)
              </Typography>
              </Box>
            </Stack>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
                lineHeight: 1.8,
                fontSize: '1.1rem',
              }}
            >
              {enhancedWorker.bio ||
                'Professional craftsperson dedicated to delivering quality work.'}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <AnimatedButton
                variant="contained"
                size="large"
                startIcon={<MessageIcon />}
                onClick={handleContact}
                disabled={isOwner}
              >
                Message Worker
              </AnimatedButton>

              {!isOwner && (
                <AnimatedButton
                  variant="outlined"
                  size="large"
                  startIcon={<BusinessCenterIcon />}
                  onClick={handleHire}
                >
                  Hire Now
                </AnimatedButton>
              )}
            </Stack>
          </Box>
        </CardContent>
      </GlassCard>
    </motion.div>
  );

  const renderMetrics = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <MetricCard>
            <WorkIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              {enhancedWorker.experience_years || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Years Experience
            </Typography>
          </MetricCard>
        </Grid>

        <Grid item xs={6} md={3}>
          <MetricCard>
            <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              {statsData.projectsCompleted || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Jobs Completed
            </Typography>
          </MetricCard>
        </Grid>

        <Grid item xs={6} md={3}>
          <MetricCard>
            <PriceIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              ${enhancedWorker.hourly_rate || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Per Hour
            </Typography>
          </MetricCard>
        </Grid>

        <Grid item xs={6} md={3}>
          <MetricCard>
            <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              {(
                ((statsData.projectsCompleted || 0) /
                  Math.max(
                    (statsData.projectsCompleted || 0) + (statsData.projects_cancelled || 0),
                    1,
                  )) *
                100
              ).toFixed(0)}
              %
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
          </MetricCard>
        </Grid>
      </Grid>
    </motion.div>
  );

  const renderSkillsAndExpertise = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <BuildIcon color="primary" />
          Skills & Expertise
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Primary Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {enhancedWorker.skills.slice(0, 8).map((skill, index) => (
                <SkillChip key={index} label={skill.name} size="medium" />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              Specializations
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {enhancedWorker.specializations?.map((spec, index) => (
              <Chip
                  key={index}
                  label={spec}
                variant="outlined"
                  color="primary"
              />
              )) || [
              <Chip
                  key="general"
                  label="General Construction"
                variant="outlined"
                  color="primary"
                />,
              <Chip
                  key="residential"
                  label="Residential Work"
                variant="outlined"
                  color="primary"
                />,
              ]}
          </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Tools & Equipment
            </Typography>
            <List dense>
              {(
                enhancedWorker.tools || [
                  'Power Tools',
                  'Hand Tools',
                  'Safety Equipment',
                  'Measuring Tools',
                ]
              ).map((tool, index) => (
                <ListItem key={index}>
                  <ListItemText primary={tool} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </GlassCard>
  );

  const renderPortfolio = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <VisibilityIcon color="primary" />
          Portfolio & Previous Work
        </Typography>

        {enhancedWorker.portfolio.length > 0 ? (
            <Grid container spacing={2}>
            {enhancedWorker.portfolio.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[12],
                    },
                  }}
                  onClick={() => {
                    setSelectedPortfolioItem(item);
                    setPortfolioDialogOpen(true);
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.image || '/api/placeholder/400/300'}
                    alt={item.title}
                  />
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
                </Grid>
              ))}
            </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <VisibilityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No portfolio items available yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later to see this worker's completed projects
            </Typography>
        </Box>
      )}
      </CardContent>
    </GlassCard>
  );

  const renderReviews = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <StarIcon color="primary" />
          Client Reviews
        </Typography>

        {enhancedWorker.testimonials.length > 0 ? (
            <List>
            {enhancedWorker.testimonials.slice(0, 5).map((review, index) => (
              <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                    <Avatar>{review.client?.charAt(0) || 'C'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          {review.client || 'Anonymous Client'}
                          </Typography>
                        <Rating value={review.rating} size="small" readOnly />
                        </Box>
                      }
                      secondary={
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {review.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.date).toLocaleDateString()}
                        </Typography>
                      </>
                      }
                    />
                  </ListItem>
                {index < enhancedWorker.testimonials.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
                </React.Fragment>
              ))}
            </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No reviews yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
              Be the first to work with this professional and leave a review
                        </Typography>
          </Box>
                      )}
                    </CardContent>
    </GlassCard>
  );

  const renderAvailability = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <ScheduleIcon color="primary" />
          Availability
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Current Status
            </Typography>
            <Chip
              label={availability?.status || 'Available'}
              color={
                availability?.status === 'Available' ? 'success' : 'warning'
              }
              size="large"
              sx={{ mb: 2 }}
            />

            <Typography variant="body1" gutterBottom>
              <strong>Response Time:</strong>{' '}
              {availability?.response_time || 'Within 2 hours'}
            </Typography>
            <Typography variant="body1">
              <strong>Next Available:</strong>{' '}
              {availability?.next_available || 'Immediately'}
            </Typography>
                </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Working Hours
            </Typography>
            <List dense>
              {(
                availability?.working_hours || [
                  'Monday: 8:00 AM - 6:00 PM',
                  'Tuesday: 8:00 AM - 6:00 PM',
                  'Wednesday: 8:00 AM - 6:00 PM',
                  'Thursday: 8:00 AM - 6:00 PM',
                  'Friday: 8:00 AM - 6:00 PM',
                  'Weekend: By appointment',
                ]
              ).map((hours, index) => (
                <ListItem key={index}>
                  <ListItemText primary={hours} />
                </ListItem>
              ))}
            </List>
            </Grid>
        </Grid>
      </CardContent>
    </GlassCard>
  );

  const renderCertifications = () => (
    <GlassCard sx={{ mb: 4 }}>
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <SchoolIcon color="primary" />
          Certifications & Credentials
        </Typography>

        {enhancedWorker.certifications.length > 0 ? (
          <Grid container spacing={2}>
            {enhancedWorker.certifications.map((cert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <EmojiEventsIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {cert.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cert.issuer}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Issued: {new Date(cert.year).toLocaleDateString()}
                      </Typography>
        </Box>
                    {cert.verified && <VerifiedIcon color="success" />}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No certifications available
                        </Typography>
                          <Typography variant="body2" color="text.secondary">
              Professional may be working on obtaining certifications
                          </Typography>
          </Box>
        )}
      </CardContent>
    </GlassCard>
  );

  // Enhanced hero section render
  const renderHeroSection = () => (
    <ProfileHeroSection ref={heroRef}>
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 3 }}>
        <Grid container spacing={6} alignItems="center" sx={{ py: 8 }}>
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <ProfileAvatar
                  src={enhancedWorker.avatar}
                  alt={enhancedWorker.name}
                  size="large"
                  verified={enhancedWorker.verified}
                  premium={enhancedWorker.premium}
                  sx={{
                    mb: 3,
                    animation: enhancedWorker.premium ? `${pulse} 3s ease-in-out infinite` : 'none',
                  }}
                >
                  {enhancedWorker.name.charAt(0)}
                </ProfileAvatar>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                  {enhancedWorker.badges.map((badge, index) => (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    >
                      <Chip
                        label={badge}
                        size="small"
                        sx={{
                          bgcolor: alpha('#FFD700', 0.2),
                          color: '#FFD700',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          border: `1px solid ${alpha('#FFD700', 0.5)}`,
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>

                <Stack direction="row" spacing={2} justifyContent="center">
                  <Rating 
                    value={enhancedWorker.rating} 
                    precision={0.01} 
                    readOnly 
                    size="large"
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#FFD700',
                        fontSize: '2rem',
                      },
                    }}
                  />
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#FFD700' }}>
                    {enhancedWorker.rating}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  ({enhancedWorker.reviewCount.toLocaleString()} reviews)
                </Typography>
              </Box>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                  fontWeight: 900,
                  mb: 2,
                  lineHeight: 1.1,
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                {enhancedWorker.name}
              </Typography>
              
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: '1.3rem', md: '1.8rem', lg: '2.2rem' },
                  fontWeight: 600,
                  mb: 4,
                  opacity: 0.95,
                  lineHeight: 1.3,
                }}
              >
                {enhancedWorker.title}
              </Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={900} color="#FFD700">
                      ${enhancedWorker.hourlyRate}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      per hour
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={900} color="#4ECDC4">
                      {enhancedWorker.completedJobs}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      projects completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={900} color="#FF6B6B">
                      {enhancedWorker.responseTime}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      response time
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={900} color="#9B59B6">
                      99.8%
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      success rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
                <AnimatedButton
                  size="large"
                  startIcon={<MessageIcon />}
                  onClick={handleContact}
                  magnetic
                  sx={{ minWidth: 200 }}
                >
                  Message Now
                </AnimatedButton>
                <AnimatedButton
                  variant="outlined"
                  size="large"
                  startIcon={<WorkIcon />}
                  onClick={handleHire}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    minWidth: 180,
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      backgroundColor: alpha('#ffffff', 0.15),
                    },
                  }}
                >
                  Hire Expert
                </AnimatedButton>
                <IconButton
                  onClick={handleBookmark}
                  sx={{
                    color: 'white',
                    bgcolor: alpha('#ffffff', 0.1),
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: alpha('#ffffff', 0.2),
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Stack>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <LocationIcon sx={{ opacity: 0.8 }} />
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                  {enhancedWorker.location}
                </Typography>
                <Chip
                  label={enhancedWorker.availability.status}
                  size="small"
                  sx={{
                    bgcolor: alpha('#4CAF50', 0.2),
                    color: '#4CAF50',
                    fontWeight: 700,
                    animation: `${pulse} 2s ease-in-out infinite`,
                  }}
                />
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </ProfileHeroSection>
  );

  // Enhanced overview section
  const renderOverview = () => (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <Grid container spacing={6}>
        <Grid item xs={12} lg={8}>
          <GlassCard featured elevation={12} sx={{ p: 4, mb: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ mb: 3 }}>
              🌟 Professional Overview
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 1.8, 
                fontSize: '1.1rem', 
                mb: 3,
                maxHeight: showFullBio ? 'none' : '150px',
                overflow: 'hidden',
                position: 'relative',
                '&::after': !showFullBio ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '50px',
                  background: `linear-gradient(transparent, ${theme.palette.background.paper})`,
                } : {},
              }}
            >
              {enhancedWorker.bio}
            </Typography>
            
            <AnimatedButton
              variant="outlined"
              size="small"
              onClick={() => setShowFullBio(!showFullBio)}
              startIcon={showFullBio ? <ExpandMoreIcon /> : <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} />}
            >
              {showFullBio ? 'Show Less' : 'Read More'}
            </AnimatedButton>
          </GlassCard>

          {/* Performance Metrics */}
          <GlassCard elevation={12} sx={{ p: 4, mb: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
              📊 Performance Excellence
            </Typography>
            
            <Grid container spacing={3}>
              {[
                { label: 'Success Rate', value: `${enhancedWorker.successMetrics.successRate}%`, color: '#4CAF50', icon: <CheckIcon /> },
                { label: 'Innovation Score', value: `${enhancedWorker.successMetrics.innovationScore}/100`, color: '#FF6B6B', icon: <EmojiEventsIcon /> },
                { label: 'Technical Score', value: `${enhancedWorker.successMetrics.technicalScore}/100`, color: '#2196F3', icon: <BuildIcon /> },
                { label: 'Leadership Score', value: `${enhancedWorker.successMetrics.leadershipScore}/100`, color: '#9C27B0', icon: <GroupWorkIcon /> },
                { label: 'Communication', value: `${enhancedWorker.successMetrics.communicationScore}/100`, color: '#FF9800', icon: <MessageIcon /> },
                { label: 'Repeat Clients', value: `${enhancedWorker.successMetrics.repeatClients}%`, color: '#00BCD4', icon: <StarIcon /> },
              ].map((metric, index) => (
                <Grid item xs={6} md={4} key={metric.label}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <MetricCard
                      color={metric.color}
                      gradient
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Box sx={{ color: metric.color, fontSize: '2.5rem', mb: 1 }}>
                        {metric.icon}
                      </Box>
                      <Typography variant="h4" fontWeight={900} color={metric.color} gutterBottom>
                        {metric.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {metric.label}
                      </Typography>
                    </MetricCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </GlassCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* Quick Stats */}
          <GlassCard premium elevation={16} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 3 }}>
              💎 Elite Professional Stats
            </Typography>
            
            <Stack spacing={3}>
              {[
                { label: 'Total Earnings', value: statsData.totalEarnings, icon: <MoneyIcon />, color: '#4CAF50' },
                { label: 'Clients Served', value: statsData.clientsServed, icon: <PersonIcon />, color: '#2196F3' },
                { label: 'Avg Rating', value: `${statsData.avgRating}/5.0`, icon: <StarIcon />, color: '#FFD700' },
                { label: 'On-Time Delivery', value: `${statsData.onTimeDelivery}%`, icon: <ScheduleIcon />, color: '#9C27B0' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(stat.color, 0.1),
                    border: `1px solid ${alpha(stat.color, 0.3)}`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: stat.color, fontSize: '1.5rem' }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={900} color={stat.color}>
                      {stat.value}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </GlassCard>

          {/* Availability */}
          <GlassCard elevation={12} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 3 }}>
              ⏰ Availability & Preferences
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Current Status
                </Typography>
                <Chip
                  label={enhancedWorker.availability.status}
                  color="success"
                  sx={{ mt: 1, fontWeight: 700 }}
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Next Available
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {enhancedWorker.availability.nextAvailable}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Project Size Preference
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {enhancedWorker.availability.preferredProjectSize}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Working Hours
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {enhancedWorker.availability.workingHours}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Remote Work
                </Typography>
                <Chip
                  label={enhancedWorker.availability.remote ? 'Available' : 'On-site only'}
                  color={enhancedWorker.availability.remote ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Stack>
          </GlassCard>

          {/* Languages */}
          <GlassCard elevation={12} sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 3 }}>
              🌍 Languages
            </Typography>
            
            <Stack spacing={1}>
              {enhancedWorker.languages.map((language, index) => (
                <Typography key={index} variant="body1" fontWeight={600}>
                  {language}
                </Typography>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Container>
  );

  // Enhanced skills section
  const renderSkillsSection = () => (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <Typography 
          variant="h3" 
          fontWeight={900} 
          textAlign="center" 
          gutterBottom 
          sx={{ 
            mb: 6,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🛠️ Skills & Expertise
        </Typography>

        <GlassCard featured elevation={20} sx={{ p: 6 }}>
          <Grid container spacing={4}>
            {['technical', 'leadership', 'soft'].map((category, categoryIndex) => {
              const categorySkills = enhancedWorker.skills.filter(skill => skill.category === category);
              const categoryColors = {
                technical: '#2196F3',
                leadership: '#FF9800',
                soft: '#4CAF50',
              };
              const categoryIcons = {
                technical: <BuildIcon />,
                leadership: <GroupWorkIcon />,
                soft: <MessageIcon />,
              };

              return (
                <Grid item xs={12} md={4} key={category}>
                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box 
                        sx={{ 
                          color: categoryColors[category], 
                          fontSize: '3rem', 
                          mb: 2,
                          filter: `drop-shadow(0 8px 16px ${alpha(categoryColors[category], 0.3)})`,
                        }}
                      >
                        {categoryIcons[category]}
                      </Box>
                      <Typography variant="h5" fontWeight={800} sx={{ color: categoryColors[category], textTransform: 'capitalize' }}>
                        {category} Skills
                      </Typography>
                    </Box>
                    
                    <Stack spacing={2}>
                      {categorySkills.map((skill, index) => (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 3,
                            bgcolor: alpha(categoryColors[category], 0.05),
                            border: `2px solid ${alpha(categoryColors[category], 0.2)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              bgcolor: alpha(categoryColors[category], 0.1),
                              borderColor: categoryColors[category],
                              transform: 'translateY(-4px)',
                              boxShadow: `0 12px 24px ${alpha(categoryColors[category], 0.2)}`,
                            }
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" fontWeight={800}>
                                {skill.name}
                              </Typography>
                              <SkillChip
                                label={skill.level}
                                size="small"
                                level={skill.level}
                                category={category}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {skill.years} years experience
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={
                                skill.level === 'expert' ? 95 :
                                skill.level === 'advanced' ? 80 :
                                skill.level === 'intermediate' ? 65 : 45
                              }
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha(categoryColors[category], 0.1),
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: categoryColors[category],
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>
                        </motion.div>
                      ))}
                    </Stack>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </GlassCard>
      </motion.div>
    </Container>
  );

  // Enhanced portfolio section
  const renderPortfolioSection = () => (
    <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), py: 8 }}>
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography 
            variant="h3" 
            fontWeight={900} 
            textAlign="center" 
            gutterBottom 
            sx={{ 
              mb: 6,
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🏆 Featured Portfolio
          </Typography>

          <Grid container spacing={4}>
            {enhancedWorker.portfolio.map((project, index) => (
              <Grid item xs={12} md={6} lg={4} key={project.id}>
                <motion.div
                  initial={{ opacity: 0, y: 80, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -12, transition: { duration: 0.3 } }}
                >
                  <GlassCard
                    featured={project.featured}
                    elevation={16}
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    onClick={() => {
                      setSelectedPortfolioItem(project);
                      setPortfolioDialog(true);
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="240"
                      image={project.image}
                      alt={project.title}
                      sx={{
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
                          {project.title}
                        </Typography>
                        {project.featured && (
                          <Chip
                            label="FEATURED"
                            size="small"
                            sx={{
                              bgcolor: alpha('#FFD700', 0.2),
                              color: '#FFD700',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {project.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip
                          label={project.category}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main,
                            fontWeight: 700,
                          }}
                        />
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          {project.year}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Client: <strong>{project.client}</strong>
                        </Typography>
                        <Typography variant="h6" fontWeight={800} color="success.main">
                          {project.value}
                        </Typography>
                      </Box>
                    </CardContent>
                  </GlassCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <AnimatedButton
              variant="outlined"
              size="large"
              startIcon={<VisibilityIcon />}
              onClick={() => navigate(`/professionals/${enhancedWorker.id}/portfolio`)}
              magnetic
            >
              View Complete Portfolio
            </AnimatedButton>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );

  // Experience and certifications section
  const renderExperienceSection = () => (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <Typography 
        variant="h3" 
        fontWeight={900} 
        textAlign="center" 
        gutterBottom 
        sx={{ 
          mb: 6,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        💼 Professional Journey
      </Typography>

      <Grid container spacing={6}>
        <Grid item xs={12} lg={8}>
          <GlassCard elevation={16} sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
              🏢 Work Experience
            </Typography>
            
            <Stack spacing={4}>
              {enhancedWorker.workHistory.map((job, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ 
                    p: 3, 
                    borderLeft: `4px solid ${theme.palette.secondary.main}`,
                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                    borderRadius: '0 12px 12px 0',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      transform: 'translateX(8px)',
                      transition: 'all 0.3s ease',
                    }
                  }}>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                      {job.role}
                    </Typography>
                    <Typography variant="h6" color="secondary.main" fontWeight={700} gutterBottom>
                      {job.company}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mb: 2 }}>
                      {job.period} • {job.projects} projects
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                      {job.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {job.achievements.map((achievement, achIndex) => (
                        <Chip
                          key={achIndex}
                          label={achievement}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <GlassCard elevation={16} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
              🎓 Certifications
            </Typography>
            
            <Stack spacing={3}>
              {enhancedWorker.certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      borderColor: theme.palette.warning.main,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" fontWeight={800}>
                        {cert.name}
                      </Typography>
                      {cert.verified && (
                        <VerifiedIcon color="success" fontSize="small" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {cert.issuer}
                    </Typography>
                    <Typography variant="caption" color="warning.main" fontWeight={700}>
                      {cert.year}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </GlassCard>

          <GlassCard elevation={16} sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
              🏆 Key Achievements
            </Typography>
            
            <Stack spacing={2}>
              {enhancedWorker.achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <EmojiEventsIcon 
                      sx={{ 
                        color: '#FFD700', 
                        fontSize: '1.2rem', 
                        mt: 0.2,
                        filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.3))',
                      }} 
                    />
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.6 }}>
                      {achievement}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Container>
  );

  // Testimonials section
  const renderTestimonials = () => (
    <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), py: 8 }}>
      <Container maxWidth="xl">
        <Typography 
          variant="h3" 
          fontWeight={900} 
          textAlign="center" 
          gutterBottom 
          sx={{ 
            mb: 6,
            background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          💬 Client Testimonials
        </Typography>

        <Grid container spacing={4}>
          {enhancedWorker.testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={6} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <GlassCard 
                  elevation={16} 
                  sx={{ 
                    p: 4, 
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha('#FFD700', 0.05)})`,
                    border: `2px solid ${alpha('#FFD700', 0.2)}`,
                  }}
                >
                  <Rating value={testimonial.rating} readOnly sx={{ mb: 2, color: '#FFD700' }} />
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, fontStyle: 'italic' }}>
                    "{testimonial.text}"
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {testimonial.client}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.project}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {testimonial.date}
                    </Typography>
                  </Box>
                </GlassCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );

  return (
    <>
      <Helmet>
        <title>{enhancedWorker.name} - {enhancedWorker.title} | Kelmah</title>
        <meta name="description" content={`Hire ${enhancedWorker.name}, ${enhancedWorker.title}. ${enhancedWorker.rating} stars, ${enhancedWorker.reviewCount} reviews. Available at $${enhancedWorker.hourlyRate}/hr.`} />
        <meta name="keywords" content={`${enhancedWorker.name}, ${enhancedWorker.skills.map(s => s.name).join(', ')}, ${enhancedWorker.location}`} />
        <meta property="og:title" content={`${enhancedWorker.name} - Elite Professional on Kelmah`} />
        <meta property="og:description" content={enhancedWorker.bio.substring(0, 160)} />
        <meta property="og:image" content={enhancedWorker.avatar} />
        <meta property="og:type" content="profile" />
        <link rel="canonical" href={`https://kelmah.com/professionals/${enhancedWorker.id}`} />
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
          background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, ${alpha('#FFD700', 0.02)} 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }
      }}>
        {/* Hero Section */}
        {renderHeroSection()}
        
        {/* Navigation Tabs */}
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Paper 
            elevation={8} 
            sx={{ 
              borderRadius: 4, 
              overflow: 'hidden',
              bgcolor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
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
              <Tab label="🌟 Overview" />
              <Tab label="🛠️ Skills" />
              <Tab label="🏆 Portfolio" />
              <Tab label="💼 Experience" />
              <Tab label="💬 Reviews" />
            </Tabs>
          </Paper>
        </Container>

        {/* Tab Content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <TabPanel value={tabValue} index={0}>
            {renderOverview()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderSkillsSection()}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {renderPortfolioSection()}
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            {renderExperienceSection()}
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            {renderTestimonials()}
          </TabPanel>
        </Box>

        {/* Floating Action Button */}
        <SpeedDial
          ariaLabel="Profile Actions"
          sx={{ 
            position: 'fixed', 
            bottom: { xs: 80, md: 24 }, 
            right: { xs: 16, md: 24 },
            '& .MuiSpeedDial-fab': {
              bgcolor: theme.palette.secondary.main,
              '&:hover': {
                bgcolor: theme.palette.secondary.dark,
                transform: 'scale(1.1)',
              },
            },
          }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<MessageIcon />}
            tooltipTitle="Send Message"
            onClick={handleContact}
          />
          <SpeedDialAction
            icon={isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            tooltipTitle={isBookmarked ? "Remove Bookmark" : "Bookmark"}
            onClick={handleBookmark}
          />
          <SpeedDialAction
            icon={<ShareIcon />}
            tooltipTitle="Share Profile"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${enhancedWorker.name} - Professional Profile`,
                  text: `Check out ${enhancedWorker.name}'s profile on Kelmah`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          />
          <SpeedDialAction
            icon={<GetAppIcon />}
            tooltipTitle="Download Resume"
            onClick={() => {
              // Mock download functionality
              const link = document.createElement('a');
              link.href = '#';
              link.download = `${enhancedWorker.name}-Resume.pdf`;
              link.click();
            }}
          />
        </SpeedDial>

        {/* Contact Dialog */}
        <Dialog
          open={contactDialog}
          onClose={() => setContactDialog(false)}
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
              💬 Contact {enhancedWorker.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Send a message to discuss your project
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Title"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Budget Range"
                  variant="outlined"
                  placeholder="e.g., $10,000 - $25,000"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timeline"
                  variant="outlined"
                  placeholder="e.g., 2-3 months"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Project Description"
                  variant="outlined"
                  placeholder="Describe your project requirements, goals, and any specific needs..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 0 }}>
            <AnimatedButton
              variant="outlined"
              onClick={() => setContactDialog(false)}
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="contained"
              onClick={() => {
                setContactDialog(false);
                // Handle message sending
              }}
              magnetic
            >
              Send Message
            </AnimatedButton>
          </DialogActions>
        </Dialog>

        {/* Portfolio Dialog */}
        <Dialog
          open={portfolioDialog}
          onClose={() => setPortfolioDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.95)})`,
              backdropFilter: 'blur(30px)',
            }
          }}
        >
          {selectedPortfolioItem && (
            <>
              <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
                <Typography variant="h4" fontWeight={800}>
                  {selectedPortfolioItem.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {selectedPortfolioItem.category} • {selectedPortfolioItem.year}
                </Typography>
              </DialogTitle>
              <DialogContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <CardMedia
                      component="img"
                      image={selectedPortfolioItem.image}
                      alt={selectedPortfolioItem.title}
                      sx={{ borderRadius: 2, width: '100%', height: 'auto' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                      Project Overview
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                      {selectedPortfolioItem.description}
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Client
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {selectedPortfolioItem.client}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Project Value
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="success.main">
                        {selectedPortfolioItem.value}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Completion Year
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {selectedPortfolioItem.year}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 4, pt: 0 }}>
                <AnimatedButton
                  variant="outlined"
                  onClick={() => setPortfolioDialog(false)}
                >
                  Close
                </AnimatedButton>
                <AnimatedButton
                  variant="contained"
                  onClick={() => {
                    setPortfolioDialog(false);
                    handleContact();
                  }}
                  magnetic
                >
                  Discuss Similar Project
                </AnimatedButton>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </>
  );
};

export default WorkerProfile;
