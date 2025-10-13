import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Stack,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  WorkOutline as WorkOutlineIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import applicationsService from '../services/applicationsService';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const MyApplicationsPage = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState(false);
  const [message, setMessage] = useState('');
  const theme = useTheme();

  // Load applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const data = await applicationsService.getMyApplications();
        // Ensure data is an array, fallback to empty array if not
        const applicationsArray = Array.isArray(data) ? data : [];
        setApplications(applicationsArray);
      } catch (error) {
        console.error('Error loading applications:', error);
        setApplications([]); // Set empty array as fallback
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open application details dialog
  const handleOpenDetails = (application) => {
    setSelectedApplication(application);
    setOpenDetailsDialog(true);
  };

  // Open message dialog
  const handleOpenMessage = (application) => {
    setSelectedApplication(application);
    setOpenMessageDialog(true);
  };

  // Send message
  const handleSendMessage = () => {
    console.log(
      'Sending message to',
      selectedApplication?.company,
      ':',
      message,
    );
    setMessage('');
    setOpenMessageDialog(false);
    // Here you would typically call an API to send the message
  };

  // Filter applications based on current tab
  const filteredApplications = Array.isArray(applications)
    ? applications.filter((app) => {
        if (tabValue === 0) return true; // All applications
        if (tabValue === 1) return app.status === 'pending';
        if (tabValue === 2) return app.status === 'interview';
        if (tabValue === 3) return app.status === 'offer';
        if (tabValue === 4) return app.status === 'rejected';
        return false;
      })
    : [];

  // Status label and color mapping
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Application Pending',
          color: 'info',
          icon: <AccessTimeIcon fontSize="small" />,
        };
      case 'interview':
        return {
          label: 'Interview Scheduled',
          color: 'primary',
          icon: <PersonIcon fontSize="small" />,
        };
      case 'offer':
        return {
          label: 'Offer Received',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />,
        };
      case 'rejected':
        return {
          label: 'Application Rejected',
          color: 'error',
          icon: <CancelIcon fontSize="small" />,
        };
      default:
        return {
          label: 'Unknown',
          color: 'default',
          icon: <AccessTimeIcon fontSize="small" />,
        };
    }
  };

  // Mobile detection
  const isActualMobile = useMediaQuery('(max-width: 768px)');

  // Mobile applications template
  if (isActualMobile) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#161513',
          color: 'white',
          fontFamily: 'Manrope, "Noto Sans", sans-serif',
        }}
      >
        {/* Mobile Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#161513',
            p: 2,
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => navigate('/worker/dashboard')}
              sx={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: '#FFD700',
                width: 40,
                height: 40,
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Typography
              sx={{
                color: '#FFD700',
                fontSize: '1.125rem',
                fontWeight: 'bold',
              }}
            >
              My Jobs
            </Typography>
          </Box>
          <IconButton
            sx={{
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              color: '#FFD700',
              width: 40,
              height: 40,
            }}
          >
            <FilterListIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Status Tabs */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2 }}>
            {['All', 'Pending', 'Interview', 'Offer', 'Rejected'].map(
              (status, index) => (
                <Chip
                  key={status}
                  label={status}
                  onClick={() => setTabValue(index)}
                  sx={{
                    backgroundColor: tabValue === index ? '#FFD700' : '#35332c',
                    color: tabValue === index ? '#161513' : 'white',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap',
                  }}
                />
              ),
            )}
          </Box>
        </Box>

        {/* Applications List */}
        <Box sx={{ px: 2 }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            {filteredApplications.length} Applications
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#FFD700' }} />
            </Box>
          ) : filteredApplications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <WorkOutlineIcon sx={{ fontSize: 60, color: '#b2afa3', mb: 2 }} />
              <Typography sx={{ color: '#b2afa3', fontSize: '1rem', mb: 1 }}>
                No applications found
              </Typography>
              <Typography sx={{ color: '#9e9e9e', fontSize: '0.875rem' }}>
                Start applying to jobs to see them here
              </Typography>
            </Box>
          ) : (
            // Sample applications for demonstration
            [
              {
                id: 1,
                jobTitle: 'Residential Carpenter',
                company: 'Golden Gate Construction',
                location: 'East Legon, Accra',
                appliedDate: '2024-01-15',
                status: 'pending',
                salary: 'GH₵150/day',
                type: 'Full-time',
              },
              {
                id: 2,
                jobTitle: 'Plumbing Technician',
                company: 'AquaFlow Services',
                location: 'Asokwa, Kumasi',
                appliedDate: '2024-01-10',
                status: 'interview',
                salary: 'GH₵120/day',
                type: 'Contract',
              },
              {
                id: 3,
                jobTitle: 'Electrical Installer',
                company: 'PowerTech Ghana',
                location: 'Industrial Area, Tema',
                appliedDate: '2024-01-08',
                status: 'offer',
                salary: 'GH₵180/day',
                type: 'Full-time',
              },
            ].map((application) => {
              const getStatusColor = (status) => {
                switch (status) {
                  case 'pending':
                    return '#ff9800';
                  case 'interview':
                    return '#2196f3';
                  case 'offer':
                    return '#4caf50';
                  case 'rejected':
                    return '#f44336';
                  default:
                    return '#9e9e9e';
                }
              };

              const getStatusLabel = (status) => {
                switch (status) {
                  case 'pending':
                    return 'Under Review';
                  case 'interview':
                    return 'Interview';
                  case 'offer':
                    return 'Job Offer';
                  case 'rejected':
                    return 'Rejected';
                  default:
                    return 'Unknown';
                }
              };

              return (
                <Paper
                  key={application.id}
                  sx={{
                    backgroundColor: '#24231e',
                    borderRadius: '12px',
                    p: 2,
                    mb: 2,
                    border: '1px solid #35332c',
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            mb: 0.5,
                          }}
                        >
                          {application.jobTitle}
                        </Typography>
                        <Typography
                          sx={{
                            color: '#b2afa3',
                            fontSize: '0.875rem',
                            mb: 0.5,
                          }}
                        >
                          {application.company}
                        </Typography>
                        <Typography
                          sx={{
                            color: '#9e9e9e',
                            fontSize: '0.75rem',
                            mb: 1,
                          }}
                        >
                          📍 {application.location} • Applied{' '}
                          {new Date(
                            application.appliedDate,
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(application.status)}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(application.status),
                          color: 'white',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          height: 22,
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={application.type}
                        size="small"
                        sx={{
                          backgroundColor: '#35332c',
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                      <Chip
                        label={application.salary}
                        size="small"
                        sx={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          height: 20,
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          flex: 1,
                          borderColor: '#FFD700',
                          color: '#FFD700',
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#FFC000',
                            backgroundColor: 'rgba(255, 215, 0, 0.1)',
                          },
                        }}
                        onClick={() => handleOpenDetails(application)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          flex: 1,
                          backgroundColor: '#FFD700',
                          color: '#161513',
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#FFC000',
                          },
                        }}
                        onClick={() => handleOpenMessage(application)}
                      >
                        Message
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>

        {/* Bottom spacing for nav */}
        <Box sx={{ height: '100px' }} />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Applications
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Applications" />
          <Tab label="Pending" />
          <Tab label="Interviews" />
          <Tab label="Offers" />
          <Tab label="Rejected" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredApplications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <WorkOutlineIcon
              sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No applications found
            </Typography>
            <Typography color="textSecondary" paragraph>
              You haven't applied to any jobs in this category yet
            </Typography>
            <Button variant="contained" color="primary">
              Browse Jobs
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map((application) => {
                  const statusInfo = getStatusInfo(application.status);

                  return (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {application.job.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.job.location.city},{' '}
                          {application.job.location.country}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={application.companyLogo}
                            alt={application.company}
                            variant="square"
                            sx={{ width: 30, height: 30, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {application.company}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(application.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDetails(application)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenMessage(application)}
                          title="Send Message"
                        >
                          <MessageIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Application Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedApplication && (
          <>
            <DialogTitle>Application Details</DialogTitle>
            <DialogContent>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {selectedApplication.jobTitle}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        {selectedApplication.company}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkOutlineIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        {selectedApplication.salary}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Application Status
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                      >
                        <Chip
                          icon={getStatusInfo(selectedApplication.status).icon}
                          label={
                            getStatusInfo(selectedApplication.status).label
                          }
                          color={
                            getStatusInfo(selectedApplication.status).color
                          }
                          size="small"
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Applied On
                      </Typography>
                      <Typography variant="body1">
                        {new Date(
                          selectedApplication.createdAt,
                        ).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    {selectedApplication.interviewDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Interview Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(
                            selectedApplication.interviewDate,
                          ).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {selectedApplication.status === 'offer' && (
                <Card
                  variant="outlined"
                  sx={{ mb: 3, bgcolor: 'success.light' }}
                >
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      <CheckCircleIcon
                        sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                      />
                      Congratulations! You have received a job offer.
                    </Typography>
                    <Typography variant="body2">
                      Please check your messages for details about the offer.
                      You can accept or negotiate the terms.
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Typography variant="subtitle1" gutterBottom>
                Application Timeline
              </Typography>
              <Box
                sx={{
                  ml: 2,
                  borderLeft: `2px solid ${theme.palette.divider}`,
                  pl: 2,
                }}
              >
                <Box sx={{ mb: 2, position: 'relative' }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      position: 'absolute',
                      left: -28,
                      top: 6,
                    }}
                  />
                  <Typography variant="subtitle2">
                    Application Submitted
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(
                      selectedApplication.createdAt,
                    ).toLocaleDateString()}
                  </Typography>
                </Box>

                {selectedApplication.status !== 'pending' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">
                      Application Reviewed
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        new Date(selectedApplication.createdAt).getTime() +
                          3 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {(selectedApplication.status === 'interview' ||
                  selectedApplication.status === 'offer' ||
                  selectedApplication.status === 'rejected') &&
                  selectedApplication.interviewDate && (
                    <Box sx={{ mb: 2, position: 'relative' }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          position: 'absolute',
                          left: -28,
                          top: 6,
                        }}
                      />
                      <Typography variant="subtitle2">
                        Interview Scheduled
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(
                          selectedApplication.interviewDate,
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                {selectedApplication.status === 'offer' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'success.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">Offer Received</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        new Date(selectedApplication.interviewDate).getTime() +
                          5 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {selectedApplication.status === 'rejected' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'error.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">
                      Application Rejected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        new Date(selectedApplication.interviewDate).getTime() +
                          2 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
              <Button
                onClick={() => {
                  setOpenDetailsDialog(false);
                  handleOpenMessage(selectedApplication);
                }}
                variant="outlined"
                startIcon={<MessageIcon />}
              >
                Contact Employer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Message Dialog */}
      <Dialog
        open={openMessageDialog}
        onClose={() => setOpenMessageDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedApplication && (
          <>
            <DialogTitle>Message to {selectedApplication.company}</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" gutterBottom>
                Regarding: {selectedApplication.jobTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your message will be sent to the hiring manager at{' '}
                {selectedApplication.company}.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Message"
                fullWidth
                variant="outlined"
                multiline
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenMessageDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                variant="contained"
                disabled={!message.trim()}
              >
                Send Message
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default MyApplicationsPage;
