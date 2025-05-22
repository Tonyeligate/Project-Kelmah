import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Warning,
  HourglassEmpty,
  Person,
  Language,
  MessageOutlined,
  StarRate,
  Gavel,
  Security,
  ErrorOutline,
  LocationOn,
  AccessTime,
  Receipt
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

/**
 * Component for displaying detailed verification information for a review
 */
const ReviewVerificationDetails = ({ reviewId }) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVerificationDetails();
  }, [reviewId]);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/reviews/verify/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVerification(response.data.verification);
    } catch (err) {
      console.error('Error fetching verification details:', err);
      setError(err.response?.data?.message || 'An error occurred while fetching verification details');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render a score with a colored linear progress
   */
  const renderScore = (score, label, inverse = false) => {
    let color = 'primary';
    const value = inverse ? (1 - score) * 100 : score * 100;

    if (inverse) {
      // For inverse scores (where lower is better)
      if (score < 0.3) color = 'success';
      else if (score < 0.7) color = 'warning';
      else color = 'error';
    } else {
      // For regular scores (where higher is better)
      if (score > 0.7) color = 'success';
      else if (score > 0.3) color = 'warning';
      else color = 'error';
    }

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={value} color={color} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {Math.round(value)}%
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  /**
   * Render the status chip
   */
  const renderStatusChip = (status) => {
    let color = 'default';
    let icon = <HourglassEmpty />;

    switch (status) {
      case 'verified':
        color = 'success';
        icon = <CheckCircle />;
        break;
      case 'rejected':
        color = 'error';
        icon = <Cancel />;
        break;
      case 'suspicious':
        color = 'warning';
        icon = <Warning />;
        break;
      default:
        color = 'info';
        icon = <HourglassEmpty />;
    }

    return (
      <Chip 
        icon={icon} 
        label={status.charAt(0).toUpperCase() + status.slice(1)} 
        color={color} 
        variant="outlined" 
      />
    );
  };

  /**
   * Render flag chips
   */
  const renderFlags = (flags) => {
    if (!flags || flags.length === 0) {
      return <Typography variant="body2">No flags detected</Typography>;
    }

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {flags.map((flag) => (
          <Tooltip 
            key={flag} 
            title={getFlagDescription(flag)}
            arrow
          >
            <Chip 
              label={formatFlagLabel(flag)}
              size="small"
              color="error"
              variant="outlined"
              icon={<ErrorOutline fontSize="small" />}
            />
          </Tooltip>
        ))}
      </Box>
    );
  };

  /**
   * Format flag label for display
   */
  const formatFlagLabel = (flag) => {
    return flag
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Get description for flag tooltip
   */
  const getFlagDescription = (flag) => {
    const descriptions = {
      'inappropriate_content': 'Potentially offensive or inappropriate content detected',
      'spam_detected': 'Review contains common spam or promotional patterns',
      'fake_review_suspected': 'This review shows patterns associated with fake reviews',
      'suspicious_pattern': 'Unusual review pattern for this user',
      'ip_mismatch': 'IP location doesn\'t match user\'s registered location',
      'suspicious_location': 'Review submitted from a suspicious location or through a proxy',
      'excessive_reviews': 'User has submitted many reviews in a short period',
      'extreme_rating': 'Rating significantly deviates from worker\'s average',
      'never_worked_together': 'No record of a completed contract between reviewer and worker'
    };

    return descriptions[flag] || 'Issue detected with this review';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!verification) {
    return <Alert severity="info">No verification data available for this review.</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Review Verification</Typography>
          {renderStatusChip(verification.verificationResult.status)}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Overall Trust Score
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box position="relative" display="inline-flex" mr={2}>
              <CircularProgress
                variant="determinate"
                value={verification.verificationResult.score * 100}
                color={verification.verificationResult.score > 0.7 ? 'success' : verification.verificationResult.score > 0.3 ? 'warning' : 'error'}
                size={60}
              />
              <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(verification.verificationResult.score * 100)}%`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {verification.verificationResult.autoApproved ? 
                "Automatically approved" : 
                verification.verificationResult.requiresManualReview ? 
                  "Requires manual review" : 
                  "Manually reviewed"}
            </Typography>
          </Box>
        </Box>

        {verification.verificationResult.flags && verification.verificationResult.flags.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Detected Issues
            </Typography>
            {renderFlags(verification.verificationResult.flags)}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          {/* Content Analysis */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                avatar={<MessageOutlined />}
                title="Content Analysis"
              />
              <CardContent>
                {renderScore(verification.contentAnalysis.inappropriateContentScore, "Inappropriate Content", true)}
                {renderScore(verification.contentAnalysis.spamScore, "Spam Detection", true)}
                {renderScore(verification.contentAnalysis.languageQualityScore, "Language Quality")}
                
                {verification.contentAnalysis.flaggedKeywords && verification.contentAnalysis.flaggedKeywords.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Flagged Keywords:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {verification.contentAnalysis.flaggedKeywords.map(keyword => (
                        <Chip key={keyword} label={keyword} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* User Behavior */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                avatar={<Person />}
                title="User Behavior Analysis"
              />
              <CardContent>
                {renderScore(verification.behaviorAnalysis.reviewerHistoryScore, "Reviewer Trustworthiness")}
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Receipt fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Worked Together" 
                      secondary={verification.behaviorAnalysis.hasWorkedTogether ? "Yes" : "No"}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <AccessTime fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Review Frequency" 
                      secondary={`${verification.behaviorAnalysis.reviewFrequency.toFixed(1)} reviews/month`}
                    />
                  </ListItem>
                  
                  {verification.behaviorAnalysis.isFirstReview && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorOutline fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="First Review" 
                        secondary="This is the reviewer's first review on the platform"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Rating Analysis */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                avatar={<StarRate />}
                title="Rating Analysis"
              />
              <CardContent>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <StarRate fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Rating Deviation" 
                      secondary={
                        <>
                          {verification.ratingAnalysis.ratingDeviation > 0 
                            ? `+${verification.ratingAnalysis.ratingDeviation.toFixed(1)} above average` 
                            : verification.ratingAnalysis.ratingDeviation < 0 
                              ? `${verification.ratingAnalysis.ratingDeviation.toFixed(1)} below average`
                              : "Same as average"}
                        </>
                      }
                    />
                  </ListItem>
                  
                  {verification.ratingAnalysis.ratingBias !== 'none' && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorOutline fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Rating Bias" 
                        secondary={`${verification.ratingAnalysis.ratingBias.charAt(0).toUpperCase() + verification.ratingAnalysis.ratingBias.slice(1)} bias detected`}
                      />
                    </ListItem>
                  )}
                  
                  <ListItem>
                    <ListItemIcon>
                      <Gavel fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Category Consistency" 
                      secondary={`${Math.round(verification.ratingAnalysis.categoryConsistency * 100)}%`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Location Data */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                avatar={<LocationOn />}
                title="Location Analysis"
              />
              <CardContent>
                <List dense>
                  {verification.locationData.country && (
                    <ListItem>
                      <ListItemIcon>
                        <Language fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Location" 
                        secondary={`${verification.locationData.city ? verification.locationData.city + ', ' : ''}${verification.locationData.country}`}
                      />
                    </ListItem>
                  )}
                  
                  {verification.locationData.isIpMismatch && (
                    <ListItem>
                      <ListItemIcon>
                        <ErrorOutline fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Location Mismatch" 
                        secondary="IP location doesn't match user's profile location"
                      />
                    </ListItem>
                  )}
                  
                  {verification.locationData.isSuspiciousLocation && (
                    <ListItem>
                      <ListItemIcon>
                        <Security fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Suspicious Connection" 
                        secondary="Review submitted through a proxy, VPN, or Tor"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {verification.verificationResult.verifiedBy && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {verification.verificationResult.status === 'verified' ? 'Approved' : 'Rejected'} by administrator
              {verification.verificationResult.verifiedAt && 
                ` ${formatDistanceToNow(new Date(verification.verificationResult.verifiedAt), { addSuffix: true })}`}
            </Typography>
            {verification.verificationResult.verificationNotes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Note: {verification.verificationResult.verificationNotes}
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ReviewVerificationDetails; 