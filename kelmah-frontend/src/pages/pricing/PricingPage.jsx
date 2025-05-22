import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';

const pricingTiers = [
  {
    title: 'Basic',
    price: '0',
    description: 'For individuals getting started',
    features: [
      'Post up to 3 jobs per month',
      'Basic search functionality',
      'Email support',
      'Basic profile',
    ],
    buttonText: 'Start Free',
    buttonVariant: 'outlined',
  },
  {
    title: 'Professional',
    price: '29',
    description: 'For growing businesses',
    features: [
      'Unlimited job posts',
      'Advanced search filters',
      'Priority support',
      'Featured listings',
      'Analytics dashboard',
    ],
    buttonText: 'Start Pro',
    buttonVariant: 'contained',
    featured: true,
  },
  {
    title: 'Enterprise',
    price: '99',
    description: 'For large organizations',
    features: [
      'Custom solutions',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced analytics',
      'Team management',
    ],
    buttonText: 'Contact Us',
    buttonVariant: 'outlined',
  },
];

function PricingPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography
        component="h1"
        variant="h2"
        align="center"
        color="secondary"
        gutterBottom
      >
        Pricing Plans
      </Typography>
      <Typography variant="h5" align="center" color="text.secondary" paragraph>
        Choose the perfect plan for your needs
      </Typography>

      <Grid container spacing={4} alignItems="flex-end" sx={{ mt: 4 }}>
        {pricingTiers.map((tier) => (
          <Grid
            item
            key={tier.title}
            xs={12}
            sm={tier.featured ? 12 : 6}
            md={4}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: tier.featured ? 2 : 1,
                borderColor: tier.featured ? 'secondary.main' : 'grey.200',
                transform: tier.featured ? 'scale(1.05)' : 'none',
              }}
            >
              <CardHeader
                title={tier.title}
                titleTypographyProps={{ align: 'center', color: 'secondary' }}
                subheaderTypographyProps={{ align: 'center' }}
                sx={{
                  backgroundColor: tier.featured ? 'secondary.main' : 'transparent',
                  color: tier.featured ? 'primary.main' : 'inherit',
                }}
              />
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'baseline',
                    mb: 2,
                  }}
                >
                  <Typography component="h2" variant="h3" color="secondary">
                    ${tier.price}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    /mo
                  </Typography>
                </Box>
                <Typography
                  variant="subtitle1"
                  align="center"
                  sx={{ fontStyle: 'italic', mb: 2 }}
                >
                  {tier.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  {tier.features.map((feature) => (
                    <ListItem key={feature} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <CheckIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ mt: 'auto', justifyContent: 'center', pb: 3 }}>
                <Button
                  fullWidth
                  variant={tier.buttonVariant}
                  color="secondary"
                  sx={{ maxWidth: 200 }}
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
}

export default PricingPage; 