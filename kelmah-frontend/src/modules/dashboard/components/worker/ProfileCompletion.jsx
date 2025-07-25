import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const ProfileCompletion = ({ completion = 75 }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Profile Completion
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={completion} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">{`${Math.round(
              completion,
            )}%`}</Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Complete your profile to attract more clients.
        </Typography>
        <Button
          component={RouterLink}
          to="/worker/profile/edit"
          variant="contained"
          fullWidth
        >
          Complete Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletion;
