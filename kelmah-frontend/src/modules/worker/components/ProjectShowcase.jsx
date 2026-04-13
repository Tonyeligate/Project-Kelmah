import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import useNetworkSpeed from '@/hooks/useNetworkSpeed';

const ProjectShowcase = ({ project }) => {
  const { isOnline } = useOnlineStatus();
  const { isSlow, saveData } = useNetworkSpeed();
  const constrainedNetworkMode = !isOnline || isSlow || saveData;

  if (!project) return null;

  const { title, beforeImageUrl, afterImageUrl, description, category } =
    project;

  const renderProjectImage = (label, imageUrl) => {
    const shouldRenderPreview = Boolean(imageUrl) && !constrainedNetworkMode;

    return (
      <Card>
        {shouldRenderPreview ? (
          <CardMedia
            component="img"
            height="220"
            image={imageUrl}
            alt={`${title} - ${label.toLowerCase()}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '';
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <Box
            sx={{
              height: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 0.6,
              bgcolor: 'action.hover',
              px: 1,
            }}
          >
            <AccessTimeIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" align="center">
              {imageUrl
                ? 'Preview paused in constrained mode'
                : 'No preview available'}
            </Typography>
          </Box>
        )}
        <CardContent>
          <Typography variant="subtitle2">{label}</Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Project Showcase
      </Typography>
      {constrainedNetworkMode && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: 'block' }}
        >
          {isOnline
            ? 'Low-bandwidth mode: before/after image previews are reduced.'
            : 'Offline mode: before/after image previews are paused until reconnection.'}
        </Typography>
      )}
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {category}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          {renderProjectImage('Before', beforeImageUrl)}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderProjectImage('After', afterImageUrl)}
        </Grid>
      </Grid>
      <Stack spacing={1} sx={{ mt: 2 }}>
        <Typography variant="subtitle2">Description</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Box>
  );
};

ProjectShowcase.propTypes = {
  project: PropTypes.shape({
    title: PropTypes.string,
    beforeImageUrl: PropTypes.string,
    afterImageUrl: PropTypes.string,
    description: PropTypes.string,
    category: PropTypes.string,
  }),
};

export default ProjectShowcase;
