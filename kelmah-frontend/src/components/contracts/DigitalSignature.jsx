import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  Alert,
  FormControlLabel,
  Checkbox,
  Stack
} from '@mui/material';
import {
  Draw as DrawIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon, 
  Download as DownloadIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import ContractService from '../../services/ContractService';

const SignaturePad = ({ value, onChange, disabled, height = 200 }) => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
    setContext(ctx);

    // Load existing signature if available
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e) => {
    if (disabled) return;
    setDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawing || !context || disabled) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!drawing || disabled) return;
    setDrawing(false);
    context.closePath();
    
    // Notify parent of change
    if (onChange) {
      const data = canvasRef.current.toDataURL('image/png');
      onChange(data);
    }
  };

  const clearCanvas = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Notify parent of change
    if (onChange) {
      onChange('');
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box 
        sx={{ 
          border: '1px solid rgba(0, 0, 0, 0.23)', 
          borderRadius: 1,
          backgroundColor: '#fff',
          cursor: disabled ? 'default' : 'crosshair',
          position: 'relative'
        }}
      >
        <canvas
          ref={canvasRef}
          width={500}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ width: '100%', height: 'auto' }}
        />
        {!value && !disabled && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            Draw your signature here
          </Typography>
        )}
      </Box>
      {!disabled && (
        <Button
          startIcon={<DeleteIcon />}
          onClick={clearCanvas}
          sx={{ mt: 1 }}
          size="small"
        >
          Clear
        </Button>
      )}
    </Box>
  );
};

const TypedSignature = ({ value, onChange, disabled, fontOptions }) => {
  const [font, setFont] = useState('cursive');
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };
  
  return (
    <TextField
      fullWidth
      label="Type your signature"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      InputProps={{
        style: {
          fontFamily: font,
          fontSize: '24px'
        }
      }}
      sx={{ mb: 2 }}
    />
  );
};

const DigitalSignature = ({ 
  contractId, 
  onSignComplete, 
  isDisabled = false 
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const signatureRef = useRef();

  // Open signature dialog
  const handleOpenSignature = () => {
    setSignatureDialogOpen(true);
    setError(null);
    setSuccessMessage(null);
  };

  // Close signature dialog
  const handleCloseSignature = () => {
    setSignatureDialogOpen(false);
  };

  // Clear signature pad
  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  // Submit signature
  const handleSubmitSignature = async () => {
    try {
      // Validate form
      if (signatureRef.current.isEmpty()) {
        setError('Please provide your signature');
      return;
    }
    
      if (!agreeToTerms) {
        setError('You must agree to the terms and conditions');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      // Get signature as data URL
      const signatureData = signatureRef.current.toDataURL();

      // Submit signature
      await ContractService.signContract(contractId, {
        signature: signatureData,
        comments: comments
      });

      setSuccessMessage('Contract signed successfully');
      
      // Call the callback if provided
      if (typeof onSignComplete === 'function') {
        onSignComplete();
      }
      
      // Close dialog after a short delay
      setTimeout(() => {
        setSignatureDialogOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Error signing contract:', err);
      setError(err.response?.data?.message || 'Failed to sign contract. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpenSignature}
        disabled={isDisabled}
        fullWidth
      >
        Sign Contract
      </Button>

      <Dialog 
        open={signatureDialogOpen} 
        onClose={handleCloseSignature}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sign Contract</DialogTitle>
        <DialogContent>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Box sx={{ mb: 2, mt: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
              Please sign below to indicate your acceptance of the contract terms
        </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              By signing, you confirm that you are {user?.fullName || user?.name || 'the registered user'} and 
              agree to be bound by the terms and conditions outlined in this contract.
              </Typography>
      </Box>
      
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1, 
              mb: 2, 
              bgcolor: 'grey.50',
              borderWidth: 1,
              borderStyle: 'dashed'
            }}
          >
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas',
                style: { 
                  width: '100%', 
                  height: '200px',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }
              }}
            />
          </Paper>

          <Box sx={{ mb: 2 }}>
              <Button
              variant="outlined" 
              size="small" 
              onClick={handleClearSignature}
              disabled={isSubmitting}
            >
              Clear Signature
              </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <TextField
            label="Comments (Optional)"
            placeholder="Add any comments or notes about your signature"
            multiline
            rows={3}
            fullWidth
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            margin="normal"
            disabled={isSubmitting}
          />

            <FormControlLabel
              control={
                <Checkbox 
                checked={agreeToTerms} 
                onChange={(e) => setAgreeToTerms(e.target.checked)} 
                disabled={isSubmitting}
              />
            }
            label="I have read and agree to the terms and conditions of this contract"
            sx={{ mt: 1, display: 'block' }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseSignature} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitSignature} 
            variant="contained"
            disabled={isSubmitting || !agreeToTerms}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Signing...' : 'Sign Contract'}
          </Button>
        </DialogActions>
      </Dialog>
        </>
  );
};

export default DigitalSignature; 