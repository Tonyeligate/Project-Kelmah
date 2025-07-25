import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  Paper,
  Chip,
  Stack,
  Badge,
  keyframes,
} from '@mui/material';
import DashboardCard from '../common/DashboardCard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import HardwareIcon from '@mui/icons-material/Hardware';
import CarpenterIcon from '@mui/icons-material/Carpenter';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Keyframes for pulsing animation
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); background-color: rgba(255, 0, 0, 0.7); }
  100% { transform: scale(1); }
`;

// Enhanced mock data with job types and trade icons
const allJobs = [
  {
    title: 'Emergency Plumbing Repair',
    distance: '2 miles away',
    match: 92,
    type: 'urgent',
    tradeIcon: <PlumbingIcon />,
  },
  {
    title: 'Fence Installation',
    distance: '3.5 miles away',
    match: 85,
    type: 'regular',
    tradeIcon: <CarpenterIcon />,
  },
  {
    title: 'Kitchen Cabinet Assembly',
    distance: '4 miles away',
    match: 78,
    type: 'regular',
    tradeIcon: <HardwareIcon />,
  },
  {
    title: 'Rooftop AC Unit Service',
    distance: '5 miles away',
    match: 95,
    type: 'urgent',
    tradeIcon: <AcUnitIcon />,
  },
];

const NearbyJobs = () => {
  const [filter, setFilter] = useState('all');

  const filteredJobs = allJobs.filter((job) => {
    if (filter === 'all') return true;
    if (filter === 'nearby') return parseFloat(job.distance) <= 3;
    return job.type === filter;
  });

  const handleQuickBid = (jobTitle) => {
    // Placeholder for bid logic
    alert(`Placing a quick bid for: ${jobTitle}`);
  };

  return (
    <DashboardCard
      title={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 1, color: '#FF9800' }} />
          <Typography variant="h6">Jobs Near You</Typography>
        </Box>
      }
      action={
        <Button variant="outlined" size="small" startIcon={<MapIcon />}>
          View on Map
        </Button>
      }
    >
      {/* Filter Chips */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <FilterListIcon
          sx={{ color: 'text.secondary', mr: 1 }}
          fontSize="small"
        />
        <Chip
          label="All Jobs"
          size="small"
          onClick={() => setFilter('all')}
          color={filter === 'all' ? 'primary' : 'default'}
          variant={filter === 'all' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Within 3 Miles"
          size="small"
          onClick={() => setFilter('nearby')}
          color={filter === 'nearby' ? 'primary' : 'default'}
          variant={filter === 'nearby' ? 'filled' : 'outlined'}
        />
        <Chip
          label="Urgent"
          size="small"
          onClick={() => setFilter('urgent')}
          color={filter === 'urgent' ? 'error' : 'default'}
          variant={filter === 'urgent' ? 'filled' : 'outlined'}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          p: 2,
          borderRadius: '8px',
          backgroundImage:
            'url(https://images.pexels.com/photos/2242633/pexels-photo-2242633.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {filteredJobs.length === 0 ? (
            <Typography color="white" textAlign="center" py={3}>
              No jobs matching the selected filter.
            </Typography>
          ) : (
            <List dense sx={{ padding: 0 }}>
              {filteredJobs.map((job, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      animation:
                        job.type === 'urgent'
                          ? `${pulseAnimation} 2s infinite`
                          : 'none',
                      bgcolor:
                        job.type === 'urgent'
                          ? 'rgba(255, 0, 0, 0.15)'
                          : 'transparent',
                      borderRadius: '4px',
                      px: 1,
                    }}
                  >
                    {/* Top section with action button */}
                    <Box
                      sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Badge
                        badgeContent={job.type === 'urgent' ? 'URGENT' : null}
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontWeight: 'bold',
                            fontSize: '0.65rem',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              mr: 1.5,
                              color:
                                job.type === 'urgent' ? '#ff6b6b' : '#FFD700',
                              display: 'flex',
                            }}
                          >
                            {job.tradeIcon}
                          </Box>
                          <Typography fontWeight="bold" color="common.white">
                            {job.title}
                          </Typography>
                        </Box>
                      </Badge>

                      <Button
                        variant="contained"
                        size="small"
                        color="warning"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleQuickBid(job.title)}
                        sx={{
                          bgcolor: '#FFD700',
                          color: 'black',
                          '&:hover': { bgcolor: '#e6c300' },
                          fontWeight: 'bold',
                        }}
                      >
                        Quick Bid
                      </Button>
                    </Box>

                    {/* Bottom section with distance and match */}
                    <Box
                      sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="rgba(255, 255, 255, 0.7)"
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <LocationOnIcon
                          sx={{
                            fontSize: 16,
                            mr: 0.5,
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        />
                        {job.distance}
                      </Typography>

                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`${job.match}% Match`}
                        color="success"
                        size="small"
                        variant="filled"
                        sx={{ height: 24, fontWeight: 'bold' }}
                      />
                    </Box>
                  </ListItem>
                  {index < filteredJobs.length - 1 && (
                    <Divider
                      component="li"
                      sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </DashboardCard>
  );
};

export default NearbyJobs;
