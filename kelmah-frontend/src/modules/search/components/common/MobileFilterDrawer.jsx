import { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Collapse,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { JOB_CATEGORIES, JOB_TYPES } from '../../utils/searchOptions';
import useKeyboardVisible from '@/hooks/useKeyboardVisible';
import { withSafeAreaBottom } from '@/utils/safeArea';

/**
 * MobileFilterDrawer - Bottom sheet for mobile filter controls
 * Reduces mobile filter height from 350-400px to ~100px
 */
const MobileFilterDrawer = ({
  open,
  onClose,
  onSearch,
  initialFilters = {},
}) => {
  const theme = useTheme();
  const { isKeyboardVisible } = useKeyboardVisible();
  const [keyword, setKeyword] = useState(initialFilters.keyword || '');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [jobType, setJobType] = useState(initialFilters.jobType || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    setKeyword(initialFilters.keyword || '');
    setLocation(initialFilters.location || '');
    setJobType(initialFilters.jobType || '');
    setCategory(initialFilters.category || '');
    if (open) {
      setShowMoreFilters(false);
    }
  }, [
    initialFilters.keyword,
    initialFilters.location,
    initialFilters.jobType,
    initialFilters.category,
    open,
  ]);

  const handleApplyFilters = () => {
    onSearch({
      keyword,
      location,
      jobType,
      category,
    });
    onClose();
  };

  const handleClearFilters = () => {
    setKeyword('');
    setLocation('');
    setJobType('');
    setCategory('');
    onSearch({});
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: isKeyboardVisible ? '92dvh' : '88dvh',
          minHeight: isKeyboardVisible ? '46dvh' : '52dvh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Find workers faster
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close mobile filters"
          sx={{
            width: 44,
            height: 44,
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Swipe Indicator */}
      <Box
        sx={{
          width: 40,
          height: 4,
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
          mx: 'auto',
          mb: 2,
        }}
      />

      <Divider />

      {/* Filter Form */}
      <Box
        sx={{
          p: 2,
          pt: 1.5,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5, lineHeight: 1.4 }}
        >
          Start with trade and location, then narrow by work type if needed.
        </Typography>
        <Stack spacing={2}>
          {/* Search Keyword */}
          <TextField
            fullWidth
            label="What work do you need?"
            variant="outlined"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., Carpenter, Plumber, Electrician"
            inputProps={{ 'aria-label': 'Filter by trade or job keyword' }}
            InputProps={{
              sx: { minHeight: '48px' }, // Touch-friendly
            }}
          />

          {/* Location */}
          <TextField
            fullWidth
            label="Where in Ghana?"
            variant="outlined"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Accra, Kumasi, Takoradi, Tamale"
            inputProps={{ 'aria-label': 'Filter by location in Ghana' }}
            InputProps={{
              sx: { minHeight: '48px' }, // Touch-friendly
            }}
          />

          <Button
            variant="text"
            onClick={() => setShowMoreFilters((prev) => !prev)}
            sx={{
              alignSelf: 'flex-start',
              minHeight: 44,
              fontWeight: 700,
              textTransform: 'none',
              px: 0,
            }}
            aria-expanded={showMoreFilters}
            aria-controls="worker-mobile-more-filters"
          >
            {showMoreFilters ? 'Hide extra filters' : 'More filters'}
          </Button>

          <Collapse in={showMoreFilters} id="worker-mobile-more-filters">
            <Stack spacing={2}>
              {/* Job Type */}
              <FormControl fullWidth variant="outlined">
                <InputLabel>Work Type</InputLabel>
                <Select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  label="Work Type"
                  inputProps={{ 'aria-label': 'Filter by work type' }}
                  sx={{ minHeight: '48px' }} // Touch-friendly
                >
                  <MenuItem value="">Any Type</MenuItem>
                  {JOB_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Trade Category */}
              <FormControl fullWidth variant="outlined">
                <InputLabel>Trade/Skill</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Trade/Skill"
                  inputProps={{
                    'aria-label': 'Filter by trade or skill category',
                  }}
                  sx={{ minHeight: '48px' }} // Touch-friendly
                >
                  <MenuItem value="">All Trades</MenuItem>
                  {JOB_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Collapse>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          bgcolor: 'background.paper',
          pb: withSafeAreaBottom(6),
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          fullWidth
          aria-label="Clear all worker search filters"
          sx={{ minHeight: '48px' }}
        >
          Clear Filters
        </Button>
        <Button
          variant="contained"
          onClick={handleApplyFilters}
          startIcon={<SearchIcon />}
          fullWidth
          sx={{
            minHeight: '48px',
            bgcolor: theme.palette.mode === 'dark' ? '#FFD700' : '#000000',
            color: theme.palette.mode === 'dark' ? '#000000' : '#FFD700',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? '#FFC700' : '#1a1a1a',
            },
          }}
        >
          Show Results
        </Button>
      </Box>
    </Drawer>
  );
};

MobileFilterDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  initialFilters: PropTypes.object,
};

export default MobileFilterDrawer;
