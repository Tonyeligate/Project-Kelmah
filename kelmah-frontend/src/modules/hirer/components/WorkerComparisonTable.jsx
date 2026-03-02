import React from 'react';
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
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const WorkerComparisonTable = ({ workers = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, px: 0.5 }}>
          Worker Comparison ({workers.length})
        </Typography>
        <Stack spacing={1.5}>
          {workers.map((w, index) => (
            <Paper
              key={w?.id || w?._id || index}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {w?.name || 'Unknown Worker'}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                {Array.isArray(w?.skills)
                  ? w.skills.slice(0, 3).map((sk) => (
                      <Chip key={sk} label={sk} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    ))
                  : w?.skill
                    ? <Chip label={w.skill} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    : null}
              </Stack>

              <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={1.5}>
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
                  <AttachMoneyIcon sx={{ fontSize: 14, color: 'info.main' }} />
                  <Typography variant="caption" fontWeight={600}>
                    {w?.avgRate != null ? `₵${w.avgRate}` : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
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
      <TableContainer component={Paper} sx={{ p: 2 }}>
        <Table size="small" aria-label="Worker comparison table">
          <TableHead>
            <TableRow>
              <TableCell scope="col">Name</TableCell>
              <TableCell scope="col">Skills</TableCell>
              <TableCell scope="col">Rating</TableCell>
              <TableCell scope="col">Completed Jobs</TableCell>
              <TableCell scope="col">Avg Rate (GHS)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((w, index) => (
              <TableRow key={w?.id || w?._id || index}>
                <TableCell>{w?.name || 'N/A'}</TableCell>
                <TableCell>
                  {Array.isArray(w?.skills) ? w.skills.join(', ') : (w?.skill || 'N/A')}
                </TableCell>
                <TableCell>{w?.rating != null ? Number(w.rating).toFixed(1) : 'N/A'}</TableCell>
                <TableCell>{w?.completedJobs ?? 'N/A'}</TableCell>
                <TableCell>{w?.avgRate != null ? `₵${w.avgRate}` : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkerComparisonTable;
