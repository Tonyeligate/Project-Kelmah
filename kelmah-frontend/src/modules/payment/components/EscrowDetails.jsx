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
  return (
    <TableContainer
      component={Paper}
      sx={{ boxShadow: 'none', borderRadius: 0 }}
    >
      <Table sx={{ minWidth: 650 }} aria-label="escrow details table">
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
                  ${row.totalAmount.toFixed(2)}
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
                      ${row.releasedAmount.toFixed(2)} Released
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
