import React, { useState } from 'react';
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
import ConfirmDialog from '../../common/components/common/ConfirmDialog';

const PaymentMethodCard = ({ method, onEdit }) => {
  const { removePaymentMethod } = usePayments();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmOpen(false);
    await removePaymentMethod(method.id);
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

  const maskedCardNumber = maskCardNumber(method.cardNumber);

  return (
    <Card
      sx={{
        mb: 2,
        overflowWrap: 'anywhere',
        '&:hover': {
          boxShadow: 3,
        },
      }}
      aria-label={`${method.type} ending ${String(method.cardNumber || '').slice(-4)}`}
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
            <IconButton
              size="small"
              onClick={handleEdit}
              sx={{
                mr: 1,
                width: 44,
                height: 44,
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                },
              }}
              aria-label={`Edit ${method.type} card ending ${String(method.cardNumber || '').slice(-4)}`}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleDelete}
              color="error"
              sx={{
                width: 44,
                height: 44,
                '&:focus-visible': {
                  outline: '3px solid',
                  outlineColor: 'error.main',
                  outlineOffset: '2px',
                },
              }}
              aria-label={`Remove ${method.type} card ending ${String(method.cardNumber || '').slice(-4)}`}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mt: 2, wordBreak: 'break-word' }}>
          {maskedCardNumber}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.5 }}
        >
          For your security, only the last 4 digits are shown.
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Expires: {method.expiryMonth}/{method.expiryYear}
          </Typography>
          {method.isDefault && (
            <Chip label="Default" size="small" color="primary" />
          )}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Cardholder: {method.cardholderName}
          </Typography>
        </Box>
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        title="Remove Payment Method"
        message="Are you sure you want to remove this payment method? You can add it again later if needed."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
};

export default PaymentMethodCard;
