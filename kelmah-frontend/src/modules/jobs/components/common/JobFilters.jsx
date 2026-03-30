import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Box,
  SwipeableDrawer,
  Typography,
  InputAdornment,
  Collapse,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useBreakpointDown } from '@/hooks/useResponsive';

const JOB_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Masonry',
  'Welding',
  'Painting',
  'HVAC',
  'Roofing',
  'Tiling',
  'Interior Design',
  'Landscaping',
  'Other',
];

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'one_time'];

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  job_type: '',
  min_budget: '',
  max_budget: '',
  status: 'open',
};

function JobFilters({ open, onClose, filters = DEFAULT_FILTERS, onApply }) {
  const isMobile = useBreakpointDown('sm');
  const [localFilters, setLocalFilters] = useState({
    ...DEFAULT_FILTERS,
    ...(filters || {}),
  });
  const [showMoreMobileFilters, setShowMoreMobileFilters] = useState(false);

  useEffect(() => {
    setLocalFilters({
      ...DEFAULT_FILTERS,
      ...(filters || {}),
    });
    if (open) {
      setShowMoreMobileFilters(false);
    }
  }, [filters, open]);

  const handleChange = (field) => (event) => {
    setLocalFilters({
      ...localFilters,
      [field]: event.target.value,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_FILTERS };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  // Shared filter field content
  const filterFields = (
    <Grid
      container
      spacing={2}
      sx={{
        '& .MuiInputBase-root': {
          minHeight: 44,
        },
      }}
    >
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={localFilters.category}
            onChange={handleChange('category')}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {JOB_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Job Type</InputLabel>
          <Select
            value={localFilters.job_type}
            onChange={handleChange('job_type')}
            label="Job Type"
          >
            <MenuItem value="">All Types</MenuItem>
            {JOB_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {(!isMobile || showMoreMobileFilters) && (
        <>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Min Budget"
              type="number"
              value={localFilters.min_budget}
              onChange={handleChange('min_budget')}
              inputProps={{ inputMode: 'decimal' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">GH₵</InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Max Budget"
              type="number"
              value={localFilters.max_budget}
              onChange={handleChange('max_budget')}
              inputProps={{ inputMode: 'decimal' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">GH₵</InputAdornment>
                ),
              }}
            />
          </Grid>
        </>
      )}
    </Grid>
  );

  // Mobile: SwipeableDrawer bottom sheet
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        aria-label="Job filters"
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '90dvh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          {/* Drag handle */}
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: 'divider',
              borderRadius: 2,
              mx: 'auto',
              mb: 2,
            }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Filter Jobs
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close filters"
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
              <Close />
            </IconButton>
          </Box>
          {filterFields}
          <Box sx={{ mt: 1.5 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => setShowMoreMobileFilters((prev) => !prev)}
              sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700 }}
              aria-expanded={showMoreMobileFilters}
              aria-controls="job-filters-mobile-more"
            >
              {showMoreMobileFilters ? 'Hide extra filters' : 'More filters'}
            </Button>
            <Collapse in={showMoreMobileFilters} id="job-filters-mobile-more">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Set budget only when you need stricter matching.
              </Typography>
            </Collapse>
          </Box>
        </Box>
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
            p: 2,
            pt: 1.25,
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            gap: 1.5,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            onClick={handleReset}
            sx={{ minHeight: 44 }}
            aria-label="Clear all job filters"
          >
            Clear filters
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleApply}
            aria-label="Apply selected job filters"
            sx={{ minHeight: 44 }}
          >
            Apply filters
          </Button>
        </Box>
      </SwipeableDrawer>
    );
  }

  // Desktop: standard Dialog
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="job-filters-title"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span id="job-filters-title">Filter Jobs</span>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close filters"
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
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>{filterFields}</DialogContent>

      <DialogActions>
        <Button onClick={handleReset} color="inherit" sx={{ minHeight: 44 }}>
          Reset
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          color="primary"
          aria-label="Apply selected job filters"
          sx={{ minHeight: 44 }}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
}

JobFilters.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  filters: PropTypes.shape({
    search: PropTypes.string,
    category: PropTypes.string,
    job_type: PropTypes.string,
    min_budget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    max_budget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
  }),
};

export default JobFilters;
