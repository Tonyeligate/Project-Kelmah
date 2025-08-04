import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Badge,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Verified as VerifiedIcon,
  Language as LanguageIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as RecommendationIcon,
  Analytics as AnalyticsIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  AutoAwesome as MagicIcon,
  EmojiPeople as CommunityIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import aiMatchingService from '../../services/aiMatchingService';

/**
 * Smart Job Matcher Component
 * Uses AI to find the best worker matches for Ghana jobs
 */
const SmartJobMatcher = ({ 
  jobRequest, 
  onWorkerSelect, 
  onMatchingComplete,
  maxResults = 10 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedAnalysis, setExpandedAnalysis] = useState(null);

  // Mock available workers for demonstration
  const mockWorkers = useMemo(() => [
    {
      id: '1',
      name: 'Kwame Asante',
      avatar: '/avatars/kwame.jpg',
      title: 'Master Plumber',
      location: 'East Legon, Accra',
      rating: 4.8,
      reviewCount: 127,
      completionRate: 96,
      averageResponseTime: 1.5, // hours
      punctualityScore: 92,
      hourlyRate: 45,
      skills: ['Pipe Installation', 'Drainage Repair', 'Emergency Service', 'Water Heater Installation'],
      certifications: ['Ghana Institute of Plumbers', 'Ghana Standards Authority'],
      languages: ['English', 'Twi', 'Ga'],
      experience: 8,
      specializations: ['plumbing'],
      ghanaCardVerified: true,
      apprenticeshipCompleted: true,
      communityRating: 4.9,
      localRecommendations: 45,
      repeatCustomers: 78,
      acceptedPayments: ['Mobile Money', 'Bank Transfer', 'Cash'],
      estimatedHours: 6,
      availability: 'Available today',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      name: 'Akosua Mensah',
      avatar: '/avatars/akosua.jpg',
      title: 'Professional Painter',
      location: 'Tema, Greater Accra',
      rating: 4.9,
      reviewCount: 89,
      completionRate: 98,
      averageResponseTime: 3,
      punctualityScore: 95,
      hourlyRate: 35,
      skills: ['Interior Painting', 'Exterior Painting', 'Color Consultation', 'Surface Preparation'],
      certifications: ['National Vocational Training Institute', 'Ghana Standards Authority'],
      languages: ['English', 'Twi'],
      experience: 6,
      specializations: ['painting'],
      ghanaCardVerified: true,
      apprenticeshipCompleted: false,
      communityRating: 4.7,
      localRecommendations: 32,
      repeatCustomers: 56,
      acceptedPayments: ['Mobile Money', 'Cash'],
      estimatedHours: 8,
      availability: 'Available tomorrow',
      lastActive: '1 hour ago'
    },
    {
      id: '3',
      name: 'Yaw Boateng',
      avatar: '/avatars/yaw.jpg',
      title: 'Master Carpenter',
      location: 'Airport City, Accra',
      rating: 4.7,
      reviewCount: 156,
      completionRate: 94,
      averageResponseTime: 4,
      punctualityScore: 88,
      hourlyRate: 50,
      skills: ['Cabinet Making', 'Furniture Design', 'Installation', 'Wood Finishing'],
      certifications: ['Traditional Apprenticeship', 'Council for Technical and Vocational Education'],
      languages: ['English', 'Twi'],
      experience: 12,
      specializations: ['carpentry'],
      ghanaCardVerified: true,
      apprenticeshipCompleted: true,
      communityRating: 4.6,
      localRecommendations: 28,
      repeatCustomers: 43,
      acceptedPayments: ['Bank Transfer', 'Mobile Money', 'Cash'],
      estimatedHours: 12,
      availability: 'Available next week',
      lastActive: '30 minutes ago'
    }
  ], []);

  // Perform AI matching
  const performMatching = useCallback(async () => {
    if (!jobRequest) return;

    setLoading(true);
    try {
      console.log('🧠 Starting AI matching for job:', jobRequest.title);
      
      const matchResults = await aiMatchingService.findBestMatches(
        jobRequest,
        mockWorkers,
        { maxResults, minimumScore: 0.3 }
      );
      
      setMatches(matchResults);
      
      if (onMatchingComplete) {
        onMatchingComplete(matchResults);
      }
      
      console.log(`✨ Found ${matchResults.length} quality matches`);
      
    } catch (error) {
      console.error('Matching failed:', error);
    } finally {
      setLoading(false);
    }
  }, [jobRequest, mockWorkers, maxResults, onMatchingComplete]);

  // Auto-perform matching when job request changes
  useEffect(() => {
    if (jobRequest) {
      performMatching();
    }
  }, [jobRequest, performMatching]);

  // Show match details
  const showMatchDetails = useCallback((match) => {
    setSelectedMatch(match);
    setDetailsOpen(true);
  }, []);

  // Render match score visualization
  const renderMatchScore = useCallback((matchScore) => {
    const score = Math.round(matchScore.totalScore * 100);
    const getScoreColor = (score) => {
      if (score >= 85) return '#4CAF50';
      if (score >= 70) return '#FFD700';
      if (score >= 55) return '#FF9800';
      return '#F44336';
    };

    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={score}
          size={50}
          thickness={4}
          sx={{
            color: getScoreColor(score),
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
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
          <Typography variant="caption" component="div" sx={{ fontWeight: 700 }}>
            {score}%
          </Typography>
        </Box>
      </Box>
    );
  }, []);

  // Render score breakdown
  const renderScoreBreakdown = useCallback((matchScore) => {
    const categories = {
      location: { label: 'Location', icon: LocationIcon, color: '#2196F3' },
      skills: { label: 'Skills', icon: CheckIcon, color: '#4CAF50' },
      pricing: { label: 'Pricing', icon: MoneyIcon, color: '#FF9800' },
      reliability: { label: 'Reliability', icon: VerifiedIcon, color: '#9C27B0' },
      cultural: { label: 'Cultural Fit', icon: LanguageIcon, color: '#F44336' }
    };

    return (
      <Stack spacing={2}>
        {Object.entries(matchScore.breakdown).map(([category, data]) => {
          const categoryInfo = categories[category];
          const percentage = Math.round(data.rawScore * 100);
          const CategoryIcon = categoryInfo.icon;

          return (
            <Box key={category}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <CategoryIcon sx={{ color: categoryInfo.color, fontSize: 20 }} />
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                  {categoryInfo.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {percentage}%
                </Typography>
              </Stack>
              
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: categoryInfo.color,
                    borderRadius: 3
                  }
                }}
              />
            </Box>
          );
        })}
      </Stack>
    );
  }, []);

  // Render worker match card
  const renderWorkerCard = useCallback((match, index) => {
    const { worker, matchScore, reasoning, recommendations } = match;
    const overallScore = Math.round(matchScore.totalScore * 100);

    return (
      <motion.div
        key={worker.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          elevation={3}
          sx={{
            mb: 2,
            position: 'relative',
            border: overallScore >= 85 ? '2px solid #4CAF50' : '1px solid rgba(255,215,0,0.2)',
            background: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.95) 100%)',
            '&:hover': {
              boxShadow: '0 8px 32px rgba(255,215,0,0.2)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onClick={() => showMatchDetails(match)}
        >
          {/* AI Match Badge */}
          {overallScore >= 85 && (
            <Chip
              icon={<MagicIcon />}
              label="AI Top Match"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: '#4CAF50',
                color: '#000',
                fontWeight: 700,
                fontSize: '10px',
                zIndex: 1
              }}
            />
          )}

          <CardContent sx={{ pb: 1 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  worker.ghanaCardVerified ? (
                    <SecurityIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                  ) : null
                }
              >
                <Avatar
                  src={worker.avatar}
                  sx={{
                    width: 60,
                    height: 60,
                    border: '3px solid #FFD700'
                  }}
                >
                  {worker.name.charAt(0)}
                </Avatar>
              </Badge>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#FFD700' }}>
                  {worker.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {worker.title}
                </Typography>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <StarIcon sx={{ fontSize: 16, color: '#FFD700' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {worker.rating}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({worker.reviewCount})
                    </Typography>
                  </Stack>
                  
                  <Divider orientation="vertical" flexItem />
                  
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {worker.location}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                {renderMatchScore(matchScore)}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  AI Match
                </Typography>
              </Box>
            </Stack>

            {/* Key Stats */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                  ₵{worker.hourlyRate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  per hour
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem />
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 700 }}>
                  {worker.completionRate}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  completion
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem />
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#FF9800', fontWeight: 700 }}>
                  {worker.averageResponseTime}h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  response
                </Typography>
              </Box>
            </Stack>

            {/* AI Reasoning */}
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AIIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: '#FFD700', fontWeight: 600 }}>
                  AI Analysis
                </Typography>
              </Stack>
              
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {reasoning[0]}
              </Typography>
            </Box>

            {/* Skills & Certifications */}
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {worker.skills.slice(0, 3).map((skill, idx) => (
                  <Chip
                    key={idx}
                    label={skill}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,215,0,0.1)',
                      color: '#FFD700',
                      fontWeight: 600,
                      fontSize: '11px'
                    }}
                  />
                ))}
                {worker.skills.length > 3 && (
                  <Chip
                    label={`+${worker.skills.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255,215,0,0.3)',
                      color: 'text.secondary',
                      fontSize: '11px'
                    }}
                  />
                )}
              </Stack>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                <VerifiedIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
                <Typography variant="caption" color="text.secondary">
                  {worker.certifications.length} Ghana certifications
                </Typography>
                
                {worker.languages.includes('Twi') && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <LanguageIcon sx={{ fontSize: 14, color: '#2196F3' }} />
                    <Typography variant="caption" color="text.secondary">
                      Local languages
                    </Typography>
                  </>
                )}
              </Stack>
            </Stack>
          </CardContent>

          <CardActions sx={{ px: 2, pb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={(e) => {
                e.stopPropagation();
                showMatchDetails(match);
              }}
              sx={{
                borderColor: 'rgba(255,215,0,0.5)',
                color: '#FFD700',
                flex: 1
              }}
            >
              View Analysis
            </Button>
            
            <Button
              size="small"
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={(e) => {
                e.stopPropagation();
                if (onWorkerSelect) onWorkerSelect(worker);
              }}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                fontWeight: 700,
                flex: 1
              }}
            >
              Contact
            </Button>
          </CardActions>
        </Card>
      </motion.div>
    );
  }, [showMatchDetails, onWorkerSelect, renderMatchScore]);

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ color: '#FFD700', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#FFD700', mb: 1 }}>
          AI is analyzing worker matches...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Considering location, skills, pricing, and cultural fit
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
          border: '1px solid rgba(255,215,0,0.2)'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <AIIcon sx={{ color: '#FFD700', fontSize: 32 }} />
              <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 700 }}>
                AI-Powered Matches
              </Typography>
            </Stack>
            <Typography variant="subtitle1" color="text.secondary">
              Smart worker recommendations based on Ghana-specific criteria
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={performMatching}
            disabled={loading}
            sx={{
              borderColor: '#FFD700',
              color: '#FFD700'
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Matches List */}
      <AnimatePresence>
        {matches.map((match, index) => renderWorkerCard(match, index))}
      </AnimatePresence>

      {matches.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <AIIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No matches found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your job requirements or expanding your location radius
          </Typography>
        </Paper>
      )}

      {/* Match Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '1px solid rgba(255,215,0,0.2)'
          }
        }}
      >
        {selectedMatch && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar src={selectedMatch.worker.avatar} sx={{ width: 48, height: 48 }}>
                  {selectedMatch.worker.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
                    {selectedMatch.worker.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI Match Analysis & Recommendations
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab label="Match Analysis" />
                <Tab label="Worker Profile" />
                <Tab label="Recommendations" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {activeTab === 0 && (
                  <Stack spacing={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      {renderMatchScore(selectedMatch.matchScore)}
                      <Typography variant="h6" sx={{ mt: 2, color: '#FFD700' }}>
                        {Math.round(selectedMatch.matchScore.totalScore * 100)}% Match
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {Math.round(selectedMatch.matchScore.confidence * 100)}%
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: '#FFD700' }}>
                        Score Breakdown
                      </Typography>
                      {renderScoreBreakdown(selectedMatch.matchScore)}
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: '#FFD700' }}>
                        AI Reasoning
                      </Typography>
                      <List>
                        {selectedMatch.reasoning.map((reason, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <CheckIcon sx={{ color: '#4CAF50' }} />
                            </ListItemIcon>
                            <ListItemText primary={reason} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    {selectedMatch.ghanaBoosts > 0 && (
                      <>
                        <Divider />
                        <Alert severity="info" icon={<CommunityIcon />}>
                          <Typography variant="body2">
                            <strong>Ghana Local Boost:</strong> +{Math.round(selectedMatch.ghanaBoosts * 100)}% 
                            for local expertise and community reputation
                          </Typography>
                        </Alert>
                      </>
                    )}
                  </Stack>
                )}

                {activeTab === 1 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: '#FFD700' }}>
                        Professional Details
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Experience:</Typography>
                          <Typography variant="body2">{selectedMatch.worker.experience} years</Typography>
                        </Stack>
                        
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Hourly Rate:</Typography>
                          <Typography variant="body2">₵{selectedMatch.worker.hourlyRate}</Typography>
                        </Stack>
                        
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Completion Rate:</Typography>
                          <Typography variant="body2">{selectedMatch.worker.completionRate}%</Typography>
                        </Stack>
                        
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Response Time:</Typography>
                          <Typography variant="body2">{selectedMatch.worker.averageResponseTime} hours</Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: '#FFD700' }}>
                        Skills & Certifications
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Skills:</Typography>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {selectedMatch.worker.skills.map((skill, idx) => (
                              <Chip key={idx} label={skill} size="small" />
                            ))}
                          </Stack>
                        </Box>
                        
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Certifications:</Typography>
                          <Stack spacing={1}>
                            {selectedMatch.worker.certifications.map((cert, idx) => (
                              <Stack key={idx} direction="row" alignItems="center" spacing={1}>
                                <VerifiedIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                                <Typography variant="body2">{cert}</Typography>
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                        
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Languages:</Typography>
                          <Stack direction="row" spacing={1}>
                            {selectedMatch.worker.languages.map((lang, idx) => (
                              <Chip 
                                key={idx} 
                                label={lang} 
                                size="small" 
                                variant="outlined"
                                icon={<LanguageIcon />}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                )}

                {activeTab === 2 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: '#FFD700' }}>
                        AI Recommendations
                      </Typography>
                      
                      {selectedMatch.recommendations.length > 0 ? (
                        <List>
                          {selectedMatch.recommendations.map((rec, index) => (
                            <ListItem key={index} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <RecommendationIcon sx={{ color: '#FF9800' }} />
                              </ListItemIcon>
                              <ListItemText primary={rec} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Alert severity="success">
                          <Typography variant="body2">
                            Excellent match! No specific recommendations needed.
                          </Typography>
                        </Alert>
                      )}
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, color: '#FFD700' }}>
                        Next Steps
                      </Typography>
                      
                      <List>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <PhoneIcon sx={{ color: '#4CAF50' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Contact the worker"
                            secondary="Discuss project details and availability"
                          />
                        </ListItem>
                        
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <ScheduleIcon sx={{ color: '#2196F3' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Schedule consultation"
                            secondary="Arrange site visit or detailed discussion"
                          />
                        </ListItem>
                        
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <MoneyIcon sx={{ color: '#FF9800' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Negotiate terms"
                            secondary="Agree on pricing, timeline, and deliverables"
                          />
                        </ListItem>
                      </List>
                    </Box>
                  </Stack>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,215,0,0.2)' }}>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              
              <Button
                variant="contained"
                startIcon={<MessageIcon />}
                onClick={() => {
                  setDetailsOpen(false);
                  if (onWorkerSelect) onWorkerSelect(selectedMatch.worker);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                  color: '#000',
                  fontWeight: 700
                }}
              >
                Contact Worker
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SmartJobMatcher;