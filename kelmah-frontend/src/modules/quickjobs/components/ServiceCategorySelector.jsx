/**
 * ServiceCategorySelector Component
 * Simplified homepage component for quick service selection
 * Part of Kelmah's Protected Quick-Hire system
 * 
 * Design Philosophy: "40-year-old homeowner with leaking pipe shouldn't have to write a job description"
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { SERVICE_CATEGORIES } from '../services/quickJobService';

// Category icons (emoji-based for universal recognition)
const categoryIcons = {
  plumbing: { emoji: '🔧', color: '#2196F3' },
  electrical: { emoji: '⚡', color: '#FFC107' },
  carpentry: { emoji: '🪚', color: '#8B4513' },
  masonry: { emoji: '🧱', color: '#D84315' },
  painting: { emoji: '🎨', color: '#9C27B0' },
  welding: { emoji: '🔥', color: '#FF5722' },
  tailoring: { emoji: '🧵', color: '#E91E63' },
  cleaning: { emoji: '🧹', color: '#4CAF50' },
  hvac: { emoji: '❄️', color: '#00BCD4' },
  roofing: { emoji: '🏠', color: '#795548' },
  tiling: { emoji: '🔲', color: '#607D8B' },
  general_repair: { emoji: '🔨', color: '#FF9800' },
  other: { emoji: '📋', color: '#9E9E9E' }
};

const ServiceCategorySelector = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');

  // Filter categories based on search
  const filteredCategories = SERVICE_CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.nameGh.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    navigate(`/quick-job/new?category=${categoryId}`);
  };

  // Handle "Find Worker" search
  const handleFindWorker = () => {
    navigate('/workers');
  };

  return (
    <Box
      sx={{
        py: { xs: 4, md: 8 },
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
        minHeight: '60vh'
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Text - Simple & Direct */}
        <Box textAlign="center" mb={4}>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            component="h1"
            fontWeight="bold"
            gutterBottom
            sx={{ color: theme.palette.text.primary }}
          >
            What do you need help with?
          </Typography>
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            color="text.secondary"
            sx={{ maxWidth: 500, mx: 'auto' }}
          >
            Select a service and get quotes from skilled workers nearby
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            maxWidth: 500,
            mx: 'auto',
            mb: 4
          }}
        >
          <TextField
            fullWidth
            placeholder="Search for a service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '& fieldset': { border: 'none' }
              }
            }}
          />
        </Box>

        {/* Category Grid - Big, Tappable Cards */}
        <Grid container spacing={2} justifyContent="center">
          {filteredCategories.map((category) => {
            const iconData = categoryIcons[category.id] || categoryIcons.other;
            return (
              <Grid item xs={6} sm={4} md={3} key={category.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `2px solid transparent`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      border: `2px solid ${iconData.color}`,
                      boxShadow: `0 8px 24px ${iconData.color}30`
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCategorySelect(category.id)}
                    sx={{ p: 2 }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 1 }}>
                      {/* Big Emoji Icon */}
                      <Avatar
                        sx={{
                          width: { xs: 60, md: 72 },
                          height: { xs: 60, md: 72 },
                          bgcolor: `${iconData.color}20`,
                          mx: 'auto',
                          mb: 1.5,
                          fontSize: { xs: '2rem', md: '2.5rem' }
                        }}
                      >
                        {iconData.emoji}
                      </Avatar>
                      
                      {/* Category Name */}
                      <Typography
                        variant="subtitle1"
                        fontWeight="600"
                        sx={{ 
                          color: theme.palette.text.primary,
                          lineHeight: 1.2
                        }}
                      >
                        {category.name}
                      </Typography>
                      
                      {/* Ghana-style name */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {category.nameGh}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Alternative Action - Browse Workers */}
        <Box textAlign="center" mt={5}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Or browse profiles of verified workers
          </Typography>
          <Button
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleFindWorker}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Find a Worker
          </Button>
        </Box>

        {/* Trust Indicators */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 2, md: 4 },
            flexWrap: 'wrap',
            mt: 6
          }}
        >
          <Chip
            icon={<span style={{ fontSize: '1.2rem' }}>✓</span>}
            label="Verified Workers"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
          <Chip
            icon={<span style={{ fontSize: '1.2rem' }}>🔒</span>}
            label="Secure Payment"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
          <Chip
            icon={<span style={{ fontSize: '1.2rem' }}>⭐</span>}
            label="Rated & Reviewed"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default ServiceCategorySelector;
