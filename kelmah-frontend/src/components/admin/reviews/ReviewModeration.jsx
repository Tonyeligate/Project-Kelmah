import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Avatar,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Flag as FlagIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

// Status chip colors
const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  flagged: 'info'
};

const ReviewModeration = () => {
  // State for reviews
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // State for filters
  const [status, setStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // State for dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  
  // Auth context
  const { token } = useAuth();
  
  // Fetch reviews on component mount and when filters change
  useEffect(() => {
    fetchReviews();
  }, [status, page, limit]);
  
  // Function to fetch reviews
  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `/api/admin/reviews/moderation`,
        {
          params: {
            status,
            page,
            limit,
            search: searchQuery
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setReviews(response.data.reviews);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to fetch reviews. Please try again.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle search
  const handleSearch = () => {
    setPage(1); // Reset page when searching
    fetchReviews();
  };
  
  // Function to reset search
  const handleResetSearch = () => {
    setSearchQuery('');
    setPage(1);
    fetchReviews();
  };
  
  // Function to handle status change
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1); // Reset page when changing status
  };
  
  // Function to handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Function to approve a review
  const handleApproveReview = async () => {
    try {
      await axios.post(
        `/api/admin/reviews/approve`,
        { reviewId: selectedReview.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setApproveDialogOpen(false);
      setSuccess('Review approved successfully.');
      fetchReviews();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error approving review:', err);
      setError('Failed to approve review. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Function to reject a review
  const handleRejectReview = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    
    try {
      await axios.post(
        `/api/admin/reviews/reject`,
        {
          reviewId: selectedReview.id,
          reason: rejectReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRejectDialogOpen(false);
      setRejectReason('');
      setSuccess('Review rejected successfully.');
      fetchReviews();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error rejecting review:', err);
      setError('Failed to reject review. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Function to flag a review
  const handleFlagReview = async () => {
    if (!flagReason.trim()) {
      setError('Please provide a reason for flagging.');
      return;
    }
    
    try {
      await axios.post(
        `/api/admin/reviews/flag`,
        {
          reviewId: selectedReview.id,
          reason: flagReason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFlagDialogOpen(false);
      setFlagReason('');
      setSuccess('Review flagged for further investigation.');
      fetchReviews();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error flagging review:', err);
      setError('Failed to flag review. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Review Moderation
      </Typography>
      
      <Typography variant="body1" paragraph>
        Review and moderate user-submitted reviews to ensure they meet community guidelines.
      </Typography>
      
      {/* Filters and search */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={handleStatusChange}
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="flagged">Flagged</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Search Reviews"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
                {searchQuery && (
                  <IconButton onClick={handleResetSearch}>
                    <RefreshIcon />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        
        <Button
          variant="contained"
          color="primary"
          onClick={fetchReviews}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Success and error messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Reviews table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reviewer</TableCell>
              <TableCell>Worker</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">
                    No reviews found matching the criteria
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={review.reviewerAvatar} 
                        sx={{ mr: 1, width: 30, height: 30 }}
                      />
                      <Typography variant="body2">
                        {review.reviewerName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={review.recipientAvatar} 
                        sx={{ mr: 1, width: 30, height: 30 }}
                      />
                      <Typography variant="body2">
                        {review.recipientName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Rating 
                      value={review.rating} 
                      readOnly 
                      size="small" 
                      precision={0.5}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 250,
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {review.comment}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={review.status}
                      color={statusColors[review.status]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={new Date(review.createdAt).toLocaleString()}>
                      <Typography variant="body2">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedReview(review);
                            setViewDialogOpen(true);
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {review.status === 'pending' && (
                        <>
                          <Tooltip title="Approve review">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setSelectedReview(review);
                                setApproveDialogOpen(true);
                              }}
                            >
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Reject review">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedReview(review);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Flag for investigation">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => {
                                setSelectedReview(review);
                                setFlagDialogOpen(true);
                              }}
                            >
                              <FlagIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>
      
      {/* Approve Review Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Review</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this review? This will make it visible to all users.
          </Typography>
          
          {selectedReview && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                Rating: <Rating value={selectedReview.rating} readOnly size="small" />
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Comment:
              </Typography>
              <Typography variant="body2">
                {selectedReview.comment}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleApproveReview} 
            variant="contained" 
            color="success"
            startIcon={<ApproveIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Review Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Review</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please provide a reason for rejecting this review.
          </Typography>
          
          <TextField
            label="Rejection Reason"
            fullWidth
            required
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {selectedReview && (
            <Box>
              <Typography variant="subtitle2">
                Rating: <Rating value={selectedReview.rating} readOnly size="small" />
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Comment:
              </Typography>
              <Typography variant="body2">
                {selectedReview.comment}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectReview} 
            variant="contained" 
            color="error"
            startIcon={<RejectIcon />}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Flag Review Dialog */}
      <Dialog open={flagDialogOpen} onClose={() => setFlagDialogOpen(false)}>
        <DialogTitle>Flag Review for Investigation</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please provide a reason for flagging this review for further investigation.
          </Typography>
          
          <TextField
            label="Flag Reason"
            fullWidth
            required
            multiline
            rows={3}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {selectedReview && (
            <Box>
              <Typography variant="subtitle2">
                Rating: <Rating value={selectedReview.rating} readOnly size="small" />
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Comment:
              </Typography>
              <Typography variant="body2">
                {selectedReview.comment}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleFlagReview} 
            variant="contained" 
            color="info"
            startIcon={<FlagIcon />}
          >
            Flag
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Review Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Details</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box>
              {/* Review header */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  src={selectedReview.reviewerAvatar} 
                  sx={{ mr: 2, width: 40, height: 40 }}
                />
                <Box>
                  <Typography variant="subtitle1">
                    {selectedReview.reviewerName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Reviewing: {selectedReview.recipientName}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={selectedReview.status}
                    color={statusColors[selectedReview.status]}
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {/* Rating and date */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={selectedReview.rating} readOnly precision={0.5} />
                <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                  {new Date(selectedReview.createdAt).toLocaleString()}
                </Typography>
              </Box>
              
              {/* Comment */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="body1">
                  {selectedReview.comment}
                </Typography>
              </Paper>
              
              {/* Category ratings */}
              <Typography variant="subtitle2" gutterBottom>
                Category Ratings
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {Object.entries(selectedReview.categories).map(([category, rating]) => (
                  <Box key={category} sx={{ minWidth: 120 }}>
                    <Typography variant="body2" color="textSecondary">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Typography>
                    <Rating value={rating} readOnly size="small" precision={0.5} />
                  </Box>
                ))}
              </Box>
              
              {/* Status info */}
              {selectedReview.status === 'rejected' && selectedReview.flagReason && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Rejection Reason:
                  </Typography>
                  <Typography variant="body2">
                    {selectedReview.flagReason}
                  </Typography>
                </Alert>
              )}
              
              {selectedReview.status === 'flagged' && selectedReview.flagReason && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Flag Reason:
                  </Typography>
                  <Typography variant="body2">
                    {selectedReview.flagReason}
                  </Typography>
                </Alert>
              )}
              
              {/* Admin info */}
              {selectedReview.adminReviewedBy && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Reviewed by admin on {new Date(selectedReview.adminReviewedAt).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          
          {selectedReview && selectedReview.status === 'pending' && (
            <>
              <Button 
                color="success" 
                variant="contained" 
                startIcon={<ApproveIcon />}
                onClick={() => {
                  setViewDialogOpen(false);
                  setApproveDialogOpen(true);
                }}
              >
                Approve
              </Button>
              
              <Button 
                color="error" 
                variant="contained" 
                startIcon={<RejectIcon />}
                onClick={() => {
                  setViewDialogOpen(false);
                  setRejectDialogOpen(true);
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