import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  LibraryAdd as CloneIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  AddCircle as AddCircleIcon,
  Delete as RemoveIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`skills-admin-tabpanel-${index}`}
      aria-labelledby={`skills-admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SkillsAssessmentManagement = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // States for tests management
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // States for test form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skillCategory: '',
    timeLimit: 30,
    passingScore: 70,
    isActive: true,
    questions: []
  });
  
  // States for metrics
  const [metrics, setMetrics] = useState({
    totalTests: 0,
    totalAssessmentsTaken: 0,
    passRate: 0,
    popularSkills: [],
    certificationsByMonth: []
  });
  
  const [categories, setCategories] = useState([]);
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    imageUrl: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });
  
  // Load initial data
  useEffect(() => {
    fetchTests();
    fetchCategories();
    if (tabValue === 2) {
      fetchMetrics();
    }
  }, [tabValue]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Fetch tests
  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/admin/skills/tests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setTests(response.data.data);
      
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch skill categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/skills/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setCategories(response.data.data);
      
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  // Fetch metrics
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/admin/skills/metrics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setMetrics(response.data.data);
      
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Create or update test
  const handleSaveTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (currentTest) {
        // Update existing test
        await axios.put(
          `${API_URL}/admin/skills/tests/${currentTest.id}`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } else {
        // Create new test
        await axios.post(
          `${API_URL}/admin/skills/tests`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      }
      
      // Refresh the tests list
      fetchTests();
      handleCloseDialog();
      
    } catch (err) {
      console.error('Error saving test:', err);
      setError('Failed to save test. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete test
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_URL}/admin/skills/tests/${testId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Refresh the tests list
      fetchTests();
      
    } catch (err) {
      console.error('Error deleting test:', err);
      setError('Failed to delete test. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Clone test
  const handleCloneTest = async (testId) => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post(
        `${API_URL}/admin/skills/tests/${testId}/clone`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Refresh the tests list
      fetchTests();
      
    } catch (err) {
      console.error('Error cloning test:', err);
      setError('Failed to clone test. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open dialog to create new test
  const handleOpenCreateDialog = () => {
    setCurrentTest(null);
    setFormData({
      title: '',
      description: '',
      skillCategory: '',
      timeLimit: 30,
      passingScore: 70,
      isActive: true,
      questions: []
    });
    setOpenDialog(true);
  };
  
  // Open dialog to edit test
  const handleOpenEditDialog = async (test) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch full test details including questions
      const response = await axios.get(`${API_URL}/admin/skills/tests/${test.id}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const testWithQuestions = response.data.data;
      setCurrentTest(testWithQuestions);
      setFormData({
        title: testWithQuestions.title,
        description: testWithQuestions.description,
        skillCategory: testWithQuestions.skillCategory,
        timeLimit: testWithQuestions.timeLimit,
        passingScore: testWithQuestions.passingScore,
        isActive: testWithQuestions.isActive,
        questions: testWithQuestions.questions || []
      });
      setOpenDialog(true);
      
    } catch (err) {
      console.error('Error fetching test details:', err);
      setError('Failed to load test details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTest(null);
    setFormData({
      title: '',
      description: '',
      skillCategory: '',
      timeLimit: 30,
      passingScore: 70,
      isActive: true,
      questions: []
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Open dialog to create/edit question
  const handleOpenQuestionDialog = (index = -1) => {
    if (index === -1) {
      // Create new question
      setQuestionFormData({
        text: '',
        imageUrl: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      });
    } else {
      // Edit existing question
      const question = formData.questions[index];
      setQuestionFormData({
        text: question.text,
        imageUrl: question.imageUrl || '',
        options: question.options.length > 0 ? [...question.options] : [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      });
    }
    
    setCurrentQuestionIndex(index);
    setOpenQuestionDialog(true);
  };
  
  // Close question dialog
  const handleCloseQuestionDialog = () => {
    setOpenQuestionDialog(false);
    setCurrentQuestionIndex(-1);
  };
  
  // Save question
  const handleSaveQuestion = () => {
    // Validate question
    if (!questionFormData.text.trim()) {
      setError('Question text is required.');
      return;
    }
    
    // Ensure at least one correct answer is selected
    if (!questionFormData.options.some(option => option.isCorrect)) {
      setError('At least one option must be marked as correct.');
      return;
    }
    
    // Ensure all options have text
    if (questionFormData.options.some(option => !option.text.trim())) {
      setError('All options must have text.');
      return;
    }
    
    const updatedQuestions = [...formData.questions];
    const newQuestion = {
      ...questionFormData,
      id: currentQuestionIndex === -1 ? `temp_${Date.now()}` : updatedQuestions[currentQuestionIndex].id
    };
    
    if (currentQuestionIndex === -1) {
      // Add new question
      updatedQuestions.push(newQuestion);
    } else {
      // Update existing question
      updatedQuestions[currentQuestionIndex] = newQuestion;
    }
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
    
    handleCloseQuestionDialog();
  };
  
  // Delete question
  const handleDeleteQuestion = (index) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions.splice(index, 1);
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };
  
  // Handle question form input changes
  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setQuestionFormData({
      ...questionFormData,
      [name]: value
    });
  };
  
  // Handle option input changes
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...questionFormData.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    
    // If marking an option as correct in single-answer mode, unmark others
    if (field === 'isCorrect' && value === true) {
      updatedOptions.forEach((option, i) => {
        if (i !== index) {
          option.isCorrect = false;
        }
      });
    }
    
    setQuestionFormData({
      ...questionFormData,
      options: updatedOptions
    });
  };
  
  // Add option
  const handleAddOption = () => {
    if (questionFormData.options.length >= 8) {
      setError('Maximum 8 options allowed per question.');
      return;
    }
    
    setQuestionFormData({
      ...questionFormData,
      options: [...questionFormData.options, { text: '', isCorrect: false }]
    });
  };
  
  // Remove option
  const handleRemoveOption = (index) => {
    if (questionFormData.options.length <= 2) {
      setError('Minimum 2 options required per question.');
      return;
    }
    
    const updatedOptions = [...questionFormData.options];
    updatedOptions.splice(index, 1);
    setQuestionFormData({
      ...questionFormData,
      options: updatedOptions
    });
  };
  
  // Filter tests based on search query and selected category
  const filteredTests = tests.filter(test => {
    const matchesQuery = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || test.skillCategory === selectedCategory;
    return matchesQuery && matchesCategory;
  });
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Skills Assessment Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, edit, and manage skill assessments for the platform.
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<AssessmentIcon />} label="Tests" />
          <Tab icon={<SchoolIcon />} label="Categories" />
          <Tab icon={<BarChartIcon />} label="Metrics" />
        </Tabs>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Tests Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, width: '70%' }}>
            <TextField
              label="Search Tests"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Test
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredTests.length === 0 ? (
          <Alert severity="info">
            No tests found. Create a new test to get started.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Time Limit</TableCell>
                  <TableCell>Passing Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.title}</TableCell>
                    <TableCell>{test.skillCategory}</TableCell>
                    <TableCell>{test.questionCount || 0}</TableCell>
                    <TableCell>{test.timeLimit} min</TableCell>
                    <TableCell>{test.passingScore}%</TableCell>
                    <TableCell>
                      <Chip
                        label={test.isActive ? 'Active' : 'Inactive'}
                        color={test.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(test)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(test)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Clone">
                          <IconButton size="small" onClick={() => handleCloneTest(test.id)}>
                            <CloneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteTest(test.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      {/* Categories Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Skill Categories
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Category
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Tests Count</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>{category.testsCount || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      
      {/* Metrics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Tests
                </Typography>
                <Typography variant="h4">
                  {metrics.totalTests}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Assessments Taken
                </Typography>
                <Typography variant="h4">
                  {metrics.totalAssessmentsTaken}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Passing Rate
                </Typography>
                <Typography variant="h4">
                  {metrics.passRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Certifications Issued
                </Typography>
                <Typography variant="h4">
                  {metrics.certificationsIssued || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Popular Skills */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Most Popular Skills
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Skill</TableCell>
                      <TableCell>Tests Taken</TableCell>
                      <TableCell>Pass Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.popularSkills && metrics.popularSkills.map((skill) => (
                      <TableRow key={skill.id}>
                        <TableCell>{skill.name}</TableCell>
                        <TableCell>{skill.testsTaken}</TableCell>
                        <TableCell>{skill.passRate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          {/* Monthly Certifications */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Certifications by Month
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell>Certifications</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.certificationsByMonth && metrics.certificationsByMonth.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Test Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentTest ? `Edit Test: ${currentTest.title}` : 'Create New Test'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Test Title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Skill Category</InputLabel>
                <Select
                  name="skillCategory"
                  value={formData.skillCategory}
                  onChange={handleInputChange}
                  label="Skill Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                name="timeLimit"
                label="Time Limit (minutes)"
                type="number"
                value={formData.timeLimit}
                onChange={handleInputChange}
                fullWidth
                required
                inputProps={{ min: 5, max: 180 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                name="passingScore"
                label="Passing Score (%)"
                type="number"
                value={formData.passingScore}
                onChange={handleInputChange}
                fullWidth
                required
                inputProps={{ min: 50, max: 100 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Active (available to workers)"
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Questions ({formData.questions.length})
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleOpenQuestionDialog()}
            >
              Add Question
            </Button>
          </Box>
          
          {formData.questions.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No questions added yet. Click "Add Question" to create a new question.
            </Alert>
          ) : (
            formData.questions.map((question, index) => (
              <Paper key={question.id} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Question {index + 1}: {question.text.substring(0, 50)}
                    {question.text.length > 50 ? '...' : ''}
                  </Typography>
                  
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenQuestionDialog(index)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteQuestion(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 1 }}>
                  {question.options.map((option, i) => (
                    <Typography
                      key={i}
                      variant="body2"
                      sx={{
                        color: option.isCorrect ? 'success.main' : 'text.primary',
                        fontWeight: option.isCorrect ? 'bold' : 'normal'
                      }}
                    >
                      {option.isCorrect ? '✓' : '○'} {option.text}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveTest}
            disabled={
              !formData.title ||
              !formData.description ||
              !formData.skillCategory ||
              formData.questions.length === 0
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Question Dialog */}
      <Dialog open={openQuestionDialog} onClose={handleCloseQuestionDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentQuestionIndex === -1 ? 'Add New Question' : 'Edit Question'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="text"
                label="Question Text"
                value={questionFormData.text}
                onChange={handleQuestionInputChange}
                fullWidth
                required
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="imageUrl"
                label="Image URL (optional)"
                value={questionFormData.imageUrl}
                onChange={handleQuestionInputChange}
                fullWidth
                placeholder="https://example.com/image.jpg"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Options (mark correct answer)
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddCircleIcon />}
                  onClick={handleAddOption}
                >
                  Add Option
                </Button>
              </Box>
              
              {questionFormData.options.map((option, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    p: 1,
                    border: '1px solid',
                    borderColor: option.isCorrect ? 'success.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: option.isCorrect ? 'success.light' : 'background.paper',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                        color="success"
                      />
                    }
                    label="Correct"
                    sx={{ minWidth: 110 }}
                  />
                  
                  <TextField
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    fullWidth
                    size="small"
                    required
                  />
                  
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveOption(index)}
                    disabled={questionFormData.options.length <= 2}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuestionDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveQuestion}
            disabled={!questionFormData.text || questionFormData.options.some(o => !o.text)}
          >
            Save Question
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SkillsAssessmentManagement; 