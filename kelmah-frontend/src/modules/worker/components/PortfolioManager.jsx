import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
// Removed AuthContext import to prevent dual state management conflicts
// import { useAuth } from '../../auth/hooks/useAuth';"
import portfolioService from '../services/portfolioService';
import fileUploadService from '../../common/services/fileUploadService';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, CardMedia, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Alert, CircularProgress, ImageList, ImageListItem, ImageListItemBar, Fab, Menu, MenuItem, Skeleton, Stack, Divider, Tooltip, useTheme, alpha } from '@mui/material';
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
import ConfirmDialog from '../../common/components/common/ConfirmDialog';
import {
  resolveMediaAssetUrl,
  resolveMediaAssetUrls,
} from '../../common/utils/mediaAssets';
import { useBreakpointDown } from '@/hooks/useResponsive';

const getPortfolioItemImages = (item = {}) =>
  resolveMediaAssetUrls(
    item?.images,
    item?.mainImage,
    item?.coverImage,
    item?.gallery,
    item?.media,
  );

const normalizePortfolioItem = (item = {}, index = 0) => {
  const previewImages = getPortfolioItemImages(item);

  return {
    ...item,
    id: item?.id || item?._id || `portfolio-item-${index}`,
    previewImages,
    heroImage: resolveMediaAssetUrl(previewImages),
    imageCount: previewImages.length,
  };
};

