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
  Divider,
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
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    const draftPayload = {
      text: trimmedMessage,
      source: 'my-applications',
      applicationId: selectedApplication?.id || selectedApplication?._id || null,
      jobId:
        selectedApplication?.job?._id ||
        selectedApplication?.job?.id ||
        null,
      jobTitle:
        selectedApplication?.job?.title ||
        selectedApplication?.jobTitle ||
        'Job Application',
      createdAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(
        'kelmah_message_draft',
        JSON.stringify(draftPayload),
      );
    } catch (storageError) {
      console.warn('Failed to persist message draft:', storageError);
    }

    setMessage('');
    setOpenMessageDialog(false);
    navigate('/messages');
  };

  // Filter applications based on current tab
  // Backend Application model statuses: pending, under_review, accepted, rejected, withdrawn
  const filteredApplications = Array.isArray(applications)
    ? applications.filter((app) => {
      if (tabValue === 0) return true; // All applications
      if (tabValue === 1) return app.status === 'pending';
      if (tabValue === 2) return app.status === 'under_review';
      if (tabValue === 3) return app.status === 'accepted';
      if (tabValue === 4) return app.status === 'rejected';
      if (tabValue === 5) return app.status === 'withdrawn';
      return false;
    })
    : [];

  // Status label and color mapping — matches Application model enum
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'info',
          icon: <AccessTimeIcon fontSize="small" />,
        };
      case 'under_review':
        return {
          label: 'Under Review',
          color: 'primary',
          icon: <PersonIcon fontSize="small" />,
        };
      case 'accepted':
        return {
          label: 'Accepted',
          color: 'success',
          icon: <CheckCircleIcon fontSize="small" />,
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'error',
          icon: <CancelIcon fontSize="small" />,
        };
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          color: 'warning',
          icon: <CancelIcon fontSize="small" />,
        };
      default:
        return {
          label: status || 'Unknown',
          color: 'default',
          icon: <AccessTimeIcon fontSize="small" />,
        };
    }
  };

  // Mobile detection
  const isActualMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile applications view — uses MUI theme for consistency with desktop
  if (isActualMobile) {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
          color: 'text.primary',
          pb: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Mobile Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: 2,
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Go back"
              color="primary"
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Typography
              color="primary"
              sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}
            >
              My Applications
            </Typography>
          </Box>
          <IconButton
            aria-label="Filter applications"
            color="primary"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <FilterListIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Status Tabs */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2 }}>
            {['All', 'Pending', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'].map(
              (status, index) => (
                <Chip
                  key={status}
                  label={status}
                  onClick={() => setTabValue(index)}
                  color={tabValue === index ? 'primary' : 'default'}
                  variant={tabValue === index ? 'filled' : 'outlined'}
                  sx={{
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
            sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 2 }}
          >
            {filteredApplications.length} Applications
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : filteredApplications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <WorkOutlineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary" sx={{ fontSize: '1rem', mb: 1 }}>
                No applications found
              </Typography>
              <Typography color="text.disabled" sx={{ fontSize: '0.875rem' }}>
                Start applying to jobs to see them here
              </Typography>
            </Box>
          ) : (
            filteredApplications.map((application) => {
              const statusInfo = getStatusInfo(application.status);

              return (
                <Paper
                  key={application.id || application._id}
                  elevation={1}
                  sx={{
                    borderRadius: 3,
                    p: 2,
                    mb: 2,
                    border: 1,
                    borderColor: 'divider',
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
                          sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 0.5 }}
                        >
                          {application.job?.title || application.jobTitle || 'Untitled Job'}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: '0.875rem', mb: 0.5 }}
                        >
                          {application.company || 'Unknown Company'}
                        </Typography>
                        <Typography
                          color="text.disabled"
                          sx={{ fontSize: '0.75rem', mb: 1 }}
                        >
                          📍 {application.job?.location?.city || application.location || 'Unknown'} • Applied{' '}
                          {new Date(
                            application.createdAt || application.appliedDate,
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        sx={{ fontSize: '0.65rem', fontWeight: 'bold', height: 22 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        sx={{
                          flex: 1,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          minHeight: 44,
                        }}
                        onClick={() => handleOpenDetails(application)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{
                          flex: 1,
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          minHeight: 44,
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
    <Container sx={{ py: { xs: 2, md: 4 } }}>
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
          <Tab label="Under Review" />
          <Tab label="Accepted" />
          <Tab label="Rejected" />
          <Tab label="Withdrawn" />
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
            <Button variant="contained" color="primary" onClick={() => navigate('/worker/find-work')}>
              Browse Jobs
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map((application) => {
                  const statusInfo = getStatusInfo(application.status);

                  return (
                    <TableRow key={application.id || application._id}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
                          {application.job?.title || 'Untitled Job'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.job?.location?.city || application.job?.location || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {application.job?.category || '—'}
                        </Typography>
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
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            flexWrap: 'nowrap',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetails(application)}
                            aria-label="View application details"
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenMessage(application)}
                            aria-label="Send message to employer"
                            sx={{ minWidth: 44, minHeight: 44 }}
                          >
                            <MessageIcon fontSize="small" />
                          </IconButton>
                        </Box>
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
        fullScreen={isActualMobile}
      >
        {selectedApplication && (
          <>
            <DialogTitle>Application Details</DialogTitle>
            <DialogContent>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {selectedApplication.job?.title || selectedApplication.jobTitle || 'Untitled Job'}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        {selectedApplication.job?.category || '\u2014'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkOutlineIcon
                        fontSize="small"
                        sx={{ mr: 0.5, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        {selectedApplication.proposedRate ? `GH\u20B5${selectedApplication.proposedRate}` : (selectedApplication.job?.budget || '\u2014')}
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

              {selectedApplication.status === 'accepted' && (
                <Card
                  variant="outlined"
                  sx={{ mb: 3, bgcolor: 'success.light' }}
                >
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      <CheckCircleIcon
                        sx={{ mr: 1, verticalAlign: 'text-bottom' }}
                      />
                      Congratulations! Your application was accepted.
                    </Typography>
                    <Typography variant="body2">
                      Please check your messages for details. You can discuss
                      terms with the hirer.
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

                {(selectedApplication.status === 'under_review' ||
                  selectedApplication.status === 'accepted' ||
                  selectedApplication.status === 'rejected') && (
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
                        Under Review
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(
                          selectedApplication.updatedAt || selectedApplication.createdAt,
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}

                {selectedApplication.status === 'accepted' && (
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
                    <Typography variant="subtitle2">Accepted</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        selectedApplication.updatedAt || selectedApplication.createdAt,
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
                        selectedApplication.updatedAt || selectedApplication.createdAt,
                      ).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {selectedApplication.status === 'withdrawn' && (
                  <Box sx={{ mb: 2, position: 'relative' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: 'warning.main',
                        borderRadius: '50%',
                        position: 'absolute',
                        left: -28,
                        top: 6,
                      }}
                    />
                    <Typography variant="subtitle2">
                      Application Withdrawn
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(
                        selectedApplication.updatedAt || selectedApplication.createdAt,
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
        fullScreen={isActualMobile}
      >
        {selectedApplication && (
          <>
            <DialogTitle>Message about {selectedApplication.job?.title || 'Application'}</DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" gutterBottom>
                Regarding: {selectedApplication.job?.title || selectedApplication.jobTitle || 'Job Application'}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your message will be sent to the hirer.
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
