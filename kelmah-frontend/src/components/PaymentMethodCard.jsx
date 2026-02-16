import React from 'react';
import { Paper, Box, Typography, Button, Chip } from '@mui/material';
import { CreditCard as CreditCardIcon } from '@mui/icons-material';

const PaymentMethodCard = ({ method, onEdit }) => {
  return (
    <Paper
      elevation={1}
      sx={{
        mb: 2,
        p: 2,
        borderLeft: method.isDefault ? '4px solid #4caf50' : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
        <CreditCardIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ overflowWrap: 'anywhere' }}>
              {method.cardNumber}
            </Typography>
            {method.isDefault && (
              <Chip
                label="Default"
                size="small"
                color="success"
                sx={{ height: 20 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Expires: {method.expiryMonth}/{method.expiryYear}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {method.cardholderName}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
        <Button size="small" fullWidth onClick={() => onEdit(method)} aria-label="Edit payment method">
          Edit
        </Button>
      </Box>
    </Paper>
  );
};

export default PaymentMethodCard;
