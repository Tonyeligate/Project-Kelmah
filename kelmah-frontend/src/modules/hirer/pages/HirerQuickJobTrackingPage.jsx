import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Rating,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  PersonOutline as PersonOutlineIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import {
  SERVICE_CATEGORIES,
  acceptQuote,
  approveWork,
  cancelQuickJob,
  formatCurrency,
  getQuickJob,
  getQuickJobPaymentStatus,
  initializeQuickJobPayment,
  raiseDispute,
  verifyQuickJobPayment,
} from '../../quickjobs/services/quickJobService';
import { useVisibilityPolling } from '../../../hooks/useVisibilityPolling';

const requesterSteps = [
  { status: 'pending', label: 'Waiting for quotes' },
  { status: 'quoted', label: 'Quotes received' },
  { status: 'accepted', label: 'Worker selected' },
  { status: 'funded', label: 'Payment secured' },
  { status: 'worker_on_way', label: 'Worker on the way' },
  { status: 'worker_arrived', label: 'Worker arrived' },
  { status: 'in_progress', label: 'Work in progress' },
  { status: 'completed', label: 'Review and approve' },
  { status: 'approved', label: 'Closed' },
];

const paymentMethodOptions = [
  { value: 'card', label: 'Card' },
  { value: 'mtn_momo', label: 'MTN MoMo' },
  { value: 'vodafone_cash', label: 'Vodafone Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

const getStatusIndex = (status) => {
  const index = requesterSteps.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
};

const getCategoryMeta = (categoryId) =>
  SERVICE_CATEGORIES.find((category) => category.id === categoryId) ||
  SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1];

const toWorkerName = (worker) => {
  if (!worker) {
    return 'Worker';
  }

  return (
    [worker.firstName, worker.lastName].filter(Boolean).join(' ') ||
    worker.name ||
    'Worker'
  );
};

const QuoteCard = ({ quote, onAccept, actionLoading, acceptedQuoteId }) => {
  const workerName = toWorkerName(quote?.worker);
  const isAccepted = String(acceptedQuoteId || '') === String(quote?._id || quote?.id || '');

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src={quote?.worker?.profilePicture}>
              {workerName?.[0] || 'W'}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{workerName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {Array.isArray(quote?.worker?.skills) && quote.worker.skills.length > 0
                  ? quote.worker.skills.slice(0, 3).join(', ')
                  : 'Skilled worker on Kelmah'}
              </Typography>
            </Box>
          </Stack>
          <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.75}>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              {formatCurrency(Number(quote?.amount || 0))}
            </Typography>
            <Chip
              size="small"
              label={quote?.status || 'pending'}
              color={isAccepted ? 'success' : 'default'}
              sx={{ textTransform: 'capitalize' }}
            />
          </Stack>
        </Stack>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Availability
            </Typography>
            <Typography variant="body2">{quote?.availableAt || 'today'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
              Estimated duration
            </Typography>
            <Typography variant="body2">{quote?.estimatedDuration || 'half_day'}</Typography>
          </Grid>
        </Grid>

        {quote?.message && (
          <Typography sx={{ mt: 1.5 }} color="text.secondary">
            {quote.message}
          </Typography>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <Button
            variant={isAccepted ? 'outlined' : 'contained'}
            disabled={actionLoading || isAccepted || quote?.status !== 'pending'}
            onClick={() => onAccept(quote)}
            sx={{ minHeight: 44 }}
          >
            {isAccepted ? 'Accepted' : 'Accept quote'}
          </Button>
          {quote?.worker?._id && (
            <Button href={`/workers/${quote.worker._id}`} variant="text" sx={{ minHeight: 44 }}>
              View worker profile
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const HirerQuickJobTrackingPage = () => {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const paymentVerificationRef = useRef('');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('work_not_completed');
  const [disputeDescription, setDisputeDescription] = useState('');
  const verificationReference = useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return params.get('reference') || params.get('trxref') || '';
  }, [location.search]);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getQuickJob(jobId);
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Unable to load quick-hire request');
      }

      setJob(result.data);

      if (['accepted', 'funded', 'worker_on_way', 'worker_arrived', 'in_progress', 'completed', 'approved'].includes(result.data?.status)) {
        try {
          const payment = await getQuickJobPaymentStatus(jobId);
          if (payment?.success) {
            setPaymentStatus(payment.data);
          }
        } catch {
          setPaymentStatus(null);
        }
      }
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load quick-hire request');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useVisibilityPolling({
    enabled: Boolean(jobId),
    intervalMs: 30_000,
    maxIntervalMs: 3 * 60 * 1000,
    shouldPause: () => actionLoading || verifyingPayment,
    callback: async () => {
      await fetchJob();
    },
  });

  useEffect(() => {
    if (!verificationReference || paymentVerificationRef.current === verificationReference) {
      return;
    }

    let isActive = true;
    paymentVerificationRef.current = verificationReference;

    const verifyCallbackPayment = async () => {
      try {
        setVerifyingPayment(true);
        const result = await verifyQuickJobPayment(verificationReference);

        if (!isActive) {
          return;
        }

        if (!result?.success) {
          throw new Error(
            result?.error?.message || result?.message || 'Unable to verify payment callback',
          );
        }

        enqueueSnackbar(result?.message || 'Payment verified successfully.', {
          variant: 'success',
        });
        await fetchJob();
      } catch (verificationError) {
        if (!isActive) {
          return;
        }

        setError(
          verificationError?.message ||
            'Payment callback verification failed. Please refresh and check the payment status.',
        );
      } finally {
        if (!isActive) {
          return;
        }

        setVerifyingPayment(false);
        navigate(
          {
            pathname: location.pathname,
            search: '',
          },
          { replace: true },
        );
      }
    };

    verifyCallbackPayment();

    return () => {
      isActive = false;
    };
  }, [enqueueSnackbar, fetchJob, location.pathname, navigate, verificationReference]);

  const acceptedWorker = job?.acceptedQuote?.worker || null;
  const category = getCategoryMeta(job?.category);
  const currentStep = getStatusIndex(job?.status);
  const completionPhotos = job?.tracking?.workCompleted?.photos || [];
  const canCancel = ['pending', 'quoted', 'accepted', 'funded', 'worker_on_way'].includes(job?.status);
  const canApprove = job?.status === 'completed';
  const canDispute = ['funded', 'worker_on_way', 'worker_arrived', 'in_progress', 'completed'].includes(job?.status);
  const canPay = job?.status === 'accepted';
  const quotes = useMemo(() => job?.quotes || [], [job?.quotes]);

  const handleAcceptQuote = async (quote) => {
    const quoteId = quote?._id || quote?.id;
    if (!quoteId) {
      return;
    }

    try {
      setActionLoading(true);
      const result = await acceptQuote(jobId, quoteId);
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Unable to accept this quote');
      }
      enqueueSnackbar('Quote accepted. You can now secure the worker with payment.', {
        variant: 'success',
      });
      await fetchJob();
    } catch (acceptError) {
      setError(acceptError?.message || 'Unable to accept the selected quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartPayment = async () => {
    try {
      setActionLoading(true);
      const result = await initializeQuickJobPayment(jobId, paymentMethod);
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Unable to initialize payment');
      }

      const redirectUrl =
        result?.data?.authorization_url ||
        result?.data?.authorizationUrl ||
        result?.data?.url ||
        result?.data?.checkoutUrl;

      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      enqueueSnackbar(result?.message || 'Payment initialized successfully.', {
        variant: 'success',
      });
      await fetchJob();
    } catch (paymentError) {
      setError(paymentError?.message || 'Unable to initialize payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveWork = async () => {
    try {
      setActionLoading(true);
      const result = await approveWork(jobId, rating, review);
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Unable to approve work');
      }
      enqueueSnackbar(result?.message || 'Work approved and payment released.', {
        variant: 'success',
      });
      setApproveDialogOpen(false);
      setReview('');
      setRating(5);
      await fetchJob();
    } catch (approveError) {
      setError(approveError?.message || 'Unable to approve completed work');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async () => {
    try {
      setActionLoading(true);
      const result = await cancelQuickJob(jobId, cancelReason);
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Unable to cancel this request');
      }
      enqueueSnackbar(result?.message || 'Quick-hire request cancelled.', {
        variant: 'success',
      });
      setCancelDialogOpen(false);
      setCancelReason('');
      await fetchJob();
    } catch (cancelError) {
      setError(cancelError?.message || 'Unable to cancel this quick-hire request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    try {
      setActionLoading(true);
      const result = await raiseDispute(jobId, disputeReason, disputeDescription);
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Unable to raise a dispute');
      }
      enqueueSnackbar(result?.message || 'Dispute raised successfully.', {
        variant: 'success',
      });
      setDisputeDialogOpen(false);
      setDisputeDescription('');
      setDisputeReason('work_not_completed');
      await fetchJob();
    } catch (disputeError) {
      setError(disputeError?.message || 'Unable to raise a dispute');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !job) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }

  if (error && !job) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/hirer/quick-hire')}>
          Back to quick-hire
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Helmet>
        <title>Quick-Hire Request | Kelmah</title>
      </Helmet>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <IconButton aria-label="Go back" onClick={() => navigate('/hirer/quick-hire')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Quick-hire request
        </Typography>
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {verifyingPayment && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Verifying your payment callback and refreshing the request status...
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    {category?.icon || '📋'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {category?.name || 'Service request'}
                    </Typography>
                    <Typography color="text.secondary">
                      {job?.location?.city || 'Ghana'} • {job?.urgency || 'soon'}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={(job?.status || 'pending').replace(/_/g, ' ')}
                  color={job?.status === 'approved' ? 'success' : 'primary'}
                  sx={{ textTransform: 'capitalize', alignSelf: { xs: 'flex-start', sm: 'center' } }}
                />
              </Stack>

              <Typography sx={{ mt: 2.5, mb: 2 }}>{job?.description}</Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {job?.location?.address && <Chip label={job.location.address} variant="outlined" />}
                {job?.location?.region && <Chip label={job.location.region} variant="outlined" />}
                {job?.escrow?.amount ? (
                  <Chip label={`Escrow ${formatCurrency(Number(job.escrow.amount || 0))}`} variant="outlined" />
                ) : null}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Request progress
              </Typography>
              <Stepper activeStep={currentStep} alternativeLabel sx={{ mt: 3 }}>
                {requesterSteps.map((step) => (
                  <Step key={step.status}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {quotes.length > 0 && ['pending', 'quoted'].includes(job?.status) && (
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Quotes from workers
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                  Compare who is available, how much they charge, and how fast they can get to you.
                </Typography>
                <Stack spacing={2}>
                  {quotes.map((quote) => (
                    <QuoteCard
                      key={quote?._id || quote?.id}
                      quote={quote}
                      onAccept={handleAcceptQuote}
                      actionLoading={actionLoading}
                      acceptedQuoteId={job?.acceptedQuote?.quote}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {acceptedWorker && (
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Assigned worker
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar src={acceptedWorker.profilePicture}>
                      {toWorkerName(acceptedWorker)?.[0] || 'W'}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>{toWorkerName(acceptedWorker)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Array.isArray(acceptedWorker.skills) && acceptedWorker.skills.length > 0
                          ? acceptedWorker.skills.slice(0, 3).join(', ')
                          : 'Kelmah worker'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.75}>
                    <Typography variant="h6" color="primary.main" fontWeight={800}>
                      {formatCurrency(Number(job?.acceptedQuote?.amount || 0))}
                    </Typography>
                    {acceptedWorker.phoneNumber && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={`tel:${acceptedWorker.phoneNumber}`}
                        sx={{ minHeight: 40 }}
                      >
                        Call worker
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}

          {completionPhotos.length > 0 && (
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Completion evidence
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Review the submitted photos before approving the payout.
                </Typography>
                <Grid container spacing={2}>
                  {completionPhotos.map((photo, index) => (
                    <Grid item xs={6} md={4} key={photo?.url || index}>
                      <Box
                        component="img"
                        src={photo?.url}
                        alt={`Completed work ${index + 1}`}
                        sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 2 }}
                      />
                    </Grid>
                  ))}
                </Grid>
                {job?.tracking?.workCompleted?.workerNote && (
                  <Alert severity="info" sx={{ mt: 2.5 }}>
                    {job.tracking.workCompleted.workerNote}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Next action
                </Typography>

                {canPay ? (
                  <Stack spacing={2}>
                    <Alert severity="info" icon={<PaymentIcon fontSize="inherit" />}>
                      You have selected a worker. Make payment to lock the job and notify them to travel.
                    </Alert>
                    <TextField
                      select
                      label="Payment method"
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      fullWidth
                    >
                      {paymentMethodOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="contained"
                      startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
                      onClick={handleStartPayment}
                      disabled={actionLoading}
                      sx={{ minHeight: 44 }}
                    >
                      Secure worker with payment
                    </Button>
                  </Stack>
                ) : canApprove ? (
                  <Stack spacing={2}>
                    <Alert severity="success" icon={<AssignmentTurnedInIcon fontSize="inherit" />}>
                      The worker marked this request as complete. Review the photos and approve the payout if the job is done.
                    </Alert>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => setApproveDialogOpen(true)}
                      sx={{ minHeight: 44 }}
                    >
                      Approve work and release payout
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    <Typography color="text.secondary">
                      {job?.status === 'pending' && 'Wait for workers to send quotes, then accept the best fit for your request.'}
                      {job?.status === 'quoted' && 'Quotes are available now. Accept one to move this request forward.'}
                      {job?.status === 'funded' && 'Payment is secured. Your worker can now start travelling to your location.'}
                      {job?.status === 'worker_on_way' && 'Your worker is travelling now. Keep your phone available in case they need directions.'}
                      {job?.status === 'worker_arrived' && 'The worker has arrived on site and can begin work.'}
                      {job?.status === 'in_progress' && 'Work is currently in progress. You can raise a dispute if something goes wrong.'}
                      {job?.status === 'approved' && 'This quick-hire request is complete and the payout has been released.'}
                      {job?.status === 'cancelled' && 'This quick-hire request has been cancelled.'}
                      {job?.status === 'disputed' && 'A dispute is open on this request. Keep evidence ready for review.'}
                    </Typography>
                    {paymentStatus?.status && (
                      <Chip
                        icon={<PaymentIcon />}
                        label={`Payment status: ${paymentStatus.status}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Safety controls
                </Typography>
                <Stack spacing={1.5}>
                  <Button
                    variant="outlined"
                    color="warning"
                    disabled={!canDispute || actionLoading}
                    startIcon={<WarningAmberIcon />}
                    onClick={() => setDisputeDialogOpen(true)}
                    sx={{ minHeight: 44 }}
                  >
                    Raise dispute
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={!canCancel || actionLoading}
                    startIcon={<LocalShippingIcon />}
                    onClick={() => setCancelDialogOpen(true)}
                    sx={{ minHeight: 44 }}
                  >
                    Cancel request
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Request details
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Posted by
                    </Typography>
                    <Typography>{job?.client?.firstName || 'You'} {job?.client?.lastName || ''}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Worker payout
                    </Typography>
                    <Typography>{formatCurrency(Number(job?.escrow?.workerPayout || 0))}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Platform fee
                    </Typography>
                    <Typography>{formatCurrency(Number(job?.escrow?.platformFee || 0))}</Typography>
                  </Box>
                  {job?.dispute?.status && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Dispute status
                        </Typography>
                        <Typography sx={{ textTransform: 'capitalize' }}>{job.dispute.status.replace(/_/g, ' ')}</Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Approve completed work</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>Rate the completed work before the payout is released.</Typography>
            <Rating value={rating} onChange={(_, value) => setRating(value || 5)} />
            <TextField
              multiline
              minRows={4}
              label="Optional review"
              value={review}
              onChange={(event) => setReview(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Back</Button>
          <Button variant="contained" onClick={handleApproveWork} disabled={actionLoading}>
            Release payout
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Cancel quick-hire request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Why are you cancelling?"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep request</Button>
          <Button color="error" variant="contained" onClick={handleCancelJob} disabled={actionLoading}>
            Cancel request
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={disputeDialogOpen} onClose={() => setDisputeDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Raise a dispute</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Reason"
              value={disputeReason}
              onChange={(event) => setDisputeReason(event.target.value)}
            >
              <MenuItem value="work_not_completed">Work not completed</MenuItem>
              <MenuItem value="poor_quality">Poor quality</MenuItem>
              <MenuItem value="worker_no_show">Worker no-show</MenuItem>
              <MenuItem value="scope_disagreement">Scope disagreement</MenuItem>
              <MenuItem value="payment_issue">Payment issue</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Describe what went wrong"
              value={disputeDescription}
              onChange={(event) => setDisputeDescription(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisputeDialogOpen(false)}>Back</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={handleRaiseDispute}
            disabled={actionLoading || !disputeDescription.trim()}
          >
            Submit dispute
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HirerQuickJobTrackingPage;
