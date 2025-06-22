import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  LinearProgress,
  Avatar,
  Stack,
  alpha,
} from '@mui/material';
import {
  Handshake as HandshakeIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  active: { label: 'Active', color: 'primary', icon: <HandshakeIcon /> },
  pending: { label: 'Pending', color: 'warning', icon: <PendingIcon /> },
  completed: { label: 'Completed', color: 'success', icon: <CheckCircleIcon /> },
  dispute: { label: 'In Dispute', color: 'error', icon: <ErrorIcon /> },
};

const ContractCard = ({ contract }) => {
  const { id, title, hirer, value, amountPaid, endDate, status } = contract;
  const currentStatus = statusConfig[status] || { label: 'Unknown', color: 'default', icon: <></> };
  const progress = value > 0 ? (amountPaid / value) * 100 : 0;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 3,
        borderTop: `4px solid`,
        borderColor: `${currentStatus.color}.main`,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
      }}
    >
      {/* Header with Hirer Info and Status */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar src={hirer.avatar} sx={{ width: 40, height: 40 }} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Contract with
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {hirer.name}
            </Typography>
          </Box>
        </Stack>
        <Chip
          icon={currentStatus.icon}
          label={currentStatus.label}
          color={currentStatus.color}
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </Stack>

      {/* Contract Title */}
      <Typography
        variant="h6"
        component="h3"
        fontWeight="bold"
        sx={{
          mb: 2,
          flexGrow: 1,
          lineHeight: 1.4,
        }}
      >
        {title}
      </Typography>

      {/* Financial Progress */}
      <Box mb={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            Paid
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 10, borderRadius: 5, mb: 0.5 }}
          color={currentStatus.color}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight="bold">
            ${amountPaid.toFixed(2)}
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            ${value.toFixed(2)}
          </Typography>
        </Stack>
      </Box>

      {/* Footer with End Date and Action Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography variant="caption" color="text.secondary">
          Ends: {formatDistanceToNow(new Date(endDate), { addSuffix: true })}
        </Typography>
        <Button
          component={Link}
          to={`/contracts/${id}`}
          variant="contained"
          size="small"
        >
          View Contract
        </Button>
      </Stack>
    </Paper>
  );
};

ContractCard.propTypes = {
  contract: PropTypes.shape({
    id: PropTypes.any.isRequired,
    title: PropTypes.string.isRequired,
    hirer: PropTypes.shape({
      name: PropTypes.string,
      avatar: PropTypes.string,
    }).isRequired,
    value: PropTypes.number.isRequired,
    amountPaid: PropTypes.number.isRequired,
    endDate: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['active', 'pending', 'completed', 'dispute']).isRequired,
  }).isRequired,
};

export default ContractCard;
