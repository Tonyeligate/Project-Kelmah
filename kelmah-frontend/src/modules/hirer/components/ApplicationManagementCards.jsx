import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Rating,
  Tooltip,
  Typography,
  useTheme,
  Badge,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AttachMoney,
  CheckCircleOutline,
  Message,
  Schedule,
  Work,
  CancelOutlined,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { formatStatusLabel } from '../utils/applicationManagementUtils';

const formatGhanaCurrencyLabel = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return 'GHS 0';
  }

  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

export const ApplicationCard = ({
  application,
  isSelected,
  onSelect,
  showJobTitle,
  statusColors,
  onAccept,
  onReject,
  onMessage,
  showQuickActions = false,
}) => {
  const theme = useTheme();
  const statusLabel = formatStatusLabel(application.status);
  const isAccepted = application.status === 'accepted';
  const isRejected = application.status === 'rejected';
  const canMessage = Boolean(application.workerId);
  const appliedDate = application.createdAt
    ? new Date(application.createdAt)
    : null;
  const appliedAgo =
    appliedDate && !Number.isNaN(appliedDate.getTime())
      ? formatDistanceToNow(appliedDate, { addSuffix: true })
      : null;
  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(application);
    }
  };

  return (
    <Card
      elevation={isSelected ? 3 : 0}
      sx={{
        mb: { xs: 1, sm: 1.5 },
        borderLeft: isSelected
          ? `4px solid ${theme.palette.primary.main}`
          : '4px solid transparent',
        backgroundColor: isSelected
          ? alpha(theme.palette.primary.main, 0.08)
          : theme.palette.background.paper,
        transition: 'all 0.15s ease',
        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={() => onSelect(application)}
        onKeyDown={handleCardKeyDown}
        aria-label={`Application from ${application.workerName}`}
        sx={{
          cursor: 'pointer',
          borderRadius: 1,
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <CardContent
          sx={{
            py: { xs: 1.1, sm: 1.5 },
            px: { xs: 1.35, sm: 2 },
            '&:last-child': { pb: { xs: 1.1, sm: 1.5 } },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.1, sm: 1.5 },
            }}
          >
            <Avatar
              src={application.workerAvatar}
              alt={application.workerName || 'Applicant'}
              sx={{ width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 } }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                fontWeight={600}
                sx={{ fontSize: { xs: '0.88rem', sm: '0.92rem' } }}
              >
                {application.workerName}
              </Typography>
              {application.workerRating !== null ? (
                <Rating
                  value={application.workerRating}
                  precision={0.5}
                  readOnly
                  size="small"
                />
              ) : (
                <Typography variant="caption" color="text.disabled">
                  No reviews yet
                </Typography>
              )}
            </Box>
            <Chip
              size="small"
              label={statusLabel}
              color={statusColors[application.status] || 'default'}
              variant="outlined"
              sx={{
                fontSize: { xs: '0.82rem', sm: '0.84rem' },
                minHeight: { xs: 28, sm: 30 },
                '& .MuiChip-label': {
                  px: { xs: 0.95, sm: 1.1 },
                },
              }}
            />
          </Box>
          {showJobTitle && (
            <Typography
              variant="caption"
              color="primary.main"
              noWrap
              sx={{
                display: 'block',
                mt: 0.35,
                fontWeight: 500,
                fontSize: { xs: '0.82rem', sm: '0.85rem' },
              }}
            >
              {application.jobTitle}
            </Typography>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.4,
              fontSize: { xs: '0.88rem', sm: '0.92rem' },
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {application.coverLetter}
          </Typography>
          {application.proposedRate != null && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 0.55,
                display: 'flex',
                alignItems: 'center',
                gap: 0.35,
                flexWrap: 'wrap',
                fontSize: { xs: '0.82rem', sm: '0.85rem' },
              }}
            >
              <AttachMoney sx={{ fontSize: { xs: 13, sm: 14 } }} />
              {formatGhanaCurrencyLabel(application.proposedRate)}
              {application.estimatedDuration && (
                <>
                  {' '}
                  <Schedule sx={{ fontSize: { xs: 13, sm: 14 }, ml: 0.6 }} />
                  {application.estimatedDuration}
                </>
              )}
            </Typography>
          )}

          {appliedAgo && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{
                mt: 0.35,
                display: 'flex',
                alignItems: 'center',
                gap: 0.4,
                fontSize: { xs: '0.82rem', sm: '0.85rem' },
              }}
            >
              <Schedule sx={{ fontSize: { xs: 12, sm: 13 } }} />
              Applied {appliedAgo}
            </Typography>
          )}

          {showQuickActions && (
            <Box
              sx={{
                mt: 0.75,
                pt: 0.75,
                borderTop: `1px dashed ${alpha(theme.palette.divider, 0.7)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 0.35,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Quick actions
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Tooltip title="Message worker">
                  <span>
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        onMessage?.(application);
                      }}
                      disabled={!canMessage}
                      aria-label={`Message ${application.workerName || 'worker'}`}
                      sx={{ width: 44, height: 44 }}
                    >
                      <Message fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={isAccepted ? 'Already accepted' : 'Accept application'}
                >
                  <span>
                    <IconButton
                      size="small"
                      color="success"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAccept?.(application);
                      }}
                      disabled={isAccepted}
                      aria-label={`Accept ${application.workerName || 'application'}`}
                      sx={{ width: 44, height: 44 }}
                    >
                      <CheckCircleOutline fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={isRejected ? 'Already rejected' : 'Reject application'}
                >
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        onReject?.(application);
                      }}
                      disabled={isRejected}
                      aria-label={`Reject ${application.workerName || 'application'}`}
                      sx={{ width: 44, height: 44 }}
                    >
                      <CancelOutlined fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          )}
        </CardContent>
      </Box>
    </Card>
  );
};

export const JobListItem = ({ job, isSelected, onClick, appCount }) => {
  const theme = useTheme();

  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      sx={{
        borderRadius: 1.5,
        mb: 0.5,
        minHeight: { xs: 50, sm: 56 },
        py: { xs: 0.8, sm: 1 },
        px: { xs: 1.1, sm: 1.5 },
        borderLeft: isSelected
          ? `3px solid ${theme.palette.primary.main}`
          : '3px solid transparent',
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: { xs: 32, sm: 36 } }}>
        <Badge badgeContent={appCount} color="primary" max={99} showZero>
          <Work
            fontSize="small"
            sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }}
          />
        </Badge>
      </ListItemIcon>
      <ListItemText
        primary={job.title}
        primaryTypographyProps={{
          variant: 'body2',
          fontWeight: isSelected ? 600 : 400,
          noWrap: true,
        }}
        secondary={
          job.status
            ? `${formatStatusLabel(job.status, 'Open')} • ${
                Number.isFinite(Number(job.budget || job.budgetRange?.min))
                  ? formatGhanaCurrencyLabel(job.budget || job.budgetRange?.min)
                  : 'Budget pending'
              }`
            : undefined
        }
        secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
      />
    </ListItemButton>
  );
};
