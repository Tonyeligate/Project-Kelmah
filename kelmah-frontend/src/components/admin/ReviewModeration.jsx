import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Pagination
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Flag,
  Visibility,
  Search,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 'calc(100vh - 250px)',
  backgroundColor: '#1a1a1a',
  borderRadius: theme.spacing(1),
  '& .MuiTableCell-root': {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  let color = '#4caf50';
  let backgroundColor = 'rgba(76, 175, 80, 0.1)';
  
  if (status === 'pending') {
    color = '#ff9800';
    backgroundColor = 'rgba(255, 152, 0, 0.1)';
  } else if (status === 'rejected' || status === 'flagged') {
    color = '#f44336';
    backgroundColor = 'rgba(244, 67, 54, 0.1)';
  }
  
  return {
    color: color,
    backgroundColor: backgroundColor,
    borderColor: color,
    '& .MuiChip-label': {
      fontWeight: 'medium',
    }
  };
});

const ActionButton = styled(Button)(({ theme, color }) => ({
  textTransform: 'none',
  minWidth: 'unset',
  padding: theme.spacing(0.5, 1),
  color: color === 'approve' ? '#4caf50' : color === 'reject' ? '#f44336' : '#ff9800',
  borderColor: color === 'approve' ? 'rgba(76, 175, 80, 0.5)' : color === 'reject' ? 'rgba(244, 67, 54, 0.5)' : 'rgba(255, 152, 0, 0.5)',
  '&:hover': {
    backgroundColor: color === 'approve' ? 'rgba(76, 175, 80, 0.1)' : color === 'reject' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 152, 0, 0.1)',
    borderColor: color === 'approve' ? '#4caf50' : color === 'reject' ? '#f44336' : '#ff9800',
  }
}));

const ReviewModeration = () => {
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch reviews data
  useEffect(() => {
    fetchReviews();
  }, [tabValue, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/admin/reviews?status=${tabValue}&page=${page}&limit=10${searchTerm ? `&search=${searchTerm}` : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setReviews(response.data.reviews);
      setTotalPages(Math.ceil(response.data.total / 10));
      setError('');
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearch = () => {
    setPage(1);
    fetchReviews();
  };

  const handleRefresh = () => {
    setSearchTerm('');
    fetchReviews();
  };

  const handleOpenDialog = (review, action) => {
    setSelectedReview(review);
    setActionType(action);
    setRejectionReason('');
    setFlagReason('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReview(null);
    setActionType('');
  };

  const handleReviewAction = async () => {
    try {
      let endpoint = '';
      let data = { reviewId: selectedReview.id };
      
      switch (actionType) {
        case 'approve':
          endpoint = '/api/admin/reviews/approve';
          break;
        case 'reject':
          endpoint = '/api/admin/reviews/reject';
          data.reason = rejectionReason;
          break;
        case 'flag':
          endpoint = '/api/admin/reviews/flag';
          data.reason = flagReason;
          break;
        default:
          break;
      }
      
      await axios.post(
        endpoint,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSnackbar({
        open: true,
        message: `Review ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'flagged'} successfully!`,
        severity: 'success'
      });
      
      handleCloseDialog();
      fetchReviews();
    } catch (err) {
      console.error(`Error ${actionType}ing review:`, err);
      setSnackbar({
        open: true,
        message: `Failed to ${actionType} review. Please try again.`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1a1a1a', color: '#fff' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#FFD700' }}>
          Review Moderation
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Manage and moderate user-submitted reviews to maintain platform quality and trust
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search by user or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              mr: 2,
              flexGrow: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 215, 0, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 215, 0, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FFD700',
                },
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
            InputProps={{
              startAdornment: (
                <Search sx={{ color: 'rgba(255, 215, 0, 0.7)', mr: 1 }} />
              ),
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} sx={{ color: '#FFD700' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFD700',
            },
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#FFD700',
              },
            },
          }}
        >
          <Tab label="Pending" value="pending" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
          <Tab label="Flagged" value="flagged" />
        </Tabs>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}>
          {error}
        </Alert>
      )}
      
      <StyledTableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Reviewer</TableCell>
              <TableCell>Recipient</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} sx={{ color: '#FFD700' }} />
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    No {tabValue} reviews found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>{review.reviewerName}</TableCell>
                  <TableCell>{review.recipientName}</TableCell>
                  <TableCell>
                    <Rating value={review.rating} readOnly precision={0.5} size="small" sx={{ color: '#FFD700' }} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {review.comment}
                  </TableCell>
                  <TableCell>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      status={review.status}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" sx={{ color: '#90caf9' }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {review.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small" 
                              sx={{ color: '#4caf50' }}
                              onClick={() => handleOpenDialog(review, 'approve')}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              size="small" 
                              sx={{ color: '#f44336' }}
                              onClick={() => handleOpenDialog(review, 'reject')}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      
                      {(review.status === 'approved' || review.status === 'pending') && (
                        <Tooltip title="Flag">
                          <IconButton 
                            size="small" 
                            sx={{ color: '#ff9800' }}
                            onClick={() => handleOpenDialog(review, 'flag')}
                          >
                            <Flag fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={handlePageChange} 
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              color: '#fff',
            },
            '& .Mui-selected': {
              backgroundColor: 'rgba(255, 215, 0, 0.2) !important',
            },
          }}
        />
      </Box>
      
      {/* Action Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            color: '#fff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFD700' }}>
          {actionType === 'approve' ? 'Approve Review' : 
           actionType === 'reject' ? 'Reject Review' : 'Flag Review'}
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                Review by: {selectedReview.reviewerName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {selectedReview.comment}
              </Typography>
              <Rating value={selectedReview.rating} readOnly precision={0.5} sx={{ color: '#FFD700' }} />
            </Box>
          )}
          
          {actionType === 'reject' && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason for rejection"
              fullWidth
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                  color: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FFD700',
                },
              }}
            />
          )}
          
          {actionType === 'flag' && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason for flagging"
              fullWidth
              multiline
              rows={3}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD700',
                  },
                  color: '#fff',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FFD700',
                },
              }}
            />
          )}
          
          {actionType === 'approve' && (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Are you sure you want to approve this review? The review will be publicly visible on the platform.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReviewAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : actionType === 'reject' ? 'error' : 'warning'}
            disabled={
              (actionType === 'reject' && !rejectionReason) ||
              (actionType === 'flag' && !flagReason)
            }
            sx={{ 
              color: '#000',
              backgroundColor: actionType === 'approve' ? '#4caf50' : 
                                actionType === 'reject' ? '#f44336' : '#ff9800',
              '&:hover': {
                backgroundColor: actionType === 'approve' ? '#388e3c' : 
                                  actionType === 'reject' ? '#d32f2f' : '#f57c00',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            {actionType === 'approve' ? 'Approve' : 
             actionType === 'reject' ? 'Reject' : 'Flag'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReviewModeration; 