import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
  InputAdornment,
  Collapse,
  Slider,
  Chip,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ElectricalServices as ElectricalIcon,
  Plumbing as PlumbingIcon,
  Handyman as CarpenterIcon,
  Construction as ConstructionIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import tradeCategories from '../data/tradeCategories.json';
import ghanaLocations from '../data/ghanaLocations.json';

const CATEGORY_ICONS = {
  Electrical: ElectricalIcon,
  Plumbing: PlumbingIcon,
  Carpentry: CarpenterIcon,
  HVAC: ConstructionIcon,
  Construction: ConstructionIcon,
};

const HeroFiltersSection = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLocation,
  onLocationChange,
  budgetRange,
  onBudgetRangeChange,
  showFilters,
  onToggleFilters,
  isSmallMobile,
}) => {
  const [categoryOptions, setCategoryOptions] = useState([
    { value: '', label: 'All Trades' },
  ]);
  const [locationOptions, setLocationOptions] = useState([
    { value: '', label: 'All Locations' },
  ]);

  useEffect(() => {
    setCategoryOptions(tradeCategories || []);
    setLocationOptions(ghanaLocations || []);
  }, []);

  const renderCategoryIcon = (value) => {
    const Icon = CATEGORY_ICONS[value] || WorkIcon;
    return <Icon sx={{ mr: 1, color: '#D4AF37', fontSize: 18 }} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box
        sx={{
          mb: { xs: 2, md: 4 },
          mt: { xs: 1, md: 0 },
          px: { xs: 1, sm: 0 },
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                textAlign: { xs: 'center', md: 'left' },
                px: { xs: 1, sm: 0 },
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  background:
                    'linear-gradient(45deg, #D4AF37 30%, #FFD700 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: { xs: 0.5, md: 1 },
                  fontSize: {
                    xs: '1.35rem',
                    sm: '1.65rem',
                    md: '2rem',
                    lg: '2.25rem',
                  },
                  lineHeight: { xs: 1.3, md: 1.3 },
                  wordWrap: 'break-word',
                }}
              >
                {isSmallMobile
                  ? 'Find Trade Jobs'
                  : 'Find Your Next Trade Opportunity'}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                  lineHeight: { xs: 1.5, md: 1.5 },
                  maxWidth: { xs: '100%', md: '90%' },
                  wordWrap: 'break-word',
                }}
              >
                {isSmallMobile
                  ? 'Connect with top employers in Ghana'
                  : "Connect with Ghana's top employers and advance your skilled trades career"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              elevation={8}
              sx={{
                p: { xs: 1.5, sm: 2 },
                bgcolor: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: { xs: 2, sm: 2 },
                mx: { xs: 1, sm: 0 },
              }}
            >
              <Grid
                container
                spacing={{ xs: 1.5, sm: 2 }}
                alignItems="stretch"
                sx={{ width: '100%', margin: 0 }}
              >
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={
                      isSmallMobile
                        ? 'Search jobs...'
                        : 'Search jobs, skills, companies...'
                    }
                    inputProps={{
                      'aria-label': 'Search for jobs, skills, or companies',
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        height: { xs: '44px', sm: '40px' },
                        '& fieldset': {
                          borderColor: 'rgba(212,175,55,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#D4AF37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#D4AF37',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.95rem', sm: '0.875rem' },
                        padding: { xs: '10px 14px', sm: '8.5px 14px' },
                        '&::placeholder': {
                          color: 'rgba(255,255,255,0.6)',
                          opacity: 1,
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon
                            sx={{
                              color: '#D4AF37',
                              fontSize: { xs: '1.2rem', sm: '1rem' },
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel
                      shrink
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: { xs: '0.8rem', sm: '0.75rem' },
                        transform: 'translate(14px, -9px) scale(0.85)',
                        '&.Mui-focused': {
                          color: '#D4AF37',
                        },
                      }}
                    >
                      Trade Category
                    </InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(event) => onCategoryChange(event.target.value)}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Select trade category' }}
                      sx={{
                        color: 'white',
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        height: { xs: '44px', sm: '40px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(212,175,55,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#D4AF37',
                        },
                        '& .MuiSelect-select': {
                          padding: { xs: '10px 14px', sm: '8.5px 14px' },
                        },
                      }}
                    >
                      {categoryOptions.map((category) => (
                        <MenuItem
                          key={category.value || 'all-categories'}
                          value={category.value}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {renderCategoryIcon(category.value)}
                            <Typography variant="body2">
                              {category.label}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel
                      shrink
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: { xs: '0.8rem', sm: '0.75rem' },
                        transform: 'translate(14px, -9px) scale(0.85)',
                        '&.Mui-focused': {
                          color: '#D4AF37',
                        },
                      }}
                    >
                      Location
                    </InputLabel>
                    <Select
                      value={selectedLocation}
                      onChange={(event) => onLocationChange(event.target.value)}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Select location' }}
                      sx={{
                        color: 'white',
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        height: { xs: '44px', sm: '40px' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(212,175,55,0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#D4AF37',
                        },
                        '& .MuiSvgIcon-root': {
                          color: '#D4AF37',
                        },
                        '& .MuiSelect-select': {
                          padding: { xs: '10px 14px', sm: '8.5px 14px' },
                        },
                      }}
                    >
                      {locationOptions.map((location) => (
                        <MenuItem
                          key={location.value || 'all-locations'}
                          value={location.value}
                        >
                          <Typography variant="body2">
                            {location.label}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={2}
                  sx={{ display: 'flex', alignItems: 'stretch' }}
                >
                  <Tooltip title="Search for jobs" placement="top">
                    <Button
                      fullWidth
                      variant="contained"
                      size="medium"
                      startIcon={<SearchIcon />}
                      onClick={() => onSearchChange(searchQuery)}
                      sx={{
                        bgcolor: '#D4AF37',
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        height: { xs: '44px', sm: '40px' },
                        minWidth: { xs: '100%', sm: 'auto' },
                        padding: { xs: '10px 20px', sm: '8px 12px' },
                        boxShadow: '0 4px 12px rgba(212,175,55,0.4)',
                        '&:hover': {
                          bgcolor: '#B8941F',
                          boxShadow: '0 6px 16px rgba(212,175,55,0.6)',
                          transform: { xs: 'none', sm: 'translateY(-2px)' },
                        },
                        transition: 'all 0.3s ease',
                        '&:active': {
                          transform: 'scale(0.98)',
                        },
                      }}
                    >
                      Search
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>

              <Box sx={{ mt: { xs: 1, sm: 1 }, textAlign: 'center' }}>
                <Button
                  startIcon={<FilterListIcon />}
                  onClick={onToggleFilters}
                  size="small"
                  sx={{
                    color: '#D4AF37',
                    fontSize: { xs: '0.8rem', sm: '0.75rem' },
                    padding: { xs: '6px 12px', sm: '4px 8px' },
                    minHeight: { xs: '36px', sm: 'auto' },
                    '&:hover': {
                      bgcolor: 'rgba(212,175,55,0.1)',
                    },
                  }}
                >
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </Box>

              <Collapse in={showFilters}>
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: '#D4AF37', fontWeight: 'bold' }}
                      >
                        Salary Range (GHS)
                      </Typography>
                      <Slider
                        value={budgetRange}
                        onChange={(_, newValue) =>
                          onBudgetRangeChange(newValue)
                        }
                        valueLabelDisplay="auto"
                        min={500}
                        max={10000}
                        step={100}
                        size="small"
                        sx={{
                          color: '#D4AF37',
                          '& .MuiSlider-thumb': { bgcolor: '#D4AF37' },
                          '& .MuiSlider-track': { bgcolor: '#D4AF37' },
                          '& .MuiSlider-rail': {
                            bgcolor: 'rgba(212,175,55,0.3)',
                          },
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          GHS {budgetRange[0]}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          GHS {budgetRange[1]}+
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: '#D4AF37', fontWeight: 'bold' }}
                      >
                        Quick Filters
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {['Urgent', 'Verified', 'Full-time', 'Contract'].map(
                          (filter) => (
                            <Chip
                              key={filter}
                              label={filter}
                              size="small"
                              variant="outlined"
                              clickable
                              onClick={() => onSearchChange(filter)}
                              sx={{
                                borderColor: '#D4AF37',
                                color: '#D4AF37',
                                fontSize: '0.7rem',
                                '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                              }}
                            />
                          ),
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

HeroFiltersSection.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  selectedLocation: PropTypes.string.isRequired,
  onLocationChange: PropTypes.func.isRequired,
  budgetRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  onBudgetRangeChange: PropTypes.func.isRequired,
  showFilters: PropTypes.bool.isRequired,
  onToggleFilters: PropTypes.func.isRequired,
  isSmallMobile: PropTypes.bool.isRequired,
};

export default HeroFiltersSection;
