import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  TrendingUp as TrendingUpIcon,
  SupportAgent as SupportAgentIcon,
  AccountBalanceWallet as WalletIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { selectIsAuthenticated } from '../../auth/services/authSlice';
import { api } from '../../../services/apiClient';
import PageCanvas from '../../common/components/PageCanvas';

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

const PricingTier = ({ plan, price, isYearly, onUpgrade, yearlySavings }) => (
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

    {isYearly && (
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Chip label="Billed yearly" size="small" color="primary" variant="outlined" />
        <Chip
          label={`Save GH₵${yearlySavings.toLocaleString()} vs monthly`}
          size="small"
          color="success"
          variant="outlined"
        />
      </Stack>
    )}

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
      sx={{ mt: 3, py: 1.5, fontWeight: 'bold', minHeight: 44 }}
      onClick={() => onUpgrade(plan.name)}
      aria-label={`Upgrade to ${plan.name} plan`}
    >
      Upgrade to {plan.name}
    </Button>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
      Secure checkout via Kelmah Payments. You will review charge details before final confirmation.
    </Typography>
  </Paper>
);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// --- Main Premium Page ---

const FeatureItem = ({ text }) => (
  <ListItem sx={{ py: 0.5 }}>
    <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, color: 'success.main' }}>
      <CheckCircleIcon fontSize="small" />
    </ListItemIcon>
    <ListItemText primary={text} />
  </ListItem>
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
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isYearly, setIsYearly] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const loginRedirectTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (loginRedirectTimerRef.current) {
        clearTimeout(loginRedirectTimerRef.current);
      }
    };
  }, []);

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
  const yearlySavings = {
    pro: plans.monthly.pro * 12 - plans.yearly.pro,
    business: plans.monthly.business * 12 - plans.yearly.business,
  };

  const handleUpgradeClick = (planName) => {
    setSelectedPlan(planName);
    setOpenDialog(true);
  };

  const handleConfirmUpgrade = async () => {
    // Guard: require authentication before attempting payment
    if (!isAuthenticated) {
      setUpgradeError('Please log in to upgrade your plan.');
      setOpenDialog(false);
      if (loginRedirectTimerRef.current) {
        clearTimeout(loginRedirectTimerRef.current);
      }
      loginRedirectTimerRef.current = setTimeout(() => navigate('/login', {
        state: {
          from: '/pricing',
          message: 'Please sign in to upgrade your plan.',
        },
      }), 1500);
      return;
    }
    setIsUpgrading(true);
    setUpgradeError('');
    try {
      const billingCycle = isYearly ? 'yearly' : 'monthly';
      const priceKey = selectedPlan.toLowerCase();
      const amount = plans[billingCycle]?.[priceKey] || 0;

      await api.post('/payments/subscriptions', {
        tier: selectedPlan.toLowerCase(),
        billingCycle,
        amount,
      });

      setUpgradeSuccess(true);
      setOpenDialog(false);
    } catch (err) {
      // Show error to user instead of silently succeeding
      const status = err?.response?.status;
      const message =
        status === 501
          ? 'Premium checkout is temporarily unavailable. Please contact support@kelmah.com for assisted upgrade.'
          : err?.response?.data?.message || err?.message || 'Failed to process upgrade. Please try again.';
      setUpgradeError(message);
      setOpenDialog(false);
    } finally {
      setIsUpgrading(false);
    }
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
      icon: <WalletIcon />,
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
    <PageCanvas disableContainer sx={{ pt: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
      <Box sx={{ color: 'text.primary' }}>
        <Helmet><title>Premium | Kelmah</title></Helmet>
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
            Upgrade to Kelmah Premium for tools that help you get hired faster
            and run your work with less stress.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item key={feature.title} xs={12} sm={6} md={3}>
              <FeatureCard {...feature} />
            </Grid>
          ))}
        </Grid>

        {/* Pricing Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Choose Your Plan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Compare plans side-by-side and choose monthly or yearly billing before checkout.
          </Typography>
          <Tooltip title="Switch to annual billing to save ~17%">
            <FormControlLabel
              control={
                <Switch
                  checked={isYearly}
                  onChange={(e) => setIsYearly(e.target.checked)}
                  inputProps={{ 'aria-label': 'Switch to annual billing' }}
                />
              }
            label={
              <Typography component="span">
                Pay Yearly{' '}
                <Chip
                  component="span"
                  label="Save ~17%"
                  color="success"
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            }
          />
          </Tooltip>
        </Box>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={5}>
            <PricingTier
              plan={planDetails[0]}
              price={isYearly ? plans.yearly.pro : plans.monthly.pro}
              isYearly={isYearly}
              yearlySavings={yearlySavings.pro}
              onUpgrade={handleUpgradeClick}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <PricingTier
              plan={planDetails[1]}
              price={isYearly ? plans.yearly.business : plans.monthly.business}
              isYearly={isYearly}
              yearlySavings={yearlySavings.business}
              onUpgrade={handleUpgradeClick}
            />
          </Grid>
        </Grid>
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            px: 3,
            py: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Chip size="small" color="primary" variant="outlined" label="Transparent pricing" />
            <Typography variant="body2" color="text.secondary">
              Pro monthly equivalent: GH₵{Math.round(plans.yearly.pro / 12)}/month.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Business monthly equivalent: GH₵{Math.round(plans.yearly.business / 12)}/month.
            </Typography>
          </Stack>
        </Paper>
        </Container>

        {/* Confirmation Dialog */}
        <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        TransitionComponent={Transition}
        PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper' } }}
        aria-labelledby="confirm-upgrade-dialog-title"
      >
        <DialogTitle
          id="confirm-upgrade-dialog-title"
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
            aria-label="Close upgrade dialog"
            onClick={() => setOpenDialog(false)}
            disabled={isUpgrading}
            sx={{
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'primary.main',
                outlineOffset: '2px',
              },
            }}
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
              GH₵
              {(isYearly
                ? plans.yearly[selectedPlan.toLowerCase()]
                : plans.monthly[selectedPlan.toLowerCase()]
              )?.toLocaleString()}
            </Typography>
            .
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Billing cycle: {isYearly ? 'Yearly' : 'Monthly'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Checkout confidence: no charge is submitted until you click Confirm & Pay.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need help before paying? Contact support@kelmah.com for assisted checkout.
            </Typography>
          </Stack>
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
            aria-label="Confirm premium plan payment"
          >
            {isUpgrading ? <CircularProgress size={24} /> : 'Confirm & Pay'}
          </Button>
        </DialogActions>
        </Dialog>

        <Snackbar
        open={upgradeSuccess}
        autoHideDuration={6000}
        onClose={() => setUpgradeSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setUpgradeSuccess(false)}>
          {selectedPlan} plan upgrade request submitted. You will receive a confirmation shortly.
        </Alert>
        </Snackbar>
        <Snackbar
        open={!!upgradeError}
        autoHideDuration={6000}
        onClose={() => setUpgradeError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setUpgradeError('')}>
          {upgradeError || 'Upgrade failed. Please try again.'}
        </Alert>
        </Snackbar>
      </Box>
    </PageCanvas>
  );
};

export default PremiumPage;
