import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';"
import portfolioService from '../services/portfolioService';
import fileUploadService from '../../common/services/fileUploadService';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Fab,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  StarBorder as FeaturedIcon,
  Category as CategoryIcon,
  DateRange as DateIcon,
  LocationOn as LocationIcon,
  AttachMoney as BudgetIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import ProjectGallery from './ProjectGallery';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const PortfolioManager = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    client: '',
    budget: '',
    duration: '',
    location: '',
    skills: [],
    images: [],
    completedAt: '',
    featured: false,
    status: 'completed', // 'completed', 'in-progress', 'draft'
  });

  const categories = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Masonry',
    'Painting',
    'Roofing',
    'Tiling',
    'Landscaping',
    'HVAC',
    'Other',
  ];

  // Load portfolio items
  const loadPortfolioItems = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await portfolioService.getWorkerPortfolio(user.id);
      const items = payload?.portfolioItems || payload?.items || [];
      setPortfolioItems(items);
      setError(null);
    } catch (err) {
      setError('Failed to load portfolio items');
      enqueueSnackbar('Failed to load portfolio', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user.id, enqueueSnackbar]);

  useEffect(() => {
    if (user?.id) {
      loadPortfolioItems();
    }
  }, [loadPortfolioItems, user]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const portfolioData = {
        ...formData,
        workerId: user.id,
        skills: formData.skills.join(','),
      };

      if (isEditing && selectedItem) {
        await portfolioService.updatePortfolioItem(
          selectedItem.id,
          portfolioData,
        );
        enqueueSnackbar('Portfolio item updated successfully', {
          variant: 'success',
        });
      } else {
        await portfolioService.createPortfolioItem(portfolioData);
        enqueueSnackbar('Portfolio item added successfully', {
          variant: 'success',
        });
      }

      handleCloseDialog();
      loadPortfolioItems();
    } catch (err) {
      enqueueSnackbar('Failed to save portfolio item', { variant: 'error' });
    }
  };

  // Handle delete
  const handleDelete = async (itemId) => {
    if (
      window.confirm('Are you sure you want to delete this portfolio item?')
    ) {
      try {
        await portfolioService.deletePortfolioItem(itemId);
        enqueueSnackbar('Portfolio item deleted successfully', {
          variant: 'success',
        });
        loadPortfolioItems();
      } catch (err) {
        enqueueSnackbar('Failed to delete portfolio item', {
          variant: 'error',
        });
      }
    }
  };

  // Dialog handlers
  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        client: item.client || '',
        budget: item.budget || '',
        duration: item.duration || '',
        location: item.location || '',
        skills: item.skills ? item.skills.split(',') : [],
        images: item.images || [],
        completedAt: item.completedAt || '',
        featured: item.featured || false,
        status: item.status || 'completed',
      });
      setIsEditing(true);
    } else {
      setSelectedItem(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        client: '',
        budget: '',
        duration: '',
        location: '',
        skills: [],
        images: [],
        completedAt: '',
        featured: false,
        status: 'completed',
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedItem(null);
    setIsEditing(false);
  };

  // Handle image upload
  const handleImageUpload = async (files) => {
    try {
      const uploadPromises = Array.from(files).map((file) =>
        fileUploadService.uploadFile(file, 'portfolio', 'user'),
      );
      const uploadResults = await Promise.all(uploadPromises);
      const imageUrls = uploadResults.map((result) => result.url);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...imageUrls],
      }));

      enqueueSnackbar('Images uploaded successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to upload images', { variant: 'error' });
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle skills input
  const handleSkillsChange = (newSkills) => {
    setFormData((prev) => ({
      ...prev,
      skills: newSkills,
    }));
  };

  // Render portfolio item card
  const renderPortfolioItem = (item) => (
    <Card
      key={item.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        position: 'relative',
      }}
    >
      {item.featured && (
        <Chip
          icon={<FeaturedIcon />}
          label="Featured"
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
          }}
        />
      )}

      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          zIndex: 1,
        }}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
          setSelectedItem(item);
        }}
      >
        <MoreVertIcon />
      </IconButton>

      {item.images && item.images.length > 0 ? (
        <CardMedia
          component="img"
          height="200"
          image={item.images[0]}
          alt={item.title}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            backgroundColor: theme.palette.grey[200],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No Images
          </Typography>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {item.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          {item.description?.length > 100
            ? `${item.description.substring(0, 100)}...`
            : item.description}
        </Typography>

        <Stack spacing={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <CategoryIcon fontSize="small" color="action" />
            <Typography variant="body2">{item.category}</Typography>
          </Box>

          {item.budget && (
            <Box display="flex" alignItems="center" gap={1}>
              <BudgetIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {formatCurrency(item.budget, 'GHS')}
              </Typography>
            </Box>
          )}

          {item.location && (
            <Box display="flex" alignItems="center" gap={1}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2">{item.location}</Typography>
            </Box>
          )}

          {item.completedAt && (
            <Box display="flex" alignItems="center" gap={1}>
              <DateIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {formatDate(item.completedAt)}
              </Typography>
            </Box>
          )}
        </Stack>

        {item.skills && (
          <Box mt={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {item.skills
                .split(',')
                .slice(0, 3)
                .map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill.trim()}
                    size="small"
                    variant="outlined"
                  />
                ))}
              {item.skills.split(',').length > 3 && (
                <Chip
                  label={`+${item.skills.split(',').length - 3} more`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h4" component="h1">
          Portfolio Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? 'small' : 'medium'}
        >
          Add Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Portfolio Items Grid */}
      {portfolioItems.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Portfolio Items Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start building your portfolio by adding your completed projects
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Your First Project
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {portfolioItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              {renderPortfolioItem(item)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedItem);
            setAnchorEl(null);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Handle view/share functionality
            setAnchorEl(null);
          }}
        >
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Handle share functionality
            setAnchorEl(null);
          }}
        >
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleDelete(selectedItem?.id);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isEditing ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Client Name"
                value={formData.client}
                onChange={(e) => handleInputChange('client', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Project Description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget (GHS)"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration"
                placeholder="e.g., 2 weeks, 1 month"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Completion Date"
                value={formData.completedAt}
                onChange={(e) =>
                  handleInputChange('completedAt', e.target.value)
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Skills Used"
                placeholder="Enter skills separated by commas"
                value={formData.skills.join(', ')}
                onChange={(e) =>
                  handleSkillsChange(
                    e.target.value.split(',').map((s) => s.trim()),
                  )
                }
              />
            </Grid>

            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                type="file"
                multiple
                id="image-upload"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                >
                  Upload Images
                </Button>
              </label>
            </Grid>

            {formData.images.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Images ({formData.images.length})
                </Typography>
                <ImageList cols={isMobile ? 2 : 4} gap={8}>
                  {formData.images.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        loading="lazy"
                        style={{ height: 80, objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        actionIcon={
                          <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                            onClick={() => {
                              const newImages = [...formData.images];
                              newImages.splice(index, 1);
                              handleInputChange('images', newImages);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Add'} Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add project"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default PortfolioManager;