const PortfolioManager = () => {
  // Use ONLY Redux auth state to prevent dual state management conflicts
  const { user } = useSelector((state) => state.auth);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');

  // State management
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [galleryState, setGalleryState] = useState({
    open: false,
    images: [],
    title: '',
    index: 0,
  });

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
      setPortfolioItems(
        items.map((item, index) => normalizePortfolioItem(item, index)),
      );
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
    setDeleteConfirm({ open: true, id: itemId });
  };

  const confirmDelete = async () => {
    const itemId = deleteConfirm.id;
    setDeleteConfirm({ open: false, id: null });
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
        skills: Array.isArray(item.skills)
          ? item.skills
          : item.skills
            ? item.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
            : [],
        images:
          (Array.isArray(item.images) && item.images.length
            ? item.images
            : item.previewImages) || [],
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
      const results = await Promise.allSettled(uploadPromises);
      const imageUrls = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.url);

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

  const handleOpenGallery = (item, initialIndex = 0) => {
    const images = item?.previewImages || getPortfolioItemImages(item);
    if (!images.length) return;

    setGalleryState({
      open: true,
      images,
      title: item?.title || 'Portfolio project',
      index: initialIndex,
    });
  };

  // Render portfolio item card
  const renderPortfolioItem = (item) => {
    const normalizedSkills = (Array.isArray(item.skills)
      ? item.skills
      : typeof item.skills === 'string'
        ? item.skills.split(',')
        : []
    )
      .map((skill) => skill.trim())
      .filter(Boolean);

    return (
    <Card
      key={item.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: { xs: 'none', md: 'translateY(-4px)' },
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
        aria-label={`Open actions for ${item.title}`}
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
          setSelectedItem(item);
        }}
      >
        <MoreVertIcon />
      </IconButton>

      {item.imageCount > 0 ? (
        <CardMedia
          component="img"
          height={isMobile ? 176 : 200}
          image={item.heroImage}
          alt={item.title}
          sx={{ objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => handleOpenGallery(item)}
          onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; }}
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
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, textAlign: 'center' }}>
            No project photos yet
          </Typography>
        </Box>
      )}

      {item.imageCount > 0 && (
        <Chip
          label={`${item.imageCount} image${item.imageCount === 1 ? '' : 's'}`}
          size="small"
          color="secondary"
          onClick={() => handleOpenGallery(item)}
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 1,
            fontWeight: 700,
          }}
        />
      )}

      <CardContent
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 1.5, sm: 2 },
          '&:last-child': { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontSize: { xs: '1rem', sm: '1.125rem' },
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            overflowWrap: 'anywhere',
            lineHeight: 1.3,
            mb: 0.75,
          }}
        >
          {item.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          paragraph
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            lineHeight: 1.45,
            mb: 0,
          }}
        >
          {item.description}
        </Typography>

        {item.imageCount === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            Add at least one clear photo so hirers can quickly verify your work.
          </Typography>
        )}

        {item.imageCount > 0 && (
          <Box mt={2} mb={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Visual proof
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 1 }}>
              {item.previewImages.slice(0, 3).map((imageUrl, index) => (
                <Box
                  key={`${item.id}-preview-${index}`}
                  sx={{
                    width: 58,
                    height: 48,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    bgcolor: 'action.hover',
                  }}
                  onClick={() => handleOpenGallery(item, index)}
                >
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={`${item.title} preview ${index + 1}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Stack spacing={{ xs: 0.75, sm: 1 }} sx={{ minWidth: 0, mt: 1 }}>
          <Box display="flex" alignItems="flex-start" gap={1} sx={{ minWidth: 0 }}>
            <CategoryIcon fontSize="small" color="action" sx={{ flexShrink: 0, mt: '2px' }} />
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere', lineHeight: 1.35 }}>
              {item.category}
            </Typography>
          </Box>

          {item.budget && (
            <Box display="flex" alignItems="flex-start" gap={1} sx={{ minWidth: 0 }}>
              <BudgetIcon fontSize="small" color="action" sx={{ flexShrink: 0, mt: '2px' }} />
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere', lineHeight: 1.35 }}>
                {formatCurrency(item.budget, 'GHS')}
              </Typography>
            </Box>
          )}

          {item.location && (
            <Box display="flex" alignItems="flex-start" gap={1} sx={{ minWidth: 0 }}>
              <LocationIcon fontSize="small" color="action" sx={{ flexShrink: 0, mt: '2px' }} />
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere', lineHeight: 1.35 }}>
                {item.location}
              </Typography>
            </Box>
          )}

          {item.completedAt && (
            <Box display="flex" alignItems="flex-start" gap={1} sx={{ minWidth: 0 }}>
              <DateIcon fontSize="small" color="action" sx={{ flexShrink: 0, mt: '2px' }} />
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere', lineHeight: 1.35 }}>
                {formatDate(item.completedAt)}
              </Typography>
            </Box>
          )}
        </Stack>

        {normalizedSkills.length > 0 && (
          <Box mt={2}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {normalizedSkills.slice(0, 3).map((skill, index) => (
                  <Chip
                    key={`${skill}-${index}`}
                    label={skill}
                    size="small"
                    variant="outlined"
                    sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                  />
                ))}
              {normalizedSkills.length > 3 && (
                <Chip
                  label={`+${normalizedSkills.length - 3} more`}
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
  };

  if (loading) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={`portfolio-skeleton-${index}`}>
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
        alignItems={{ xs: 'stretch', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={1.5}
      >
        <Typography variant="h4" component="h1">
          Portfolio Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
          sx={{ minHeight: { xs: 44, sm: 'auto' } }}
        >
          Add Project
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Clear project details and real photos help hirers trust your experience faster.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Portfolio Items Grid */}
      {portfolioItems.length === 0 ? (
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No portfolio projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add completed projects so hirers can quickly understand your work.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Best first entry: title, category, short description, location, and clear photos. Only include work you completed yourself.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            fullWidth={isMobile}
            sx={{ minHeight: { xs: 44, sm: 'auto' } }}
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
              handleOpenGallery(selectedItem);
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
        aria-labelledby="portfolio-dialog-title"
      >
        <DialogTitle id="portfolio-dialog-title">
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
                label="Budget (GH₵)"
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
                aria-label="Upload portfolio images"
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Uploaded images appear on your portfolio cards. Use clear photos of finished work.
              </Typography>
            </Grid>

            {formData.images.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Images ({formData.images.length})
                </Typography>
                <ImageList cols={isMobile ? 2 : 4} gap={8}>
                  {formData.images.map((image, index) => {
                    const previewUrl = resolveMediaAssetUrl(image);

                    return (
                    <ImageListItem key={`${previewUrl || 'image'}-${index}`}>
                      <img
                        src={previewUrl}
                        alt={`Upload ${index + 1}`}
                        loading="lazy"
                        style={{ height: 80, objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        actionIcon={
                          <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                            aria-label={`Remove uploaded image ${index + 1}`}
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
                      );
                    })}
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
          aria-label="Add project"
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
      <ProjectGallery
        open={galleryState.open}
        images={galleryState.images}
        projectTitle={galleryState.title}
        initialIndex={galleryState.index}
        onClose={() =>
          setGalleryState({ open: false, images: [], title: '', index: 0 })
        }
      />
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Portfolio Item"
        message="Are you sure you want to delete this portfolio item?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
    </Box>
  );
};

export default PortfolioManager;

