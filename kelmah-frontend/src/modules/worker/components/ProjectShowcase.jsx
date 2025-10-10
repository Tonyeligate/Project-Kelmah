import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';

const ProjectShowcase = ({ project }) => {
  if (!project) return null;
  const { title, beforeImageUrl, afterImageUrl, description, category } =
    project;
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Project Showcase
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {category}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardMedia
              component="img"
              height="220"
              image={beforeImageUrl}
              alt={`${title} - before`}
            />
            <CardContent>
              <Typography variant="subtitle2">Before</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardMedia
              component="img"
              height="220"
              image={afterImageUrl}
              alt={`${title} - after`}
            />
            <CardContent>
              <Typography variant="subtitle2">After</Typography>
            </CardContent>
          </Card>
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

export default ProjectShowcase;
