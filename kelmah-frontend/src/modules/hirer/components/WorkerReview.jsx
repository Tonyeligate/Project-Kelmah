import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tooltip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import {
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  MoreVert as MoreVertIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../../auth/contexts/AuthContext';
import { format } from 'date-fns';

const WorkerReview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    communication: 0,
    quality: 0,
    deadline: 0,
    professionalism: 0,
    comment: '',
    recommend: '',
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hirers/${user.id}/workers`);
      const data = await response.json();
      setWorkers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load workers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, worker) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorker(worker);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWorker(null);
  };

  const handleDialogOpen = (type) => {
    setDialogType(type);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogType(null);
    setReviewForm({
      rating: 0,
      communication: 0,
      quality: 0,
      deadline: 0,
      professionalism: 0,
      comment: '',
      recommend: '',
    });
  };

  const handleReviewSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workers/${selectedWorker.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewForm),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      fetchWorkers();
      handleDialogClose();
    } catch (err) {
      setError('Failed to submit review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 4) return 'primary';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  const renderWorkerCard = (worker) => (
    <Card key={worker.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={worker.avatar} sx={{ width: 64, height: 64 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{worker.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {worker.profession}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={worker.rating} readOnly precision={0.5} />
            <Typography variant="body2" color="text.secondary">
              ({worker.reviewCount} reviews)
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon color="primary" />
              <Typography variant="body1">
                {worker.completedJobs} completed jobs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon color="primary" />
              <Typography variant="body1">
                {worker.yearsExperience} years experience
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {worker.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
          {worker.recentReviews && worker.recentReviews.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Recent Reviews
              </Typography>
              <List dense>
                {worker.recentReviews.slice(0, 2).map((review, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="body2">
                            {review.comment}
                          </Typography>
                        </Box>
                      }
                      secondary={format(new Date(review.date), 'MMM dd, yyyy')}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
        </Grid>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          size="small"
          startIcon={<MessageIcon />}
          onClick={() => handleDialogOpen('message')}
        >
          Message
        </Button>
        <Button
          size="small"
          startIcon={<StarIcon />}
          onClick={() => handleDialogOpen('review')}
        >
          Review
        </Button>
        <IconButton size="small" onClick={(e) => handleMenuOpen(e, worker)}>
          <MoreVertIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Worker Reviews
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : workers.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No workers to review</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {workers.map(renderWorkerCard)}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDialogOpen('message')}>
          <MessageIcon sx={{ mr: 1 }} /> Send Message
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('review')}>
          <StarIcon sx={{ mr: 1 }} /> Write Review
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen('details')}>
          <DescriptionIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'message' && 'Send Message'}
          {dialogType === 'review' && 'Write Review'}
          {dialogType === 'details' && 'Worker Details'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {dialogType === 'message' && (
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                margin="normal"
              />
            )}
            {dialogType === 'review' && selectedWorker && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography component="legend">Overall Rating</Typography>
                  <Rating
                    value={reviewForm.rating}
                    onChange={(event, newValue) => {
                      setReviewForm({ ...reviewForm, rating: newValue });
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography component="legend">Communication</Typography>
                  <Rating
                    value={reviewForm.communication}
                    onChange={(event, newValue) => {
                      setReviewForm({ ...reviewForm, communication: newValue });
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography component="legend">Quality of Work</Typography>
                  <Rating
                    value={reviewForm.quality}
                    onChange={(event, newValue) => {
                      setReviewForm({ ...reviewForm, quality: newValue });
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography component="legend">Meeting Deadlines</Typography>
                  <Rating
                    value={reviewForm.deadline}
                    onChange={(event, newValue) => {
                      setReviewForm({ ...reviewForm, deadline: newValue });
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography component="legend">Professionalism</Typography>
                  <Rating
                    value={reviewForm.professionalism}
                    onChange={(event, newValue) => {
                      setReviewForm({
                        ...reviewForm,
                        professionalism: newValue,
                      });
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Review Comment"
                    multiline
                    rows={4}
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Would you recommend this worker?</InputLabel>
                    <Select
                      value={reviewForm.recommend}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          recommend: e.target.value,
                        })
                      }
                      label="Would you recommend this worker?"
                    >
                      <MenuItem value="yes">Yes, I would recommend</MenuItem>
                      <MenuItem value="no">No, I would not recommend</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
            {dialogType === 'details' && selectedWorker && (
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Name"
                    secondary={selectedWorker.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <WorkIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Profession"
                    secondary={selectedWorker.profession}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <StarIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Rating"
                    secondary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Rating
                          value={selectedWorker.rating}
                          readOnly
                          size="small"
                        />
                        <Typography variant="body2">
                          ({selectedWorker.reviewCount} reviews)
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AccessTimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Experience"
                    secondary={`${selectedWorker.yearsExperience} years`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Skills"
                    secondary={
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedWorker.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={
              dialogType === 'review' ? handleReviewSubmit : handleDialogClose
            }
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerReview;
