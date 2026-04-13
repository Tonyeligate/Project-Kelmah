import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import useNetworkSpeed from '@/hooks/useNetworkSpeed';

const PortfolioGallery = ({ items = [] }) => {
  const { isOnline } = useOnlineStatus();
  const { isSlow, saveData } = useNetworkSpeed();
  const constrainedNetworkMode = !isOnline || isSlow || saveData;

  const resolvePreviewImage = (item) => {
    const candidates = [
      item?.thumbnailUrl,
      item?.image,
      item?.mainImage,
      Array.isArray(item?.images) ? item.images[0] : null,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }

      if (candidate && typeof candidate === 'object') {
        const resolved =
          candidate.thumbnailUrl ||
          candidate.url ||
          candidate.secureUrl ||
          candidate.fileUrl;
        if (typeof resolved === 'string' && resolved.trim()) {
          return resolved.trim();
        }
      }
    }

    return '';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Portfolio Gallery
      </Typography>
      {items.length > 0 && constrainedNetworkMode && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: 'block' }}
        >
          {isOnline
            ? 'Low-bandwidth mode: portfolio previews are reduced to save data.'
            : 'Offline mode: portfolio previews are paused until connection returns.'}
        </Typography>
      )}
      <Grid container spacing={2}>
        {items.map((item, index) => {
          const previewImage = resolvePreviewImage(item);
          const shouldRenderPreview =
            Boolean(previewImage) && !constrainedNetworkMode;

          return (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={item.id || `portfolio-${index}`}
            >
              <Card>
                {shouldRenderPreview ? (
                  <CardMedia
                    component="img"
                    height="160"
                    image={previewImage}
                    alt={item.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '';
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 160,
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      align="center"
                    >
                      {previewImage
                        ? 'Preview paused in constrained mode'
                        : 'No preview available'}
                    </Typography>
                  </Box>
                )}
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    noWrap
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.description}
                  </Typography>
                  <Box
                    sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
                  >
                    {(item.tags || []).map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {items.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              No portfolio items yet. Add your first project to showcase your
              work.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

PortfolioGallery.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      description: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      thumbnailUrl: PropTypes.string,
      image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      mainImage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      images: PropTypes.array,
    }),
  ),
};

export default PortfolioGallery;
