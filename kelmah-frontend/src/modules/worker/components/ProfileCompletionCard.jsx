import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Collapse,
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
  bio: { label: 'Write bio', icon: <EditIcon fontSize="small" />, path: '/worker/profile/edit#bio' },
  skills: { label: 'Add skills', icon: <BuildIcon fontSize="small" />, path: '/worker/profile/edit#skills' },
  profilePhoto: { label: 'Upload photo', icon: <PhotoCameraIcon fontSize="small" />, path: '/worker/profile/edit#photo' },
  photo: { label: 'Upload photo', icon: <PhotoCameraIcon fontSize="small" />, path: '/worker/profile/edit#photo' },
  avatar: { label: 'Upload photo', icon: <PhotoCameraIcon fontSize="small" />, path: '/worker/profile/edit#photo' },
  location: { label: 'Set location', icon: <LocationOnIcon fontSize="small" />, path: '/worker/profile/edit#location' },
  locationDetails: { label: 'Set location', icon: <LocationOnIcon fontSize="small" />, path: '/worker/profile/edit#location' },
  phone: { label: 'Add phone', icon: <PhoneIcon fontSize="small" />, path: '/worker/profile/edit#contact' },
  phoneNumber: { label: 'Add phone', icon: <PhoneIcon fontSize="small" />, path: '/worker/profile/edit#contact' },
  documents: { label: 'Upload documents', icon: <UploadFileIcon fontSize="small" />, path: '/worker/certificates' },
  certifications: { label: 'Upload documents', icon: <UploadFileIcon fontSize="small" />, path: '/worker/certificates' },
};

const fallbackField = (fieldName) => ({
  label: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
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
const ProfileCompletionCard = ({ percentage = 0, missingFields = [], onStepClick }) => {
  const theme = useTheme();
  const isComplete = percentage >= 100;

  const visibleFields = (missingFields || []).slice(0, 3);

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
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.25),
        }}
      >
        {/* Header row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">
            Profile Completion
          </Typography>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: progressColor }}>
            {Math.round(percentage)}%
          </Typography>
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: visibleFields.length > 0 ? 1.5 : 0 }}>
          Complete your profile to get 3× more job matches
        </Typography>

        {/* Missing-field chips */}
        {visibleFields.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
        )}
      </Paper>
    </Collapse>
  );
};

export default ProfileCompletionCard;
