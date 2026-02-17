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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link } from 'react-router-dom';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {escrows.map((row) => {
          const progress = row.totalAmount > 0
            ? (row.releasedAmount / row.totalAmount) * 100
            : 0;
          return (
            <Card key={row.id} variant="outlined">
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <MuiLink component={Link} to={`/jobs/${row.jobId}`} underline="hover" sx={{ fontWeight: 600 }}>
                      {row.jobTitle}
                    </MuiLink>
                    {getStatusChip(row.status)}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Hirer: {row.hirer?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Total: GH₵{row.totalAmount.toFixed(2)}
                  </Typography>
                  <Box>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="caption" color="text.secondary">
                      GH₵{row.releasedAmount.toFixed(2)} Released
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
    <TableContainer
      component={Paper}
      sx={{ boxShadow: 'none', borderRadius: 0 }}
    >
      <Table sx={{ minWidth: { xs: 0, md: 650 } }} aria-label="escrow details table">
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
          {escrows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <MuiLink
                  component={Link}
                  to={`/jobs/${row.jobId}`}
                  underline="hover"
                >
                  {row.jobTitle}
                </MuiLink>
              </TableCell>
              <TableCell>{row.hirer.name}</TableCell>
              <TableCell>{getStatusChip(row.status)}</TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">
                  GH₵{row.totalAmount.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(row.releasedAmount / row.totalAmount) * 100}
                    />
                  </Box>
                  <Box sx={{ minWidth: 110 }}>
                    <Typography variant="body2" color="text.secondary">
                      GH₵{row.releasedAmount.toFixed(2)} Released
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EscrowDetails;
