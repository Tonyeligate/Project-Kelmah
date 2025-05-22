import React from 'react';
import { Link } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard,
  Analytics,
  People,
  Settings,
  Security,
  Storage,
  Backup
} from '@mui/icons-material';

function AdminNavigation() {
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Analytics', icon: <Analytics />, path: '/admin/analytics' },
    { text: 'Users', icon: <People />, path: '/admin/users' },
    { text: 'Jobs', icon: <Work />, path: '/admin/jobs' },
    { text: 'Security', icon: <Security />, path: '/admin/security' },
    { text: 'Monitoring', icon: <Storage />, path: '/admin/monitoring' },
    { text: 'Backups', icon: <Backup />, path: '/admin/backups' },
    { text: 'Settings', icon: <Settings />, path: '/admin/settings' }
  ];

  return (
    <List>
      {menuItems.map((item) => (
        <ListItem
          button
          component={Link}
          to={item.path}
          key={item.text}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  );
}

export default AdminNavigation; 