import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  styled
} from '@mui/material';

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const features = [
  {
    title: 'Enhanced Job Matching',
    description: 'Our AI-powered system now provides more accurate job recommendations based on your skills and preferences.',
    image: '/images/feature1.jpg', // Add actual image paths
    date: 'March 2024',
    category: 'Feature'
  },
  {
    title: 'Mobile App Launch',
    description: 'Stay connected on the go with our new mobile app, available now on iOS and Android.',
    image: '/images/feature2.jpg',
    date: 'February 2024',
    category: 'Release'
  },
  // Add more features as needed
];

function WhatsNew() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ color: 'secondary.main' }}>
        What's New at Kelmah
      </Typography>
      <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
        Stay updated with our latest features and improvements
      </Typography>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <FeatureCard>
              <CardMedia
                component="img"
                height="200"
                image={feature.image}
                alt={feature.title}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Chip label={feature.category} color="secondary" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {feature.date}
                  </Typography>
                </Box>
                <Typography variant="h5" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </FeatureCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default WhatsNew; 