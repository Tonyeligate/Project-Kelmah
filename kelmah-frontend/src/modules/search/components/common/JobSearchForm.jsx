import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PropTypes from 'prop-types';

const JobSearchForm = ({
  onSubmit,
  onSearch,
  initialValues = {},
  initialFilters,
}) => {
  const resolvedInitials = initialFilters || initialValues || {};
  const {
    keyword: initialKeyword = '',
    location: initialLocation = '',
    jobType: initialJobType = '',
    category: initialCategory = '',
    skills: initialSkills = [],
  } = resolvedInitials;

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [jobType, setJobType] = useState(initialJobType);
  const [category, setCategory] = useState(initialCategory);
  const [skills, setSkills] = useState(initialSkills);
  const [skill, setSkill] = useState('');

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    setLocation(initialLocation);
  }, [initialLocation]);

  useEffect(() => {
    setJobType(initialJobType);
  }, [initialJobType]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setSkills(Array.isArray(initialSkills) ? initialSkills : []);
  }, [initialSkills]);

  const submitHandler = onSearch || onSubmit;

  // Vocational job categories for Ghana's skilled trades
  const jobCategories = [
    'Carpentry',
    'Masonry',
    'Plumbing',
    'Electrical Work',
    'Painting',
    'Welding',
    'Roofing',
    'Flooring',
    'HVAC',
    'Landscaping',
    'General Construction',
    'Maintenance',
  ];

  // Job types relevant to skilled trades
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Daily Work',
    'Project-based',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitHandler) {
      submitHandler({
        keyword,
        location,
        jobType,
        category,
        skills,
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('JobSearchForm submitted without handler');
    }
  };

  const handleAddSkill = () => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <Paper elevation={1} sx={{ p: 1.5, mb: 1, mt: 0 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="What work do you need?"
              variant="outlined"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., Carpenter, Plumber"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Where?"
              variant="outlined"
              size="small"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Accra, Kumasi"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                label="Type"
              >
                <MenuItem value="">Any</MenuItem>
                {jobTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Trade</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Trade"
              >
                <MenuItem value="">Any</MenuItem>
                {jobCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={3}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              fullWidth
              sx={{ height: '40px' }}
            >
              Find Work
            </Button>
          </Grid>
        </Grid>

        {/* Skills Section - Collapsible */}
        {skills.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {skills.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onDelete={() => handleRemoveSkill(s)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

JobSearchForm.propTypes = {
  onSubmit: PropTypes.func,
  onSearch: PropTypes.func,
  initialValues: PropTypes.object,
  initialFilters: PropTypes.object,
};

export default JobSearchForm;
