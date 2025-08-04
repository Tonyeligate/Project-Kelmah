import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Rating,
  Avatar,
  Box,
  Stack,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  Reply as ReplyIcon,
  Report as ReportIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../modules/auth/contexts/AuthContext';

/**
 * Individual Review Card Component
 * Displays a single review with all interactions
 */
const ReviewCard = ({ 
  review, 
  index = 0,
  compact = false,
  showWorkerResponse = true,
  showActions = true,
  onVoteHelpful,
  onReport,
  onRespond,
  workerId = null
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  const formatDate = (date) => {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    
    return reviewDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleVoteHelpful = () => {
    if (onVoteHelpful) {
      onVoteHelpful(review._id);
    }
    setMenuAnchor(null);
  };

  const handleReport = () => {
    if (onReport) {
      onReport(review._id, 'inappropriate');
    }
    setMenuAnchor(null);
  };

  const handleResponse = async () => {
    if (!responseText.trim()) return;
    
    try {
      setResponding(true);
      if (onRespond) {
        await onRespond(review._id, responseText.trim());
      }
      setResponseText('');
      setResponseDialogOpen(false);
    } catch (error) {
      console.error('Error adding response:', error);
    } finally {
      setResponding(false);
    }
  };

  const canRespond = user?.role === 'worker' && 
                    user?.id === workerId && 
                    !review.response && 
                    showWorkerResponse;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card 
          sx={{ 
            mb: compact ? 1 : 2, 
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)', 
            border: '1px solid rgba(255,255,255,0.1)',
            '&:hover': {
              border: '1px solid rgba(255,215,0,0.3)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          <CardContent sx={{ p: compact ? 2 : 3 }}>
            {/* Review Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2}>
                <Avatar 
                  src={review.hirerId?.profilePicture}
                  sx={{ width: compact ? 40 : 48, height: compact ? 40 : 48 }}
                >
                  {review.hirerId?.firstName?.[0] || 'H'}
                </Avatar>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography 
                      variant={compact ? "body1" : "subtitle1"} 
                      sx={{ color: '#fff', fontWeight: 600 }}
                    >
                      {review.hirerId?.firstName || 'Anonymous'} {review.hirerId?.lastName || 'User'}
                    </Typography>
                    {review.isVerified && (
                      <VerifiedIcon sx={{ color: '#2196F3', fontSize: compact ? 14 : 16 }} />
                    )}
                  </Stack>
                  <Typography 
                    variant="body2" 
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {formatDate(review.createdAt)} • {review.jobCategory}
                  </Typography>
                  <Rating 
                    value={review.ratings?.overall || 0} 
                    readOnly 
                    size={compact ? "small" : "small"} 
                    sx={{ mt: 0.5 }} 
                  />
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip 
                  label={review.wouldRecommend ? 'Recommends' : 'Neutral'} 
                  size="small"
                  sx={{ 
                    backgroundColor: review.wouldRecommend 
                      ? alpha('#4CAF50', 0.2) 
                      : alpha('#FF9800', 0.2),
                    color: review.wouldRecommend ? '#4CAF50' : '#FF9800',
                    fontSize: '0.7rem'
                  }}
                />
                {showActions && (
                  <IconButton 
                    size="small" 
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                )}
              </Stack>
            </Stack>

            {/* Review Content */}
            {!compact && (
              <>
                <Typography 
                  variant="h6" 
                  sx={{ color: '#FFD700', mb: 1, fontWeight: 600, fontSize: '1.1rem' }}
                >
                  {review.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    mb: 2, 
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {review.comment}
                </Typography>

                {/* Pros and Cons - Only show if they exist */}
                {(review.pros?.length > 0 || review.cons?.length > 0) && (
                  <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                    {review.pros?.length > 0 && (
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ color: '#4CAF50', fontWeight: 600, display: 'block', mb: 0.5 }}
                        >
                          PROS
                        </Typography>
                        {review.pros.slice(0, 2).map((pro, i) => (
                          <Typography 
                            key={i} 
                            variant="body2" 
                            sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}
                          >
                            • {pro}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {review.cons?.length > 0 && (
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ color: '#FF9800', fontWeight: 600, display: 'block', mb: 0.5 }}
                        >
                          IMPROVEMENT AREAS
                        </Typography>
                        {review.cons.slice(0, 2).map((con, i) => (
                          <Typography 
                            key={i} 
                            variant="body2" 
                            sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}
                          >
                            • {con}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Stack>
                )}
              </>
            )}

            {compact && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {review.comment}
              </Typography>
            )}

            {/* Worker Response */}
            {showWorkerResponse && review.response && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                backgroundColor: 'rgba(255,215,0,0.05)', 
                border: '1px solid rgba(255,215,0,0.2)', 
                borderRadius: 2 
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <ReplyIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                  <Typography variant="subtitle2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                    Worker Response
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {formatDate(review.response.timestamp)}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {review.response.comment}
                </Typography>
              </Box>
            )}

            {/* Review Actions */}
            {showActions && (
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<ThumbUpIcon />}
                    onClick={handleVoteHelpful}
                    sx={{ 
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.8rem',
                      '&:hover': { color: '#FFD700' }
                    }}
                  >
                    Helpful ({review.helpfulVotes || 0})
                  </Button>
                  {canRespond && (
                    <Button
                      size="small"
                      startIcon={<ReplyIcon />}
                      onClick={() => setResponseDialogOpen(true)}
                      sx={{ 
                        color: '#FFD700',
                        fontSize: '0.8rem',
                        '&:hover': { backgroundColor: alpha('#FFD700', 0.1) }
                      }}
                    >
                      Respond
                    </Button>
                  )}
                </Stack>

                {/* Rating Display */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StarIcon sx={{ color: '#FFD700', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                    {review.ratings?.overall || 0}/5
                  </Typography>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(40,40,40,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <MenuItem onClick={handleVoteHelpful}>
          <ThumbUpIcon sx={{ mr: 1, color: '#4CAF50' }} /> 
          <Typography sx={{ color: '#fff' }}>Mark Helpful</Typography>
        </MenuItem>
        <MenuItem onClick={handleReport}>
          <ReportIcon sx={{ mr: 1, color: '#F44336' }} /> 
          <Typography sx={{ color: '#fff' }}>Report Review</Typography>
        </MenuItem>
      </Menu>

      {/* Response Dialog */}
      <Dialog 
        open={responseDialogOpen} 
        onClose={() => setResponseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFD700', fontWeight: 700 }}>
          Respond to Review
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Responding to "{review.title}"
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            placeholder="Thank your client and provide any additional context..."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,215,0,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#FFD700' }
              },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setResponseDialogOpen(false)} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleResponse}
            disabled={!responseText.trim() || responding}
            startIcon={responding ? null : <SendIcon />}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255,215,0,0.3)',
                color: 'rgba(0,0,0,0.5)'
              }
            }}
          >
            {responding ? 'Posting...' : 'Post Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReviewCard;