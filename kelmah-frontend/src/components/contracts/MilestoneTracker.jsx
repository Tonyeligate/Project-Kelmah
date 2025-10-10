import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Assignment as TaskIcon,
  Photo as PhotoIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as ProgressIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Comprehensive Milestone Tracker for Ghana Contract Management
 * Features: Progress tracking, payment milestones, deliverable management, automated notifications
 */
const MilestoneTracker = ({
  contractId,
  milestones: initialMilestones = [],
  onMilestoneUpdate,
  onPaymentRequest,
  currentUser,
  isContractOwner = false,
  isWorker = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [milestones, setMilestones] = useState(initialMilestones);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    dueDate: '',
    amount: '',
    deliverables: [],
    priority: 'medium',
  });

  // Milestone status types for Ghana context
  const milestoneStatuses = {
    pending: {
      label: 'Pending',
      color: '#FFA726',
      icon: PendingIcon,
      description: 'Waiting to start',
    },
    in_progress: {
      label: 'In Progress',
      color: '#42A5F5',
      icon: StartIcon,
      description: 'Currently working on this milestone',
    },
    review: {
      label: 'Under Review',
      color: '#AB47BC',
      icon: ViewIcon,
      description: 'Submitted for client review',
    },
    completed: {
      label: 'Completed',
      color: '#66BB6A',
      icon: CheckCircleIcon,
      description: 'Successfully completed and approved',
    },
    payment_pending: {
      label: 'Payment Pending',
      color: '#FFD700',
      icon: PaymentIcon,
      description: 'Awaiting payment from client',
    },
    overdue: {
      label: 'Overdue',
      color: '#EF5350',
      icon: WarningIcon,
      description: 'Past due date',
    },
    blocked: {
      label: 'Blocked',
      color: '#FF7043',
      icon: ErrorIcon,
      description: 'Cannot proceed due to dependencies',
    },
  };

  // Priority levels
  const priorityLevels = {
    low: { label: 'Low', color: '#81C784' },
    medium: { label: 'Medium', color: '#FFB74D' },
    high: { label: 'High', color: '#FF8A65' },
    critical: { label: 'Critical', color: '#E57373' },
  };

  // Sample milestones for demonstration (Ghana context)
  const sampleMilestones = useMemo(
    () => [
      {
        id: '1',
        title: 'Site Assessment & Planning',
        description:
          'Complete assessment of plumbing requirements and create detailed work plan',
        status: 'completed',
        priority: 'high',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        amount: 500,
        paidAmount: 500,
        progress: 100,
        deliverables: [
          {
            id: '1a',
            name: 'Site assessment report',
            status: 'completed',
            file: '/docs/assessment.pdf',
          },
          {
            id: '1b',
            name: 'Work timeline',
            status: 'completed',
            file: '/docs/timeline.pdf',
          },
          {
            id: '1c',
            name: 'Material list',
            status: 'completed',
            file: '/docs/materials.pdf',
          },
        ],
        assignedTo: 'Kwame Asante',
        location: 'East Legon, Accra',
        notes:
          'Site assessment completed successfully. All necessary permits obtained.',
        photos: ['/photos/site1.jpg', '/photos/site2.jpg'],
      },
      {
        id: '2',
        title: 'Material Procurement',
        description:
          'Purchase all required materials including pipes, fittings, and fixtures',
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 1200,
        paidAmount: 600,
        progress: 60,
        deliverables: [
          {
            id: '2a',
            name: 'Material receipts',
            status: 'completed',
            file: '/docs/receipts.pdf',
          },
          { id: '2b', name: 'Quality certificates', status: 'in_progress' },
          { id: '2c', name: 'Delivery confirmation', status: 'pending' },
        ],
        assignedTo: 'Kwame Asante',
        location: 'Supplier - Tema',
        notes: 'Materials ordered from certified suppliers. 60% delivered.',
        photos: ['/photos/materials1.jpg'],
      },
      {
        id: '3',
        title: 'Pipe Installation',
        description:
          'Install new water supply and drainage pipes throughout the building',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 2000,
        paidAmount: 0,
        progress: 0,
        deliverables: [
          { id: '3a', name: 'Pipe installation photos', status: 'pending' },
          { id: '3b', name: 'Pressure test results', status: 'pending' },
          { id: '3c', name: 'Installation certificate', status: 'pending' },
        ],
        assignedTo: 'Kwame Asante',
        location: 'East Legon, Accra',
        notes: 'Waiting for material delivery completion',
        dependencies: ['2'],
      },
      {
        id: '4',
        title: 'Final Testing & Handover',
        description:
          'Comprehensive testing of all plumbing systems and project handover',
        status: 'pending',
        priority: 'critical',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 800,
        paidAmount: 0,
        progress: 0,
        deliverables: [
          { id: '4a', name: 'System test report', status: 'pending' },
          { id: '4b', name: 'Warranty documentation', status: 'pending' },
          { id: '4c', name: 'User manual', status: 'pending' },
        ],
        assignedTo: 'Kwame Asante',
        location: 'East Legon, Accra',
        notes: 'Final milestone - includes 6-month warranty',
        dependencies: ['3'],
      },
    ],
    [],
  );

  // Initialize with sample data if no milestones provided
  useEffect(() => {
    if (initialMilestones.length === 0) {
      setMilestones(sampleMilestones);
    }
  }, [initialMilestones, sampleMilestones]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (milestones.length === 0) return 0;
    const totalProgress = milestones.reduce(
      (sum, milestone) => sum + milestone.progress,
      0,
    );
    return Math.round(totalProgress / milestones.length);
  }, [milestones]);

  // Calculate financial progress
  const financialSummary = useMemo(() => {
    const totalAmount = milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    const paidAmount = milestones.reduce(
      (sum, m) => sum + (m.paidAmount || 0),
      0,
    );
    const pendingAmount = totalAmount - paidAmount;

    return {
      total: totalAmount,
      paid: paidAmount,
      pending: pendingAmount,
      percentagePaid:
        totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    };
  }, [milestones]);

  // Filter milestones based on status
  const filteredMilestones = useMemo(() => {
    if (filterStatus === 'all') return milestones;
    return milestones.filter((milestone) => milestone.status === filterStatus);
  }, [milestones, filterStatus]);

  // Get milestone status with overdue logic
  const getMilestoneStatus = useCallback((milestone) => {
    if (milestone.status === 'completed') return milestone.status;

    const dueDate = new Date(milestone.dueDate);
    const now = new Date();

    if (now > dueDate && milestone.status !== 'completed') {
      return 'overdue';
    }

    return milestone.status;
  }, []);

  // Update milestone status
  const updateMilestoneStatus = useCallback(
    async (milestoneId, newStatus) => {
      try {
        const updatedMilestones = milestones.map((milestone) => {
          if (milestone.id === milestoneId) {
            const updated = {
              ...milestone,
              status: newStatus,
            };

            // Auto-set completion date and progress for completed milestones
            if (newStatus === 'completed') {
              updated.completedDate = new Date().toISOString();
              updated.progress = 100;
            }

            return updated;
          }
          return milestone;
        });

        setMilestones(updatedMilestones);

        if (onMilestoneUpdate) {
          onMilestoneUpdate(milestoneId, newStatus);
        }

        // Simulate API call
        console.log(`Milestone ${milestoneId} updated to ${newStatus}`);
      } catch (error) {
        console.error('Failed to update milestone:', error);
      }
    },
    [milestones, onMilestoneUpdate],
  );

  // Request payment for milestone
  const requestPayment = useCallback(
    async (milestoneId) => {
      try {
        if (onPaymentRequest) {
          onPaymentRequest(milestoneId);
        }

        // Update status to payment pending
        await updateMilestoneStatus(milestoneId, 'payment_pending');

        console.log(`Payment requested for milestone ${milestoneId}`);
      } catch (error) {
        console.error('Failed to request payment:', error);
      }
    },
    [onPaymentRequest, updateMilestoneStatus],
  );

  // Add new milestone
  const addMilestone = useCallback(async () => {
    try {
      const milestone = {
        id: Date.now().toString(),
        ...newMilestone,
        status: 'pending',
        progress: 0,
        paidAmount: 0,
        assignedTo: currentUser?.name || 'Assigned Worker',
        createdDate: new Date().toISOString(),
      };

      setMilestones((prev) => [...prev, milestone]);
      setAddDialogOpen(false);
      setNewMilestone({
        title: '',
        description: '',
        dueDate: '',
        amount: '',
        deliverables: [],
        priority: 'medium',
      });

      console.log('New milestone added:', milestone);
    } catch (error) {
      console.error('Failed to add milestone:', error);
    }
  }, [newMilestone, currentUser]);

  // Render milestone card
  const renderMilestoneCard = useCallback(
    (milestone) => {
      const status = getMilestoneStatus(milestone);
      const statusInfo = milestoneStatuses[status];
      const priorityInfo = priorityLevels[milestone.priority];
      const isExpanded = expandedMilestone === milestone.id;

      return (
        <motion.div
          key={milestone.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            elevation={3}
            sx={{
              mb: 2,
              border:
                status === 'overdue'
                  ? '2px solid #EF5350'
                  : '1px solid rgba(255,215,0,0.2)',
              background:
                'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.95) 100%)',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            {/* Priority Badge */}
            <Chip
              label={priorityInfo.label}
              size="small"
              sx={{
                position: 'absolute',
                top: -8,
                right: 16,
                backgroundColor: priorityInfo.color,
                color: '#000',
                fontWeight: 700,
                fontSize: '10px',
              }}
            />

            <CardContent sx={{ pb: 1 }}>
              {/* Header */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: statusInfo.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                  }}
                >
                  <statusInfo.icon />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: '#FFD700' }}
                  >
                    {milestone.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {milestone.description}
                  </Typography>
                </Box>

                <Stack alignItems="center" spacing={1}>
                  <Typography
                    variant="h6"
                    sx={{ color: '#4CAF50', fontWeight: 700 }}
                  >
                    ₵{milestone.amount?.toLocaleString()}
                  </Typography>
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                      fontWeight: 600,
                    }}
                  />
                </Stack>
              </Stack>

              {/* Progress Bar */}
              <Box sx={{ mb: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {milestone.progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={milestone.progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,215,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: statusInfo.color,
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>

              {/* Key Information */}
              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarIcon
                    sx={{ fontSize: 16, color: 'text.secondary' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {milestone.assignedTo}
                  </Typography>
                </Stack>

                {milestone.location && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationIcon
                      sx={{ fontSize: 16, color: 'text.secondary' }}
                    />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {milestone.location}
                    </Typography>
                  </Stack>
                )}
              </Stack>

              {/* Actions */}
              <Stack
                direction="row"
                spacing={1}
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack direction="row" spacing={1}>
                  {isWorker && status === 'in_progress' && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircleIcon />}
                      onClick={() =>
                        updateMilestoneStatus(milestone.id, 'review')
                      }
                      sx={{ borderColor: '#66BB6A', color: '#66BB6A' }}
                    >
                      Submit for Review
                    </Button>
                  )}

                  {isContractOwner && status === 'review' && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={() =>
                        updateMilestoneStatus(milestone.id, 'completed')
                      }
                      sx={{
                        background:
                          'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)',
                        color: '#000',
                      }}
                    >
                      Approve
                    </Button>
                  )}

                  {status === 'completed' &&
                    milestone.paidAmount < milestone.amount &&
                    isWorker && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        onClick={() => requestPayment(milestone.id)}
                        sx={{
                          background:
                            'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                          color: '#000',
                        }}
                      >
                        Request Payment
                      </Button>
                    )}
                </Stack>

                <IconButton
                  size="small"
                  onClick={() =>
                    setExpandedMilestone(isExpanded ? null : milestone.id)
                  }
                  sx={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Stack>

              {/* Expanded Content */}
              <Collapse in={isExpanded}>
                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid rgba(255,215,0,0.2)',
                  }}
                >
                  {/* Deliverables */}
                  {milestone.deliverables &&
                    milestone.deliverables.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 2, color: '#FFD700' }}
                        >
                          Deliverables ({milestone.deliverables.length})
                        </Typography>
                        <List dense>
                          {milestone.deliverables.map((deliverable) => (
                            <ListItem key={deliverable.id} sx={{ py: 0.5 }}>
                              <ListItemIcon>
                                {deliverable.status === 'completed' ? (
                                  <CheckCircleIcon
                                    sx={{ color: '#66BB6A', fontSize: 20 }}
                                  />
                                ) : deliverable.status === 'in_progress' ? (
                                  <StartIcon
                                    sx={{ color: '#42A5F5', fontSize: 20 }}
                                  />
                                ) : (
                                  <PendingIcon
                                    sx={{ color: '#FFA726', fontSize: 20 }}
                                  />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={deliverable.name}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                              {deliverable.file && (
                                <ListItemSecondaryAction>
                                  <IconButton size="small">
                                    <ViewIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                  {/* Notes */}
                  {milestone.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: '#FFD700' }}
                      >
                        Notes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Photos */}
                  {milestone.photos && milestone.photos.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: '#FFD700' }}
                      >
                        Photos ({milestone.photos.length})
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {milestone.photos.map((photo, index) => (
                          <Paper
                            key={index}
                            sx={{
                              width: 60,
                              height: 60,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255,215,0,0.1)',
                              cursor: 'pointer',
                            }}
                          >
                            <PhotoIcon sx={{ color: '#FFD700' }} />
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </motion.div>
      );
    },
    [
      expandedMilestone,
      getMilestoneStatus,
      isWorker,
      isContractOwner,
      updateMilestoneStatus,
      requestPayment,
    ],
  );

  return (
    <Box>
      {/* Header with Summary */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          background:
            'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Typography variant="h5" sx={{ color: '#FFD700', fontWeight: 700 }}>
            Project Milestones
          </Typography>

          {isContractOwner && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
                color: '#000',
                fontWeight: 700,
              }}
            >
              Add Milestone
            </Button>
          )}
        </Stack>

        {/* Progress Summary */}
        <Stack direction={isMobile ? 'column' : 'row'} spacing={3}>
          {/* Overall Progress */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#FFD700' }}>
              Overall Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ flex: 1, mr: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={overallProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,215,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#FFD700',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {overallProgress}%
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {milestones.filter((m) => m.status === 'completed').length} of{' '}
              {milestones.length} milestones completed
            </Typography>
          </Box>

          {/* Financial Summary */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#FFD700' }}>
              Financial Progress
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ₵{financialSummary.total.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Paid
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: '#4CAF50', fontWeight: 700 }}
                >
                  ₵{financialSummary.paid.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: '#FF9800', fontWeight: 700 }}
                >
                  ₵{financialSummary.pending.toLocaleString()}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {financialSummary.percentagePaid}% of contract value paid
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Filter Chips */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 3, overflowX: 'auto', pb: 1 }}
      >
        <Chip
          label="All"
          onClick={() => setFilterStatus('all')}
          color={filterStatus === 'all' ? 'primary' : 'default'}
          sx={{
            backgroundColor:
              filterStatus === 'all' ? '#FFD700' : 'rgba(255,255,255,0.1)',
            color: filterStatus === 'all' ? '#000' : '#fff',
            fontWeight: 600,
          }}
        />
        {Object.entries(milestoneStatuses).map(([status, info]) => {
          const count = milestones.filter(
            (m) => getMilestoneStatus(m) === status,
          ).length;
          return (
            <Chip
              key={status}
              label={`${info.label} (${count})`}
              onClick={() => setFilterStatus(status)}
              color={filterStatus === status ? 'primary' : 'default'}
              sx={{
                backgroundColor:
                  filterStatus === status
                    ? info.color
                    : 'rgba(255,255,255,0.1)',
                color: filterStatus === status ? '#000' : '#fff',
                fontWeight: 600,
                minWidth: 'fit-content',
              }}
            />
          );
        })}
      </Stack>

      {/* Milestones List */}
      <AnimatePresence>
        {filteredMilestones.map((milestone) => renderMilestoneCard(milestone))}
      </AnimatePresence>

      {filteredMilestones.length === 0 && (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <TaskIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No milestones found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus === 'all'
              ? 'No milestones have been created for this contract yet.'
              : `No milestones with status "${milestoneStatuses[filterStatus]?.label}" found.`}
          </Typography>
        </Paper>
      )}

      {/* Add Milestone Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Add New Milestone</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Milestone Title"
              value={newMilestone.title}
              onChange={(e) =>
                setNewMilestone((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Complete foundation work"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={newMilestone.description}
              onChange={(e) =>
                setNewMilestone((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Detailed description of milestone requirements"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                value={newMilestone.dueDate}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                type="number"
                label="Amount (₵)"
                value={newMilestone.amount}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || '',
                  }))
                }
                placeholder="0"
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newMilestone.priority}
                onChange={(e) =>
                  setNewMilestone((prev) => ({
                    ...prev,
                    priority: e.target.value,
                  }))
                }
                label="Priority"
              >
                {Object.entries(priorityLevels).map(([key, level]) => (
                  <MenuItem key={key} value={key}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={addMilestone}
            variant="contained"
            disabled={!newMilestone.title || !newMilestone.dueDate}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
            }}
          >
            Add Milestone
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MilestoneTracker;
