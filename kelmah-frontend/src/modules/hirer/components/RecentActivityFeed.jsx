import React, { useMemo } from 'react';
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
import { formatRelativeTime } from '../../../utils/formatters';

/**
 * Derive a flat list of recent events from active jobs and application records.
 */
const deriveEvents = (jobs = [], applications = {}) => {
  const events = [];

  const extractApplications = (record) => {
    if (!record || typeof record !== 'object') return [];

    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.applications)) return record.applications;

    if (record.buckets && typeof record.buckets === 'object') {
      return Object.values(record.buckets)
        .filter(Array.isArray)
        .flat();
    }

    return [];
  };

  const appendApplicationEvents = (apps = [], record = {}, jobIdFallback = null) => {
    if (!Array.isArray(apps)) return;

    apps.forEach((app, appIdx) => {
      const jobTitle =
        app?.jobTitle ||
        app?.job?.title ||
        record?.jobTitle ||
        'a job';
      const applicantName =
        app?.applicantName || app?.workerName || 'A worker';
      const createdAt = app?.createdAt || app?.appliedAt;
      events.push({
        id: `app-${app?._id || app?.id || jobIdFallback || 'activity'}-${appIdx}`,
        icon: <AssignmentIcon />,
        iconColor: 'warning',
        primary: `${applicantName} applied for "${jobTitle}"`,
        secondary: createdAt ? formatRelativeTime(createdAt) : '',
        _timestamp: createdAt ? new Date(createdAt).getTime() : 0,
      });
    });
  };

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
  if (Array.isArray(applications)) {
    appendApplicationEvents(applications);
  } else if (applications && typeof applications === 'object') {
    Object.entries(applications).forEach(([jobId, record]) => {
      const apps = extractApplications(record);
      appendApplicationEvents(apps, record, jobId);
    });
  }

  // Sort newest first by actual timestamp and take top 5
  events.sort((a, b) => b._timestamp - a._timestamp);

  return events.slice(0, 5);
};

const mapActivityTypeToDisplay = (type) => {
  switch (type) {
    case 'application_received':
    case 'application_submitted':
      return { icon: <AssignmentIcon />, iconColor: 'warning' };
    case 'job_completed':
      return { icon: <WorkIcon />, iconColor: 'success' };
    case 'login':
      return { icon: <InfoIcon />, iconColor: 'info' };
    case 'job_posted':
    case 'job_assigned':
    case 'job_status_changed':
    case 'job_update':
    default:
      return { icon: <WorkIcon />, iconColor: 'primary' };
  }
};

const mapBackendActivities = (activities = []) =>
  (Array.isArray(activities) ? activities : [])
    .map((activity, index) => {
      const display = mapActivityTypeToDisplay(activity?.type);
      const timestamp = activity?.timestamp ? new Date(activity.timestamp).getTime() : 0;
      return {
        id: activity?.id || `activity-${index}`,
        icon: display.icon,
        iconColor: display.iconColor,
        primary: activity?.summary || 'Recent activity',
        secondary: activity?.timestamp ? formatRelativeTime(activity.timestamp) : '',
        _timestamp: timestamp,
      };
    })
    .sort((a, b) => b._timestamp - a._timestamp)
    .slice(0, 5);

/**
 * RecentActivityFeed — shows up to 5 recent events derived from jobs & applications.
 *
 * Props:
 *   jobs          (array)  — active/recent jobs
 *   applications  (object|array) — application records keyed by jobId or a flat application list
 */
const RecentActivityFeed = ({ jobs = [], applications = {}, activities = null }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  // FIX L1: Memoize event derivation to avoid recalculating on every render
  const events = useMemo(
    () => Array.isArray(activities)
      ? mapBackendActivities(activities)
      : deriveEvents(jobs, applications),
    [activities, jobs, applications],
  );

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
          onClick={() => navigate('/notifications')}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          View All Activity
        </Button>
      </Box>
    </Paper>
  );
};

export default RecentActivityFeed;
