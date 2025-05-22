import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Rating,
  Slider,
  Chip,
  InputAdornment,
  Paper,
  Divider,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material';
import {
  Search,
  LocationOn,
  Star,
  FilterList,
  Check,
  Sort,
  ArrowUpward,
  ArrowDownward,
  Tune,
  ClearAll,
  Bookmark,
  BookmarkBorder,
  VerifiedUser
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import WorkerCard from '../../components/workers/WorkerCard';
import WorkerFilter from '../../components/workers/WorkerFilter';
import { workerService } from '../../api/workerService';

// Styled components
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  fontWeight: 700,
  textAlign: 'center',
  color: '#1a1a1a',
}));

const EmptyResultPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  borderRadius: 8,
  backgroundColor: '#f9f9f9',
}));

const SearchPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  marginBottom: theme.spacing(4)
}));

const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  height: '100%'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
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
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
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
}));

const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8))',
  color: '#000',
  fontWeight: 'bold',
  padding: theme.spacing(1, 3),
  borderRadius: theme.spacing(1),
  '&:hover': {
    background: 'linear-gradient(45deg, rgba(255, 215, 0, 1), rgba(255, 165, 0, 1))',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderColor: 'rgba(255, 215, 0, 0.5)',
  color: '#FFD700',
  '&:hover': {
    borderColor: '#FFD700',
    background: 'rgba(255, 215, 0, 0.1)',
  },
}));

const SkillChip = styled(Chip)(({ theme, level }) => {
  const colors = {
    expert: 'linear-gradient(45deg, #FFD700, #FFA500)',
    advanced: 'linear-gradient(45deg, #FFA500, #FF8C00)',
    intermediate: 'linear-gradient(45deg, #FF8C00, #FF4500)',
    beginner: 'linear-gradient(45deg, #FF4500, #8B0000)'
  };
  
  return {
    margin: theme.spacing(0.5),
    background: colors[level] || colors.intermediate,
    color: '#000',
    fontWeight: 'bold',
    '&:hover': {
      opacity: 0.9,
    }
  };
});

// Worker Categories for filter
const WORKER_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'HVAC',
  'Landscaping',
  'Cleaning',
  'Moving',
  'Roofing',
  'General Maintenance',
  'Renovation',
  'Installation',
  'Flooring',
  'Other'
];

const FindTalents = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    location: '',
    category: 'All Categories',
    hourlyRateRange: [10, 100],
    minRating: 0,
    verifiedOnly: false,
    sortBy: 'rating'
  });
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Effect to fetch workers based on filters
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const data = await workerService.getWorkers(filters);
        setWorkers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching workers:', err);
        setError('Failed to load workers. Please try again later.');
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch to avoid too many API calls when filters change rapidly
    const timeoutId = setTimeout(() => {
      fetchWorkers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const toggleSaveWorker = (workerId) => {
    if (savedWorkers.includes(workerId)) {
      setSavedWorkers(savedWorkers.filter(id => id !== workerId));
    } else {
      setSavedWorkers([...savedWorkers, workerId]);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <PageContainer maxWidth="lg">
      <PageTitle variant="h3" component="h1">
        Find Skilled Workers
      </PageTitle>
      
      <WorkerFilter onFilterChange={handleFilterChange} />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#D4AF37' }} />
        </Box>
      ) : error ? (
        <EmptyResultPaper elevation={1}>
          <Typography variant="h6" color="error" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body1">
            Please check your connection and try again later.
          </Typography>
        </EmptyResultPaper>
      ) : workers.length === 0 ? (
        <EmptyResultPaper elevation={1}>
        <Typography variant="h6" gutterBottom>
            No workers found matching your criteria
        </Typography>
          <Typography variant="body1">
            Try adjusting your filters to see more results.
                    </Typography>
        </EmptyResultPaper>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {workers.map((worker) => (
            <Grid item xs={12} sm={6} md={4} key={worker.id}>
              <WorkerCard worker={worker} />
          </Grid>
        ))}
      </Grid>
      )}
    </PageContainer>
  );
};

export default FindTalents; 