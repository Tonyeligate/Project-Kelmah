/**
 * buildMenuItems — returns the menu section structure for the UserMenu
 * based on the user's role.
 */
import React from 'react';
import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Engineering as EngineeringIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  SupportAgent as SupportIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';

const SHARED_ITEMS = [
  { label: 'Profile', path: '/profile', icon: <PersonIcon color="primary" /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon color="primary" /> },
  { label: 'Help & Support', path: '/support', icon: <SupportIcon color="primary" /> },
];

export default function buildMenuItems(role) {
  if (role === 'hirer') {
    return [
      {
        title: 'Manage Hiring',
        items: [
          { label: 'Post a Job', path: '/hirer/jobs/post', icon: <WorkIcon color="primary" />, description: 'Create and publish a new job' },
          { label: 'My Jobs', path: '/hirer/jobs', icon: <DashboardIcon color="primary" />, description: 'Track in-progress postings' },
          { label: 'Find Talent', path: '/hirer/find-talent', icon: <EngineeringIcon color="primary" />, description: 'Search verified workers' },
        ],
      },
      { title: 'Account', items: SHARED_ITEMS },
    ];
  }

  if (role === 'worker') {
    return [
      {
        title: 'Workflows',
        items: [
          { label: 'My Dashboard', path: '/worker/dashboard', icon: <DashboardIcon color="primary" /> },
          { label: 'Applications', path: '/worker/applications', icon: <AssignmentTurnedInIcon color="primary" /> },
          { label: 'Saved Jobs', path: '/worker/saved-jobs', icon: <BookmarkBorderIcon color="primary" /> },
        ],
      },
      { title: 'Account', items: SHARED_ITEMS },
    ];
  }

  return [{ title: 'Account', items: SHARED_ITEMS }];
}
