import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Rating,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Verified as VerifiedIcon,
  ThumbUp as ThumbUpIcon,
  Speed as SpeedIcon,
  EmojiEvents as TrophyIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  WorkHistory as ExperienceIcon,
  Category as CategoryIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import reviewService from '../../modules/reviews/services/reviewService';

/**
 * Comprehensive Worker Reputation System
 * Displays detailed reputation metrics, badges, achievements, and trust indicators
 */
const WorkerReputationSystem = ({
  workerId,
  compact = false,
  showBadges = true,
  showTrends = true,
  showCategoryBreakdown = true,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [reputationData, setReputationData] = useState(null);
  const [achievements, setAchievements] = useState([]);

  // Mock API for development (replace with actual API calls)
  const reputationApi = {
    async getWorkerReputation(workerId) {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        workerId,
        overallScore: 94.5, // Out of 100
        totalReviews: 87,
        averageRating: 4.8,
        completedJobs: 156,
        repeatClients: 23,

        // Rating breakdown
        ratings: {
          overall: 4.8,
          quality: 4.9,
          communication: 4.6,
          timeliness: 4.7,
          professionalism: 4.9,
        },

        // Rating distribution
        ratingDistribution: {
          5: 68, // 78.2%
          4: 15, // 17.2%
          3: 3, // 3.4%
          2: 1, // 1.1%
          1: 0, // 0%
        },

        // Category expertise
        categoryExpertise: [
          {
            category: 'Carpentry',
            rating: 4.9,
            jobs: 45,
            specialization: 'Custom Furniture',
          },
          {
            category: 'Home Renovation',
            rating: 4.8,
            jobs: 32,
            specialization: 'Kitchen Remodeling',
          },
          {
            category: 'Repairs',
            rating: 4.7,
            jobs: 28,
            specialization: 'Emergency Fixes',
          },
          {
            category: 'Installation',
            rating: 4.6,
            jobs: 18,
            specialization: 'Cabinet Installation',
          },
        ],

        // Trust metrics
        trustMetrics: {
          verificationStatus: 'fully_verified',
          backgroundCheck: true,
          insuranceVerified: true,
          licensesVerified: true,
          identityVerified: true,
          responseRate: 95.2,
          responseTime: 2.3, // hours
          recommendationRate: 96.5,
          repeatClientRate: 34.2,
          onTimeDelivery: 92.8,
          qualityConsistency: 89.5,
        },

        // Performance trends
        performanceTrends: {
          lastMonth: { rating: 4.9, trend: 'up', change: 0.2 },
          last3Months: { rating: 4.8, trend: 'stable', change: 0.0 },
          last6Months: { rating: 4.7, trend: 'up', change: 0.1 },
          lastYear: { rating: 4.6, trend: 'up', change: 0.2 },
        },

        // Professional highlights
        highlights: [
          'Top 5% of carpenters in Accra',
          '98% client satisfaction rate',
          'Specialist in custom furniture',
          'Emergency repair expert',
          'Eco-friendly materials advocate',
        ],

        // Recent feedback themes
        feedbackThemes: {
          positive: [
            { theme: 'Exceptional craftsmanship', count: 45 },
            { theme: 'Reliable and punctual', count: 38 },
            { theme: 'Great communication', count: 32 },
            { theme: 'Fair pricing', count: 28 },
            { theme: 'Clean worksite', count: 24 },
          ],
          improvement: [
            { theme: 'Could improve cleanup', count: 3 },
            { theme: 'Better time estimates', count: 2 },
          ],
        },
      };
    },

    async getWorkerAchievements(workerId) {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      return [
        {
          id: 'top_rated',
          title: 'Top Rated Professional',
          description: 'Maintained 4.8+ rating for 6+ months',
          icon: TrophyIcon,
          color: '#FFD700',
          earned: true,
          earnedDate: '2024-01-15',
          level: 'gold',
        },
        {
          id: 'quality_master',
          title: 'Quality Master',
          description: 'Achieved 95%+ quality ratings',
          icon: StarIcon,
          color: '#4CAF50',
          earned: true,
          earnedDate: '2023-12-20',
          level: 'platinum',
        },
        {
          id: 'communication_expert',
          title: 'Communication Expert',
          description: 'Excellent communication ratings',
          icon: ThumbUpIcon,
          color: '#2196F3',
          earned: true,
          earnedDate: '2023-11-10',
          level: 'gold',
        },
        {
          id: 'speedster',
          title: 'Speed Demon',
          description: 'Consistently fast delivery',
          icon: SpeedIcon,
          color: '#FF9800',
          earned: true,
          earnedDate: '2023-10-05',
          level: 'silver',
        },
        {
          id: 'trusted_pro',
          title: 'Trusted Professional',
          description: 'Complete verification & insurance',
          icon: SecurityIcon,
          color: '#9C27B0',
          earned: true,
          earnedDate: '2023-09-01',
          level: 'platinum',
        },
        {
          id: 'repeat_champion',
          title: 'Client Favorite',
          description: '25+ repeat clients',
          icon: GroupIcon,
          color: '#E91E63',
          earned: true,
          earnedDate: '2024-02-01',
          level: 'gold',
        },
      ];
    },
  };

  // Fetch reputation data
  useEffect(() => {
    const fetchReputationData = async () => {
      try {
        setLoading(true);
        const [reputation, achievementsList] = await Promise.all([
          reputationApi.getWorkerReputation(workerId),
          reputationApi.getWorkerAchievements(workerId),
        ]);

        setReputationData(reputation);
        setAchievements(achievementsList);
      } catch (error) {
        console.error('Error fetching reputation data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      fetchReputationData();
    }
  }, [workerId]);

  // Calculate reputation score color
  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 80) return '#8BC34A'; // Light Green
    if (score >= 70) return '#FFC107'; // Yellow
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Get trend icon and color
  const getTrendDisplay = (trend, change = 0) => {
    if (trend === 'up') {
      return { icon: TrendingUpIcon, color: '#4CAF50', text: `+${change}` };
    } else if (trend === 'down') {
      return {
        icon: TrendingDownIcon,
        color: '#F44336',
        text: `-${Math.abs(change)}`,
      };
    }
    return { icon: null, color: '#9E9E9E', text: 'Stable' };
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  if (!reputationData) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          No reputation data available
        </Typography>
      </Card>
    );
  }

  const CompactView = () => (
    <Card
      sx={{
        background:
          'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
        border: '1px solid rgba(255,215,0,0.2)',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `conic-gradient(${getScoreColor(reputationData.overallScore)} 0deg ${reputationData.overallScore * 3.6}deg, rgba(255,255,255,0.1) ${reputationData.overallScore * 3.6}deg 360deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 800 }}>
              {reputationData.overallScore}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 0.5 }}
            >
              <Rating
                value={reputationData.averageRating}
                readOnly
                size="small"
              />
              <Typography
                variant="body2"
                sx={{ color: '#FFD700', fontWeight: 600 }}
              >
                {reputationData.averageRating}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                ({reputationData.totalReviews} reviews)
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              {reputationData.trustMetrics.verificationStatus ===
                'fully_verified' && (
                <VerifiedIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
              )}
              <Chip
                label={`${reputationData.completedJobs} jobs`}
                size="small"
                sx={{
                  backgroundColor: alpha('#2196F3', 0.2),
                  color: '#2196F3',
                  fontSize: '0.7rem',
                }}
              />
              <Chip
                label={`${reputationData.trustMetrics.recommendationRate}% recommend`}
                size="small"
                sx={{
                  backgroundColor: alpha('#4CAF50', 0.2),
                  color: '#4CAF50',
                  fontSize: '0.7rem',
                }}
              />
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (compact) {
    return <CompactView />;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Overall Reputation Score */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                background: `linear-gradient(135deg, ${alpha(getScoreColor(reputationData.overallScore), 0.1)} 0%, ${alpha(getScoreColor(reputationData.overallScore), 0.05)} 100%)`,
                border: `1px solid ${alpha(getScoreColor(reputationData.overallScore), 0.2)}`,
                textAlign: 'center',
                p: 2,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}
                >
                  Reputation Score
                </Typography>

                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `conic-gradient(${getScoreColor(reputationData.overallScore)} 0deg ${reputationData.overallScore * 3.6}deg, rgba(255,255,255,0.1) ${reputationData.overallScore * 3.6}deg 360deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(30,30,30,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        color: getScoreColor(reputationData.overallScore),
                        fontWeight: 800,
                      }}
                    >
                      {reputationData.overallScore}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      /100
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body1"
                  sx={{ color: '#fff', fontWeight: 600, mb: 1 }}
                >
                  Elite Professional
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Top 5% of professionals in category
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Rating Breakdown */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background:
                'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              height: '100%',
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}
              >
                Rating Breakdown
              </Typography>

              <Stack spacing={2}>
                {Object.entries(reputationData.ratings).map(
                  ([category, rating]) => (
                    <Box key={category}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: '#fff', textTransform: 'capitalize' }}
                        >
                          {category}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#FFD700', fontWeight: 600 }}
                        >
                          {rating}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(rating / 5) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#FFD700',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  ),
                )}
              </Stack>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Based on {reputationData.totalReviews} reviews
                </Typography>
                <Rating
                  value={reputationData.averageRating}
                  readOnly
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Trust Metrics */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background:
                'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              height: '100%',
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}
              >
                Trust Indicators
              </Typography>

              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SecurityIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Verification Status
                    </Typography>
                  </Stack>
                  <Chip
                    label="Fully Verified"
                    size="small"
                    sx={{
                      backgroundColor: alpha('#4CAF50', 0.2),
                      color: '#4CAF50',
                      fontSize: '0.7rem',
                    }}
                  />
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <ThumbUpIcon sx={{ color: '#2196F3', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Response Rate
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: '#2196F3', fontWeight: 600 }}
                  >
                    {reputationData.trustMetrics.responseRate}%
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SpeedIcon sx={{ color: '#FF9800', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Avg Response Time
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: '#FF9800', fontWeight: 600 }}
                  >
                    {reputationData.trustMetrics.responseTime}h
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      On-Time Delivery
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: '#4CAF50', fontWeight: 600 }}
                  >
                    {reputationData.trustMetrics.onTimeDelivery}%
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GroupIcon sx={{ color: '#E91E63', fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Repeat Clients
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: '#E91E63', fontWeight: 600 }}
                  >
                    {reputationData.repeatClients}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements & Badges */}
        {showBadges && (
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background:
                  'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}
                >
                  Achievements & Badges
                </Typography>

                <Grid container spacing={2}>
                  {achievements
                    .filter((achievement) => achievement.earned)
                    .map((achievement) => {
                      const IconComponent = achievement.icon;
                      return (
                        <Grid item xs={6} sm={4} key={achievement.id}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Tooltip title={achievement.description}>
                              <Paper
                                sx={{
                                  p: 2,
                                  textAlign: 'center',
                                  background: `linear-gradient(135deg, ${alpha(achievement.color, 0.1)} 0%, ${alpha(achievement.color, 0.05)} 100%)`,
                                  border: `1px solid ${alpha(achievement.color, 0.2)}`,
                                  cursor: 'pointer',
                                }}
                              >
                                <Badge
                                  badgeContent={
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: achievement.color,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        fontSize: '0.6rem',
                                      }}
                                    >
                                      {achievement.level}
                                    </Typography>
                                  }
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      backgroundColor: alpha(
                                        achievement.color,
                                        0.2,
                                      ),
                                      border: `1px solid ${achievement.color}`,
                                    },
                                  }}
                                >
                                  <IconComponent
                                    sx={{
                                      fontSize: 32,
                                      color: achievement.color,
                                      mb: 1,
                                    }}
                                  />
                                </Badge>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#fff',
                                    fontWeight: 600,
                                    display: 'block',
                                  }}
                                >
                                  {achievement.title}
                                </Typography>
                              </Paper>
                            </Tooltip>
                          </motion.div>
                        </Grid>
                      );
                    })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Category Expertise */}
        {showCategoryBreakdown && (
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background:
                  'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}
                >
                  Category Expertise
                </Typography>

                <Stack spacing={2}>
                  {reputationData.categoryExpertise.map((category) => (
                    <Box key={category.category}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                      >
                        <Stack>
                          <Typography
                            variant="body2"
                            sx={{ color: '#fff', fontWeight: 600 }}
                          >
                            {category.category}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                          >
                            {category.specialization} • {category.jobs} jobs
                          </Typography>
                        </Stack>
                        <Stack alignItems="flex-end">
                          <Rating
                            value={category.rating}
                            readOnly
                            size="small"
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: '#FFD700' }}
                          >
                            {category.rating}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Performance Trends */}
        {showTrends && (
          <Grid item xs={12}>
            <Card
              sx={{
                background:
                  'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}
                >
                  Performance Trends & Highlights
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: '#fff', mb: 2 }}
                    >
                      Recent Performance
                    </Typography>
                    <Stack spacing={1.5}>
                      {Object.entries(reputationData.performanceTrends).map(
                        ([period, data]) => {
                          const trendDisplay = getTrendDisplay(
                            data.trend,
                            data.change,
                          );
                          const TrendIcon = trendDisplay.icon;

                          return (
                            <Stack
                              key={period}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'rgba(255,255,255,0.7)',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {period
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, (str) => str.toUpperCase())}
                              </Typography>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Rating
                                  value={data.rating}
                                  readOnly
                                  size="small"
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#FFD700' }}
                                >
                                  {data.rating}
                                </Typography>
                                {TrendIcon && (
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={0.5}
                                  >
                                    <TrendIcon
                                      sx={{
                                        fontSize: 16,
                                        color: trendDisplay.color,
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{ color: trendDisplay.color }}
                                    >
                                      {trendDisplay.text}
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Stack>
                          );
                        },
                      )}
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: '#fff', mb: 2 }}
                    >
                      Professional Highlights
                    </Typography>
                    <List dense>
                      {reputationData.highlights.map((highlight, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <StarIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={highlight}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: { color: 'rgba(255,255,255,0.9)' },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default WorkerReputationSystem;
