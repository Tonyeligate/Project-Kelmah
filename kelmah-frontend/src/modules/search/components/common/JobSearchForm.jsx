import React, { useState, useEffect, useMemo } from 'react';
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
import { createFeatureLogger } from '';

const EMPTY_SKILLS = [];
const SEARCH_QUERY_MAX_LENGTH = 120;
const SEARCH_LOCATION_MAX_LENGTH = 80;
const SEARCH_SKILL_MAX_LENGTH = 40;
const searchDebugWarn = createFeatureLogger({
  flagName: 'VITE_DEBUG_SEARCH',
  level: 'warn',
});

const areSkillsEqual = (left = EMPTY_SKILLS, right = EMPTY_SKILLS) =>
  left.length === right.length &&
  left.every((skillName, index) => skillName === right[index]);

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
  } = resolvedInitials;
  const initialSkillsKey = JSON.stringify(
    Array.isArray(resolvedInitials.skills)
      ? resolvedInitials.skills
      : EMPTY_SKILLS,
  );
  const normalizedInitialSkills = useMemo(
    () =>
      Array.isArray(resolvedInitials.skills)
        ? resolvedInitials.skills
        : EMPTY_SKILLS,
    [initialSkillsKey],
  );

  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [jobType, setJobType] = useState(initialJobType);
  const [category, setCategory] = useState(initialCategory);
  const [skills, setSkills] = useState(normalizedInitialSkills);
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
    setSkills((currentSkills) =>
      areSkillsEqual(currentSkills, normalizedInitialSkills)
        ? currentSkills
        : normalizedInitialSkills,
    );
  }, [normalizedInitialSkills]);

  const submitHandler = onSearch || onSubmit;

  // Vocational job categories for Ghana's skilled trades
  const jobCategories = [
    'Carpentry',
    'Masonry',
    'Plumbing',
    'Emergency Plumbing',
    'Electrical Work',
    'Rewiring & Switchboard',
    'Painting',
    'Exterior Painting',
    'Welding',
    'Certified Welding',
    'Roofing',
    'Roof Repair',
    'Flooring',
    'HVAC',
    'AC & Refrigeration',
    'Cabinet Making',
    'Landscaping',
    'General Construction',
    'Maintenance',
    'Maintenance Callout',
  ];

  // Job types relevant to skilled trades
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Daily Work',
    'Project-based',
  ];

  const getSnapshot = (overrides = {}) => ({
    keyword: overrides.keyword !== undefined ? overrides.keyword : keyword,
    location: overrides.location !== undefined ? overrides.location : location,
    jobType: overrides.jobType !== undefined ? overrides.jobType : jobType,
    category: overrides.category !== undefined ? overrides.category : category,
    skills: overrides.skills !== undefined ? overrides.skills : skills,
  });

  const emitSearch = (overrides = {}) => {
    if (!submitHandler) {
      return;
    }
    const payload = getSnapshot(overrides);
    submitHandler(payload);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitHandler) {
      emitSearch();
    } else {
      searchDebugWarn('JobSearchForm submitted without handler');
    }
  };

  const handleAddSkill = () => {
    const normalizedSkill = skill.trim().slice(0, SEARCH_SKILL_MAX_LENGTH);
    if (normalizedSkill && !skills.includes(normalizedSkill)) {
      const nextSkills = [...skills, normalizedSkill];
      setSkills(nextSkills);
      emitSearch({ skills: nextSkills });
      setSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const nextSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(nextSkills);
    emitSearch({ skills: nextSkills });
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
              onChange={(e) => {
                const nextKeyword = e.target.value.slice(
                  0,
                  SEARCH_QUERY_MAX_LENGTH,
                );
                setKeyword(nextKeyword);
              }}
              placeholder="e.g., emergency plumber, electrician, tiler"
              inputProps={{ maxLength: SEARCH_QUERY_MAX_LENGTH, 'aria-label': 'Search by work keyword' }}
              helperText="Start with trade first, then include area if known."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Where in Ghana?"
              variant="outlined"
              size="small"
              value={location}
              onChange={(e) => {
                const nextLocation = e.target.value.slice(
                  0,
                  SEARCH_LOCATION_MAX_LENGTH,
                );
                setLocation(nextLocation);
              }}
              placeholder="e.g., Accra, Kumasi, Tamale"
              inputProps={{ maxLength: SEARCH_LOCATION_MAX_LENGTH, 'aria-label': 'Search by location' }}
              helperText="City, town, or neighborhood helps rank nearby matches first."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={jobType}
                onChange={(e) => {
                  const nextJobType = e.target.value;
                  setJobType(nextJobType);
                  emitSearch({ jobType: nextJobType });
                }}
                label="Type"
                inputProps={{ 'aria-label': 'Filter by job type' }}
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
                onChange={(e) => {
                  const nextCategory = e.target.value;
                  setCategory(nextCategory);
                  emitSearch({ category: nextCategory });
                }}
                label="Trade"
                inputProps={{ 'aria-label': 'Filter by trade category' }}
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
              sx={{ minHeight: 44 }}
            >
              Find Work
            </Button>
          </Grid>
        </Grid>

        {/* FIX H5: Skills Section - Add input field + existing chips */}
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            label="Add skill"
            variant="outlined"
            value={skill}
            onChange={(e) =>
              setSkill(e.target.value.slice(0, SEARCH_SKILL_MAX_LENGTH))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="e.g., Welding"
            inputProps={{ maxLength: SEARCH_SKILL_MAX_LENGTH }}
            sx={{ minWidth: 140, maxWidth: 200 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddSkill}
            disabled={!skill.trim()}
            sx={{ minHeight: 44 }}
          >
            Add
          </Button>
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
