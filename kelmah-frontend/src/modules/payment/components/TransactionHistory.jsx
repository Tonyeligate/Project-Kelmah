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
  IconButton,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const getStatusChip = (status) => {
  const color = {
    completed: 'success',
    pending: 'warning',
    processing: 'info',
    failed: 'error',
  }[status];
  return <Chip label={status} color={color} size="small" />;
};

const TransactionHistory = ({ transactions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {transactions.map((row) => (
          <Card key={row.id} variant="outlined">
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={600}>
                    {format(new Date(row.date), 'PP')}
                  </Typography>
                  {getStatusChip(row.status)}
                </Stack>
                <Typography variant="body2" fontWeight={500}>
                  {row.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.type === 'received' ? `From: ${row.from}` : `To: ${row.to}`}
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    fontWeight={700}
                    color={row.type === 'received' ? 'success.main' : 'error.main'}
                  >
                    {row.type === 'received' ? '+' : '-'}GH₵{row.amount.toFixed(2)}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      {row.type}
                    </Typography>
                    <IconButton size="small" aria-label="Download receipt">
                      <DownloadIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{ boxShadow: 'none', borderRadius: 0 }}
    >
      <Table sx={{ minWidth: { xs: 0, md: 650 } }} aria-label="transaction history table">
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
                  {row.type === 'received'
                    ? `From: ${row.from}`
                    : `To: ${row.to}`}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  color={
                    row.type === 'received' ? 'success.main' : 'error.main'
                  }
                >
                  {row.type === 'received' ? '+' : '-'}GH₵{row.amount.toFixed(2)}
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
