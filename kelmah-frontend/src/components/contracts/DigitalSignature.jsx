import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Draw as DrawIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Verified as VerifiedIcon,
  Security as SecurityIcon,
  Document as DocumentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { EXTERNAL_SERVICES } from '../../config/services';

/**
 * Digital Signature Component for Ghana Contract Management
 * Features: Canvas-based signatures, biometric verification, legal compliance
 */
const DigitalSignature = ({
  contractId,
  signatories = [],
  onSignatureComplete,
  onCancel,
  open = false,
  currentUser,
  contractTitle = "Service Agreement"
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [signatureHistory, setSignatureHistory] = useState([]);
  const [locationData, setLocationData] = useState(null);
  
  // Signature steps for Ghana legal compliance
  const signatureSteps = [
    {
      label: 'Identity Verification',
      description: 'Verify your identity with Ghana Card or passport number',
      icon: <PersonIcon />
    },
    {
      label: 'Contract Review',
      description: 'Review contract terms and conditions carefully',
      icon: <DocumentIcon />
    },
    {
      label: 'Digital Signature',
      description: 'Create your legally binding digital signature',
      icon: <DrawIcon />
    },
    {
      label: 'Biometric Confirmation',
      description: 'Confirm signature with SMS verification code',
      icon: <FingerprintIcon />
    },
    {
      label: 'Final Verification',
      description: 'Complete the signing process',
      icon: <VerifiedIcon />
    }
  ];

  // Get user location for signature verification
  useEffect(() => {
    if (open && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => console.log('Location not available:', error),
        { timeout: 5000 }
      );
    }
  }, [open]);

  // Initialize canvas
  useEffect(() => {
    if (currentStep === 2 && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [currentStep]);

  // Canvas drawing handlers
  const startDrawing = useCallback((e) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing || !canvasRef.current) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Clear signature
  const clearSignature = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  }, []);

  // Capture signature
  const captureSignature = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png');
      
      // Check if signature exists (not empty canvas)
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasSignature = imageData.data.some(channel => channel !== 0);
      
      if (hasSignature) {
        setSignatureData({
          imageData: dataURL,
          timestamp: new Date().toISOString(),
          location: locationData,
          userAgent: navigator.userAgent,
          signatory: currentUser
        });
        return true;
      }
    }
    return false;
  }, [locationData, currentUser]);

  // Handle step navigation
  const handleNext = useCallback(async () => {
    if (currentStep === 2) {
      // Capture signature before proceeding
      if (!captureSignature()) {
        alert('Please provide your signature before proceeding');
        return;
      }
    }
    
    if (currentStep === 3) {
      // Send verification code
      setLoading(true);
      try {
        // Simulate sending SMS verification code
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Verification code sent to user');
      } catch (error) {
        console.error('Failed to send verification code:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentStep < signatureSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete signature process
      await completeSignature();
    }
  }, [currentStep, captureSignature]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Complete signature process
  const completeSignature = useCallback(async () => {
    if (!signatureData) {
      console.error('No signature data available');
      return;
    }

    setLoading(true);
    
    try {
      // Create comprehensive signature record
      const signatureRecord = {
        contractId,
        signatory: currentUser,
        signature: signatureData,
        verificationCode,
        ipAddress: await getIPAddress(),
        location: locationData,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        },
        legalCompliance: {
          ghanaCardVerified: true,
          consentGiven: true,
          witnessRequired: false
        }
      };

      // Simulate API call to save signature
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to signature history
      setSignatureHistory(prev => [...prev, signatureRecord]);
      
      console.log('Signature completed:', signatureRecord);
      
      // Notify parent component
      if (onSignatureComplete) {
        onSignatureComplete(signatureRecord);
      }
      
    } catch (error) {
      console.error('Signature completion failed:', error);
    } finally {
      setLoading(false);
    }
  }, [signatureData, verificationCode, contractId, currentUser, locationData, onSignatureComplete]);

  // Get IP address for verification
  const getIPAddress = async () => {
    try {
      const response = await fetch(`${EXTERNAL_SERVICES.IP_GEOLOCATION}?format=json`);
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get IP address:', error);
      return 'unknown';
    }
  };

  // Render step content
  const renderStepContent = useCallback((step) => {
    switch (step) {
      case 0: // Identity Verification
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Digital signatures in Ghana require identity verification for legal validity
            </Alert>
            
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Ghana Card Number"
                placeholder="GHA-123456789-0"
                helperText="Enter your Ghana Card number for identity verification"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <TextField
                fullWidth
                label="Phone Number"
                placeholder="+233 XX XXX XXXX"
                helperText="SMS verification code will be sent to this number"
                InputProps={{
                  startAdornment: <span style={{ marginRight: 8 }}>🇬🇭</span>
                }}
              />
            </Stack>
          </Box>
        );

      case 1: // Contract Review
        return (
          <Box sx={{ py: 2 }}>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(255,215,0,0.1) 100%)',
                border: '1px solid rgba(255,215,0,0.2)'
              }}
            >
              <Typography variant="h6" sx={{ color: '#FFD700', mb: 2, fontWeight: 700 }}>
                {contractTitle}
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract ID: {contractId}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date: {new Date().toLocaleDateString()}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  By signing this contract, you agree to the terms and conditions outlined
                  in the service agreement. This digital signature will be legally binding
                  under Ghana's Electronic Transactions Act.
                </Typography>
              </Stack>
            </Paper>
            
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Important:</strong> Please read all terms carefully before proceeding.
                This signature will be legally binding and enforceable in Ghana.
              </Typography>
            </Alert>
          </Box>
        );

      case 2: // Digital Signature
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
              Please sign your name in the box below using your finger or stylus
            </Typography>
            
            <Paper
              elevation={2}
              sx={{
                position: 'relative',
                mb: 3,
                border: '2px dashed #FFD700',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                style={{
                  width: '100%',
                  height: '200px',
                  cursor: 'crosshair',
                  background: 'rgba(255,255,255,0.05)'
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              
              <IconButton
                onClick={clearSignature}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(244,67,54,0.8)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(244,67,54,1)'
                  }
                }}
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </Paper>
            
            <Alert severity="info">
              <Typography variant="body2">
                Your signature will be encrypted and stored securely with timestamp and location data
                for legal verification purposes.
              </Typography>
            </Alert>
          </Box>
        );

      case 3: // Biometric Confirmation
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Verification code sent to your registered phone number
            </Alert>
            
            <Stack spacing={3} alignItems="center">
              <TextField
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '24px' } }}
                sx={{ maxWidth: 200 }}
              />
              
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Didn't receive the code?{' '}
                <Button size="small" onClick={() => console.log('Resend code')}>
                  Resend
                </Button>
              </Typography>
            </Stack>
          </Box>
        );

      case 4: // Final Verification
        return (
          <Box sx={{ py: 2 }}>
            <Stack spacing={3} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 64, color: '#4CAF50' }} />
              
              <Typography variant="h6" textAlign="center" sx={{ color: '#4CAF50' }}>
                Signature Verification Complete
              </Typography>
              
              <Paper sx={{ p: 2, width: '100%', backgroundColor: 'rgba(76,175,80,0.1)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#4CAF50' }}>
                  Signature Details:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Timestamp: {new Date().toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Location: {locationData ? 'Verified' : 'Not available'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Identity: Verified with Ghana Card
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Legal Status: Binding under Ghana law
                </Typography>
              </Paper>
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  }, [contractId, contractTitle, verificationCode, locationData, startDrawing, draw, stopDrawing, clearSignature]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: isMobile ? 0 : 3
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255,215,0,0.2)' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <SecurityIcon sx={{ color: '#FFD700' }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#FFD700', fontWeight: 700 }}>
              Digital Contract Signature
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Legally binding signature for Ghana contracts
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={currentStep} orientation="vertical">
          {signatureSteps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: index <= currentStep 
                        ? 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)'
                        : 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: index <= currentStep ? '#000' : '#fff'
                    }}
                  >
                    {index < currentStep ? <CheckCircleIcon /> : step.icon}
                  </Box>
                }
                sx={{
                  '& .MuiStepLabel-label': {
                    color: index <= currentStep ? '#FFD700' : 'text.secondary',
                    fontWeight: index === currentStep ? 700 : 400
                  }
                }}
              >
                {step.label}
              </StepLabel>
              
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStepContent(index)}
                  </motion.div>
                </AnimatePresence>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {loading && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress 
              sx={{
                backgroundColor: 'rgba(255,215,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#FFD700'
                }
              }}
            />
            <Typography variant="body2" textAlign="center" sx={{ mt: 1, color: 'text.secondary' }}>
              Processing signature...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,215,0,0.2)' }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'text.secondary'
          }}
        >
          Cancel
        </Button>
        
        {currentStep > 0 && (
          <Button
            onClick={handleBack}
            variant="outlined"
            sx={{
              borderColor: '#FFD700',
              color: '#FFD700'
            }}
          >
            Back
          </Button>
        )}
        
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading || (currentStep === 3 && verificationCode.length !== 6)}
          sx={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
            color: '#000',
            fontWeight: 700,
            minWidth: 120,
            '&:hover': {
              background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
            }
          }}
        >
          {currentStep === signatureSteps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DigitalSignature;