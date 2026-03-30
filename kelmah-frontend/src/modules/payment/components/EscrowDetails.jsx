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
  LinearProgress,
  Link as MuiLink,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useBreakpointDown } from '@/hooks/useResponsive';
import { currencyFormatter } from '@/modules/common/utils/formatters';

const getStatusChip = (status) => {
  const color = {
    active: 'success',
    completed: 'primary',
    disputed: 'error',
    pending: 'warning',
  }[status];
  return <Chip label={status} color={color} size="small" />;
};

const EscrowDetails = ({ escrows }) => {
  const isMobile = useBreakpointDown('sm');

  if (!Array.isArray(escrows) || escrows.length === 0) {
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
          No escrow records yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Escrow jobs appear here after a funded milestone is created by a
          hirer.
        </Typography>
      </Box>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          Funds are released as milestones are approved. Use each card to track
          progress clearly.
        </Typography>
        {escrows.map((row) => {
          const progress =
            row.totalAmount > 0
              ? (row.releasedAmount / row.totalAmount) * 100
              : 0;
          return (
            <Card key={row.id} variant="outlined">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <MuiLink
                      component={Link}
                      to={`/jobs/${row.jobId}`}
                      underline="hover"
                      aria-label={`Open escrow job ${row.jobTitle}`}
                      sx={{
                        fontWeight: 600,
                        minWidth: 0,
                        wordBreak: 'break-word',
                      }}
                    >
                      {row.jobTitle}
                    </MuiLink>
                    {getStatusChip(row.status)}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Hirer: {row.hirer?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total: {currencyFormatter.format(row.totalAmount)}
                  </Typography>
                  <Box>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="caption" color="text.secondary">
                      {currencyFormatter.format(row.releasedAmount)} Released
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Escrow progress shows how much of each funded job has already been
        released.
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ boxShadow: 'none', borderRadius: 0 }}
      >
        <Table
          sx={{ minWidth: { xs: 0, md: 650 } }}
          aria-label="Escrow details table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Job</TableCell>
              <TableCell>Hirer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="center">Funds Released</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {escrows.map((row) => {
              const progress =
                row.totalAmount > 0
                  ? (row.releasedAmount / row.totalAmount) * 100
                  : 0;

              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <MuiLink
                      component={Link}
                      to={`/jobs/${row.jobId}`}
                      underline="hover"
                      aria-label={`Open escrow job ${row.jobTitle}`}
                      sx={{ wordBreak: 'break-word' }}
                    >
                      {row.jobTitle}
                    </MuiLink>
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'break-word' }}>
                    {row.hirer?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{getStatusChip(row.status)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {currencyFormatter.format(row.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                        />
                      </Box>
                      <Box sx={{ minWidth: 110 }}>
                        <Typography variant="body2" color="text.secondary">
                          {currencyFormatter.format(row.releasedAmount)}{' '}
                          Released
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EscrowDetails;
