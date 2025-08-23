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
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CreditCardIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1">{method.cardNumber}</Typography>
            {method.isDefault && (
              <Chip
                label="Default"
                size="small"
                color="success"
                sx={{ ml: 1, height: 20 }}
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

      <Box>
        <Button size="small" onClick={() => onEdit(method)}>
          Edit
        </Button>
      </Box>
    </Paper>
  );
};

export default PaymentMethodCard;
