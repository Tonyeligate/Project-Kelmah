import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  useTheme,
} from '@mui/material';
import { Work, LocationOn } from '@mui/icons-material';
import ServiceNavigation from '../../components/common/ServiceNavigation';

function FindWork() {
  const theme = useTheme();

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <ServiceNavigation />
      
      <Container maxWidth="lg">
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom color="secondary">
            Find Your Next Opportunity
          </Typography>
          <Typography variant="h6" sx={{ mb: 4 }} color="text.secondary">
            Browse through available projects and connect with potential clients
          </Typography>

          <Grid container spacing={3}>
            {/* Featured Categories */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom color="secondary">
                Popular Categories
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['Plumbing', 'Electrical', 'Carpentry', 'HVAC', 'Painting'].map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => {}}
                    sx={{ 
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'secondary.main', color: 'primary.main' }
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Recent Projects */}
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom color="secondary" sx={{ mt: 4 }}>
                Recent Projects
              </Typography>
              <Grid container spacing={3}>
                {[1, 2, 3].map((project) => (
                  <Grid item xs={12} md={4} key={project}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Project Title {project}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ mr: 1, fontSize: 18 }} />
                          <Typography variant="body2">New York, NY</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip label="$500-1000" size="small" color="secondary" />
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => {}}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

export default FindWork; 