/**
 * buildMenuItems — returns the menu section structure for the UserMenu
 * based on the user's role.
 */
import React from 'react';
import {
  Person as PersonIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';

const SHARED_ITEMS = [
  { label: 'Profile', path: '/profile', icon: <PersonIcon color="primary" /> },
  {
    label: 'Help & Support',
    path: '/support',
    icon: <SupportIcon color="primary" />,
  },
];

export default function buildMenuItems(role) {
  return [{ title: 'Account', items: SHARED_ITEMS }];
}
