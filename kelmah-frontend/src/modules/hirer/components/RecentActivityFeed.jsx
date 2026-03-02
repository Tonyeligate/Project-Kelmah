import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Box,
  Button,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';
import { useNavigate } from 'react-router-dom';

/**
 * Derive a flat list of recent events from active jobs and application records.
 */
const deriveEvents = (jobs = [], applications = {}) => {
  const events = [];

  // Jobs → "Job posted" events
  if (Array.isArray(jobs)) {
    jobs.forEach((job) => {
      const title = job?.title || job?.name || 'Untitled Job';
      const createdAt = job?.createdAt || job?.postedAt || job?.updatedAt;
      events.push({
        id: `job-${job?._id || job?.id}`,
        icon: <WorkIcon />,
        iconColor: 'primary',
        primary: `Job posted: ${title}`,
        secondary: createdAt ? formatRelativeTime(createdAt) : '',
        _timestamp: createdAt ? new Date(createdAt).getTime() : 0,
      });
    });
  }

  // Applications → "New application" events
  if (applications && typeof applications === 'object') {
    Object.entries(applications).forEach(([jobId, record]) => {
      const apps = record?.data || record?.applications || [];
      if (!Array.isArray(apps)) return;
      apps.forEach((app, appIdx) => {
        const jobTitle = app?.jobTitle || record?.jobTitle || 'a job';
        const applicantName =
          app?.applicantName || app?.workerName || 'A worker';
        const createdAt = app?.createdAt || app?.appliedAt;
        events.push({
          id: `app-${app?._id || app?.id || jobId}-${appIdx}`,
          icon: <AssignmentIcon />,
          iconColor: 'warning',
          primary: `${applicantName} applied for "${jobTitle}"`,
          secondary: createdAt ? formatRelativeTime(createdAt) : '',
          _timestamp: createdAt ? new Date(createdAt).getTime() : 0,
        });
      });
    });
  }

  // Sort newest first by actual timestamp and take top 5
  events.sort((a, b) => b._timestamp - a._timestamp);

  return events.slice(0, 5);
};

/** Simple relative-time formatter */
function formatRelativeTime(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return '';
  }
}

/**
 * RecentActivityFeed — shows up to 5 recent events derived from jobs & applications.
 *
 * Props:
 *   jobs          (array)  — active/recent jobs
 *   applications  (object) — applicationRecords keyed by jobId
 */
const RecentActivityFeed = ({ jobs = [], applications = {} }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const events = deriveEvents(jobs, applications);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
        <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Recent Activity
        </Typography>
      </Box>

      {events.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <InfoIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No recent activity yet. Post a job to get started!
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {events.map((evt, idx) => (
            <React.Fragment key={evt.id}>
              <ListItem alignItems="flex-start" sx={{ px: { xs: 2, sm: 3 }, py: 1.25 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette[evt.iconColor]?.main || theme.palette.primary.main, 0.12),
                      color: theme.palette[evt.iconColor]?.main || theme.palette.primary.main,
                      width: 36,
                      height: 36,
                    }}
                  >
                    {evt.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={evt.primary}
                  secondary={evt.secondary}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                />
              </ListItem>
              {idx < events.length - 1 && <Divider component="li" variant="inset" />}
            </React.Fragment>
          ))}
        </List>
      )}

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          size="small"
          onClick={() => navigate('/hirer/jobs')}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          View All Activity
        </Button>
      </Box>
    </Paper>
  );
};

export default RecentActivityFeed;
