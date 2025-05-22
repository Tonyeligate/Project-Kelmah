import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Chip, 
  Grid, 
  Button, 
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AlertTitle,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import ContractService from '../../services/ContractService';
import SignatureCanvas from 'react-signature-canvas';

const getStatusColor = (status) => {
  const statusMap = {
    'draft': 'default',
    'pending_signature': 'warning',
    'active': 'success',
    'completed': 'info',
    'cancelled': 'error',
    'disputed': 'error'
  };
  
  return statusMap[status] || 'default';
};

const getStatusLabel = (status) => {
  const statusLabels = {
    'draft': 'Draft',
    'pending_signature': 'Pending Signature',
    'active': 'Active',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'disputed': 'Disputed'
  };
  
  return statusLabels[status] || 'Unknown';
};

const ContractDetails = ({ contractId, onClose }) => {
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureRef, setSignatureRef] = useState(null);
  const [comments, setComments] = useState('');
  
  useEffect(() => {
    const fetchContractDetails = async () => {
      try {
        setLoading(true);
        const response = await ContractService.getContractById(contractId);
        setContract(response.data);
      } catch (err) {
        console.error('Error fetching contract details:', err);
        setError('Failed to load contract details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (contractId) {
      fetchContractDetails();
    }
  }, [contractId]);
  
  const handleSignatureDialogOpen = () => {
    setSignatureDialogOpen(true);
  };
  
  const handleSignatureDialogClose = () => {
    setSignatureDialogOpen(false);
  };
  
  const handleSignatureClear = () => {
    signatureRef?.clear();
  };
  
  const handleSignatureComplete = async () => {
    if (signatureRef?.isEmpty()) {
      return;
    }
    
    try {
      const signatureData = signatureRef.toDataURL();
      await ContractService.signContract(contractId, {
        signature: signatureData,
        comments: comments
      });
      
      // Refresh contract after signing
      const response = await ContractService.getContractById(contractId);
      setContract(response.data);
      setSignatureDialogOpen(false);
      setComments('');
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Failed to sign contract. Please try again.');
    }
  };
  
  const calculateProgress = () => {
    if (!contract || !contract.milestones || contract.milestones.length === 0) {
      return 0;
    }
    
    const completedMilestones = contract.milestones.filter(
      milestone => milestone.status === 'completed'
    ).length;
    
    return (completedMilestones / contract.milestones.length) * 100;
  };
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading contract details...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }
  
  if (!contract) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Alert severity="info">
          <AlertTitle>No Contract Found</AlertTitle>
          The requested contract could not be found or you don't have permission to view it.
        </Alert>
      </Box>
    );
  }
  
  const progress = calculateProgress();
  
  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 3 } }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" component="h2" gutterBottom>
                Contract #{contract.contractNumber}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {contract.title}
              </Typography>
            </Box>
            <Chip 
              label={getStatusLabel(contract.status)} 
              color={getStatusColor(contract.status)} 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Job Details</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Job Title" 
                    secondary={contract.jobTitle} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contract Type" 
                    secondary={contract.contractType} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Start Date" 
                    secondary={new Date(contract.startDate).toLocaleDateString()} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="End Date" 
                    secondary={contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Not specified'} 
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Parties</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Avatar>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Hirer" 
                    secondary={contract.hirer?.name || 'Not assigned'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Worker" 
                    secondary={contract.worker?.name || 'Not assigned'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Payment Amount" 
                    secondary={`$${contract.paymentAmount.toFixed(2)}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Payment Terms" 
                    secondary={contract.paymentTerms} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Contract Progress
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(progress)}%`}</Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {contract.milestones?.filter(m => m.status === 'completed').length || 0} 
              {' '}of{' '}
              {contract.milestones?.length || 0} milestones completed
            </Typography>
          </Box>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Milestones</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stepper activeStep={contract.milestones?.filter(m => m.status === 'completed').length || 0} orientation="vertical">
                {contract.milestones?.map((milestone, index) => (
                  <Step key={milestone.id || index}>
                    <StepLabel
                      optional={
                        <Typography variant="caption">
                          {milestone.dueDate && `Due: ${new Date(milestone.dueDate).toLocaleDateString()}`}
                        </Typography>
                      }
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {milestone.title}
                        </Typography>
                        <Chip 
                          size="small"
                          label={milestone.status} 
                          color={milestone.status === 'completed' ? 'success' : 'default'} 
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.description}
                      </Typography>
                      {milestone.paymentAmount && (
                        <Typography variant="body2" color="primary">
                          Payment: ${milestone.paymentAmount.toFixed(2)}
                        </Typography>
                      )}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Signatures & Approvals</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Hirer Signature
                      </Typography>
                      {contract.hirerSignature ? (
                        <Box>
                          <Box 
                            component="img" 
                            src={contract.hirerSignature} 
                            alt="Hirer Signature" 
                            sx={{ 
                              maxWidth: '100%', 
                              height: 80, 
                              border: '1px solid #eee', 
                              borderRadius: 1 
                            }} 
                          />
                          <Typography variant="caption" display="block">
                            Signed {formatDistanceToNow(new Date(contract.hirerSignatureDate), { addSuffix: true })}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not signed yet
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Worker Signature
                      </Typography>
                      {contract.workerSignature ? (
                        <Box>
                          <Box 
                            component="img" 
                            src={contract.workerSignature} 
                            alt="Worker Signature" 
                            sx={{ 
                              maxWidth: '100%', 
                              height: 80, 
                              border: '1px solid #eee', 
                              borderRadius: 1 
                            }} 
                          />
                          <Typography variant="caption" display="block">
                            Signed {formatDistanceToNow(new Date(contract.workerSignatureDate), { addSuffix: true })}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not signed yet
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
            <Button 
              startIcon={<DownloadIcon />}
              variant="outlined"
              onClick={() => ContractService.downloadContract(contractId)}
            >
              Download PDF
            </Button>
            
            {contract.status === 'pending_signature' && (
              <Button 
                color="primary" 
                variant="contained"
                onClick={handleSignatureDialogOpen}
              >
                Sign Contract
              </Button>
            )}
            
            {(contract.status === 'draft' && user.id === contract.createdBy) && (
              <Button 
                color="primary" 
                variant="contained"
                onClick={() => ContractService.sendContractForSignature(contractId)}
              >
                Send for Signature
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
      
      <Dialog 
        open={signatureDialogOpen} 
        onClose={handleSignatureDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Sign Contract
          <IconButton
            aria-label="close"
            onClick={handleSignatureDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            By signing this contract, you agree to all terms and conditions specified in the contract.
          </Typography>
          
          <Box sx={{ border: '1px solid #ccc', borderRadius: 1, mb: 2 }}>
            <SignatureCanvas
              ref={(ref) => setSignatureRef(ref)}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas'
              }}
            />
          </Box>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={handleSignatureClear}
            sx={{ mb: 2 }}
          >
            Clear
          </Button>
          
          <TextField
            label="Comments (Optional)"
            multiline
            rows={3}
            fullWidth
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignatureDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSignatureComplete} 
            variant="contained" 
            color="primary"
          >
            Submit Signature
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractDetails; 