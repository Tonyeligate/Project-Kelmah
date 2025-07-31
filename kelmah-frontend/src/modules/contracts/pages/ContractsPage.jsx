import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Description as ContractIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  CloudUpload as UploadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Handshake as HandshakeIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  formatDistanceToNow,
  format,
  addDays,
  differenceInDays,
} from 'date-fns';
import { useAuth } from '../../auth/contexts/AuthContext';

// Enhanced Contract Management System
const EnhancedContractsPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [],
      payments: [],
      totalPaid: 1100,
      nextPaymentDue: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      documents: [],
      signatures: {
        worker: {
          signed: true,
          signedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
          ipAddress: '192.168.1.100',
        },
        client: {
          signed: true,
          signedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
          ipAddress: '192.168.1.101',
        },
      },
    },
    [],
        client: {
          signed: true,
          signedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22),
          ipAddress: '192.168.1.102',
        },
      },
    },
    [],
        client: {
          signed: false,
          signedAt: null,
          ipAddress: null,
        },
      },
    },
  ];

  // Initialize data
  useEffect(() => {
    const loadContracts = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setContracts(mockContracts);
      } catch (error) {
        console.error('Failed to load contracts:', error);
        showFeedback('Failed to load contracts', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, []);

  // Filter and sort contracts
  useEffect(() => {
    let filtered = [...contracts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.title.toLowerCase().includes(query) ||
          contract.client.name.toLowerCase().includes(query) ||
          contract.job.title.toLowerCase().includes(query) ||
          contract.status.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'active':
        filtered = filtered.filter((contract) => contract.status === 'active');
        break;
      case 'completed':
        filtered = filtered.filter(
          (contract) => contract.status === 'completed',
        );
        break;
      case 'pending':
        filtered = filtered.filter(
          (contract) => contract.status === 'pending-signature',
        );
        break;
      case 'overdue':
        filtered = filtered.filter((contract) => {
          const now = new Date();
          return contract.status === 'active' && contract.endDate < now;
        });
        break;
      case 'payment-due':
        filtered = filtered.filter(
          (contract) =>
            contract.nextPaymentDue && contract.nextPaymentDue < new Date(),
        );
        break;
      default:
        break;
    }

    // Apply sorting
    switch (selectedSort) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'value-high':
        filtered.sort((a, b) => b.budget - a.budget);
        break;
      case 'value-low':
        filtered.sort((a, b) => a.budget - b.budget);
        break;
      case 'deadline':
        filtered.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredContracts(filtered);
  }, [contracts, searchQuery, selectedFilter, selectedSort]);

  // Utility functions
  const showFeedback = (message, severity = 'info') => {
    setFeedback({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'pending-signature':
        return '#FFD700';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      case 'pending-signature':
        return <ScheduleIcon />;
      case 'cancelled':
        return <ErrorIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in-progress':
        return '#FFD700';
      case 'pending':
        return '#9E9E9E';
      case 'overdue':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Contract Statistics Component
  const ContractStatistics = () => {
    const stats = useMemo(() => {
      const total = contracts.length;
      const active = contracts.filter((c) => c.status === 'active').length;
      const completed = contracts.filter(
        (c) => c.status === 'completed',
      ).length;
      const pending = contracts.filter(
        (c) => c.status === 'pending-signature',
      ).length;
      const totalValue = (contracts || []).reduce((sum, c) => sum + (c.budget || 0), 0);
      const totalPaid = (contracts || []).reduce((sum, c) => sum + (c.totalPaid || 0), 0);
      const avgValue = total > 0 ? totalValue / total : 0;

      return {
        total,
        active,
        completed,
        pending,
        totalValue,
        totalPaid,
        avgValue,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    }, [contracts]);

  return (
      <Grid container spacing={3}>
        {[
          {
            title: 'Total Contracts',
            value: stats.total,
            color: '#2196F3',
            icon: <ContractIcon />,
          },
          {
            title: 'Active',
            value: stats.active,
            color: '#4CAF50',
            icon: <CheckCircleIcon />,
          },
          {
            title: 'Completed',
            value: stats.completed,
            color: '#9C27B0',
            icon: <CheckCircleIcon />,
          },
          {
            title: 'Pending Signature',
            value: stats.pending,
            color: '#FFD700',
            icon: <ScheduleIcon />,
          },
          {
            title: 'Total Value',
            value: `GH₵${stats.totalValue.toLocaleString()}`,
            color: '#FF9800',
            icon: <MoneyIcon />,
          },
          {
            title: 'Total Earned',
            value: `GH₵${stats.totalPaid.toLocaleString()}`,
            color: '#4CAF50',
            icon: <PaymentIcon />,
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, ${alpha(stat.color, 0.05)} 100%)`,
                  border: `1px solid ${alpha(stat.color, 0.2)}`,
                  borderRadius: 3,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${stat.color} 0%, ${alpha(stat.color, 0.8)} 100%)`,
                  },
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{
                          color: stat.color,
                          fontWeight: 800,
                          fontSize: { xs: '1.5rem', sm: '1.75rem' },
                          mb: 0.5,
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        {stat.title}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: alpha(stat.color, 0.2),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Contract Card Component
  const ContractCard = ({ contract, index }) => {
    const statusColor = getStatusColor(contract.status);
    const statusIcon = getStatusIcon(contract.status);
    const daysUntilDeadline = differenceInDays(
      new Date(contract.endDate),
      new Date(),
    );
    const isOverdue = daysUntilDeadline < 0 && contract.status === 'active';
    const paymentDue =
      contract.nextPaymentDue && contract.nextPaymentDue < new Date();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          sx={{
            background:
              'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
            border: `1px solid ${alpha(statusColor, 0.3)}`,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 25px ${alpha(statusColor, 0.3)}`,
              border: `1px solid ${alpha(statusColor, 0.5)}`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${statusColor} 0%, ${alpha(statusColor, 0.8)} 100%)`,
            },
          }}
          onClick={() => {
            setSelectedContract(contract);
            setViewDialog(true);
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {/* Header */}
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {contract.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={contract.client.avatar}
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: alpha('#FFD700', 0.2),
                      color: '#FFD700',
                    }}
                  >
                    {contract.client.name.charAt(0)}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {contract.client.name}
                  </Typography>
                </Stack>
      </Box>

              <Stack direction="row" alignItems="center" spacing={1}>
                {(isOverdue || paymentDue) && (
                  <Tooltip
                    title={isOverdue ? 'Contract overdue' : 'Payment due'}
                  >
                    <WarningIcon sx={{ color: '#FF5722', fontSize: 20 }} />
                  </Tooltip>
                )}
                <Chip
                  icon={statusIcon}
                  label={contract.status.replace('-', ' ').toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: alpha(statusColor, 0.2),
                    color: statusColor,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': {
                      color: statusColor,
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedContract(contract);
                    setMoreMenuAnchor(e.currentTarget);
                  }}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      color: '#FFD700',
                    },
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Stack>
            </Stack>

            {/* Contract Details */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MoneyIcon sx={{ color: '#4CAF50', fontSize: 16 }} />
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      Value
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#4CAF50',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                    }}
                  >
                    {contract.currency}
                    {contract.budget.toLocaleString()}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarIcon sx={{ color: '#2196F3', fontSize: 16 }} />
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      Deadline
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isOverdue ? '#FF5722' : '#2196F3',
                      fontWeight: 600,
                    }}
                  >
                    {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                    {contract.status === 'active' && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: isOverdue
                            ? '#FF5722'
                            : 'rgba(255,255,255,0.5)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {isOverdue
                          ? `${Math.abs(daysUntilDeadline)} days overdue`
                          : `${daysUntilDeadline} days left`}
                      </Typography>
                    )}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            {/* Progress Bar */}
            {contract.status === 'active' && (
              <Box sx={{ mb: 2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    Progress
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#FFD700', fontWeight: 600 }}
                  >
                    {contract.progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={contract.progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background:
                        'linear-gradient(90deg, #FFD700 0%, #FFC000 100%)',
                    },
                  }}
                />
              </Box>
            )}

            {/* Payment Status */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <PaymentIcon sx={{ color: '#9C27B0', fontSize: 16 }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Paid: {contract.currency}
                  {contract.totalPaid.toLocaleString()} / {contract.currency}
                  {contract.budget.toLocaleString()}
                </Typography>
              </Stack>
              {paymentDue && (
                <Chip
                  label="Payment Due"
                  size="small"
                  sx={{
                    backgroundColor: alpha('#FF5722', 0.2),
                    color: '#FF5722',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Contract Details Dialog
  const ContractDetailsDialog = () => (
    <Dialog
      open={viewDialog}
      onClose={() => {
        setViewDialog(false);
        setSelectedContract(null);
      }}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(40,40,40,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          maxHeight: '90vh',
        },
      }}
    >
      {selectedContract && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{ color: '#FFD700', fontWeight: 700 }}
                >
                  {selectedContract.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Contract ID: {selectedContract.id}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={getStatusIcon(selectedContract.status)}
                  label={selectedContract.status
                    .replace('-', ' ')
                    .toUpperCase()}
                  sx={{
                    backgroundColor: alpha(
                      getStatusColor(selectedContract.status),
                      0.2,
                    ),
                    color: getStatusColor(selectedContract.status),
                    fontWeight: 600,
                  }}
                />
                <IconButton
                  onClick={() => {
                    setViewDialog(false);
                    setSelectedContract(null);
                  }}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Contract Overview */}
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: '#FFD700', fontWeight: 600, mb: 2 }}
                    >
                      Contract Details
                    </Typography>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={selectedContract.client.avatar}
                          sx={{
                            width: 50,
                            height: 50,
                            bgcolor: alpha('#FFD700', 0.2),
                            color: '#FFD700',
                          }}
                        >
                          {selectedContract.client.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ color: '#fff', fontWeight: 600 }}
                          >
                            {selectedContract.client.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                          >
                            {selectedContract.client.email}
                          </Typography>
                        </Box>
                      </Stack>

                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                      <Stack spacing={1}>
                        <Typography
                          variant="body2"
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          Contract Value
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: '#4CAF50', fontWeight: 700 }}
                        >
                          {selectedContract.currency}
                          {selectedContract.budget.toLocaleString()}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={4}>
                        <Stack spacing={1}>
                          <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                          >
                            Start Date
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {format(
                              new Date(selectedContract.startDate),
                              'MMM dd, yyyy',
                            )}
                          </Typography>
                        </Stack>
                        <Stack spacing={1}>
                          <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                          >
                            End Date
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {format(
                              new Date(selectedContract.endDate),
                              'MMM dd, yyyy',
                            )}
                          </Typography>
                        </Stack>
                      </Stack>

                      {selectedContract.status === 'active' && (
                        <Stack spacing={1}>
                          <Typography
                            variant="body2"
                            sx={{ color: 'rgba(255,255,255,0.7)' }}
                          >
                            Progress
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={selectedContract.progress}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background:
                                  'linear-gradient(90deg, #FFD700 0%, #FFC000 100%)',
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: '#FFD700', fontWeight: 600 }}
                          >
                            {selectedContract.progress}% Complete
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                {/* Milestones */}
                <Grid item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      maxHeight: '400px',
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: '#FFD700', fontWeight: 600, mb: 2 }}
                    >
                      Milestones
                    </Typography>
                    <Timeline>
                      {selectedContract.milestones.map((milestone, index) => (
                        <TimelineItem key={milestone.id}>
                          <TimelineSeparator>
                            <TimelineDot
                              sx={{
                                bgcolor: getMilestoneStatusColor(
                                  milestone.status,
                                ),
                                border: 'none',
                              }}
                            >
                              {milestone.status === 'completed' ? (
                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                              ) : milestone.status === 'in-progress' ? (
                                <ScheduleIcon sx={{ fontSize: 16 }} />
                              ) : (
                                <AssignmentIcon sx={{ fontSize: 16 }} />
                              )}
                            </TimelineDot>
                            {index < selectedContract.milestones.length - 1 && (
                              <TimelineConnector
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                }}
                              />
                            )}
                          </TimelineSeparator>
                          <TimelineContent sx={{ py: '12px', px: 2 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                              }}
                            >
                              {milestone.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.7)',
                                mb: 1,
                              }}
                            >
                              {milestone.description}
                            </Typography>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#4CAF50',
                                  fontWeight: 600,
                                }}
                              >
                                {selectedContract.currency}
                                {milestone.amount.toLocaleString()}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255,255,255,0.5)',
                                }}
                              >
                                Due:{' '}
                                {format(new Date(milestone.dueDate), 'MMM dd')}
                              </Typography>
                            </Stack>
                            {milestone.status === 'in-progress' &&
                              milestone.progress && (
                                <LinearProgress
                                  variant="determinate"
                                  value={milestone.progress}
                                  sx={{
                                    mt: 1,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 2,
                                      backgroundColor: '#FFD700',
                                    },
                                  }}
                                />
                              )}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </Paper>
                </Grid>

                {/* Payment History */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: '#FFD700', fontWeight: 600, mb: 2 }}
                    >
                      Payment History
                    </Typography>
                    {selectedContract.payments.length > 0 ? (
                      <Stack spacing={2}>
                        {selectedContract.payments.map((payment) => (
                          <Stack
                            key={payment.id}
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: 'rgba(76, 175, 80, 0.1)',
                              border: '1px solid rgba(76, 175, 80, 0.2)',
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                            >
                              <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                              <Box>
                                <Typography
                                  variant="body1"
                                  sx={{ color: '#fff', fontWeight: 600 }}
                                >
                                  {selectedContract.currency}
                                  {payment.amount.toLocaleString()}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                  Paid on{' '}
                                  {format(
                                    new Date(payment.paidAt),
                                    'MMM dd, yyyy',
                                  )}{' '}
                                  via {payment.method}
                                </Typography>
                              </Box>
                            </Stack>
                            <Chip
                              label="Completed"
                              size="small"
                              sx={{
                                backgroundColor: alpha('#4CAF50', 0.2),
                                color: '#4CAF50',
                                fontWeight: 600,
                              }}
                            />
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.5)',
                          textAlign: 'center',
                          py: 2,
                        }}
                      >
                        No payments recorded yet
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Documents */}
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: '#FFD700', fontWeight: 600, mb: 2 }}
                    >
                      Documents & Signatures
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography
                          variant="subtitle1"
                          sx={{ color: '#fff', fontWeight: 600, mb: 2 }}
                        >
                          Documents
                        </Typography>
                        <Stack spacing={1}>
                          {selectedContract.documents.map((doc) => (
                            <Stack
                              key={doc.id}
                              direction="row"
                              alignItems="center"
                              spacing={2}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                              }}
                            >
                              <ContractIcon sx={{ color: '#2196F3' }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#fff', fontWeight: 600 }}
                                >
                                  {doc.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                  Uploaded{' '}
                                  {formatDistanceToNow(
                                    new Date(doc.uploadedAt),
                                    { addSuffix: true },
                                  )}
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                sx={{ color: '#2196F3' }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography
                          variant="subtitle1"
                          sx={{ color: '#fff', fontWeight: 600, mb: 2 }}
                        >
                          Signatures
                        </Typography>
                        <Stack spacing={2}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: selectedContract.signatures.worker
                                .signed
                                ? 'rgba(76, 175, 80, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${
                                selectedContract.signatures.worker.signed
                                  ? 'rgba(76, 175, 80, 0.2)'
                                  : 'rgba(255, 255, 255, 0.1)'
                              }`,
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                            >
                              <HandshakeIcon
                                sx={{
                                  color: selectedContract.signatures.worker
                                    .signed
                                    ? '#4CAF50'
                                    : 'rgba(255,255,255,0.5)',
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#fff', fontWeight: 600 }}
                                >
                                  Worker (You)
                                </Typography>
                                {selectedContract.signatures.worker.signed && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                                  >
                                    Signed{' '}
                                    {formatDistanceToNow(
                                      new Date(
                                        selectedContract.signatures.worker.signedAt,
                                      ),
                                      { addSuffix: true },
                                    )}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                            <Chip
                              label={
                                selectedContract.signatures.worker.signed
                                  ? 'Signed'
                                  : 'Pending'
                              }
                              size="small"
                              sx={{
                                backgroundColor: alpha(
                                  selectedContract.signatures.worker.signed
                                    ? '#4CAF50'
                                    : '#9E9E9E',
                                  0.2,
                                ),
                                color: selectedContract.signatures.worker.signed
                                  ? '#4CAF50'
                                  : '#9E9E9E',
                                fontWeight: 600,
                              }}
                            />
                          </Stack>

                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: selectedContract.signatures.client
                                .signed
                                ? 'rgba(76, 175, 80, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                              border: `1px solid ${
                                selectedContract.signatures.client.signed
                                  ? 'rgba(76, 175, 80, 0.2)'
                                  : 'rgba(255, 255, 255, 0.1)'
                              }`,
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                            >
                              <PersonIcon
                                sx={{
                                  color: selectedContract.signatures.client
                                    .signed
                                    ? '#4CAF50'
                                    : 'rgba(255,255,255,0.5)',
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#fff', fontWeight: 600 }}
                                >
                                  Client ({selectedContract.client.name})
                                </Typography>
                                {selectedContract.signatures.client.signed && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                                  >
                                    Signed{' '}
                                    {formatDistanceToNow(
                                      new Date(
                                        selectedContract.signatures.client.signedAt,
                                      ),
                                      { addSuffix: true },
                                    )}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                            <Chip
                              label={
                                selectedContract.signatures.client.signed
                                  ? 'Signed'
                                  : 'Pending'
                              }
                              size="small"
                              sx={{
                                backgroundColor: alpha(
                                  selectedContract.signatures.client.signed
                                    ? '#4CAF50'
                                    : '#9E9E9E',
                                  0.2,
                                ),
                                color: selectedContract.signatures.client.signed
                                  ? '#4CAF50'
                                  : '#9E9E9E',
                                fontWeight: 600,
                              }}
                            />
                          </Stack>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.1),
                },
              }}
            >
              Print
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.1),
                },
              }}
            >
              Download PDF
            </Button>
            <Button
              startIcon={<EmailIcon />}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.1),
                },
              }}
            >
              Send to Client
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                fontWeight: 700,
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                },
              }}
            >
              Edit Contract
            </Button>
          </DialogActions>
        </motion.div>
      )}
    </Dialog>
  );

  // Tab panels
  const tabPanels = [
    { label: 'All Contracts', value: 0 },
    { label: 'Active', value: 1 },
    { label: 'Pending Signature', value: 2 },
    { label: 'Completed', value: 3 },
    { label: 'Analytics', value: 4 },
  ];

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <ContractStatistics />
          {[...Array(3)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: '#FFD700',
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                mb: 0.5,
              }}
            >
              Contract Management
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Manage your contracts, milestones, and payments
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <IconButton
              onClick={() => window.location.reload()}
              sx={{
                background: alpha('#FFD700', 0.1),
                border: '1px solid rgba(255,215,0,0.3)',
                '&:hover': {
                  background: alpha('#FFD700', 0.2),
                },
              }}
            >
              <RefreshIcon sx={{ color: '#FFD700' }} />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialog(true)}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                fontWeight: 700,
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                },
              }}
            >
              New Contract
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Statistics */}
      <Box sx={{ mb: 4 }}>
        <ContractStatistics />
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600,
              '&.Mui-selected': {
                color: '#FFD700',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#FFD700',
            },
          }}
        >
          {tabPanels.map((panel) => (
            <Tab key={panel.value} label={panel.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 4 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background:
              'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
            Contract Analytics
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Detailed analytics and reporting features coming soon!
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Search and Filters */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background:
                'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
              border: '1px solid rgba(255,215,0,0.2)',
              borderRadius: 3,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <TextField
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255,215,0,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,215,0,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FFD700',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.5)',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{ color: 'rgba(255,255,255,0.5)', mr: 1 }}
                    />
                  ),
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: 'rgba(255,215,0,0.3)',
                  color: '#FFD700',
                  '&:hover': {
                    borderColor: '#FFD700',
                    backgroundColor: alpha('#FFD700', 0.1),
                  },
                }}
              >
                Filter
              </Button>

              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{
                  borderColor: 'rgba(255,215,0,0.3)',
                  color: '#FFD700',
                  '&:hover': {
                    borderColor: '#FFD700',
                    backgroundColor: alpha('#FFD700', 0.1),
                  },
                }}
              >
                Sort
              </Button>
            </Stack>

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {filteredContracts.length} contract
              {filteredContracts.length !== 1 ? 's' : ''} found
            </Typography>
          </Paper>

          {/* Contracts Grid */}
          {filteredContracts.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background:
                  'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
                borderRadius: 3,
              }}
            >
              <ContractIcon
                sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }}
              />
              <Typography
                variant="h6"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
              >
                No contracts found
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Try adjusting your search or filters
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              <AnimatePresence>
                {filteredContracts.map((contract, index) => (
                  <Grid item xs={12} md={6} lg={4} key={contract.id}>
                    <ContractCard contract={contract} index={index} />
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          )}
        </>
      )}

      {/* Contract Details Dialog */}
      <ContractDetailsDialog />

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        {[
          { value: 'all', label: 'All Contracts' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'pending', label: 'Pending Signature' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'payment-due', label: 'Payment Due' },
        ].map((filter) => (
          <MenuItem
            key={filter.value}
            selected={selectedFilter === filter.value}
            onClick={() => {
              setSelectedFilter(filter.value);
              setFilterMenuAnchor(null);
            }}
          >
            {filter.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        {[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' },
          { value: 'value-high', label: 'Highest Value' },
          { value: 'value-low', label: 'Lowest Value' },
          { value: 'deadline', label: 'By Deadline' },
        ].map((sort) => (
          <MenuItem
            key={sort.value}
            selected={selectedSort === sort.value}
            onClick={() => {
              setSelectedSort(sort.value);
              setSortMenuAnchor(null);
            }}
          >
            {sort.label}
          </MenuItem>
        ))}
      </Menu>

      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setViewDialog(true);
            setMoreMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <ViewIcon />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit Contract</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText>Download PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setMoreMenuAnchor(null)}>
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => setMoreMenuAnchor(null)}
          sx={{ color: '#F44336' }}
        >
          <ListItemIcon>
            <DeleteIcon sx={{ color: '#F44336' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Feedback Snackbar */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedContractsPage;
