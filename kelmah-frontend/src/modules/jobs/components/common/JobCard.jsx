import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  Divider,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  AccessTime,
  Star,
  BookmarkBorder,
  Bookmark,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  saveJobToServer,
  unsaveJobFromServer,
  selectSavedJobs,
  selectSavedLoading,
  fetchSavedJobs,
} from '../../services/jobSlice';
import { useNavigate, useLocation } from 'react-router-dom';

const JobCard = ({ job, onViewDetails }) => {
  if (!job) return null;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();
  const locationHook = useLocation();

  const {
    id,
    title,
    description,
    budget,
    location,
    postedDate,
    deadline,
    category,
    skills = [],
    hirerName,
    hirerRating,
  } = job;

  // Normalize job id from various API shapes
  const jobId = job?.id || job?._id;

  const dispatch = useDispatch();
  const savedJobs = useSelector(selectSavedJobs) || [];
  const savedLoading = useSelector(selectSavedLoading);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const isSaved = savedJobs.some(
    (saved) => saved?.id === jobId || saved?._id === jobId,
  );

  const handleToggleSave = async () => {
    // Require authentication to save jobs
    if (!isAuthenticated) {
      navigate('/login', { state: { from: locationHook.pathname } });
      return;
    }

    try {
      if (isSaved) {
        await dispatch(unsaveJobFromServer(jobId));
      } else {
        await dispatch(saveJobToServer(jobId));
      }
      // Refresh saved jobs list to reflect latest server state
      await dispatch(fetchSavedJobs());
    } catch (e) {
      // No-op: errors handled by slice; keep UI stable
    }
  };

  // Helper to format budget, handling object or primitive
  const formatBudget = () => {
    if (budget && typeof budget === 'object') {
      const { min, max, currency } = budget;
      return `${currency || 'GHS'} ${min} - ${max}`;
    }
    return budget != null ? `GHS ${budget}` : '';
  };

  return (
    <Card sx={{ 
      mb: 2, 
      borderRadius: { xs: 3, sm: 2 }, 
      boxShadow: 2,
      minHeight: { xs: '280px', sm: '320px' },
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-2px)' },
        boxShadow: { xs: 2, sm: 4 },
      },
      transition: 'all 0.3s ease-in-out'
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography 
            variant="h6" 
            component="div"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              lineHeight: { xs: 1.3, sm: 1.4 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: { xs: 2, sm: 1 },
              WebkitBoxOrient: 'vertical'
            }}
          >
            {title}
          </Typography>
          <Chip
            size={isMobile ? "small" : "medium"}
            label={category}
            color="primary"
            variant="outlined"
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
          />
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            lineHeight: { xs: 1.4, sm: 1.5 },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: { xs: 3, sm: 2 },
            WebkitBoxOrient: 'vertical'
          }}
        >
          {description?.substring(0, isMobile ? 100 : 150)}
          {description?.length > (isMobile ? 100 : 150) ? '...' : ''}
        </Typography>

        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 1, sm: 2 }} 
          sx={{ mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoney 
              fontSize={isMobile ? "small" : "medium"} 
              color="action" 
              sx={{ mr: 0.5 }} 
            />
            <Typography 
              variant="body2"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {formatBudget()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">{location}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              {new Date(postedDate).toLocaleDateString()}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {skills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
            {hirerName ? hirerName[0].toUpperCase() : 'H'}
          </Avatar>
          <Typography variant="body2">{hirerName}</Typography>
          {hirerRating && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              <Star sx={{ color: 'gold', fontSize: 18, mr: 0.5 }} />
              <Typography variant="body2">{hirerRating}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions>
        <IconButton onClick={handleToggleSave} disabled={savedLoading}>
          {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
        </IconButton>
        <Button
          size="small"
          variant="contained"
          onClick={() => onViewDetails?.(jobId)}
          fullWidth
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default JobCard;
