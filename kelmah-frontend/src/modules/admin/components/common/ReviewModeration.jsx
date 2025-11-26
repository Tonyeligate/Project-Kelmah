import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  Queue as QueueIcon,
  Assessment as AnalyticsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../auth/hooks/useAuth';
import ReviewModerationQueue from '../reviews/ReviewModerationQueue';
import ReviewAnalyticsDashboard from '../reviews/ReviewAnalyticsDashboard';

/**
 * Enhanced Review Moderation Component
 * Combines moderation queue and analytics dashboard with tabbed interface
 */
const ReviewModeration = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Tab configuration with new modular components
  const tabs = [
    {
      label: 'Moderation Queue',
      icon: QueueIcon,
      component: ReviewModerationQueue,
      description:
        'Review and moderate pending submissions, handle flagged content, and manage bulk operations',
    },
    {
      label: 'Analytics Dashboard',
      icon: AnalyticsIcon,
      component: ReviewAnalyticsDashboard,
      description:
        'Comprehensive review insights, trends, and performance metrics',
    },
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Access control
  if (!user || user.role !== 'admin') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            background:
              'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.05) 100%)',
            border: '1px solid rgba(244,67,54,0.2)',
          }}
        >
          <SecurityIcon sx={{ fontSize: 64, color: '#F44336', mb: 2 }} />
          <Typography
            variant="h5"
            sx={{ color: '#F44336', fontWeight: 700, mb: 1 }}
          >
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Administrator privileges required to access review moderation tools.
          </Typography>
        </Card>
      </Box>
    );
  }

  const ActiveComponent = tabs[activeTab]?.component;

  return (
    <Box>
      {/* Header */}
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{ color: '#FFD700', fontWeight: 700, mb: 1 }}
          >
            Review Moderation Center
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Comprehensive tools for managing and analyzing platform reviews
          </Typography>
        </Box>

        {/* Tab Navigation */}
        <Card
          sx={{
            background:
              'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(40,40,40,0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                minHeight: 72,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              },
              '& .Mui-selected': { color: '#FFD700 !important' },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FFD700',
                height: 3,
              },
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
            }}
            variant="fullWidth"
          >
            {tabs.map((tab, index) => {
              const IconComponent = tab.icon;
              return (
                <Tab
                  key={index}
                  label={
                    <Stack alignItems="center" spacing={1}>
                      <IconComponent sx={{ fontSize: 24 }} />
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
                          {tab.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255,255,255,0.5)',
                            lineHeight: 1.2,
                          }}
                        >
                          {tab.description}
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>
        </Card>
      </Stack>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>{ActiveComponent && <ActiveComponent />}</Box>
    </Box>
  );
};

export default ReviewModeration;

