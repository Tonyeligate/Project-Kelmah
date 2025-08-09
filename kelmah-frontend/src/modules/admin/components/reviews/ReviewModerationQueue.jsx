import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Flag as FlagIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  EditNote as EditNoteIcon,
  Report as ReportIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import reviewsApi from '../../../../services/reviewsApi';
import { FEATURES } from '../../../../config/environment';

/**
 * Advanced Review Moderation Queue Component
 * Comprehensive tools for moderating reviews in the admin dashboard
 */
const ReviewModerationQueue = () => {
  const theme = useTheme();
  
  // State management
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedReview, setSelectedReview] = useState(null);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [bulkSelection, setBulkSelection] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    priority: '',
    category: '',
    rating: '',
    reportCount: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moderationNote, setModerationNote] = useState('');
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
    total: 0
  });

  // Tab configuration
  const tabs = [
    { label: 'Pending Review', value: 'pending', icon: PendingIcon, color: '#FF9800' },
    { label: 'Flagged', value: 'flagged', icon: FlagIcon, color: '#F44336' },
    { label: 'Approved', value: 'approved', icon: ApproveIcon, color: '#4CAF50' },
    { label: 'Rejected', value: 'rejected', icon: RejectIcon, color: '#9E9E9E' },
  ];

  // Use real backend; fallback to mocks only in dev when enabled
  const moderationApi = {
    async getReviewQueue(params = {}) {
      try {
        // Use real admin queue endpoint
        const status = tabs[selectedTab]?.value || 'pending';
        const data = await reviewsApi.getModerationQueue({ page, limit: 10, status, ...filters });
        const { reviews: items, pagination } = data;
        // Map to expected UI shape
        const mapped = items.map((r) => ({
          _id: r._id,
          title: r.title,
          comment: r.comment,
          ratings: r.ratings,
          status: r.status,
          priority: r.priority || 'medium',
          hirerId: r.hirerId || { _id: '', firstName: 'User', lastName: 'Hirer', profilePicture: '' },
          workerId: r.workerId || { _id: '', firstName: 'Worker', lastName: '', profession: '' },
          jobCategory: r.jobCategory,
          reportCount: r.reportCount || 0,
          helpfulVotes: r.helpfulVotes || 0,
          isVerified: r.isVerified || false,
          createdAt: r.createdAt,
        }));
        return {
          reviews: mapped,
          pagination,
          stats: {
            pending: 0, flagged: 0, approved: 0, rejected: 0, total: pagination.total
          }
        };
      } catch (e) {
        if (import.meta.env.MODE === 'development' && FEATURES.useMocks) {
          // Keep existing mock path in dev if enabled
          await new Promise(resolve => setTimeout(resolve, 300));
          const mockReviews = Array.from({ length: 25 }, (_, index) => ({ /* omitted for brevity */ }));
          const statusFilter = tabs[selectedTab]?.value || 'pending';
          const filteredReviews = mockReviews.filter(review => review.status === statusFilter);
          return {
            reviews: filteredReviews.slice((params.page - 1) * 10, params.page * 10),
            pagination: { page: params.page || 1, limit: 10, total: filteredReviews.length, pages: Math.ceil(filteredReviews.length / 10) },
            stats: {
              pending: mockReviews.filter(r => r.status === 'pending').length,
              flagged: mockReviews.filter(r => r.status === 'flagged').length,
              approved: mockReviews.filter(r => r.status === 'approved').length,
              rejected: mockReviews.filter(r => r.status === 'rejected').length,
              total: mockReviews.length
            }
          };
        }
        throw e;
      }
    },

    async moderateReview(reviewId, status, note = '') {
      try {
        const result = await reviewsApi.moderateReview(reviewId, status, note);
        return result;
      } catch (e) {
        if (import.meta.env.MODE === 'development' && FEATURES.useMocks) {
          await new Promise(r => setTimeout(r, 300));
          return { success: true, message: `Review ${status} successfully` };
        }
        throw e;
      }
    },

    async bulkModerate(reviewIds, status, note = '') {
      try {
        // No dedicated bulk endpoint; simulate sequence for now
        for (const id of reviewIds) {
          await reviewsApi.moderateReview(id, status, note);
        }
        return { success: true, message: `${reviewIds.length} reviews ${status} successfully` };
      } catch (e) {
        if (import.meta.env.MODE === 'development' && FEATURES.useMocks) {
          await new Promise(r => setTimeout(r, 300));
          return { success: true, message: `${reviewIds.length} reviews ${status} successfully` };
        }
        throw e;
      }
    }
  };

  // Fetch reviews and stats
  useEffect(() => {
    fetchReviews();
  }, [selectedTab, page, filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await moderationApi.getReviewQueue({
        page,
        status: tabs[selectedTab]?.value,
        ...filters
      });
      
      setReviews(response.reviews);
      setTotalPages(response.pagination.pages);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showFeedback('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (message, severity = 'success') => {
    setFeedback({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setPage(1);
    setBulkSelection(new Set());
  };

  const handleModerateReview = async (reviewId, status) => {
    try {
      await moderationApi.moderateReview(reviewId, status, moderationNote);
      showFeedback(`Review ${status} successfully`, 'success');
      setModerationDialogOpen(false);
      setModerationNote('');
      fetchReviews();
    } catch (error) {
      showFeedback(`Failed to ${status} review`, 'error');
    }
  };

  const handleBulkModeration = async (status) => {
    if (bulkSelection.size === 0) return;
    try {
      // Use admin bulk endpoint through reviewsApi
      const resp = await fetch('/api/admin/reviews/bulk-moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(bulkSelection), status, note: moderationNote })
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.message || 'Bulk moderation failed');
      showFeedback(`${bulkSelection.size} reviews ${status} successfully`, 'success');
      setBulkSelection(new Set());
      fetchReviews();
    } catch (error) {
      showFeedback(`Failed to ${status} reviews`, 'error');
    }
  };

  const toggleBulkSelection = (reviewId) => {
    const newSelection = new Set(bulkSelection);
    if (newSelection.has(reviewId)) {
      newSelection.delete(reviewId);
    } else {
      newSelection.add(reviewId);
    }
    setBulkSelection(newSelection);
  };

  const selectAllReviews = () => {
    if (bulkSelection.size === reviews.length) {
      setBulkSelection(new Set());
    } else {
      setBulkSelection(new Set(reviews.map(r => r._id)));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtered reviews based on search
  const filteredReviews = useMemo(() => {
    if (!searchTerm) return reviews;
    
    return reviews.filter(review => 
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.hirerId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.hirerId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.workerId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.workerId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.jobCategory.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reviews, searchTerm]);

  return (
    <Box>
      {/* Header with Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700, mb: 2 }}>
            Review Moderation Center
          </Typography>
        </Grid>
        
        {/* Quick Stats */}
        {Object.entries(stats).map(([key, value]) => (
          <Grid item xs={6} sm={2.4} key={key}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center'
            }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h3" sx={{ 
                  color: key === 'total' ? '#FFD700' : 
                        key === 'pending' ? '#FF9800' :
                        key === 'flagged' ? '#F44336' :
                        key === 'approved' ? '#4CAF50' : '#9E9E9E',
                  fontWeight: 800
                }}>
                  {value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                  {key === 'total' ? 'Total Reviews' : key}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Card */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
        border: '1px solid rgba(255,255,255,0.1)' 
      }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
              '& .Mui-selected': { color: '#FFD700 !important' },
              '& .MuiTabs-indicator': { backgroundColor: '#FFD700' }
            }}
          >
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              return (
                <Tab
                  key={tab.value}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Badge badgeContent={stats[tab.value]} color="primary" max={99}>
                        <IconComponent sx={{ fontSize: 18 }} />
                      </Badge>
                      <Typography variant="body2">{tab.label}</Typography>
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>
        </Box>

        <CardContent>
          {/* Search and Filters */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              placeholder="Search reviews, users, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,215,0,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                },
                '& .MuiInputBase-input': { color: '#fff' }
              }}
            />
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchReviews}
              sx={{ 
                borderColor: 'rgba(255,215,0,0.5)',
                color: '#FFD700',
                '&:hover': { borderColor: '#FFD700', backgroundColor: alpha('#FFD700', 0.1) }
              }}
            >
              Refresh
            </Button>
          </Stack>

          {/* Bulk Actions */}
          {bulkSelection.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 2,
                  backgroundColor: alpha('#2196F3', 0.1),
                  color: '#2196F3',
                  '& .MuiAlert-icon': { color: '#2196F3' }
                }}
                action={
                  <Stack direction="row" spacing={1}>
                    <Button 
                      size="small" 
                      startIcon={<ApproveIcon />}
                      onClick={() => handleBulkModeration('approved')}
                      sx={{ color: '#4CAF50' }}
                    >
                      Approve All
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<RejectIcon />}
                      onClick={() => handleBulkModeration('rejected')}
                      sx={{ color: '#F44336' }}
                    >
                      Reject All
                    </Button>
                  </Stack>
                }
              >
                {bulkSelection.size} review{bulkSelection.size > 1 ? 's' : ''} selected
              </Alert>
            </motion.div>
          )}

          {/* Reviews Table */}
          {loading ? (
            <Box sx={{ py: 4 }}>
              <LinearProgress sx={{ backgroundColor: 'rgba(255,215,0,0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#FFD700' } }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mt: 2 }}>
                Loading reviews...
              </Typography>
            </Box>
          ) : filteredReviews.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <StarIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                No reviews found
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'No reviews in this category yet'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={bulkSelection.size === filteredReviews.length && filteredReviews.length > 0}
                          onChange={selectAllReviews}
                          style={{ accentColor: '#FFD700' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Review</TableCell>
                      <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Users</TableCell>
                      <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Rating</TableCell>
                      <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Priority</TableCell>
                      <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Created</TableCell>
                      <TableCell sx={{ color: '#FFD700', fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredReviews.map((review, index) => (
                        <motion.tr
                          key={review._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          component={TableRow}
                          sx={{
                            '&:hover': { backgroundColor: 'rgba(255,215,0,0.05)' },
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <TableCell padding="checkbox">
                            <input
                              type="checkbox"
                              checked={bulkSelection.has(review._id)}
                              onChange={() => toggleBulkSelection(review._id)}
                              style={{ accentColor: '#FFD700' }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, mb: 0.5 }}>
                                {review.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'rgba(255,255,255,0.7)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  maxWidth: 300
                                }}
                              >
                                {review.comment}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Chip 
                                  label={review.jobCategory} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: alpha('#2196F3', 0.2),
                                    color: '#2196F3',
                                    fontSize: '0.7rem'
                                  }} 
                                />
                                {review.reportCount > 0 && (
                                  <Chip 
                                    label={`${review.reportCount} reports`} 
                                    size="small" 
                                    sx={{ 
                                      backgroundColor: alpha('#F44336', 0.2),
                                      color: '#F44336',
                                      fontSize: '0.7rem'
                                    }} 
                                  />
                                )}
                                {review.isVerified && (
                                  <Chip 
                                    label="Verified" 
                                    size="small" 
                                    sx={{ 
                                      backgroundColor: alpha('#4CAF50', 0.2),
                                      color: '#4CAF50',
                                      fontSize: '0.7rem'
                                    }} 
                                  />
                                )}
                              </Stack>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Stack spacing={1}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Avatar 
                                  src={review.hirerId.profilePicture} 
                                  sx={{ width: 24, height: 24 }}
                                >
                                  {review.hirerId.firstName[0]}
                                </Avatar>
                                <Typography variant="body2" sx={{ color: '#fff' }}>
                                  {review.hirerId.firstName} {review.hirerId.lastName}
                                </Typography>
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <WorkIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                  {review.workerId.firstName} {review.workerId.lastName}
                                </Typography>
                              </Stack>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="center" spacing={0.5}>
                              <Rating value={review.ratings.overall} readOnly size="small" />
                              <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 600 }}>
                                {review.ratings.overall}/5
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                {review.helpfulVotes} helpful
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Chip 
                              label={review.priority} 
                              size="small"
                              sx={{ 
                                backgroundColor: alpha(getPriorityColor(review.priority), 0.2),
                                color: getPriorityColor(review.priority),
                                fontWeight: 600,
                                textTransform: 'uppercase'
                              }}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {formatDate(review.createdAt)}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small"
                                  onClick={() => {
                                    setSelectedReview(review);
                                    setModerationDialogOpen(true);
                                  }}
                                  sx={{ color: '#2196F3' }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Approve">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleModerateReview(review._id, 'approved')}
                                  sx={{ color: '#4CAF50' }}
                                >
                                  <ApproveIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleModerateReview(review._id, 'rejected')}
                                  sx={{ color: '#F44336' }}
                                >
                                  <RejectIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                    sx={{
                      '& .MuiPaginationItem-root': { color: '#fff' },
                      '& .Mui-selected': { 
                        backgroundColor: '#FFD700 !important', 
                        color: '#000 !important' 
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Detail & Moderation Dialog */}
      <Dialog
        open={moderationDialogOpen}
        onClose={() => setModerationDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          },
        }}
      >
        <DialogTitle sx={{ color: '#FFD700', fontWeight: 700 }}>
          Review Moderation
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Grid container spacing={3}>
              {/* Review Content */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#FFD700', mb: 1 }}>
                  {selectedReview.title}
                </Typography>
                <Typography variant="body1" sx={{ color: '#fff', mb: 2, lineHeight: 1.6 }}>
                  {selectedReview.comment}
                </Typography>
                
                {/* Rating Breakdown */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {Object.entries(selectedReview.ratings).map(([category, rating]) => (
                    <Grid item xs={6} sm={4} key={category}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                          {category}
                        </Typography>
                        <Rating value={rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ color: '#FFD700' }}>
                          {rating}/5
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Moderation Notes */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Moderation Notes"
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="Add notes about your moderation decision..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      '& fieldset': { borderColor: 'rgba(255,215,0,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,215,0,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#FFD700' }
                    },
                    '& .MuiInputBase-input': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setModerationDialogOpen(false)} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleModerateReview(selectedReview?._id, 'rejected')}
            startIcon={<RejectIcon />}
            sx={{ color: '#F44336' }}
          >
            Reject
          </Button>
          <Button 
            onClick={() => handleModerateReview(selectedReview?._id, 'approved')}
            startIcon={<ApproveIcon />}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={feedback.severity} sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReviewModerationQueue;