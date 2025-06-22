import React, { useState } from 'react';
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
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PropTypes from 'prop-types';

const JobSearchForm = ({ onSubmit, initialValues = {} }) => {
  const [keyword, setKeyword] = useState(initialValues.keyword || '');
  const [location, setLocation] = useState(initialValues.location || '');
  const [jobType, setJobType] = useState(initialValues.jobType || '');
  const [category, setCategory] = useState(initialValues.category || '');
  const [skills, setSkills] = useState(initialValues.skills || []);
  const [skill, setSkill] = useState('');

  // Sample job categories for the demo
  const jobCategories = [
    'Web Development',
    'Mobile Development',
    'Design',
    'Writing',
    'Admin Support',
    'Customer Service',
    'Marketing',
    'Accounting',
    'Consulting',
    'Legal'
  ];

  // Sample job types
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Internship'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      keyword,
      location,
      jobType,
      category,
      skills
    });
  };

  const handleAddSkill = () => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Keywords"
              variant="outlined"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Job title, skills, or company"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Location"
              variant="outlined"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state, or remote"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Job Type</InputLabel>
              <Select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                label="Job Type"
              >
                <MenuItem value="">Any</MenuItem>
                {jobTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">Any</MenuItem>
                {jobCategories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                label="Skills"
                variant="outlined"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Add relevant skills"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddSkill}
                sx={{ minWidth: 100 }}
              >
                Add Skill
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {skills.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onDelete={() => handleRemoveSkill(s)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              size="large"
              sx={{ px: 4 }}
            >
              Search Jobs
            </Button>
          </Grid>
        </Grid>
    </Box>
    </Paper>
  );
};

JobSearchForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.object
};

export default JobSearchForm;
