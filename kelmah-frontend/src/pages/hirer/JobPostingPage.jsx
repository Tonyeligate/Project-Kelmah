import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  RadioGroup,
  Radio,
  Autocomplete,
  useTheme
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  QuestionAnswer as QuestionsIcon,
  Add as AddIcon,
  Save as SaveIcon,
  DeleteOutline as DeleteIcon,
  CheckCircle as SuccessIcon,
  KeyboardArrowLeft as BackIcon,
  KeyboardArrowRight as NextIcon,
  Publish as PublishIcon
} from '@mui/icons-material';
import { Helmet } from 'react-helmet';

// Import hirer slice
import { createHirerJob, selectHirerLoading, selectHirerError } from '../../store/slices/hirerSlice';

const JobPostingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get loading states from Redux store
  const isLoading = useSelector(selectHirerLoading('jobs'));
  const error = useSelector(selectHirerError('jobs'));
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    skills: [],
    description: '',
    requirements: '',
    paymentType: 'hourly',
    budget: {
      min: 0,
      max: 0,
      fixed: 0
    },
    experience: 'entry',
    duration: '',
    locationType: 'remote',
    location: '',
    questions: [],
    visibility: 'public',
    draft: false
  });
  const [newSkill, setNewSkill] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Available categories and skills for selection
  const categories = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Graphic Design',
    'Content Writing',
    'Translation',
    'Marketing',
    'Sales',
    'Customer Service',
    'Admin Support',
    'Data Entry',
    'Business Analysis',
    'Project Management',
    'Other'
  ];
  
  const popularSkills = [
    'JavaScript', 'React', 'Angular', 'Vue.js', 'Node.js',
    'HTML', 'CSS', 'Sass', 'Python', 'Java', 'PHP',
    'C++', 'C#', 'Swift', 'Kotlin', 'Flutter', 'React Native',
    'SQL', 'MongoDB', 'Firebase', 'AWS', 'Docker', 'Figma',
    'Photoshop', 'Illustrator', 'SEO', 'SEM', 'Content Marketing',
    'Social Media Marketing', 'Microsoft Office', 'WordPress'
  ];
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like budget.min
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'number' ? Number(value) : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };
  
  // Handle skills changes
  const handleSkillsChange = (event, newSkills) => {
    setFormData({
      ...formData,
      skills: newSkills
    });
  };
  
  // Add custom skill
  const handleAddSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill]
      });
      setNewSkill('');
    }
  };
  
  // Remove skill
  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };
  
  // Add screening question
  const handleAddQuestion = () => {
    if (newQuestion) {
      setFormData({
        ...formData,
        questions: [...formData.questions, newQuestion]
      });
      setNewQuestion('');
    }
  };
  
  // Remove question
  const handleRemoveQuestion = (index) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (activeStep === 0) {
      if (!formData.title.trim()) {
        errors.title = 'Job title is required';
      }
      
      if (!formData.category) {
        errors.category = 'Please select a category';
      }
      
      if (formData.skills.length === 0) {
        errors.skills = 'Please add at least one required skill';
      }
    }
    
    if (activeStep === 1) {
      if (!formData.description.trim()) {
        errors.description = 'Job description is required';
      }
      
      if (!formData.requirements.trim()) {
        errors.requirements = 'Job requirements are required';
      }
    }
    
    if (activeStep === 2) {
      if (formData.paymentType === 'hourly') {
        if (formData.budget.min <= 0) {
          errors['budget.min'] = 'Minimum hourly rate is required';
        }
        
        if (formData.budget.max <= 0) {
          errors['budget.max'] = 'Maximum hourly rate is required';
        }
        
        if (formData.budget.min > formData.budget.max) {
          errors['budget.min'] = 'Minimum rate cannot be greater than maximum rate';
        }
      } else if (formData.paymentType === 'fixed') {
        if (formData.budget.fixed <= 0) {
          errors['budget.fixed'] = 'Fixed price is required';
        }
      }
      
      if (!formData.duration.trim()) {
        errors.duration = 'Please specify project duration';
      }
    }
    
    if (activeStep === 3) {
      if (formData.locationType === 'onsite' && !formData.location.trim()) {
        errors.location = 'Location is required for onsite jobs';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (validateForm()) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (asDraft = false) => {
    try {
      // Set draft status
      const jobData = {
        ...formData,
        draft: asDraft
      };
      
      // Dispatch job creation action
      await dispatch(createHirerJob(jobData)).unwrap();
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        skills: [],
        description: '',
        requirements: '',
        paymentType: 'hourly',
        budget: {
          min: 0,
          max: 0,
          fixed: 0
        },
        experience: 'entry',
        duration: '',
        locationType: 'remote',
        location: '',
        questions: [],
        visibility: 'public',
        draft: false
      });
      
      // Move to success step
      setActiveStep(5);
    } catch (err) {
      console.error('Job posting failed:', err);
    }
  };
  
  // Navigate to job management
  const handleGoToJobManagement = () => {
    navigate('/hirer/jobs');
  };
  
  // Post another job
  const handlePostAnother = () => {
    setActiveStep(0);
    setSubmitSuccess(false);
  };
  
  // Define steps for the job posting process
  const steps = [
    'Job Basics',
    'Description',
    'Budget & Timeline',
    'Location',
    'Review & Post'
  ];
  
  // Render form steps
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Job Basics
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Let's start with the basics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a clear job title and select the relevant category to help talents find your job.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!validationErrors.title}
                helperText={validationErrors.title || "e.g., 'Full Stack Developer' or 'UI/UX Designer'"}
                placeholder="Enter a clear, specific job title"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!validationErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category"
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.category && (
                  <Typography color="error" variant="caption">
                    {validationErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Required Skills
              </Typography>
              <Autocomplete
                multiple
                freeSolo
                options={popularSkills.filter(skill => !formData.skills.includes(skill))}
                value={formData.skills}
                onChange={handleSkillsChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skills"
                    placeholder="Add skills"
                    error={!!validationErrors.skills}
                    helperText={validationErrors.skills}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  label="Experience Level"
                >
                  <MenuItem value="entry">Entry Level</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 1: // Description & Requirements
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Describe your job in detail
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Provide a clear description of the job responsibilities and the requirements for applicants.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={6}
                maxRows={10}
                label="Job Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                placeholder="Describe the job responsibilities, project scope, and deliverables. Be as specific as possible."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={4}
                maxRows={8}
                label="Requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                error={!!validationErrors.requirements}
                helperText={validationErrors.requirements}
                placeholder="List qualifications, experience, and any specific requirements for applicants."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Screening Questions (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Add screening questions to get more information from applicants.
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Screening Question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g., 'How many years of experience do you have with React?'"
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddQuestion}
                  disabled={!newQuestion}
                  sx={{ ml: 1, whiteSpace: 'nowrap' }}
                >
                  Add
                </Button>
              </Box>
              
              {formData.questions.length > 0 && (
                <Stack spacing={1}>
                  {formData.questions.map((question, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {index + 1}. {question}
                      </Typography>
                      <IconButton size="small" onClick={() => handleRemoveQuestion(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Grid>
          </Grid>
        );
        
      case 2: // Budget & Timeline
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Set your budget and timeline
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Specify how you want to pay and the expected duration of the project.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Payment Type
                </Typography>
                <RadioGroup
                  row
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                >
                  <FormControlLabel value="hourly" control={<Radio />} label="Hourly Rate" />
                  <FormControlLabel value="fixed" control={<Radio />} label="Fixed Price" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {formData.paymentType === 'hourly' ? (
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Hourly Rate ($)"
                    name="budget.min"
                    value={formData.budget.min}
                    onChange={handleChange}
                    error={!!validationErrors['budget.min']}
                    helperText={validationErrors['budget.min']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Hourly Rate ($)"
                    name="budget.max"
                    value={formData.budget.max}
                    onChange={handleChange}
                    error={!!validationErrors['budget.max']}
                    helperText={validationErrors['budget.max']}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fixed Budget ($)"
                  name="budget.fixed"
                  value={formData.budget.fixed}
                  onChange={handleChange}
                  error={!!validationErrors['budget.fixed']}
                  helperText={validationErrors['budget.fixed']}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                error={!!validationErrors.duration}
                helperText={validationErrors.duration || "e.g., '2 weeks', '3 months'"}
                placeholder="How long do you expect this project to take"
              />
            </Grid>
          </Grid>
        );
        
      case 3: // Location
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Specify job location
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Let talents know if this is a remote job or requires on-site presence.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Location Type
                </Typography>
                <RadioGroup
                  row
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleChange}
                >
                  <FormControlLabel value="remote" control={<Radio />} label="Remote" />
                  <FormControlLabel value="onsite" control={<Radio />} label="On-site" />
                  <FormControlLabel value="hybrid" control={<Radio />} label="Hybrid" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            {(formData.locationType === 'onsite' || formData.locationType === 'hybrid') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  error={!!validationErrors.location}
                  helperText={validationErrors.location || 'Specify city, state, and country'}
                  placeholder="e.g., 'New York, NY, USA'"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Visibility Settings
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Job Visibility</InputLabel>
                <Select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  label="Job Visibility"
                >
                  <MenuItem value="public">Public (visible to all talents)</MenuItem>
                  <MenuItem value="private">Private (by invitation only)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 4: // Review & Post
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review your job posting
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review your job details before posting.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5">{formData.title}</Typography>
                  <Chip 
                    icon={<CategoryIcon />} 
                    label={formData.category} 
                    variant="outlined" 
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.skills.map((skill) => (
                    <Chip 
                      key={skill} 
                      label={skill} 
                      size="small" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Chip 
                    icon={<MoneyIcon />} 
                    label={
                      formData.paymentType === 'hourly' 
                        ? `$${formData.budget.min}-${formData.budget.max}/hr` 
                        : `$${formData.budget.fixed} (Fixed)`
                    } 
                  />
                  <Chip 
                    icon={<LocationIcon />} 
                    label={
                      formData.locationType === 'remote' 
                        ? 'Remote' 
                        : formData.locationType === 'hybrid' 
                          ? `Hybrid (${formData.location})` 
                          : formData.location
                    } 
                  />
                </Box>
                
                <Typography variant="subtitle1" gutterBottom>
                  Experience Level
                </Typography>
                <Typography variant="body2" paragraph>
                  {formData.experience === 'entry' 
                    ? 'Entry Level' 
                    : formData.experience === 'intermediate' 
                      ? 'Intermediate' 
                      : 'Expert'}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Duration
                </Typography>
                <Typography variant="body2" paragraph>
                  {formData.duration}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {formData.description}
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Requirements
                </Typography>
                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {formData.requirements}
                </Typography>
                
                {formData.questions.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Screening Questions
                    </Typography>
                    <Stack spacing={1}>
                      {formData.questions.map((question, index) => (
                        <Typography key={index} variant="body2">
                          {index + 1}. {question}
                        </Typography>
                      ))}
                    </Stack>
                  </>
                )}
              </Paper>
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Grid>
            )}
          </Grid>
        );
        
      case 5: // Success
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Job Posted Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {formData.draft 
                ? 'Your job has been saved as a draft. You can edit and publish it later.' 
                : 'Your job is now live. You will be notified when talents apply.'}
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={handlePostAnother}
              >
                Post Another Job
              </Button>
              <Button 
                variant="contained" 
                onClick={handleGoToJobManagement}
              >
                Manage Jobs
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Helmet>
        <title>Post a Job | Kelmah</title>
      </Helmet>
      
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Post a Job
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a detailed job posting to find the perfect talent for your project
        </Typography>
      </Box>
      
      {/* Job posting stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Step content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {getStepContent(activeStep)}
      </Paper>
      
      {/* Navigation buttons */}
      {activeStep !== 5 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<BackIcon />}
            disabled={activeStep === 0}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(true)}
                  startIcon={<SaveIcon />}
                  sx={{ mr: 1 }}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmit(false)}
                  endIcon={<PublishIcon />}
                  disabled={isLoading}
                  color="primary"
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Post Job'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NextIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default JobPostingPage; 