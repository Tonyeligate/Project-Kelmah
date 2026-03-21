import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Chip, Box, IconButton, Card, CardContent, Stack } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { safeFormatDate } from '@/modules/common/utils/formatters';
import { useBreakpointDown } from '@/hooks/useResponsive';

const getStatusChip = (status) => {
  const color = {
    completed: 'success',
    pending: 'warning',
    processing: 'info',
    failed: 'error',
  }[status];
  const label = typeof status === 'string' && status.length > 0
    ? `${status.charAt(0).toUpperCase()}${status.slice(1)}`
    : 'Unknown';
  return <Chip label={label} color={color || 'default'} size="small" />;
};

const getTypeLabel = (type) => (type === 'received' ? 'Money in' : 'Money out');

const TransactionHistory = ({ transactions }) => {
  const isMobile = useBreakpointDown('sm');

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <Box
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          p: 2.5,
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.75 }}>
          No transactions yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your payment history appears here after you receive or send money on Kelmah.
        </Typography>
      </Box>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {transactions.map((row) => (
          <Card key={row.id} variant="outlined">
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={600}>
                    {safeFormatDate(row.date, 'PP')}
                  </Typography>
                  {getStatusChip(row.status)}
                </Stack>
                <Typography variant="body2" fontWeight={500}>
                  {row.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                  {row.type === 'received' ? `From: ${row.from}` : `To: ${row.to}`}
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                  <Typography
                    fontWeight={700}
                    color={row.type === 'received' ? 'success.main' : 'error.main'}
                  >
                    {row.type === 'received' ? '+' : '-'}GH₵{row.amount.toFixed(2)}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      {getTypeLabel(row.type)}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label={`Download ${getTypeLabel(row.type)} receipt for ${safeFormatDate(row.date, 'PP')}`}
                      sx={{ width: 44, height: 44 }}
                    >
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
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', px: 2, pt: 1.5 }}
      >
        Review each transaction date, status, and receipt action before sharing payment proof.
      </Typography>
      <Table sx={{ minWidth: { xs: 0, md: 650 } }} aria-label="Transaction history table">
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
              <TableCell>{safeFormatDate(row.date, 'PP')}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  {row.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
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
              <TableCell>{getTypeLabel(row.type)}</TableCell>
              <TableCell>{getStatusChip(row.status)}</TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  aria-label={`Download ${getTypeLabel(row.type)} receipt for ${safeFormatDate(row.date, 'PP')}`}
                  sx={{ width: 44, height: 44 }}
                >
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
