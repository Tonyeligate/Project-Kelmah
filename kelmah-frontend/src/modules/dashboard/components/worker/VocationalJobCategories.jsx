import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Badge,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Build as CarpenterIcon,
  Construction as MasonIcon,
  Plumbing as PlumberIcon,
  ElectricalServices as ElectricianIcon,
  Handyman as HandymanIcon,
  Brush as PainterIcon,
  LocalShipping as DriverIcon,
  CleaningServices as CleanerIcon,
  Agriculture as GardenerIcon,
  Engineering as MechanicIcon,
  Kitchen as CookIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

// Job categories with visual icons and colors for easy recognition
const jobCategories = [
  {
    id: 'carpenter',
    title: 'Carpenter',
    localName: 'Dwumadi',
    icon: <CarpenterIcon sx={{ fontSize: 48 }} />,
    color: '#8B4513', // Brown
    description: 'Wood work & furniture',
    jobCount: 12,
  },
  {
    id: 'mason',
    title: 'Mason',
    localName: 'Simdani',
    icon: <MasonIcon sx={{ fontSize: 48 }} />,
    color: '#808080', // Gray
    description: 'Building & construction',
    jobCount: 8,
  },
  {
    id: 'plumber',
    title: 'Plumber',
    localName: 'Nsuo dwumayɛni',
    icon: <PlumberIcon sx={{ fontSize: 48 }} />,
    color: '#4169E1', // Blue
    description: 'Pipes & water systems',
    jobCount: 15,
  },
  {
    id: 'electrician',
    title: 'Electrician',
    localName: 'Anyinam ahoɔden',
    icon: <ElectricianIcon sx={{ fontSize: 48 }} />,
    color: '#FFD700', // Gold
    description: 'Electrical installations',
    jobCount: 10,
  },
  {
    id: 'painter',
    title: 'Painter',
    localName: 'Adurakani',
    icon: <PainterIcon sx={{ fontSize: 48 }} />,
    color: '#FF69B4', // Pink
    description: 'Painting & decoration',
    jobCount: 7,
  },
  {
    id: 'handyman',
    title: 'Handyman',
    localName: 'Ɔhwɛfo',
    icon: <HandymanIcon sx={{ fontSize: 48 }} />,
    color: '#32CD32', // Green
    description: 'General repairs',
    jobCount: 20,
  },
  {
    id: 'driver',
    title: 'Driver',
    localName: 'Ɔkani',
    icon: <DriverIcon sx={{ fontSize: 48 }} />,
    color: '#FF4500', // Orange Red
    description: 'Transportation services',
    jobCount: 18,
  },
  {
    id: 'cleaner',
    title: 'Cleaner',
    localName: 'Safohene',
    icon: <CleanerIcon sx={{ fontSize: 48 }} />,
    color: '#00CED1', // Turquoise
    description: 'Cleaning services',
    jobCount: 25,
  },
  {
    id: 'gardener',
    title: 'Gardener',
    localName: 'Turom yɛfo',
    icon: <GardenerIcon sx={{ fontSize: 48 }} />,
    color: '#228B22', // Forest Green
    description: 'Garden maintenance',
    jobCount: 5,
  },
  {
    id: 'mechanic',
    title: 'Mechanic',
    localName: 'Kar yɛfo',
    icon: <MechanicIcon sx={{ fontSize: 48 }} />,
    color: '#2F4F4F', // Dark Slate Gray
    description: 'Vehicle repairs',
    jobCount: 14,
  },
  {
    id: 'cook',
    title: 'Cook/Chef',
    localName: 'Aduanoa',
    icon: <CookIcon sx={{ fontSize: 48 }} />,
    color: '#D2691E', // Chocolate
    description: 'Food preparation',
    jobCount: 9,
  },
  {
    id: 'security',
    title: 'Security',
    localName: 'Bammɔni',
    icon: <SecurityIcon sx={{ fontSize: 48 }} />,
    color: '#000080', // Navy
    description: 'Security services',
    jobCount: 11,
  },
];

const VocationalJobCategories = ({ onCategorySelect }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      // Navigate to job search with category filter
      navigate(`/worker/find-work?category=${category.id}`);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
        🔨 Find Jobs by Trade
      </Typography>

      <Grid container spacing={2}>
        {jobCategories.map((category) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={category.id}>
            <Tooltip title={`${category.jobCount} jobs available`} arrow>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                    borderColor: category.color,
                  },
                }}
                onClick={() => handleCategoryClick(category)}
              >
                <CardContent
                  sx={{
                    textAlign: 'center',
                    py: 2,
                    px: 1,
                  }}
                >
                  <Badge
                    badgeContent={category.jobCount}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -3,
                        top: 3,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        color: category.color,
                        mb: 1,
                      }}
                    >
                      {category.icon}
                    </Box>
                  </Badge>

                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      mb: 0.5,
                    }}
                  >
                    {category.title}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      fontStyle: 'italic',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {category.localName}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      display: 'block',
                    }}
                  >
                    {category.description}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VocationalJobCategories;
