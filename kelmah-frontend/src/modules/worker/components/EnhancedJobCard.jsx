/**
 * Enhanced Job Card Component
 * Displays job information with bidding system and performance tiers
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { normalizeUser } from '../../../utils/userUtils';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Stack,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Star as StarIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Verified as VerifiedIcon,
  Schedule as ScheduleIcon,
  Gavel as GavelIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
// Note: bidApi and userPerformanceApi functionality should be integrated into appropriate module services

const EnhancedJobCard = ({ 
  job, 
  onApply, 
  onSave, 
  onShare, 
  showBiddingInfo = true,
  showPerformanceTier = true 
}) => {
  const theme = useTheme();
  // FIXED: Use standardized user normalization for consistent user data access
  const { user: rawUser } = useSelector(state => state.auth);
  const user = normalizeUser(rawUser);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidData, setBidData] = useState({
    bidAmount: job?.bidding?.minBidAmount || 0,
    estimatedDuration: { value: 1, unit: 'day' },
    coverLetter: '',
    availability: {
      startDate: new Date(),
      hoursPerWeek: 40,
      flexible: false
    }
  });
  const [bidLoading, setBidLoading] = useState(false);
  const [userPerformance, setUserPerformance] = useState(null);
  const [bidStats, setBidStats] = useState(null);

  // Load user performance data
  React.useEffect(() => {
    if (user?.id) {
      // TODO: Integrate user performance and bid functionality into worker service
      // userPerformanceApi.getUserPerformance(user.id)
      //   .then(response => setUserPerformance(response.data))
      //   .catch(error => console.warn('Failed to load user performance:', error));
      
      // bidApi.getWorkerBidStats(user.id)
      //   .then(response => setBidStats(response.data))
      //   .catch(error => console.warn('Failed to load bid stats:', error));
    }
  }, [user?.id]);

  const handleBidSubmit = async () => {
    if (!user?.id) return;
    
    setBidLoading(true);
    try {
      // TODO: Integrate bid functionality into worker service
      // await bidApi.createBid({
      //   jobId: job.id,
      //   ...bidData
      // });
      
      setBidDialogOpen(false);
      // Show success message
      if (onApply) onApply(job);
    } catch (error) {
      console.error('Failed to submit bid:', error);
    } finally {
      setBidLoading(false);
    }
  };

  const getPerformanceTierColor = (tier) => {
    switch (tier) {
      case 'tier1': return theme.palette.success.main;
      case 'tier2': return theme.palette.warning.main;
      case 'tier3': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getPerformanceTierLabel = (tier) => {
    switch (tier) {
      case 'tier1': return 'Premium Access';
      case 'tier2': return 'Verified Access';
      case 'tier3': return 'Standard Access';
      default: return 'Standard';
    }
  };

  const canBid = () => {
    if (!user?.id || !bidStats) return false;
    return bidStats.remainingBids > 0 && job?.bidding?.bidStatus === 'open';
  };

  const getBidStatusColor = () => {
    if (!job?.bidding) return theme.palette.grey[500];
    
    switch (job?.bidding?.bidStatus) {
      case 'open': return theme.palette.success.main;
      case 'full': return theme.palette.warning.main;
      case 'closed': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getBidStatusText = () => {
    if (!job?.bidding) return 'No Bidding';
    
    switch (job?.bidding?.bidStatus) {
      case 'open': return `${job?.bidding?.currentBidders || 0}/${job?.bidding?.maxBidders || 0} Bidders`;
      case 'full': return 'Bidding Full';
      case 'closed': return 'Bidding Closed';
      default: return 'No Bidding';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[12],
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            },
          }}
        >
          {/* Header with Performance Tier */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              p: 2,
              position: 'relative',
            }}
          >
            {showPerformanceTier && job?.performanceTier && (
              <Chip
                icon={<EmojiEventsIcon />}
                label={getPerformanceTierLabel(job.performanceTier)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: getPerformanceTierColor(job.performanceTier),
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            )}
            
            <Typography variant="h6" fontWeight={600} sx={{ pr: 8 }}>
              {job?.title || 'Job Title'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Avatar
                src={job.company?.logo}
                sx={{ width: 24, height: 24, mr: 1 }}
              >
                {job.company?.name?.charAt(0)}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {job.company?.name}
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ flexGrow: 1, p: 2 }}>
            {/* Location and Type */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                icon={<LocationOnIcon />}
                label={job?.location || 'Location not specified'}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<WorkIcon />}
                label={job?.type || 'Type not specified'}
                size="small"
                variant="outlined"
              />
            </Stack>

            {/* Bidding Information */}
            {showBiddingInfo && job?.bidding && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GavelIcon sx={{ fontSize: 16, mr: 1, color: getBidStatusColor() }} />
                  <Typography variant="body2" fontWeight={600}>
                    Bidding: {getBidStatusText()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Min: GH₵{job.bidding.minBidAmount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Max: GH₵{job.bidding.maxBidAmount}
                  </Typography>
                </Box>
                
                <LinearProgress
                  variant="determinate"
                  value={(job.bidding.currentBidders / job.bidding.maxBidders) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getBidStatusColor(),
                    },
                  }}
                />
              </Box>
            )}

            {/* Budget */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoneyIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.success.main }} />
              <Typography variant="body2" fontWeight={600}>
                {job?.budget ? (
                  typeof job.budget === 'object' ? (
                    `GH₵${job.budget.min || 0} - ${job.budget.max || 0} ${job.budget.type || 'fixed'}`
                  ) : (
                    `GH₵${job.budget}`
                  )
                ) : (
                  'Salary not specified'
                )}
              </Typography>
            </Box>

            {/* Description */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {job?.description || 'No description available'}
            </Typography>

            {/* Skills */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Required Skills:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {job.skills?.slice(0, 3).map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  />
                ))}
                {job.skills?.length > 3 && (
                  <Chip
                    label={`+${job.skills.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 0.5 }}
                  />
                )}
              </Stack>
            </Box>

            {/* Posted Date */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ScheduleIcon sx={{ fontSize: 14, mr: 1, color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary">
                Posted {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
              </Typography>
            </Box>

            {/* Apply By */}
            {job.applyBy && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: 14, mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="caption" color="text.secondary">
                  Apply by {format(new Date(job.applyBy), 'MMM dd')}
                </Typography>
              </Box>
            )}
          </CardContent>

          <Divider />

          <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Box>
              <IconButton
                onClick={() => onSave?.(job)}
                color={job.saved ? 'primary' : 'default'}
              >
                {job.saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
              <IconButton onClick={() => onShare?.(job)}>
                <ShareIcon />
              </IconButton>
            </Box>

            <Button
              variant="contained"
              onClick={() => setBidDialogOpen(true)}
              disabled={!canBid()}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                },
              }}
            >
              {canBid() ? 'Bid Now' : 'Bidding Closed'}
            </Button>
          </CardActions>
        </Card>
      </motion.div>

      {/* Bid Dialog */}
      <Dialog
        open={bidDialogOpen}
        onClose={() => setBidDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GavelIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            Submit Bid for {job.title}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {bidStats && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You have {bidStats.remainingBids} bids remaining this month
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Bid Amount (GHS)"
            type="number"
            value={bidData.bidAmount}
            onChange={(e) => setBidData({
              ...bidData,
              bidAmount: parseFloat(e.target.value) || 0
            })}
            inputProps={{
              min: job?.bidding?.minBidAmount || 0,
              max: job?.bidding?.maxBidAmount || 10000
            }}
            helperText={`Min: GH₵${job?.bidding?.minBidAmount || 0}, Max: GH₵${job?.bidding?.maxBidAmount || 10000}`}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Duration"
              type="number"
              value={bidData.estimatedDuration.value}
              onChange={(e) => setBidData({
                ...bidData,
                estimatedDuration: {
                  ...bidData.estimatedDuration,
                  value: parseInt(e.target.value) || 1
                }
              })}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Unit</InputLabel>
              <Select
                value={bidData.estimatedDuration.unit}
                onChange={(e) => setBidData({
                  ...bidData,
                  estimatedDuration: {
                    ...bidData.estimatedDuration,
                    unit: e.target.value
                  }
                })}
              >
                <MenuItem value="hour">Hours</MenuItem>
                <MenuItem value="day">Days</MenuItem>
                <MenuItem value="week">Weeks</MenuItem>
                <MenuItem value="month">Months</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <TextField
            fullWidth
            label="Cover Letter"
            multiline
            rows={4}
            value={bidData.coverLetter}
            onChange={(e) => setBidData({
              ...bidData,
              coverLetter: e.target.value
            })}
            placeholder="Explain why you're the best fit for this job..."
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Hours per Week"
            type="number"
            value={bidData.availability.hoursPerWeek}
            onChange={(e) => setBidData({
              ...bidData,
              availability: {
                ...bidData.availability,
                hoursPerWeek: parseInt(e.target.value) || 40
              }
            })}
            inputProps={{ min: 1, max: 168 }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setBidDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBidSubmit}
            variant="contained"
            disabled={bidLoading || !bidData.bidAmount || !bidData.coverLetter}
          >
            {bidLoading ? 'Submitting...' : 'Submit Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EnhancedJobCard;
