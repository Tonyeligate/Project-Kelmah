import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Rating,
  Chip,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Person,
  Work,
  Star,
  BusinessCenter,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet';
import axiosInstance from '../../common/services/axios';

function UserProfilePage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchReviews();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Error fetching user profile');
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/api/reviews/user/${userId}`);
      setReviews(response.data.reviews);
      setRatings(response.data.ratings);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Skeleton variant="circular" width={120} height={120} />
                <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
                <Skeleton variant="text" width="40%" />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={200}
                  sx={{ mt: 2 }}
                />
                <Skeleton variant="text" width="50%" sx={{ mt: 2 }} />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={80}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="rectangular" width="30%" height={40} />
              <Box sx={{ mt: 2 }}>
                {Array.from(new Array(5)).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="text"
                    width="100%"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>{user?.username || 'User Profile'} | Kelmah</title>
      </Helmet>

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Avatar sx={{ width: 120, height: 120, mb: 2 }}>
                <Person sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.username}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user.role === 'worker' ? 'Freelancer' : 'Client'}
              </Typography>

              {ratings && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating
                    value={ratings.average_rating}
                    readOnly
                    precision={0.1}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    ({ratings.total_ratings} reviews)
                  </Typography>
                </Box>
              )}

              <Box sx={{ width: '100%', mt: 2 }}>
                {user.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">{user.location}</Typography>
                  </Box>
                )}

                {user.location && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      borderRadius: 2,
                      overflow: 'hidden',
                      mt: 2,
                    }}
                  >
                    <iframe
                      title="User Location"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(user.location)}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Member since{' '}
                    {format(new Date(user.created_at), 'MMMM yyyy')}
                  </Typography>
                </Box>
              </Box>

              {user.skills && (
                <Box sx={{ mt: 2, width: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {user.skills.split(',').map((skill, index) => (
                      <Chip key={index} label={skill.trim()} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Overview" value="overview" />
              <Tab label="Reviews" value="reviews" />
              <Tab label="Portfolio" value="portfolio" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 'overview' && (
                <>
                  <Typography variant="h6" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {user.bio || 'No bio provided'}
                  </Typography>
                </>
              )}

              {activeTab === 'reviews' && (
                <Box>
                  {reviews.length > 0 ? (
                    <List>
                      {reviews.map((rev) => (
                        <ListItem
                          key={rev.id || rev._id}
                          alignItems="flex-start"
                        >
                          <ListItemAvatar>
                            <Avatar src={rev.reviewer.avatar} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Rating
                                value={rev.rating}
                                readOnly
                                size="small"
                              />
                            }
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {rev.reviewer.name}
                                </Typography>
                                {' — ' + rev.comment}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography>No reviews yet.</Typography>
                  )}
                </Box>
              )}

              {activeTab === 'portfolio' && (
                <Box>
                  {user.portfolio && user.portfolio.length > 0 ? (
                    <Grid container spacing={2}>
                      {user.portfolio.map((item, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Paper elevation={3} sx={{ overflow: 'hidden' }}>
                            <img
                              src={item.url}
                              alt={item.title || 'Portfolio Item'}
                              style={{ width: '100%', display: 'block' }}
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography>No portfolio items available.</Typography>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default UserProfilePage;
