import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  Checkbox,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Rating,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../auth/contexts/AuthContext';

const ReviewModeration = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Analytics data
  const [analytics, setAnalytics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
    averageRating: 0,
    totalReviews: 0
  });

  useEffect(() => {
    fetchReviews();
  }, [searchTerm, activeTab]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for demonstration
      const mockReviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Excellent work! Very professional and delivered on time.',
          reviewerName: 'John Doe',
          workerName: 'Alice Johnson',
          jobTitle: 'Website Development',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          rating: 1,
          comment: 'Terrible experience. Work was incomplete.',
          reviewerName: 'Jane Smith',
          workerName: 'Bob Wilson',
          jobTitle: 'Graphic Design',
          status: 'flagged',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          flaggedReason: 'Potentially fake review',
        },
        {
          id: '3',
          rating: 4,
          comment: 'Good quality work with minor revisions needed.',
          reviewerName: 'Mike Davis',
          workerName: 'Carol Brown',
          jobTitle: 'Content Writing',
          status: 'approved',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ];

      // Filter based on active tab
      let filteredReviews = mockReviews;
      if (activeTab === 0) {
        filteredReviews = mockReviews.filter(r => r.status === 'pending');
      } else if (activeTab === 1) {
        filteredReviews = mockReviews.filter(r => r.status === 'flagged');
      }

      if (searchTerm) {
        filteredReviews = filteredReviews.filter(
          review => 
            review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.workerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setReviews(filteredReviews);

      // Set analytics
      setAnalytics({
        pending: mockReviews.filter(r => r.status === 'pending').length,
        approved: mockReviews.filter(r => r.status === 'approved').length,
        rejected: mockReviews.filter(r => r.status === 'rejected').length,
        flagged: mockReviews.filter(r => r.status === 'flagged').length,
        averageRating: mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length,
        totalReviews: mockReviews.length
      });

    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'approved' } : review
      ));
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to approve review');
    }
  };

  const handleRejectReview = async (reviewId) => {
    try {
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: 'rejected' } : review
      ));
      setAnchorEl(null);
    } catch (err) {
      setError('Failed to reject review');
    }
  };

  const handleViewReview = (review) => {
    setCurrentReview(review);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) return;
    
    try {
      switch (action) {
        case 'approve':
          setReviews(prev => prev.map(review => 
            selectedReviews.includes(review.id) ? { ...review, status: 'approved' } : review
          ));
          break;
        case 'reject':
          setReviews(prev => prev.map(review => 
            selectedReviews.includes(review.id) ? { ...review, status: 'rejected' } : review
          ));
          break;
      }
      setSelectedReviews([]);
    } catch (err) {
      setError('Failed to perform bulk action');
    }
  };

  const handleSelectReview = (reviewId) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(review => review.id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'flagged': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Review Moderation
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Pending
              </Typography>
              <Typography variant="h4" color="info.main">
                {analytics.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Approved
              </Typography>
              <Typography variant="h4" color="success.main">
                {analytics.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Rejected
              </Typography>
              <Typography variant="h4" color="error.main">
                {analytics.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Flagged
              </Typography>
              <Typography variant="h4" color="warning.main">
                {analytics.flagged}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom variant="overline">
                Avg Rating
              </Typography>
              <Typography variant="h4">
                {analytics.averageRating.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={
              <Badge badgeContent={analytics.pending} color="info">
                Pending Reviews
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={analytics.flagged} color="warning">
                Flagged Reviews  
              </Badge>
            }
          />
          <Tab label="All Reviews" />
        </Tabs>
      </Paper>

      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedReviews.length > 0 && (
                  <>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={() => handleBulkAction('approve')}
                    >
                      Approve ({selectedReviews.length})
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleBulkAction('reject')}
                    >
                      Reject ({selectedReviews.length})
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Reviews ({reviews.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedReviews.length > 0 && selectedReviews.length < reviews.length}
                        checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Review</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Reviewer</TableCell>
                    <TableCell>Worker</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => handleSelectReview(review.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" noWrap>
                            {review.comment}
                          </Typography>
                          {review.flaggedReason && (
                            <Chip 
                              label={review.flaggedReason} 
                              color="warning" 
                              size="small" 
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating value={review.rating} size="small" readOnly />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({review.rating})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                            {review.reviewerName[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {review.reviewerName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'success.main' }}>
                            {review.workerName[0]}
                          </Avatar>
                          <Typography variant="body2">
                            {review.workerName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(review.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={review.status} 
                          color={getStatusColor(review.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedRowId(review.id);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {reviews.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No reviews found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItemComponent onClick={() => {
          const review = reviews.find(r => r.id === selectedRowId);
          handleViewReview(review);
        }}>
          <ListItemIcon><ViewIcon /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleApproveReview(selectedRowId)}>
          <ListItemIcon><ApproveIcon color="success" /></ListItemIcon>
          <ListItemText>Approve Review</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleRejectReview(selectedRowId)}>
          <ListItemIcon><RejectIcon color="error" /></ListItemIcon>
          <ListItemText>Reject Review</ListItemText>
        </MenuItemComponent>
        <Divider />
        <MenuItemComponent sx={{ color: 'warning.main' }}>
          <ListItemIcon><FlagIcon color="warning" /></ListItemIcon>
          <ListItemText>Flag Review</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* Review Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Details</DialogTitle>
        <DialogContent>
          {currentReview && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={currentReview.rating} size="large" readOnly />
                  <Typography variant="h6" sx={{ ml: 2 }}>
                    {currentReview.rating}/5 Stars
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Review Comment:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  {currentReview.comment}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Reviewer:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>{currentReview.reviewerName[0]}</Avatar>
                  <Typography>{currentReview.reviewerName}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Worker:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>{currentReview.workerName[0]}</Avatar>
                  <Typography>{currentReview.workerName}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Job:
                </Typography>
                <Typography>{currentReview.jobTitle}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Status:
                </Typography>
                <Chip 
                  label={currentReview.status} 
                  color={getStatusColor(currentReview.status)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Date:
                </Typography>
                <Typography>{formatDate(currentReview.createdAt)}</Typography>
              </Grid>
              {currentReview.flaggedReason && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Flagged Reason:
                  </Typography>
                  <Alert severity="warning">
                    {currentReview.flaggedReason}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Close
          </Button>
          {currentReview && currentReview.status === 'pending' && (
            <>
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  handleApproveReview(currentReview.id);
                  setOpenDialog(false);
                }}
              >
                Approve
              </Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => {
                  handleRejectReview(currentReview.id);
                  setOpenDialog(false);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewModeration;