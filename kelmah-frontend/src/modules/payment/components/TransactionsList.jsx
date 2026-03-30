import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  Avatar,
  ListItemText,
  Divider,
  Box,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import {
  currencyFormatter,
  safeFormatDate,
} from '@/modules/common/utils/formatters';

const TransactionsList = ({ transactions = [], loading = false, limit }) => {
  if (loading) {
    return (
      <Box>
        {[...Array(limit || 3)].map((_, idx) => (
          <Skeleton
            key={`transactions-skeleton-${idx}`}
            variant="rectangular"
            height={60}
            sx={{ mb: 2, borderRadius: 2 }}
          />
        ))}
      </Box>
    );
  }

  const items = limit ? transactions.slice(0, limit) : transactions;
  // Empty state when no transactions
  if (!loading && items.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Recent Transactions
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          No transactions found.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Deposits, withdrawals, and escrow releases will appear here when
          available.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }} aria-label="Recent transactions list">
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Recent Transactions
      </Typography>
      <List>
        {items.map((tx, idx) => (
          <React.Fragment key={tx.id}>
            <ListItem>
              <ListItemIcon>
                <Tooltip
                  title={
                    tx.type === 'deposit' ? 'Money received' : 'Money spent'
                  }
                >
                  <Avatar
                    sx={{
                      bgcolor:
                        tx.type === 'deposit' ? 'success.light' : 'error.light',
                    }}
                  >
                    {tx.type === 'deposit' ? (
                      <ArrowUpwardIcon />
                    ) : (
                      <ArrowDownwardIcon />
                    )}
                  </Avatar>
                </Tooltip>
              </ListItemIcon>
              <ListItemText
                primary={tx.title || tx.description}
                secondary={safeFormatDate(tx.date, 'd MMMM yyyy, hh:mm a')}
                primaryTypographyProps={{
                  sx: { wordBreak: 'break-word', overflowWrap: 'anywhere' },
                }}
                secondaryTypographyProps={{ sx: { whiteSpace: 'normal' } }}
              />
              <Tooltip
                title={
                  tx.type === 'deposit' ? 'Amount received' : 'Amount paid'
                }
              >
                <Typography
                  color={tx.type === 'deposit' ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                  sx={{ minWidth: 90, textAlign: 'right' }}
                >
                  {(tx.type === 'deposit' ? '+' : '-') +
                    currencyFormatter.format(tx.amount)}
                </Typography>
              </Tooltip>
            </ListItem>
            {idx < items.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default TransactionsList;
