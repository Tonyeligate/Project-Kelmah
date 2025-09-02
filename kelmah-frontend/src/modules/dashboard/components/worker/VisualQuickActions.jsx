import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Work as JobIcon,
  AccountBalanceWallet as WalletIcon,
  Person as ProfileIcon,
  Message as MessageIcon,
  Star as ReviewIcon,
  Assignment as ApplicationIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

// Visual quick actions with large icons and simple text
const quickActions = [
  {
    id: 'find-jobs',
    title: 'Find Jobs',
    subtitle: 'Search for work',
    icon: <SearchIcon sx={{ fontSize: 40 }} />,
    color: '#2196F3', // Blue
    path: '/worker/find-work',
    emoji: '🔍',
  },
  {
    id: 'my-jobs',
    title: 'My Jobs',
    subtitle: 'Current work',
    icon: <JobIcon sx={{ fontSize: 40 }} />,
    color: '#4CAF50', // Green
    path: '/worker/jobs',
    emoji: '💼',
  },
  {
    id: 'applications',
    title: 'Applications',
    subtitle: 'Job requests',
    icon: <ApplicationIcon sx={{ fontSize: 40 }} />,
    color: '#FF9800', // Orange
    path: '/worker/applications',
    emoji: '📝',
  },
  {
    id: 'earnings',
    title: 'My Money',
    subtitle: 'View earnings',
    icon: <WalletIcon sx={{ fontSize: 40 }} />,
    color: '#FFD700', // Gold
    path: '/worker/earnings',
    emoji: '💰',
  },
  {
    id: 'profile',
    title: 'My Profile',
    subtitle: 'Update info',
    icon: <ProfileIcon sx={{ fontSize: 40 }} />,
    color: '#9C27B0', // Purple
    path: '/worker/profile/edit',
    emoji: '👤',
  },
  {
    id: 'messages',
    title: 'Messages',
    subtitle: 'Chat with clients',
    icon: <MessageIcon sx={{ fontSize: 40 }} />,
    color: '#00BCD4', // Cyan
    path: '/messaging',
    emoji: '💬',
  },
  {
    id: 'schedule',
    title: 'Schedule',
    subtitle: 'Work calendar',
    icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
    color: '#FF5722', // Deep Orange
    path: '/worker/schedule',
    emoji: '📅',
  },
  {
    id: 'reviews',
    title: 'Reviews',
    subtitle: 'Client feedback',
    icon: <ReviewIcon sx={{ fontSize: 40 }} />,
    color: '#FFC107', // Amber
    path: '/worker/reviews',
    emoji: '⭐',
  },
];

const VisualQuickActions = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="h5"
        fontWeight={600}
        gutterBottom
        sx={{ mb: 3 }}
      >
        ⚡ Quick Actions
      </Typography>
      
      <Grid container spacing={2}>
        {quickActions.map((action) => (
          <Grid item xs={6} sm={4} md={3} key={action.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}08 100%)`,
                border: `2px solid ${action.color}20`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                  borderColor: action.color,
                  background: `linear-gradient(135deg, ${action.color}25 0%, ${action.color}10 100%)`,
                },
              }}
              onClick={() => navigate(action.path)}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: action.color,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2.5rem',
                  }}
                >
                  {action.emoji}
                </Avatar>
                
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: 0.5,
                  }}
                >
                  {action.title}
                </Typography>
                
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  {action.subtitle}
                </Typography>
                
                <Box
                  sx={{
                    mt: 2,
                    color: action.color,
                    opacity: 0.8,
                  }}
                >
                  {action.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VisualQuickActions;
