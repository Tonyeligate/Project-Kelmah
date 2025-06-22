import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  IconButton
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const getStatusChip = (status) => {
  const color = {
    completed: 'success',
    pending: 'warning',
    processing: 'info',
    failed: 'error'
  }[status];
  return <Chip label={status} color={color} size="small" />;
};

const TransactionHistory = ({ transactions }) => {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', borderRadius: 0 }}>
      <Table sx={{ minWidth: 650 }} aria-label="transaction history table">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{format(new Date(row.date), 'PP')}</TableCell>
              <TableCell>
                <Typography variant="body2">{row.description}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.type === 'received' ? `From: ${row.from}` : `To: ${row.to}`}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography color={row.type === 'received' ? 'success.main' : 'error.main'}>
                  {row.type === 'received' ? '+' : '-'}${row.amount.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{getStatusChip(row.status)}</TableCell>
              <TableCell>
                <IconButton size="small">
                  <DownloadIcon fontSize="inherit" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransactionHistory; 