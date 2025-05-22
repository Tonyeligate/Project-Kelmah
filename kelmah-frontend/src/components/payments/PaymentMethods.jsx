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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import PaymentService from '../../services/PaymentService';

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    isDefault: false
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await PaymentService.getPaymentMethods();
      setPaymentMethods(response);
      setError(null);
    } catch (err) {
      setError(err.message);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        type: method.type,
        cardNumber: method.cardNumber,
        expiryDate: method.expiryDate,
        cvv: '',
        name: method.name,
        isDefault: method.isDefault
      });
    } else {
      setEditingMethod(null);
      setFormData({
        type: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        name: '',
        isDefault: false
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMethod(null);
    setFormData({
      type: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: '',
      isDefault: false
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingMethod) {
        await PaymentService.updatePaymentMethod(editingMethod.id, formData);
      } else {
        await PaymentService.addPaymentMethod(formData);
      }
      fetchPaymentMethods();
      handleCloseDialog();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (methodId) => {
    try {
      await PaymentService.deletePaymentMethod(methodId);
      fetchPaymentMethods();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      await PaymentService.setDefaultPaymentMethod(methodId);
      fetchPaymentMethods();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatCardNumber = (number) => {
    return number.replace(/(\d{4})/g, '$1 ').trim();
  };

  const maskCardNumber = (number) => {
    return `**** **** **** ${number.slice(-4)}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Payment Methods</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Payment Method
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {paymentMethods.map((method) => (
          <Grid item xs={12} md={6} key={method.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{method.name}</Typography>
                  <IconButton
                    onClick={() => handleSetDefault(method.id)}
                    color={method.isDefault ? 'primary' : 'default'}
                  >
                    {method.isDefault ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                </Box>
                <Typography variant="body1" color="textSecondary">
                  {method.type}
                </Typography>
                <Typography variant="h6" sx={{ my: 1 }}>
                  {maskCardNumber(method.cardNumber)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Expires: {method.expiryDate}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <IconButton onClick={() => handleOpenDialog(method)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(method.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Cardholder Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Card Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                label="Card Type"
              >
                <MenuItem value="visa">Visa</MenuItem>
                <MenuItem value="mastercard">Mastercard</MenuItem>
                <MenuItem value="amex">American Express</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Card Number"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              margin="normal"
              required
              placeholder="1234 5678 9012 3456"
            />
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Expiry Date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="MM/YY"
              />
              <TextField
                fullWidth
                label="CVV"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                margin="normal"
                required
                type="password"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMethod ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentMethods; 