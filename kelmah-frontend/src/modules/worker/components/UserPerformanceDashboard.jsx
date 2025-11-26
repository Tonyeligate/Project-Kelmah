/**
 * User Performance Dashboard Component
 * Displays user performance metrics and tier information
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  Gavel as GavelIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
// TODO: Integrate user performance functionality into worker service

const UserPerformanceDashboard = ({ userId, onRefresh }) => {
  const theme = useTheme();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPerformanceData();
  }, [userId]);

  const loadPerformanceData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // TODO: Integrate into worker service
      // const response = await userPerformanceApi.getUserPerformance(userId);
      // Mock response for now to fix build error
      const response = { data: {} };
      setPerformance(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load performance data:', err);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'tier1':
        return theme.palette.success.main;
      case 'tier2':
        return theme.palette.warning.main;
      case 'tier3':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getTierLabel = (tier) => {
    switch (tier) {
      case 'tier1':
        return 'Premium Access';
      case 'tier2':
        return 'Verified Access';
      case 'tier3':
        return 'Standard Access';
      default:
        return 'Standard';
    }
  };

  const getTierBenefits = (tier) => {
    switch (tier) {
      case 'tier1':
        return [
          'Immediate job access',
          'Exclusive opportunities',
          'Priority bidding',
          '8 bids/month',
        ];
      case 'tier2':
        return [
          'Early job access (2hr delay)',
          'Verified jobs',
          '6 bids/month',
        ];
      case 'tier3':
        return ['Standard job access (24hr delay)', '5 bids/month'];
      default:
        return ['Standard access'];
    }
  };

  if (loading) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography>Loading performance data...</Typography>
      </Card>
    );
  }

  if (error || !performance) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography color="error">
          {error || 'No performance data available'}
        </Typography>
      </Card>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Performance Tier Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(getTierColor(performance.performanceTier), 0.1)}, ${alpha(getTierColor(performance.performanceTier), 0.05)})`,
            border: `2px solid ${alpha(getTierColor(performance.performanceTier), 0.3)}`,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: getTierColor(performance.performanceTier),
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <EmojiEventsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {getTierLabel(performance.performanceTier)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Score: {performance.overallScore}/100
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Tier Benefits:
                </Typography>
                <Stack spacing={1}>
                  {getTierBenefits(performance.performanceTier).map(
                    (benefit, index) => (
                      <Box
                        key={index}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <CheckCircleIcon
                          sx={{
                            fontSize: 16,
                            mr: 1,
                            color: theme.palette.success.main,
                          }}
                        />
                        <Typography variant="body2">{benefit}</Typography>
                      </Box>
                    ),
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Monthly Bid Quota:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GavelIcon sx={{ fontSize: 16, mr: 1 }} />
                  <Typography variant="body2">
                    {performance.monthlyBidQuota} bids per month
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getTierColor(performance.performanceTier),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Job Completion Rate
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {performance.metrics.jobCompletionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={performance.metrics.jobCompletionRate}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Client Satisfaction
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {performance.metrics.clientSatisfaction}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={performance.metrics.clientSatisfaction}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Profile Completeness
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {performance.metrics.profileCompleteness}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={performance.metrics.profileCompleteness}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">On-Time Delivery</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {performance.metrics.onTimeDeliveryRate}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={performance.metrics.onTimeDeliveryRate}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Skill Verification
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Primary Skills:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {performance.skillVerification.primarySkills.map(
                        (skill, index) => (
                          <Chip
                            key={index}
                            label={skill.skill}
                            size="small"
                            color={skill.verified ? 'success' : 'default'}
                            icon={
                              skill.verified ? <CheckCircleIcon /> : undefined
                            }
                            variant={skill.verified ? 'filled' : 'outlined'}
                          />
                        ),
                      )}
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Secondary Skills:
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {performance.skillVerification.secondarySkills.map(
                        (skill, index) => (
                          <Chip
                            key={index}
                            label={skill.skill}
                            size="small"
                            color={skill.verified ? 'success' : 'default'}
                            icon={
                              skill.verified ? <CheckCircleIcon /> : undefined
                            }
                            variant={skill.verified ? 'filled' : 'outlined'}
                          />
                        ),
                      )}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Verified Skills: {performance.metrics.verifiedSkillsCount}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Location Preferences */}
      {performance.locationPreferences && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location Preferences
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="body2">
                      Primary Region:{' '}
                      {performance.locationPreferences.primaryRegion ||
                        'Not set'}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    Max Travel Distance:{' '}
                    {performance.locationPreferences.maxTravelDistance}km
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Willing to Relocate:{' '}
                    {performance.locationPreferences.willingToRelocate
                      ? 'Yes'
                      : 'No'}
                  </Typography>

                  {performance.locationPreferences.preferredCities?.length >
                    0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Preferred Cities:{' '}
                          {performance.locationPreferences.preferredCities.join(
                            ', ',
                          )}
                        </Typography>
                      </Box>
                    )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bid History Summary */}
      {performance.bidHistory && performance.bidHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bid Performance
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ fontSize: 16, mr: 1 }} />
                <Typography variant="body2">
                  Success Rate: {performance.getBidSuccessRate()}%
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Total Bids: {performance.bidHistory.length}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Box>
  );
};

export default UserPerformanceDashboard;
