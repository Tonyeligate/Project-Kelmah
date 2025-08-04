import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Work as JobIcon,
  Message as MessageIcon,
  Payment as PaymentIcon,
  Assignment as ContractIcon,
  Emergency as EmergencyIcon,
  Sync as SyncIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  CloudOff as OfflineIcon,
  Cloud as OnlineIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import useBackgroundSync from '../../hooks/useBackgroundSync';

/**
 * Background Sync Demo Component
 * Demonstrates how to use the background sync functionality in Ghana trade app
 */
const BackgroundSyncDemo = () => {
  const theme = useTheme();
  const {
    syncStatus,
    isOnline,
    isSyncing,
    queueSize,
    queueJobApplication,
    queueMessage,
    queuePaymentAction,
    queueContractSignature,
    queueEmergencyRequest,
    forceSyncAll,
    getSyncStats
  } = useBackgroundSync();

  const [demoData, setDemoData] = useState({
    jobTitle: 'Plumber needed in East Legon',
    messageText: 'Hello, I am interested in your plumbing services',
    paymentAmount: '500',
    contractId: 'contract_123'
  });

  const [feedback, setFeedback] = useState('');

  // Handle demo actions
  const handleJobApplication = async () => {
    try {
      const actionId = await queueJobApplication({
        jobId: 'job_demo_123',
        userId: 'demo_user',
        coverLetter: 'I am an experienced plumber in Ghana with 5 years of experience.',
        location: 'East Legon, Accra',
        availableDate: new Date().toISOString(),
        expectedRate: 45
      });
      
      setFeedback(`✅ Job application queued for background sync! ID: ${actionId}`);
    } catch (error) {
      setFeedback(`❌ Failed to queue job application: ${error.message}`);
    }
  };

  const handleSendMessage = async () => {
    try {
      const actionId = await queueMessage({
        conversationId: 'conv_demo_456',
        senderId: 'demo_user',
        receiverId: 'demo_worker',
        message: demoData.messageText,
        timestamp: new Date().toISOString(),
        urgent: false
      });
      
      setFeedback(`✅ Message queued for background sync! ID: ${actionId}`);
    } catch (error) {
      setFeedback(`❌ Failed to queue message: ${error.message}`);
    }
  };

  const handlePayment = async () => {
    try {
      const actionId = await queuePaymentAction({
        userId: 'demo_user',
        amount: parseFloat(demoData.paymentAmount),
        currency: 'GHS',
        method: 'Mobile Money',
        provider: 'MTN Money',
        contractId: 'contract_demo_789',
        description: 'Payment for plumbing services',
        ghanaSpecific: {
          mobileNumber: '024-123-4567',
          region: 'Greater Accra'
        }
      });
      
      setFeedback(`✅ Payment queued for background sync! ID: ${actionId}`);
    } catch (error) {
      setFeedback(`❌ Failed to queue payment: ${error.message}`);
    }
  };

  const handleContractSign = async () => {
    try {
      const actionId = await queueContractSignature({
        userId: 'demo_user',
        contractId: demoData.contractId,
        signature: 'demo_signature_data',
        timestamp: new Date().toISOString(),
        location: 'East Legon, Accra',
        ipAddress: '192.168.1.1',
        ghanaLegalCompliance: true
      });
      
      setFeedback(`✅ Contract signature queued for background sync! ID: ${actionId}`);
    } catch (error) {
      setFeedback(`❌ Failed to queue contract signature: ${error.message}`);
    }
  };

  const handleEmergencyRequest = async () => {
    try {
      const actionId = await queueEmergencyRequest({
        userId: 'demo_user',
        emergencyType: 'plumbing_leak',
        location: 'East Legon, Accra',
        description: 'Major water leak in kitchen, need immediate help!',
        contactNumber: '024-123-4567',
        urgencyLevel: 'high',
        timestamp: new Date().toISOString(),
        ghanaLocation: {
          region: 'Greater Accra',
          nearestLandmark: 'A&C Mall'
        }
      });
      
      setFeedback(`✅ Emergency request queued for background sync! ID: ${actionId}`);
    } catch (error) {
      setFeedback(`❌ Failed to queue emergency request: ${error.message}`);
    }
  };

  const handleForceSyncAll = async () => {
    try {
      await forceSyncAll();
      setFeedback(`✅ Forced sync of all pending actions!`);
    } catch (error) {
      setFeedback(`❌ Force sync failed: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'syncing': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'syncing': return <SyncIcon />;
      case 'completed': return <SuccessIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <PendingIcon />;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
          border: '1px solid rgba(255,215,0,0.2)'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <SyncIcon sx={{ color: '#FFD700', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Background Sync Demo
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Test offline actions for Ghana's network conditions
            </Typography>
          </Box>
        </Stack>

        {/* Connection Status */}
        <Stack direction="row" alignItems="center" spacing={2}>
          {isOnline ? (
            <Chip 
              icon={<OnlineIcon />} 
              label="Online" 
              color="success" 
              variant="filled"
            />
          ) : (
            <Chip 
              icon={<OfflineIcon />} 
              label="Offline" 
              color="error" 
              variant="filled"
            />
          )}
          
          <Chip 
            label={`Queue: ${queueSize} actions`} 
            color="info" 
            variant="outlined"
          />
          
          {isSyncing && (
            <Chip 
              icon={<SyncIcon />} 
              label="Syncing..." 
              color="primary" 
              variant="filled"
            />
          )}
        </Stack>
      </Paper>

      {/* Demo Actions */}
      <Stack spacing={3}>
        {/* Job Application Demo */}
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <JobIcon sx={{ color: '#4CAF50' }} />
              <Typography variant="h6">Job Application</Typography>
            </Stack>
            
            <TextField
              fullWidth
              label="Job Title"
              value={demoData.jobTitle}
              onChange={(e) => setDemoData(prev => ({ ...prev, jobTitle: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              Simulate applying for a plumbing job in Ghana. This will be queued for background sync with high priority.
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              variant="contained"
              startIcon={<JobIcon />}
              onClick={handleJobApplication}
              sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)' }}
            >
              Apply for Job
            </Button>
          </CardActions>
        </Card>

        {/* Message Demo */}
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <MessageIcon sx={{ color: '#2196F3' }} />
              <Typography variant="h6">Send Message</Typography>
            </Stack>
            
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Message"
              value={demoData.messageText}
              onChange={(e) => setDemoData(prev => ({ ...prev, messageText: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              Send a message to a worker. Will be queued with medium priority for background sync.
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={handleSendMessage}
              sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' }}
            >
              Send Message
            </Button>
          </CardActions>
        </Card>

        {/* Payment Demo */}
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <PaymentIcon sx={{ color: '#FF9800' }} />
              <Typography variant="h6">Ghana Mobile Money Payment</Typography>
            </Stack>
            
            <TextField
              fullWidth
              type="number"
              label="Amount (GHS)"
              value={demoData.paymentAmount}
              onChange={(e) => setDemoData(prev => ({ ...prev, paymentAmount: e.target.value }))}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₵</Typography>
              }}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              Process a Mobile Money payment. High priority action that will retry on Ghana's network.
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={handlePayment}
              sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' }}
            >
              Pay with Mobile Money
            </Button>
          </CardActions>
        </Card>

        {/* Contract Signature Demo */}
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <ContractIcon sx={{ color: '#9C27B0' }} />
              <Typography variant="h6">Digital Contract Signature</Typography>
            </Stack>
            
            <TextField
              fullWidth
              label="Contract ID"
              value={demoData.contractId}
              onChange={(e) => setDemoData(prev => ({ ...prev, contractId: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              Sign a contract digitally with Ghana legal compliance. High priority for legal validity.
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              variant="contained"
              startIcon={<ContractIcon />}
              onClick={handleContractSign}
              sx={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)' }}
            >
              Sign Contract
            </Button>
          </CardActions>
        </Card>

        {/* Emergency Request Demo */}
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <EmergencyIcon sx={{ color: '#F44336' }} />
              <Typography variant="h6">Emergency Request</Typography>
            </Stack>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Emergency requests have the highest priority and shortest timeout for immediate response.
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              Submit an emergency plumbing request. This will be processed immediately when network is available.
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              variant="contained"
              startIcon={<EmergencyIcon />}
              onClick={handleEmergencyRequest}
              sx={{ background: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)' }}
            >
              Submit Emergency
            </Button>
          </CardActions>
        </Card>

        {/* Force Sync */}
        <Card elevation={2}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <SyncIcon sx={{ color: '#607D8B' }} />
              <Typography variant="h6">Manual Sync</Typography>
            </Stack>
            
            <Typography variant="body2" color="text.secondary">
              Force sync all pending actions immediately. Useful for testing or when you need immediate sync.
            </Typography>
          </CardContent>
          
          <CardActions>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={handleForceSyncAll}
              disabled={!isOnline || isSyncing}
              sx={{ borderColor: '#607D8B', color: '#607D8B' }}
            >
              Force Sync All
            </Button>
          </CardActions>
        </Card>
      </Stack>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert 
            severity={feedback.includes('✅') ? 'success' : 'error'}
            sx={{ mt: 3 }}
            onClose={() => setFeedback('')}
          >
            {feedback}
          </Alert>
        </motion.div>
      )}

      {/* Sync Status */}
      <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Background Sync Status
        </Typography>
        
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Network Status:</Typography>
            <Typography variant="body2" color={isOnline ? 'success.main' : 'error.main'}>
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
          </Stack>
          
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Queue Size:</Typography>
            <Typography variant="body2">{queueSize} actions</Typography>
          </Stack>
          
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Pending:</Typography>
            <Typography variant="body2">{syncStatus.pending}</Typography>
          </Stack>
          
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Currently Syncing:</Typography>
            <Typography variant="body2">{syncStatus.syncing}</Typography>
          </Stack>
          
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Failed:</Typography>
            <Typography variant="body2" color={syncStatus.failed > 0 ? 'error.main' : 'inherit'}>
              {syncStatus.failed}
            </Typography>
          </Stack>
          
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Network Type:</Typography>
            <Typography variant="body2">{syncStatus.networkType || 'Unknown'}</Typography>
          </Stack>
        </Stack>

        {isSyncing && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Syncing actions...
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default BackgroundSyncDemo;