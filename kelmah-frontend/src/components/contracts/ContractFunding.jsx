import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  styled,
  Chip,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PaymentRounded,
  AccountBalanceWallet,
  CreditCard,
  Payments,
  Security,
  Receipt,
  CheckCircle,
  Info,
  AccountBalance,
  Error,
  Warning
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import PaymentService from '../../services/PaymentService';
import ContractService from '../../services/ContractService';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const FundingCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  marginBottom: theme.spacing(3),
  overflow: 'hidden'
}));

const PaymentMethodCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  border: '1px solid',
  borderColor: theme.palette.divider,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)'
  }
}));

const SelectedPaymentMethod = styled(Card)(({ theme, selected }) => ({
  borderRadius: theme.shape.borderRadius,
  border: '2px solid',
  borderColor: selected ? theme.palette.primary.main : theme.palette.divider,
  boxShadow: selected ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
  transform: selected ? 'translateY(-3px)' : 'none'
}));

function ContractFunding({ contractId, contractData, onFundingSuccess }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [fundingDetails, setFundingDetails] = useState({
    amount: '',
    escrowFee: 0,
    processingFee: 0,
    totalAmount: 0
  });
  const [success, setSuccess] = useState(false);
  const [escrowId, setEscrowId] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const steps = ['Select Amount', 'Choose Payment Method', 'Review & Confirm'];
  
  // Calculate fees and total
  useEffect(() => {
    if (fundingDetails.amount && !isNaN(parseFloat(fundingDetails.amount))) {
      const amount = parseFloat(fundingDetails.amount);
      // Calculate platform fee (5%)
      const escrowFee = amount * 0.05;
      // Calculate processing fee (2.9% + $0.30)
      const processingFee = (amount * 0.029) + 0.30;
      // Calculate total
      const totalAmount = amount + escrowFee + processingFee;
      
      setFundingDetails(prev => ({
        ...prev,
        escrowFee: escrowFee.toFixed(2),
        processingFee: processingFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2)
      }));
    }
  }, [fundingDetails.amount]);
  
  // Load contract and payment methods
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch saved payment methods
        const paymentMethodsResponse = await PaymentService.getPaymentMethods();
        setPaymentMethods(paymentMethodsResponse.data || []);
        
        // If contract amount is provided, set it as the default
        if (contractData?.totalAmount) {
          setFundingDetails(prev => ({
            ...prev,
            amount: contractData.totalAmount.toString()
          }));
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load payment methods');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [contractId, contractData]);
  
  const handleAmountChange = (e) => {
    setFundingDetails(prev => ({
      ...prev,
      amount: e.target.value
    }));
  };
  
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };
  
  const handleNext = () => {
    // Validate current step
    if (activeStep === 0 && (!fundingDetails.amount || parseFloat(fundingDetails.amount) <= 0)) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (activeStep === 1 && !selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    setActiveStep(prev => prev + 1);
    setError(null);
  };
  
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };
  
  const handleConfirmPayment = () => {
    setConfirmDialogOpen(true);
  };
  
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleProcessPayment = async () => {
    setConfirmDialogOpen(false);
    setProcessingPayment(true);
    setError(null);
    
    try {
      // Create escrow payment
      const escrowData = {
        contractId,
        amount: parseFloat(fundingDetails.amount),
        paymentMethodId: selectedPaymentMethod.id,
        currency: contractData?.currency || 'GHS'
      };
      
      const response = await PaymentService.createEscrow(escrowData);
      
      // Update contract with escrow information
      await ContractService.updateContract(contractId, {
        escrowId: response.data.id,
        escrowFunded: true
      });
      
      setEscrowId(response.data.id);
      setSuccess(true);
      
      // Call the success callback if provided
      if (onFundingSuccess) {
        onFundingSuccess(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Select Amount
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Enter Funding Amount
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This amount will be held in escrow until the work is completed and approved.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Amount"
                  fullWidth
                  type="number"
                  value={fundingDetails.amount}
                  onChange={handleAmountChange}
                  InputProps={{
                    startAdornment: <Box component="span" sx={{ mr: 1 }}>{contractData?.currency || 'GHS'}</Box>
                  }}
                />
                
                {contractData?.totalAmount && fundingDetails.amount !== contractData.totalAmount.toString() && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    The contract amount is {contractData.totalAmount} {contractData.currency}
                  </Alert>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Fee Breakdown
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Contract Amount" 
                          secondary={`The amount that will go to the worker once approved`}
                        />
                        <Typography>
                          {fundingDetails.amount ? `${contractData?.currency || 'GHS'} ${parseFloat(fundingDetails.amount).toFixed(2)}` : '-'}
                        </Typography>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText 
                          primary="Platform Fee (5%)" 
                          secondary="Fee for using the platform's escrow service"
                        />
                        <Typography>
                          {fundingDetails.escrowFee ? `${contractData?.currency || 'GHS'} ${fundingDetails.escrowFee}` : '-'}
                        </Typography>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText 
                          primary="Payment Processing Fee" 
                          secondary="Fee charged by payment processor (2.9% + 0.30)"
                        />
                        <Typography>
                          {fundingDetails.processingFee ? `${contractData?.currency || 'GHS'} ${fundingDetails.processingFee}` : '-'}
                        </Typography>
                      </ListItem>
                    </List>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Total to Pay:
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight={600}>
                        {fundingDetails.totalAmount ? `${contractData?.currency || 'GHS'} ${fundingDetails.totalAmount}` : '-'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1: // Choose Payment Method
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Choose Payment Method
            </Typography>
            
            {paymentMethods.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                You don't have any saved payment methods. Please add a new one.
              </Alert>
            ) : (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {paymentMethods.map((method) => (
                  <Grid item xs={12} sm={6} md={4} key={method.id}>
                    <SelectedPaymentMethod
                      selected={selectedPaymentMethod?.id === method.id}
                      onClick={() => handlePaymentMethodSelect(method)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {method.type === 'card' ? (
                            <CreditCard color="primary" sx={{ mr: 1 }} />
                          ) : (
                            <AccountBalance color="primary" sx={{ mr: 1 }} />
                          )}
                          <Typography variant="subtitle1">
                            {method.type === 'card' ? `${method.brand} ****${method.last4}` : method.bankName}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {method.type === 'card' 
                            ? `Expires: ${method.expMonth}/${method.expYear}`
                            : `Account: ****${method.accountLast4}`
                          }
                        </Typography>
                      </CardContent>
                    </SelectedPaymentMethod>
                  </Grid>
                ))}
                
                <Grid item xs={12} sm={6} md={4}>
                  <PaymentMethodCard>
                    <CardContent sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      py: 3
                    }}>
                      <AddIcon color="action" sx={{ mb: 1, fontSize: '2rem' }} />
                      <Typography variant="body1">Add Payment Method</Typography>
                    </CardContent>
                  </PaymentMethodCard>
                </Grid>
              </Grid>
            )}
            
            <Alert severity="info" icon={<Security />} sx={{ mt: 3 }}>
              All payments are secure and encrypted. Funds will be held in escrow until you approve the work.
            </Alert>
          </Box>
        );
        
      case 2: // Review & Confirm
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review & Confirm
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Contract Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Contract:
                    </Typography>
                    <Typography variant="body1">
                      {contractData?.title || `Contract #${contractId}`}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Worker:
                    </Typography>
                    <Typography variant="body1">
                      {contractData?.workerName || 'Selected Worker'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Payment Details
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Payments fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Amount" />
                    <Typography>
                      {fundingDetails.amount ? `${contractData?.currency || 'GHS'} ${parseFloat(fundingDetails.amount).toFixed(2)}` : '-'}
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Receipt fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Fees" />
                    <Typography>
                      {fundingDetails.escrowFee && fundingDetails.processingFee 
                        ? `${contractData?.currency || 'GHS'} ${(parseFloat(fundingDetails.escrowFee) + parseFloat(fundingDetails.processingFee)).toFixed(2)}` 
                        : '-'
                      }
                    </Typography>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PaymentRounded fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Payment Method" />
                    <Typography>
                      {selectedPaymentMethod?.type === 'card' 
                        ? `${selectedPaymentMethod.brand} ****${selectedPaymentMethod.last4}` 
                        : `${selectedPaymentMethod?.bankName} ****${selectedPaymentMethod?.accountLast4}`
                      }
                    </Typography>
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Total to Pay:
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={600}>
                    {fundingDetails.totalAmount ? `${contractData?.currency || 'GHS'} ${fundingDetails.totalAmount}` : '-'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              By proceeding, you agree to fund this contract. The funds will be held in escrow until you approve the work.
            </Alert>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  // Render success state
  if (success) {
    return (
      <FundingCard>
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
          
          <Typography variant="h5" gutterBottom>
            Contract Successfully Funded!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Your payment of {contractData?.currency || 'GHS'} {fundingDetails.totalAmount} has been processed and the funds are now in escrow.
          </Typography>
          
          <Chip
            label={`Escrow ID: ${escrowId}`}
            color="primary"
            variant="outlined"
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.location.reload()}
              sx={{ mx: 1 }}
            >
              View Contract
            </Button>
            <Button 
              variant="outlined"
              onClick={() => window.location.href = `/dashboard/contracts`}
              sx={{ mx: 1 }}
            >
              Back to Contracts
            </Button>
          </Box>
        </CardContent>
      </FundingCard>
    );
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }
  
  return (
    <FundingCard>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.background.default,
        p: 3
      }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
      </CardContent>
      
      <CardActions sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        borderTop: 1,
        borderColor: 'divider',
        p: 2,
        px: 3
      }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmPayment}
              disabled={processingPayment}
              startIcon={processingPayment && <CircularProgress size={20} color="inherit" />}
            >
              {processingPayment ? 'Processing...' : 'Confirm Payment'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </CardActions>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to process this payment of {contractData?.currency || 'GHS'} {fundingDetails.totalAmount}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This amount will be charged to your selected payment method and held in escrow until you approve the work.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleProcessPayment} variant="contained" color="primary">
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </FundingCard>
  );
}

export default ContractFunding; 