import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { usePayments } from '../contexts/PaymentContext';

const PaymentMethodCard = ({ method, onEdit }) => {
  const { removePaymentMethod } = usePayments();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (
      window.confirm('Are you sure you want to remove this payment method?')
    ) {
      await removePaymentMethod(method.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(method);
  };

  const getCardTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const maskCardNumber = (number) => {
    return `**** **** **** ${number.slice(-4)}`;
  };

  return (
    <Card
      sx={{
        mb: 2,
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="span">
              {getCardTypeIcon(method.type)}
            </Typography>
            <Typography variant="h6">{method.type}</Typography>
          </Box>
          <Box>
            <IconButton size="small" onClick={handleEdit} sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mt: 2 }}>
          {maskCardNumber(method.cardNumber)}
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Expires: {method.expiryMonth}/{method.expiryYear}
          </Typography>
          {method.isDefault && (
            <Chip label="Default" size="small" color="primary" />
          )}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Cardholder: {method.cardholderName}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodCard;
