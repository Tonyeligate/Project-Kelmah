import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Stack,
} from '@mui/material';
import PropTypes from 'prop-types';
import StarIcon from '@mui/icons-material/Star';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useBreakpointDown } from '@/hooks/useResponsive';

const compactChipSx = {
  height: 20,
  fontSize: '0.65rem',
  maxWidth: '100%',
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
};

const getLocationLabel = (worker) => {
  const location =
    typeof worker?.location === 'string' ? worker.location.trim() : '';
  const city = typeof worker?.city === 'string' ? worker.city.trim() : '';
  const region = typeof worker?.region === 'string' ? worker.region.trim() : '';
  const parts = [location, city, region].filter(Boolean);

  return parts.length > 0
    ? parts
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .join(', ')
    : null;
};

const getAvailabilityLabel = (worker) => {
  if (typeof worker?.availability === 'string' && worker.availability.trim()) {
    return worker.availability.trim();
  }

  if (typeof worker?.isAvailable === 'boolean') {
    return worker.isAvailable ? 'Available now' : 'Limited availability';
  }

  return null;
};

const getResponseTimeLabel = (worker) => {
  const responseTime = worker?.responseTime ?? worker?.avgResponseTime;

  if (responseTime == null || responseTime === '') {
    return null;
  }

  return `Responds ${responseTime}`;
};

const WorkerComparisonTable = ({ workers = [] }) => {
  const isMobile = useBreakpointDown('md');

  if (workers.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No workers selected for comparison
        </Typography>
      </Box>
    );
  }

  // Mobile: stacked comparison cards
  if (isMobile) {
    return (
      <Box>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ mb: 1.5, px: 0.5 }}
        >
          Worker Comparison ({workers.length})
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5, px: 0.5 }}
        >
          Compare rating, completed jobs, and average rate. Trust cues appear
          only when workers share those profile details.
        </Typography>
        <Stack spacing={1.5}>
          {workers.map((w, index) => {
            const skills = Array.isArray(w?.skills)
              ? w.skills.filter(Boolean).slice(0, 3)
              : w?.skill
                ? [w.skill]
                : [];
            const locationLabel = getLocationLabel(w);
            const availabilityLabel = getAvailabilityLabel(w);
            const responseTimeLabel = getResponseTimeLabel(w);
            const hasVerificationCue = Boolean(
              w?.isVerified || w?.verified || w?.identityVerified,
            );

            return (
              <Paper
                key={w?.id || w?._id || index}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2 }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  gutterBottom
                  sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {w?.name || 'Unknown Worker'}
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mb: 1 }}
                >
                  {skills.map((skill, skillIndex) => (
                    <Chip
                      key={`${skill}-${skillIndex}`}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={compactChipSx}
                    />
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mb: 1 }}
                >
                  {locationLabel ? (
                    <Chip
                      label={`Location: ${locationLabel}`}
                      size="small"
                      variant="filled"
                      sx={compactChipSx}
                    />
                  ) : null}
                  {availabilityLabel ? (
                    <Chip
                      label={availabilityLabel}
                      size="small"
                      variant="filled"
                      sx={compactChipSx}
                    />
                  ) : null}
                  {responseTimeLabel ? (
                    <Chip
                      label={responseTimeLabel}
                      size="small"
                      variant="filled"
                      sx={compactChipSx}
                    />
                  ) : null}
                  {hasVerificationCue ? (
                    <Chip
                      label="Verified profile"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={compactChipSx}
                    />
                  ) : null}
                </Stack>

                <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                    <Typography variant="caption" fontWeight={600}>
                      {w?.rating != null ? Number(w.rating).toFixed(1) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WorkIcon sx={{ fontSize: 14, color: 'success.main' }} />
                    <Typography variant="caption" fontWeight={600}>
                      {w?.completedJobs ?? 'N/A'} jobs
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoneyIcon
                      sx={{ fontSize: 14, color: 'info.main' }}
                    />
                    <Typography variant="caption" fontWeight={600}>
                      {w?.avgRate != null ? `₵${w.avgRate}` : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Box>
    );
  }

  // Desktop: full comparison table
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Worker Comparison
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Compare key profile details side-by-side. Scroll horizontally on smaller
        desktop widths if needed.
      </Typography>
      <TableContainer
        component={Paper}
        sx={{ p: 2, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <Table
          size="small"
          aria-label="Worker comparison table"
          sx={{ minWidth: 760 }}
        >
          <TableHead>
            <TableRow>
              <TableCell scope="col">Name</TableCell>
              <TableCell scope="col">Skills</TableCell>
              <TableCell scope="col">Rating</TableCell>
              <TableCell scope="col">Completed Jobs</TableCell>
              <TableCell scope="col">Avg Rate (GH₵)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((w, index) => (
              <TableRow key={w?.id || w?._id || index}>
                <TableCell sx={{ minWidth: 170 }}>
                  <Typography
                    variant="body2"
                    sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {w?.name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 220 }}>
                  <Typography
                    variant="body2"
                    sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {Array.isArray(w?.skills)
                      ? w.skills.join(', ')
                      : w?.skill || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {w?.rating != null ? Number(w.rating).toFixed(1) : 'N/A'}
                </TableCell>
                <TableCell>{w?.completedJobs ?? 'N/A'}</TableCell>
                <TableCell>
                  {w?.avgRate != null ? `₵${w.avgRate}` : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

WorkerComparisonTable.propTypes = {
  workers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      skills: PropTypes.arrayOf(PropTypes.string),
      skill: PropTypes.string,
      rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      completedJobs: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      avgRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      location: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      city: PropTypes.string,
      region: PropTypes.string,
      availability: PropTypes.string,
      isAvailable: PropTypes.bool,
      responseTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      avgResponseTime: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]),
      isVerified: PropTypes.bool,
      verified: PropTypes.bool,
      identityVerified: PropTypes.bool,
    }),
  ),
};

export default WorkerComparisonTable;
