import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  Chip,
  Switch,
  FormControlLabel,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  alpha,
  IconButton,
} from '@mui/material';
import {
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  TrendingUp as TrendingUpIcon,
  SupportAgent as SupportAgentIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// --- Reusable Components ---

const FeatureCard = ({ icon, title, description }) => (
  <Paper
    elevation={2}
    sx={{
      p: 3,
      textAlign: 'center',
      height: '100%',
      backgroundColor: 'background.paper',
      transition: 'transform 0.3s',
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: 8,
      },
    }}
  >
    <Box color="primary.main" mb={2}>
      {React.cloneElement(icon, { sx: { fontSize: 48 } })}
    </Box>
    <Typography variant="h6" fontWeight="bold" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Paper>
);

const PricingTier = ({ plan, price, isYearly, onUpgrade }) => (
  <Paper
    elevation={plan.isPopular ? 8 : 2}
    sx={{
      p: 4,
      borderRadius: 4,
      border: plan.isPopular ? '2px solid' : '1px solid',
      borderColor: plan.isPopular ? 'primary.main' : 'divider',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {plan.isPopular && (
      <Chip
        label="Most Popular"
        color="primary"
        sx={{ position: 'absolute', top: 16, right: 16 }}
      />
    )}
    <Typography variant="h5" fontWeight="bold">
      {plan.name}
    </Typography>
    <Typography variant="subtitle1" color="text.secondary" mb={2}>
      {plan.description}
    </Typography>

    <Box display="flex" alignItems="baseline" my={2}>
      <Typography variant="h3" fontWeight="bold">
        GH₵{price}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        /{isYearly ? 'year' : 'month'}
      </Typography>
    </Box>

    <List dense>
      {plan.features.map((feature) => (
        <ListItem key={feature} disableGutters>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <CheckCircleIcon color="success" fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={feature} />
        </ListItem>
      ))}
    </List>

    <Button
      fullWidth
      variant={plan.isPopular ? 'contained' : 'outlined'}
      color="primary"
      size="large"
      sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
      onClick={() => onUpgrade(plan.name)}
    >
      Upgrade to {plan.name}
    </Button>
  </Paper>
);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- Main Premium Page ---

const tiers = [
  {
    title: 'Basic',
    price: '0',
    description:
      'For individuals starting out and getting to know the platform.',
    features: [
      'Create a professional profile',
      'Apply to 5 jobs per month',
      'Standard messaging features',
      'Community and email support',
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outlined',
    isCurrent: true,
  },
  {
    title: 'Pro',
    price: '225',
    subheader: 'Most Popular',
    description:
      'For professionals aiming to maximize their opportunities and stand out.',
    features: [
      'All features in Basic plan',
      'Unlimited job applications',
      'Priority placement in search results',
      'Access to exclusive premium-only jobs',
      'Advanced profile analytics',
      'Reduced service fees (5%)',
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'contained',
  },
  {
    title: 'Business',
    price: '675',
    description:
      'For established freelancers and businesses managing multiple projects.',
    features: [
      'All features in Pro plan',
      'Ability to post featured job listings',
      'Dedicated account manager',
      'Team collaboration tools (coming soon)',
      'Lowest service fees (2.5%)',
    ],
    buttonText: 'Upgrade to Business',
    buttonVariant: 'outlined',
  },
];

const FeatureItem = ({ text }) => (
  <ListItem sx={{ py: 0.5 }}>
    <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, color: 'success.main' }}>
      <CheckCircleIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary={text} />
  </ListItem>
);

const PricingCard = ({ tier, isAnnual, onUpgrade }) => (
  <Paper
    elevation={tier.isCurrent ? 8 : 2}
    sx={(theme) => ({
      p: 4,
      borderRadius: 4,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: tier.isCurrent ? '2px solid' : '1px solid',
      borderColor: tier.isCurrent
        ? theme.palette.primary.main
        : theme.palette.divider,
      backgroundColor: tier.subheader
        ? alpha(theme.palette.secondary.main, 0.05)
        : 'transparent',
      position: 'relative',
    })}
  >
    {tier.subheader && (
      <Chip
        label={tier.subheader}
        color="primary"
        size="small"
        sx={{
          fontWeight: 'bold',
          position: 'absolute',
          top: 16,
          right: 16,
        }}
      />
    )}
    <Typography variant="h5" component="h2" fontWeight="bold">
      {tier.title}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', my: 2 }}>
      <Typography variant="h3" component="p" fontWeight="bold">
        GH₵{isAnnual ? (tier.price * 10).toFixed(0) : tier.price}
      </Typography>
      <Typography color="text.secondary" ml={0.5}>
        /{isAnnual ? 'year' : 'month'}
      </Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
      {tier.description}
    </Typography>
    <List sx={{ my: 2 }}>
      {tier.features.map((line) => (
        <FeatureItem key={line} text={line} />
      ))}
    </List>
    <Button
      fullWidth
      variant={tier.buttonVariant}
      disabled={tier.isCurrent}
      sx={{ mt: 'auto', fontWeight: 'bold', py: 1.5 }}
      onClick={() => onUpgrade(tier.title)}
    >
      {tier.buttonText}
    </Button>
  </Paper>
);

const BenefitCard = ({ icon, title, description }) => (
  <Paper
    elevation={1}
    sx={{ p: 3, textAlign: 'center', height: '100%', borderRadius: 2 }}
  >
    <Box color="primary.main" mb={1.5}>
      {React.cloneElement(icon, { sx: { fontSize: 40 } })}
    </Box>
    <Typography variant="h6" fontWeight="bold" mb={1}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Paper>
);

const PremiumPage = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const plans = {
    monthly: {
      pro: 449,
      business: 1199,
    },
    yearly: {
      pro: 4490,
      business: 11990,
    },
  };

  const handleUpgradeClick = (planName) => {
    setSelectedPlan(planName);
    setOpenDialog(true);
  };

  const handleConfirmUpgrade = () => {
    setIsUpgrading(true);
    // TODO: Replace with actual payment API call when backend is ready
    // e.g. paymentService.upgradePlan(selectedPlan, billingCycle)
    setTimeout(() => {
      setIsUpgrading(false);
      setOpenDialog(false);
      // Show success notification once integrated with payment service
    }, 1500);
  };

  const features = [
    {
      icon: <TrendingUpIcon />,
      title: 'Priority Job Matching',
      description: 'Get your profile seen by top hirers first.',
    },
    {
      icon: <WorkspacePremiumIcon />,
      title: 'Premium Profile Badge',
      description:
        'Stand out from the competition with a badge that builds trust.',
    },
    {
      icon: <SupportAgentIcon />,
      title: 'Dedicated Support',
      description: 'Access to our priority support team, 24/7.',
    },
    {
      icon: <AttachMoneyIcon />,
      title: 'Lower Service Fees',
      description:
        'Keep more of your earnings with reduced service fees on every completed job.',
    },
  ];

  const planDetails = [
    {
      name: 'Pro',
      description: 'For individual professionals.',
      features: [
        'Priority Job Matching',
        'Premium Profile Badge',
        'Basic Analytics',
      ],
      isPopular: true,
    },
    {
      name: 'Business',
      description: 'For agencies and teams.',
      features: [
        'All Pro features',
        'Team Management',
        'Advanced Analytics',
        'Dedicated Support',
      ],
      isPopular: false,
    },
  ];

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', py: 6 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip
            icon={<StarIcon />}
            label="Premium Access"
            color="primary"
            sx={{ mb: 2 }}
          />
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Unlock Your Full Potential
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            maxWidth="md"
            mx="auto"
          >
            Upgrade to Kelmah Premium to get exclusive features that help you
            find work faster and manage your business more efficiently.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <FeatureCard {...feature} />
            </Grid>
          ))}
        </Grid>

        {/* Pricing Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Choose Your Plan
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isYearly}
                onChange={(e) => setIsYearly(e.target.checked)}
              />
            }
            label={
              <Typography component="span">
                Bill Annually{' '}
                <Chip
                  component="span"
                  label="Save 20%"
                  color="success"
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            }
          />
        </Box>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={5}>
            <PricingTier
              plan={planDetails[0]}
              price={isYearly ? plans.yearly.pro : plans.monthly.pro}
              isYearly={isYearly}
              onUpgrade={handleUpgradeClick}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <PricingTier
              plan={planDetails[1]}
              price={isYearly ? plans.yearly.business : plans.monthly.business}
              isYearly={isYearly}
              onUpgrade={handleUpgradeClick}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        TransitionComponent={Transition}
        PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Confirm Upgrade
          </Typography>
          <IconButton
            onClick={() => setOpenDialog(false)}
            disabled={isUpgrading}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>
            You are about to upgrade to the{' '}
            <Typography component="span" fontWeight="bold">
              {selectedPlan}
            </Typography>{' '}
            plan. Your payment method will be charged{' '}
            <Typography component="span" fontWeight="bold">
              $
              {isYearly
                ? plans.yearly[selectedPlan.toLowerCase()]
                : plans.monthly[selectedPlan.toLowerCase()]}
            </Typography>
            .
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button
            onClick={() => setOpenDialog(false)}
            color="secondary"
            disabled={isUpgrading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpgrade}
            variant="contained"
            color="primary"
            disabled={isUpgrading}
          >
            {isUpgrading ? <CircularProgress size={24} /> : 'Confirm & Pay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PremiumPage;
