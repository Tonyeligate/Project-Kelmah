import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Paper,
  Divider,
  InputAdornment,
  Slider,
  FormHelperText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  AttachMoney, 
  AddCircleOutline, 
  Image as ImageIcon,
  LocationOn,
  Work,
  Description,
  Close,
  ArrowBack,
  Save
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Styled components
const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
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

const SubmitButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8))',
  color: '#000',
  padding: theme.spacing(1.5, 3),
  fontWeight: 'bold',
  borderRadius: theme.spacing(1),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(45deg, rgba(255, 215, 0, 1), rgba(255, 165, 0, 1))',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
}));

const ImagePreview = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 200,
  borderRadius: theme.spacing(1),
  border: '1px dashed rgba(255, 215, 0, 0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#FFD700',
    background: 'rgba(255, 215, 0, 0.05)',
  },
}));

// Job categories
const JOB_CATEGORIES = [
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

const JobSubmissionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    rateType: 'hourly',
    minRate: 20,
    maxRate: 50,
    skills: [],
    deadline: '',
    images: []
  });
  const [skill, setSkill] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setJobData({
      ...jobData,
      [name]: value
    });
  };

  const handleRateChange = (event, newValue) => {
    setJobData({
      ...jobData,
      minRate: newValue[0],
      maxRate: newValue[1]
    });
  };

  const handleAddSkill = () => {
    if (skill.trim() !== '' && !jobData.skills.includes(skill.trim())) {
      setJobData({
        ...jobData,
        skills: [...jobData.skills, skill.trim()]
      });
      setSkill('');
    }
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter' && skill.trim() !== '') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setJobData({
      ...jobData,
      skills: jobData.skills.filter(s => s !== skillToRemove)
    });
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const newImages = [...jobData.images, ...files];
    setJobData({
      ...jobData,
      images: newImages
    });

    // Create image previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...jobData.images];
    newImages.splice(index, 1);
    setJobData({
      ...jobData,
      images: newImages
    });

    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!jobData.title || !jobData.description || !jobData.category || !jobData.location) {
        throw new Error('Please fill all required fields');
      }

      // In a real app, this would be an API call to submit the job
      // Using setTimeout to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setSuccessDialogOpen(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to submit job. Please try again.');
      setLoading(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setSuccessDialogOpen(false);
    navigate('/jobs');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      py: 8, 
      px: 2,
      background: '#1a1a1a'
    }}>
      <Container maxWidth="lg">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/jobs')}
            sx={{ 
              mb: 3, 
              color: '#FFD700',
              '&:hover': {
                background: 'rgba(255, 215, 0, 0.1)',
              }
            }}
          >
            Back to Jobs
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FormPaper elevation={3}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                mb: 4,
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}
            >
              Post a New Job
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, background: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Job Title */}
                <Grid item xs={12}>
                  <StyledTextField
                    name="title"
                    label="Job Title"
                    required
                    fullWidth
                    value={jobData.title}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Work sx={{ color: 'rgba(255, 215, 0, 0.7)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Category and Location */}
                <Grid item xs={12} sm={6}>
                  <StyledFormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={jobData.category}
                      onChange={handleChange}
                      label="Category"
                    >
                      {JOB_CATEGORIES.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </StyledFormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    name="location"
                    label="Location"
                    required
                    fullWidth
                    value={jobData.location}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: 'rgba(255, 215, 0, 0.7)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <StyledTextField
                    name="description"
                    label="Job Description"
                    required
                    fullWidth
                    multiline
                    rows={6}
                    value={jobData.description}
                    onChange={handleChange}
                    placeholder="Provide a detailed description of the job..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                          <Description sx={{ color: 'rgba(255, 215, 0, 0.7)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Rate Type and Range */}
                <Grid item xs={12} sm={4}>
                  <StyledFormControl fullWidth>
                    <InputLabel>Rate Type</InputLabel>
                    <Select
                      name="rateType"
                      value={jobData.rateType}
                      onChange={handleChange}
                      label="Rate Type"
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="fixed">Fixed</MenuItem>
                    </Select>
                  </StyledFormControl>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#FFD700' }}>
                    Rate Range (${jobData.minRate} - ${jobData.maxRate}/{jobData.rateType === 'hourly' ? 'hr' : 'fixed'})
                  </Typography>
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={[jobData.minRate, jobData.maxRate]}
                      onChange={handleRateChange}
                      valueLabelDisplay="auto"
                      min={5}
                      max={200}
                      sx={{
                        color: '#FFD700',
                        '& .MuiSlider-thumb': {
                          width: 12,
                          height: 12,
                          transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                          '&::before': {
                            boxShadow: '0 2px 12px 0 rgba(255, 215, 0, 0.4)',
                          },
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0px 0px 0px 8px rgba(255, 215, 0, 0.16)',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Skills */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#FFD700' }}>
                    Required Skills
                  </Typography>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <StyledTextField
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      onKeyPress={handleSkillKeyPress}
                      placeholder="Add a required skill"
                      variant="outlined"
                      sx={{ mr: 1, flexGrow: 1 }}
                    />
                    <Button
                      onClick={handleAddSkill}
                      variant="outlined"
                      sx={{
                        color: '#FFD700',
                        borderColor: 'rgba(255, 215, 0, 0.5)',
                        '&:hover': {
                          borderColor: '#FFD700',
                          background: 'rgba(255, 215, 0, 0.1)',
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {jobData.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        onDelete={() => handleRemoveSkill(skill)}
                        sx={{
                          background: 'rgba(255, 215, 0, 0.1)',
                          color: '#FFD700',
                          borderColor: 'rgba(255, 215, 0, 0.3)',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255, 215, 0, 0.7)',
                            '&:hover': {
                              color: '#FFD700',
                            }
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Deadline */}
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    name="deadline"
                    label="Deadline"
                    type="date"
                    fullWidth
                    value={jobData.deadline}
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                {/* Upload Images */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1, color: '#FFD700' }}>
                    Project Images (Optional)
                  </Typography>
                  <input
                    accept="image/*"
                    id="project-images"
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <Grid container spacing={2}>
                    {previewImages.map((preview, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <ImagePreview>
                          <Box
                            component="img"
                            src={preview}
                            alt={`Preview ${index}`}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: 'rgba(0, 0, 0, 0.5)',
                              color: '#fff',
                              '&:hover': {
                                background: 'rgba(0, 0, 0, 0.7)',
                              }
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </ImagePreview>
                      </Grid>
                    ))}
                    <Grid item xs={12} sm={4}>
                      <label htmlFor="project-images">
                        <ImagePreview>
                          <Box sx={{ textAlign: 'center' }}>
                            <ImageIcon sx={{ fontSize: 48, color: 'rgba(255, 215, 0, 0.5)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                              Click to upload images
                            </Typography>
                          </Box>
                        </ImagePreview>
                      </label>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <SubmitButton
                      type="submit"
                      fullWidth
                      size="large"
                      disabled={loading}
                      startIcon={<Save />}
                    >
                      Post Job
                    </SubmitButton>
                    {loading && (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: '#FFD700',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: '-12px',
                          marginLeft: '-12px',
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </form>
          </FormPaper>
        </motion.div>

        {/* Success Dialog */}
        <Dialog
          open={successDialogOpen}
          onClose={handleCloseSuccessDialog}
          PaperProps={{
            sx: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ color: '#4caf50' }}>
            Job Posted Successfully!
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Your job has been posted and is now visible to workers. You'll be notified when someone applies.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseSuccessDialog} 
              sx={{ 
                color: '#FFD700',
                '&:hover': {
                  background: 'rgba(255, 215, 0, 0.1)',
                }
              }}
            >
              View Jobs
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default JobSubmissionPage;
