import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Collapse,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BuildIcon from '@mui/icons-material/Build';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PersonIcon from '@mui/icons-material/Person';

// Map raw field names to human-readable labels, icons, and navigation targets
const FIELD_MAP = {
  bio: {
    label: 'Write bio',
    icon: <EditIcon fontSize="small" />,
    path: '/worker/profile/edit#bio',
  },
  skills: {
    label: 'Add skills',
    icon: <BuildIcon fontSize="small" />,
    path: '/worker/profile/edit#skills',
  },
  profilePhoto: {
    label: 'Upload photo',
    icon: <PhotoCameraIcon fontSize="small" />,
    path: '/worker/profile/edit#photo',
  },
  photo: {
    label: 'Upload photo',
    icon: <PhotoCameraIcon fontSize="small" />,
    path: '/worker/profile/edit#photo',
  },
  avatar: {
    label: 'Upload photo',
    icon: <PhotoCameraIcon fontSize="small" />,
    path: '/worker/profile/edit#photo',
  },
  location: {
    label: 'Set location',
    icon: <LocationOnIcon fontSize="small" />,
    path: '/worker/profile/edit#location',
  },
  locationDetails: {
    label: 'Set location',
    icon: <LocationOnIcon fontSize="small" />,
    path: '/worker/profile/edit#location',
  },
  phone: {
    label: 'Add phone',
    icon: <PhoneIcon fontSize="small" />,
    path: '/worker/profile/edit#contact',
  },
  phoneNumber: {
    label: 'Add phone',
    icon: <PhoneIcon fontSize="small" />,
    path: '/worker/profile/edit#contact',
  },
  documents: {
    label: 'Upload documents',
    icon: <UploadFileIcon fontSize="small" />,
    path: '/worker/certificates',
  },
  certifications: {
    label: 'Upload documents',
    icon: <UploadFileIcon fontSize="small" />,
    path: '/worker/certificates',
  },
};

const fallbackField = (fieldName) => ({
  label: fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase()),
  icon: <PersonIcon fontSize="small" />,
  path: '/worker/profile/edit',
});

/**
 * ProfileCompletionCard — shows a progress bar and up to 3 missing-field chips.
 * Props:
 *   percentage  (number)   — 0-100 completion percentage
 *   missingFields (string[]) — raw field names from the API
 *   onStepClick (function)  — called with the navigation path when a chip is clicked
 */
const ProfileCompletionCard = ({
  percentage = 0,
  missingFields = [],
  onStepClick,
}) => {
  const theme = useTheme();
  const isComplete = percentage >= 100;

  const visibleFields = (missingFields || []).slice(0, 3);
  const remainingCount = Math.max(
    (missingFields || []).length - visibleFields.length,
    0,
  );

  const progressColor =
    percentage >= 80
      ? theme.palette.success.main
      : percentage >= 50
        ? theme.palette.warning.main
        : theme.palette.error.main;

  return (
    <Collapse in={!isComplete} timeout={400} unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: 2.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.25),
          background: `linear-gradient(155deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 55%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
        }}
      >
        {/* Header row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="text.primary"
            >
              Profile Completion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete a few more details to improve your visibility in search.
            </Typography>
          </Box>
          <Chip
            label={`${Math.round(percentage)}%`}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: alpha(progressColor, 0.12),
              color: progressColor,
            }}
          />
        </Box>

        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 2,
            bgcolor: alpha(progressColor, 0.15),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: progressColor,
            },
          }}
        />

        {/* Helper text */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: visibleFields.length > 0 ? 1.5 : 0 }}
        >
          Complete your profile to improve your chances of getting matched with
          relevant jobs.
        </Typography>

        {/* Missing-field chips */}
        {visibleFields.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {visibleFields.map((field) => {
                const mapped = FIELD_MAP[field] || fallbackField(field);
                return (
                  <Chip
                    key={field}
                    icon={mapped.icon}
                    label={mapped.label}
                    size="small"
                    clickable
                    onClick={() => onStepClick?.(mapped.path)}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'text.primary',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.18),
                      },
                    }}
                  />
                );
              })}
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {remainingCount > 0
                  ? `Plus ${remainingCount} more step${remainingCount > 1 ? 's' : ''} to finish.`
                  : 'You are close to completing your profile.'}
              </Typography>
              <Button
                size="small"
                variant="contained"
                onClick={() => onStepClick?.('/worker/profile/edit')}
                sx={{
                  minHeight: { xs: 44, sm: 36 },
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Finish Profile
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Collapse>
  );
};

export default ProfileCompletionCard;
