import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Avatar,
  Divider,
  Tooltip,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Water as WaterIcon,
  ElectricalServices as ElectricalIcon,
  DirectionsCar as MechanicIcon,
  Checkroom as TailorIcon,
  Agriculture as AgricultureIcon,
  Security as SecurityIcon,
  CleaningServices as CleaningIcon,
  Restaurant as CateringIcon,
  LocalShipping as LogisticsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const GhanaJobCategoriesManagement = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'build',
    color: '#FFD700',
    isActive: true,
    requirements: [],
    skills: [],
    averageRate: 0,
    demandLevel: 'medium',
    region: 'all'
  });

  // Pre-defined Ghana job categories
  const ghanaJobCategories = [
    {
      id: 1,
      name: 'Carpentry & Woodwork',
      description: 'Furniture making, wood construction, cabinet work',
      icon: 'build',
      color: '#8B4513',
      isActive: true,
      totalWorkers: 2847,
      activeJobs: 156,
      averageRate: 45,
      demandLevel: 'high',
      region: 'all',
      skills: ['Wood Carving', 'Furniture Making', 'Cabinet Installation', 'Wood Finishing'],
      requirements: ['Basic Tools', '2+ Years Experience'],
      growthRate: 23.5,
      topRegions: ['Greater Accra', 'Ashanti', 'Western']
    },
    {
      id: 2,
      name: 'Masonry & Construction',
      description: 'Building construction, bricklaying, concrete work',
      icon: 'home',
      color: '#CD853F',
      isActive: true,
      totalWorkers: 3201,
      activeJobs: 234,
      averageRate: 55,
      demandLevel: 'high',
      region: 'all',
      skills: ['Bricklaying', 'Concrete Work', 'Plastering', 'Tile Installation'],
      requirements: ['Physical Fitness', 'Construction Experience'],
      growthRate: 18.7,
      topRegions: ['Greater Accra', 'Ashanti', 'Eastern']
    },
    {
      id: 3,
      name: 'Plumbing & Water Systems',
      description: 'Water installation, pipe fitting, drainage systems',
      icon: 'water',
      color: '#4169E1',
      isActive: true,
      totalWorkers: 1543,
      activeJobs: 89,
      averageRate: 60,
      demandLevel: 'high',
      region: 'all',
      skills: ['Pipe Installation', 'Water Heater Setup', 'Drainage Systems', 'Leak Repair'],
      requirements: ['Licensed Plumber', 'Tools & Equipment'],
      growthRate: 31.2,
      topRegions: ['Greater Accra', 'Ashanti', 'Central']
    },
    {
      id: 4,
      name: 'Electrical Services',
      description: 'Electrical installation, wiring, appliance repair',
      icon: 'electrical',
      color: '#FFD700',
      isActive: true,
      totalWorkers: 1876,
      activeJobs: 167,
      averageRate: 70,
      demandLevel: 'very_high',
      region: 'all',
      skills: ['House Wiring', 'Appliance Repair', 'Solar Installation', 'Electrical Safety'],
      requirements: ['Electrical License', 'Safety Certification'],
      growthRate: 42.3,
      topRegions: ['Greater Accra', 'Ashanti', 'Northern']
    },
    {
      id: 5,
      name: 'Tailoring & Fashion',
      description: 'Clothing design, garment making, alterations',
      icon: 'tailor',
      color: '#FF1493',
      isActive: true,
      totalWorkers: 4523,
      activeJobs: 298,
      averageRate: 35,
      demandLevel: 'medium',
      region: 'all',
      skills: ['Kente Weaving', 'Garment Making', 'Alterations', 'Fashion Design'],
      requirements: ['Sewing Skills', 'Fashion Training'],
      growthRate: 15.8,
      topRegions: ['Greater Accra', 'Ashanti', 'Volta']
    },
    {
      id: 6,
      name: 'Auto Mechanics',
      description: 'Vehicle repair, maintenance, diagnostic services',
      icon: 'mechanic',
      color: '#2F4F4F',
      isActive: true,
      totalWorkers: 2134,
      activeJobs: 145,
      averageRate: 50,
      demandLevel: 'high',
      region: 'all',
      skills: ['Engine Repair', 'Auto Diagnosis', 'Brake Systems', 'AC Repair'],
      requirements: ['Mechanical Training', 'Diagnostic Tools'],
      growthRate: 12.4,
      topRegions: ['Greater Accra', 'Ashanti', 'Western']
    },
    {
      id: 7,
      name: 'Agriculture & Farming',
      description: 'Crop cultivation, livestock management, agro-processing',
      icon: 'agriculture',
      color: '#228B22',
      isActive: true,
      totalWorkers: 1876,
      activeJobs: 78,
      averageRate: 30,
      demandLevel: 'medium',
      region: 'rural',
      skills: ['Crop Farming', 'Livestock Care', 'Irrigation', 'Pest Control'],
      requirements: ['Agricultural Knowledge', 'Physical Stamina'],
      growthRate: 8.9,
      topRegions: ['Northern', 'Upper East', 'Brong Ahafo']
    },
    {
      id: 8,
      name: 'Security Services',
      description: 'Property security, event security, personal protection',
      icon: 'security',
      color: '#800080',
      isActive: true,
      totalWorkers: 3456,
      activeJobs: 203,
      averageRate: 25,
      demandLevel: 'high',
      region: 'all',
      skills: ['Security Training', 'Surveillance', 'Crowd Control', 'Emergency Response'],
      requirements: ['Security License', 'Background Check'],
      growthRate: 19.6,
      topRegions: ['Greater Accra', 'Ashanti', 'Western']
    },
    {
      id: 9,
      name: 'Cleaning Services',
      description: 'House cleaning, office cleaning, deep cleaning',
      icon: 'cleaning',
      color: '#40E0D0',
      isActive: true,
      totalWorkers: 5234,
      activeJobs: 412,
      averageRate: 20,
      demandLevel: 'very_high',
      region: 'all',
      skills: ['Deep Cleaning', 'Carpet Cleaning', 'Window Cleaning', 'Sanitization'],
      requirements: ['Cleaning Supplies', 'Reliability'],
      growthRate: 34.7,
      topRegions: ['Greater Accra', 'Ashanti', 'Central']
    },
    {
      id: 10,
      name: 'Catering & Food Services',
      description: 'Event catering, food preparation, local cuisine',
      icon: 'catering',
      color: '#FF4500',
      isActive: true,
      totalWorkers: 2987,
      activeJobs: 234,
      averageRate: 40,
      demandLevel: 'high',
      region: 'all',
      skills: ['Local Cuisine', 'Event Catering', 'Food Safety', 'Menu Planning'],
      requirements: ['Food Handler Permit', 'Cooking Experience'],
      growthRate: 25.3,
      topRegions: ['Greater Accra', 'Ashanti', 'Central']
    }
  ];

  useEffect(() => {
    // Simulate loading Ghana job categories
    setLoading(true);
    setTimeout(() => {
      setCategories(ghanaJobCategories);
      setLoading(false);
    }, 1000);
  }, []);

  const handleOpenDialog = (mode, category = null) => {
    setDialogMode(mode);
    setEditingCategory(category);
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: '',
        description: '',
        icon: 'build',
        color: '#FFD700',
        isActive: true,
        requirements: [],
        skills: [],
        averageRate: 0,
        demandLevel: 'medium',
        region: 'all'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = () => {
    if (dialogMode === 'add') {
      const newCategory = {
        ...formData,
        id: categories.length + 1,
        totalWorkers: Math.floor(Math.random() * 5000) + 500,
        activeJobs: Math.floor(Math.random() * 300) + 50,
        growthRate: Math.floor(Math.random() * 40) + 5,
        topRegions: ['Greater Accra', 'Ashanti']
      };
      setCategories([...categories, newCategory]);
    } else if (dialogMode === 'edit') {
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { ...formData } : cat
      ));
    }
    handleCloseDialog();
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const handleToggleStatus = (categoryId) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    ));
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      build: BuildIcon,
      home: HomeIcon,
      water: WaterIcon,
      electrical: ElectricalIcon,
      mechanic: MechanicIcon,
      tailor: TailorIcon,
      agriculture: AgricultureIcon,
      security: SecurityIcon,
      cleaning: CleaningIcon,
      catering: CateringIcon,
      logistics: LogisticsIcon,
    };
    const IconComponent = iconMap[iconName] || BuildIcon;
    return <IconComponent />;
  };

  const getDemandLevelColor = (level) => {
    const colorMap = {
      low: 'error',
      medium: 'warning',
      high: 'info',
      very_high: 'success'
    };
    return colorMap[level] || 'default';
  };

  const getDemandLevelText = (level) => {
    const textMap = {
      low: 'Low Demand',
      medium: 'Medium Demand',
      high: 'High Demand',
      very_high: 'Very High Demand'
    };
    return textMap[level] || 'Unknown';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🇬🇭 Ghana Job Categories Management
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
        <Typography sx={{ mt: 2 }}>Loading Ghana vocational categories...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🇬🇭 Ghana Job Categories Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
          sx={{
            background: 'linear-gradient(45deg, #FFD700, #DAA520)',
            color: '#1a1a1a',
            fontWeight: 600,
          }}
        >
          Add New Category
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#FFD700', color: '#1a1a1a' }}>
                  <WorkIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{categories.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Categories
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4CAF50', color: 'white' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {categories.reduce((sum, cat) => sum + cat.totalWorkers, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Workers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#2196F3', color: 'white' }}>
                  <WorkIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {categories.reduce((sum, cat) => sum + cat.activeJobs, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Jobs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#FF9800', color: 'white' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {(categories.reduce((sum, cat) => sum + cat.growthRate, 0) / categories.length).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Growth Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Categories Table */}
      <Card>
        <CardHeader 
          title="Job Categories"
          subheader="Manage vocational job categories for Ghana's skilled workers"
        />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Workers</TableCell>
                  <TableCell>Active Jobs</TableCell>
                  <TableCell>Avg Rate (GHS/hour)</TableCell>
                  <TableCell>Demand Level</TableCell>
                  <TableCell>Growth Rate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: category.color, width: 40, height: 40 }}>
                          {getIconComponent(category.icon)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {category.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {category.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {category.totalWorkers.toLocaleString()}
                        </Typography>
                        <PeopleIcon fontSize="small" color="action" />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={category.activeJobs} color="primary">
                        <WorkIcon color="action" />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        GHS {category.averageRate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getDemandLevelText(category.demandLevel)}
                        color={getDemandLevelColor(category.demandLevel)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          +{category.growthRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={category.isActive}
                        onChange={() => handleToggleStatus(category.id)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog('view', category)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Category">
                          <IconButton 
                            size="small"
                            onClick={() => handleOpenDialog('edit', category)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Category">
                          <IconButton 
                            size="small"
                            onClick={() => handleDeleteCategory(category.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' && 'Add New Job Category'}
          {dialogMode === 'edit' && 'Edit Job Category'}
          {dialogMode === 'view' && 'Category Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Icon</InputLabel>
                <Select
                  value={formData.icon}
                  label="Icon"
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="build">🔨 Build</MenuItem>
                  <MenuItem value="home">🏠 Home</MenuItem>
                  <MenuItem value="water">💧 Water</MenuItem>
                  <MenuItem value="electrical">⚡ Electrical</MenuItem>
                  <MenuItem value="mechanic">🚗 Mechanic</MenuItem>
                  <MenuItem value="tailor">👗 Tailor</MenuItem>
                  <MenuItem value="agriculture">🌾 Agriculture</MenuItem>
                  <MenuItem value="security">🛡️ Security</MenuItem>
                  <MenuItem value="cleaning">🧽 Cleaning</MenuItem>
                  <MenuItem value="catering">🍽️ Catering</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Demand Level</InputLabel>
                <Select
                  value={formData.demandLevel}
                  label="Demand Level"
                  onChange={(e) => setFormData({ ...formData, demandLevel: e.target.value })}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="low">Low Demand</MenuItem>
                  <MenuItem value="medium">Medium Demand</MenuItem>
                  <MenuItem value="high">High Demand</MenuItem>
                  <MenuItem value="very_high">Very High Demand</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Average Rate (GHS/hour)"
                type="number"
                value={formData.averageRate}
                onChange={(e) => setFormData({ ...formData, averageRate: Number(e.target.value) })}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={dialogMode === 'view'}
                  />
                }
                label="Active Category"
              />
            </Grid>
            
            {dialogMode === 'view' && editingCategory && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Category Statistics</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {editingCategory.totalWorkers.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">Total Workers</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {editingCategory.activeJobs.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">Active Jobs</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        +{editingCategory.growthRate}%
                      </Typography>
                      <Typography variant="body2">Growth Rate</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Top Skills:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {editingCategory.skills?.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Top Regions:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {editingCategory.topRegions?.map((region, index) => (
                      <Chip key={index} label={region} size="small" color="primary" />
                    ))}
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button 
              variant="contained" 
              onClick={handleSaveCategory}
              sx={{
                background: 'linear-gradient(45deg, #FFD700, #DAA520)',
                color: '#1a1a1a',
              }}
            >
              {dialogMode === 'add' ? 'Add Category' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GhanaJobCategoriesManagement;
