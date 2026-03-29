import React from 'react';
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Rating,
  Typography,
  useTheme,
  Badge,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AttachMoney, Schedule, Work } from '@mui/icons-material';

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

const toTitleCase = (value) => {
  const source = String(value || '').trim();
  if (!source) {
    return 'Pending';
  }

  return source.charAt(0).toUpperCase() + source.slice(1);
};

export const ApplicationCard = ({
  application,
  isSelected,
  onSelect,
  showJobTitle,
  statusColors,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={isSelected ? 3 : 0}
      sx={{
        mb: 1.5,
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
      <CardActionArea
        onClick={() => onSelect(application)}
        aria-label={`Application from ${application.workerName}`}
        sx={{
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={application.workerAvatar}
              alt={application.workerName || 'Applicant'}
              sx={{ width: 40, height: 40 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap fontWeight={600}>
                {application.workerName}
              </Typography>
              {application.workerRating !== null ? (
                <Rating value={application.workerRating} precision={0.5} readOnly size="small" />
              ) : (
                <Typography variant="caption" color="text.disabled">
                  No reviews yet
                </Typography>
              )}
            </Box>
            <Chip
              size="small"
              label={toTitleCase(application.status)}
              color={statusColors[application.status] || 'default'}
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                minHeight: 26,
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>
          {showJobTitle && (
            <Typography
              variant="caption"
              color="primary.main"
              noWrap
              sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}
            >
              {application.jobTitle}
            </Typography>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
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
                mt: 0.75,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <AttachMoney sx={{ fontSize: 14 }} />
              {formatGhanaCurrencyLabel(application.proposedRate)}
              {application.estimatedDuration && (
                <>
                  {' '}
                  <Schedule sx={{ fontSize: 14, ml: 0.75 }} />
                  {application.estimatedDuration}
                </>
              )}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
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
        minHeight: 56,
        py: 1,
        px: 1.5,
        borderLeft: isSelected
          ? `3px solid ${theme.palette.primary.main}`
          : '3px solid transparent',
        '&.Mui-selected': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
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
            ? `${toTitleCase(job.status)} • ${
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
