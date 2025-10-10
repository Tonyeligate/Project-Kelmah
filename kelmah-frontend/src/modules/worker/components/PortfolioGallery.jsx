import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';

const PortfolioGallery = ({ items = [] }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Portfolio Gallery
      </Typography>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardMedia
                component="img"
                height="160"
                image={item.thumbnailUrl}
                alt={item.title}
              />
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  {item.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
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
        ))}
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

export default PortfolioGallery;
