import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineDot,
  TimelineSeparator,
  TimelineConnector,
  TimelineOppositeContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Search as SearchIcon,
  Gavel as DisputeIcon,
  Warning as WarningIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  Assignment as CaseIcon,
  AttachFile as AttachmentIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  AccountBalance as EscrowIcon,
  MonetizationOn as RefundIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Priority as PriorityIcon,
  FilterList as FilterIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  PlayArrow as StartIcon,
  Stop as PauseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../auth/contexts/AuthContext';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dispute-tabpanel-${index}`}
      aria-labelledby={`dispute-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DisputeManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');

  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalDisputes: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
    escalatedDisputes: 0,
    avgResolutionTime: 0,
    resolutionRate: 0,
    categories: {
      payment: 0,
      quality: 0,
      communication: 0,
      scope: 0,
      other: 0
    }
  });

  const disputeStatuses = [
    { value: 'open', label: 'Open', color: 'warning' },
    { value: 'investigating', label: 'Investigating', color: 'info' },
    { value: 'mediation', label: 'In Mediation', color: 'primary' },
    { value: 'resolved', label: 'Resolved', color: 'success' },
    { value: 'escalated', label: 'Escalated', color: 'error' },
    { value: 'closed', label: 'Closed', color: 'default' }
  ];

  const disputeCategories = [
    { value: 'payment', label: 'Payment Issues', icon: <EscrowIcon /> },
    { value: 'quality', label: 'Work Quality', icon: <WorkIcon /> },
    { value: 'communication', label: 'Communication', icon: <MessageIcon /> },
    { value: 'scope', label: 'Scope Disagreement', icon: <CaseIcon /> },
    { value: 'other', label: 'Other', icon: <WarningIcon /> }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'info' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' },
    { value: 'critical', label: 'Critical', color: 'error' }
  ];

  useEffect(() => {
    fetchDisputes();
  }, [searchTerm, filterStatus, filterPriority, filterCategory, activeTab]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock dispute data for demonstration
      const mockDisputes = [
        {
          id: 'DSP001',
          title: 'Payment Dispute - Web Development Project',
          category: 'payment',
          status: 'investigating',
          priority: 'high',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          hirer: {
            id: 'H001',
            name: 'John Doe',
            email: 'john@example.com'
          },
          worker: {
            id: 'W001',
            name: 'Alice Johnson',
            email: 'alice@example.com'
          },
          job: {
            id: 'J001',
            title: 'E-commerce Website Development',
            amount: 1500.00
          },
          description: 'Hirer claims work was not completed according to specifications and refuses to release escrow funds.',
          evidence: [
            { type: 'file', name: 'project_requirements.pdf', uploadedBy: 'hirer' },
            { type: 'file', name: 'completed_work.zip', uploadedBy: 'worker' },
            { type: 'message', content: 'Screenshots of delivered work', uploadedBy: 'worker' }
          ],
          timeline: [
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), action: 'Dispute opened by hirer', actor: 'John Doe' },
            { date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), action: 'Initial evidence submitted', actor: 'Alice Johnson' },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), action: 'Case assigned to admin', actor: 'Admin' },
            { date: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000), action: 'Investigation started', actor: 'Admin' }
          ],
          escrowAmount: 1500.00,
          adminNotes: 'Reviewing submitted evidence. Both parties have valid points.',
          resolutionSteps: ['Review Evidence', 'Contact Parties', 'Mediation', 'Resolution'],
          currentStep: 1
        },
        {
          id: 'DSP002',
          title: 'Quality Dispute - Logo Design',
          category: 'quality',
          status: 'mediation',
          priority: 'medium',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          hirer: {
            id: 'H002',
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          worker: {
            id: 'W002',
            name: 'Bob Wilson',
            email: 'bob@example.com'
          },
          job: {
            id: 'J002',
            title: 'Company Logo Design',
            amount: 300.00
          },
          description: 'Hirer is unsatisfied with logo design quality and wants revisions beyond agreed scope.',
          evidence: [
            { type: 'image', name: 'original_brief.png', uploadedBy: 'hirer' },
            { type: 'image', name: 'delivered_logo.png', uploadedBy: 'worker' },
            { type: 'message', content: 'Communication thread', uploadedBy: 'system' }
          ],
          timeline: [
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), action: 'Dispute opened by hirer', actor: 'Jane Smith' },
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), action: 'Worker response submitted', actor: 'Bob Wilson' },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), action: 'Mediation initiated', actor: 'Admin' },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), action: 'Compromise proposal sent', actor: 'Admin' }
          ],
          escrowAmount: 300.00,
          adminNotes: 'Proposed 50% payment + one additional revision. Awaiting responses.',
          resolutionSteps: ['Review Evidence', 'Contact Parties', 'Mediation', 'Resolution'],
          currentStep: 2
        },
        {
          id: 'DSP003',
          title: 'Communication Dispute - Mobile App',
          category: 'communication',
          status: 'resolved',
          priority: 'low',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          hirer: {
            id: 'H003',
            name: 'Mike Davis',
            email: 'mike@example.com'
          },
          worker: {
            id: 'W003',
            name: 'Carol Brown',
            email: 'carol@example.com'
          },
          job: {
            id: 'J003',
            title: 'Mobile App Development',
            amount: 2500.00
          },
          description: 'Worker became unresponsive during project. Communication breakdown.',
          resolution: 'Worker provided valid explanation (medical emergency). Project timeline extended.',
          resolutionType: 'mediated_agreement',
          escrowAmount: 2500.00,
          adminNotes: 'Resolved amicably. Both parties satisfied with extended timeline.',
          resolutionSteps: ['Review Evidence', 'Contact Parties', 'Mediation', 'Resolution'],
          currentStep: 3
        }
      ];

      // Filter based on active tab and filters
      let filteredDisputes = mockDisputes;
      
      if (activeTab === 0) { // All
        filteredDisputes = mockDisputes;
      } else if (activeTab === 1) { // Open
        filteredDisputes = mockDisputes.filter(d => ['open', 'investigating', 'mediation'].includes(d.status));
      } else if (activeTab === 2) { // Resolved
        filteredDisputes = mockDisputes.filter(d => d.status === 'resolved');
      }

      if (searchTerm) {
        filteredDisputes = filteredDisputes.filter(
          dispute => 
            dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispute.hirer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispute.worker.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterStatus !== 'all') {
        filteredDisputes = filteredDisputes.filter(
          dispute => dispute.status === filterStatus
        );
      }

      if (filterPriority !== 'all') {
        filteredDisputes = filteredDisputes.filter(
          dispute => dispute.priority === filterPriority
        );
      }

      if (filterCategory !== 'all') {
        filteredDisputes = filteredDisputes.filter(
          dispute => dispute.category === filterCategory
        );
      }

      setDisputes(filteredDisputes);

      // Calculate analytics
      const open = mockDisputes.filter(d => ['open', 'investigating', 'mediation'].includes(d.status));
      const resolved = mockDisputes.filter(d => d.status === 'resolved');
      const escalated = mockDisputes.filter(d => d.status === 'escalated');

      setAnalytics({
        totalDisputes: mockDisputes.length,
        openDisputes: open.length,
        resolvedDisputes: resolved.length,
        escalatedDisputes: escalated.length,
        avgResolutionTime: 4.2, // Mock average days
        resolutionRate: (resolved.length / mockDisputes.length * 100),
        categories: {
          payment: mockDisputes.filter(d => d.category === 'payment').length,
          quality: mockDisputes.filter(d => d.category === 'quality').length,
          communication: mockDisputes.filter(d => d.category === 'communication').length,
          scope: mockDisputes.filter(d => d.category === 'scope').length,
          other: mockDisputes.filter(d => d.category === 'other').length
        }
      });

    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError('Failed to fetch dispute data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDispute = (dispute) => {
    setSelectedDispute(dispute);
    setActiveStep(dispute.currentStep || 0);
    setAdminNotes(dispute.adminNotes || '');
    setOpenDialog(true);
  };

  const handleUpdateStatus = async (disputeId, newStatus) => {
    try {
      setDisputes(prev => prev.map(dispute => 
        dispute.id === disputeId ? { ...dispute, status: newStatus } : dispute
      ));
    } catch (err) {
      setError('Failed to update dispute status');
    }
  };

  const handleAddNote = async (note) => {
    if (!selectedDispute || !note.trim()) return;
    
    try {
      const updatedDispute = {
        ...selectedDispute,
        adminNotes: note,
        timeline: [
          ...selectedDispute.timeline,
          {
            date: new Date(),
            action: 'Admin note added',
            actor: 'Admin',
            note: note
          }
        ]
      };
      
      setSelectedDispute(updatedDispute);
      setDisputes(prev => prev.map(dispute => 
        dispute.id === selectedDispute.id ? updatedDispute : dispute
      ));
    } catch (err) {
      setError('Failed to add admin note');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = disputeStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'default';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorityLevels.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'default';
  };

  const getCategoryIcon = (category) => {
    const categoryObj = disputeCategories.find(c => c.value === category);
    return categoryObj ? categoryObj.icon : <CaseIcon />;
  };

  const formatCurrency = (amount, currency = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const calculateDaysOpen = (createdAt) => {
    const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dispute Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDisputes}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Total Disputes
                  </Typography>
                  <Typography variant="h4">
                    {analytics.totalDisputes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All time cases
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <DisputeIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Open Cases
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {analytics.openDisputes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Require attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <PendingIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Resolution Rate
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {analytics.resolutionRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successfully resolved
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <ResolvedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="overline">
                    Avg Resolution
                  </Typography>
                  <Typography variant="h4">
                    {analytics.avgResolutionTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Days to resolve
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <CaseIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Distribution */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Dispute Categories" />
        <CardContent>
          <Grid container spacing={2}>
            {disputeCategories.map((category) => (
              <Grid item xs={12} sm={6} md={2.4} key={category.value}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    {category.icon}
                    <Typography variant="h5" sx={{ ml: 1 }}>
                      {analytics.categories[category.value]}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {category.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Disputes" />
          <Tab 
            label={
              <Badge badgeContent={analytics.openDisputes} color="warning">
                Open Cases
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={analytics.resolvedDisputes} color="success">
                Resolved
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search disputes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
              </Box>
            </Grid>
          </Grid>

          {showFilters && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      {disputeStatuses.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={filterPriority}
                      label="Priority"
                      onChange={(e) => setFilterPriority(e.target.value)}
                    >
                      <MenuItem value="all">All Priorities</MenuItem>
                      {priorityLevels.map((priority) => (
                        <MenuItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filterCategory}
                      label="Category"
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value="all">All Categories</MenuItem>
                      {disputeCategories.map((category) => (
                        <MenuItem key={category.value} value={category.value}>
                          {category.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Dispute Cases ({disputes.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Case ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Parties</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Days Open</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {dispute.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {dispute.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dispute.job.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getCategoryIcon(dispute.category)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {disputeCategories.find(c => c.value === dispute.category)?.label}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Avatar sx={{ width: 20, height: 20, mr: 1, bgcolor: 'primary.main' }}>
                              {dispute.hirer.name[0]}
                            </Avatar>
                            <Typography variant="caption">
                              {dispute.hirer.name} (Hirer)
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 20, height: 20, mr: 1, bgcolor: 'success.main' }}>
                              {dispute.worker.name[0]}
                            </Avatar>
                            <Typography variant="caption">
                              {dispute.worker.name} (Worker)
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(dispute.job.amount)}
                        </Typography>
                        {dispute.escrowAmount && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Escrow: {formatCurrency(dispute.escrowAmount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={dispute.priority.toUpperCase()} 
                          color={getPriorityColor(dispute.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={disputeStatuses.find(s => s.value === dispute.status)?.label} 
                          color={getStatusColor(dispute.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {calculateDaysOpen(dispute.createdAt)} days
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleViewDispute(dispute)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {disputes.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No disputes found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dispute Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Dispute Case: {selectedDispute?.id}
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDispute && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Case Overview */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="Case Overview"
                    action={
                      <Chip 
                        label={disputeStatuses.find(s => s.value === selectedDispute.status)?.label} 
                        color={getStatusColor(selectedDispute.status)}
                      />
                    }
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Title:
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {selectedDispute.title}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Description:
                        </Typography>
                        <Typography variant="body2" sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                          {selectedDispute.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Job Details:
                        </Typography>
                        <Typography variant="body1">
                          {selectedDispute.job.title}
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {formatCurrency(selectedDispute.job.amount)}
                        </Typography>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Priority:
                          </Typography>
                          <Chip 
                            label={selectedDispute.priority.toUpperCase()} 
                            color={getPriorityColor(selectedDispute.priority)}
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Resolution Progress */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Resolution Progress" />
                  <CardContent>
                    <Stepper activeStep={activeStep} orientation="vertical">
                      {selectedDispute.resolutionSteps?.map((step, index) => (
                        <Step key={step}>
                          <StepLabel>{step}</StepLabel>
                          <StepContent>
                            <Typography variant="body2" color="text.secondary">
                              {index === activeStep ? 'Currently in progress' : 
                               index < activeStep ? 'Completed' : 'Pending'}
                            </Typography>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </CardContent>
                </Card>
              </Grid>

              {/* Evidence */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Evidence & Documents" />
                  <CardContent>
                    <List>
                      {selectedDispute.evidence?.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AttachmentIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.name || item.content}
                            secondary={`Uploaded by: ${item.uploadedBy}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end">
                              <ViewIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Timeline */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Case Timeline" />
                  <CardContent>
                    <Timeline>
                      {selectedDispute.timeline?.map((event, index) => (
                        <TimelineItem key={index}>
                          <TimelineOppositeContent color="text.secondary">
                            {formatDate(event.date)}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color="primary" />
                            {index < selectedDispute.timeline.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant="subtitle2">
                              {event.action}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              by {event.actor}
                            </Typography>
                            {event.note && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                Note: {event.note}
                              </Typography>
                            )}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </CardContent>
                </Card>
              </Grid>

              {/* Admin Notes */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Admin Notes" />
                  <CardContent>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add administrative notes about this case..."
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleAddNote(adminNotes)}
                      >
                        Add Note
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Close
          </Button>
          {selectedDispute && selectedDispute.status !== 'resolved' && (
            <>
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  handleUpdateStatus(selectedDispute.id, 'resolved');
                  setOpenDialog(false);
                }}
              >
                Mark Resolved
              </Button>
              <Button 
                variant="contained" 
                color="warning"
                onClick={() => {
                  handleUpdateStatus(selectedDispute.id, 'escalated');
                  setOpenDialog(false);
                }}
              >
                Escalate Case
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DisputeManagement;
