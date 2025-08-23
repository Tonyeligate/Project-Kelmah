import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import { CheckCircle, Star } from '@mui/icons-material';

const tiers = [
  {
    title: 'Basic',
    price: '0',
    description: 'For individuals and small teams trying out Kelmah.',
    features: [
      '5 Job Posts per Month',
      'Basic Worker Search',
      'Standard Support',
      'Access to Basic Analytics',
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outlined',
  },
  {
    title: 'Pro',
    price: '49',
    description: 'For growing businesses that need more power and support.',
    features: [
      'Unlimited Job Posts',
      'Advanced Worker Search',
      'Priority Support',
      'Advanced Analytics',
      'Featured Job Listings',
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'contained',
  },
  {
    title: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with custom needs.',
    features: [
      'All Pro Features',
      'Dedicated Account Manager',
      'Custom Integrations',
      'On-premises Deployment Options',
      'Personalized Onboarding',
    ],
    buttonText: 'Contact Us',
    buttonVariant: 'outlined',
  },
];

const PremiumPage = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper sx={{ p: 4, textAlign: 'center', mb: 5 }}>
        <Chip
          icon={<Star />}
          label="Premium"
          color="secondary"
          sx={{ mb: 2 }}
        />
        <Typography variant="h3" component="h1" fontWeight="bold">
          Unlock Your Potential
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
          Choose a plan that's right for you and your business.
        </Typography>
      </Paper>

      <Grid container spacing={4} alignItems="stretch">
        {tiers.map((tier) => (
          <Grid item xs={12} md={4} key={tier.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border:
                  tier.title === 'Pro'
                    ? `2px solid ${theme.palette.secondary.main}`
                    : `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {tier.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', my: 2 }}>
                  <Typography variant="h4" component="h2">
                    ${tier.price}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {tier.price !== 'Custom' && '/mo'}
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  paragraph
                >
                  {tier.description}
                </Typography>
                <List>
                  {tier.features.map((line) => (
                    <ListItem key={line} disableGutters>
                      <ListItemIcon
                        sx={{ minWidth: 'auto', mr: 1, color: 'success.main' }}
                      >
                        <CheckCircle fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={line} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant={tier.buttonVariant}
                  color="primary"
                  size="large"
                >
                  {tier.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PremiumPage;
