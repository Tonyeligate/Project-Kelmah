import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  Divider,
  Stack,
} from '@mui/material';
import { LocationOn, AttachMoney, AccessTime, Star } from '@mui/icons-material';

const JobCard = ({ job, onViewDetails }) => {
  if (!job) return null;

  const {
    id,
    title,
    description,
    budget,
    location,
    postedDate,
    deadline,
    category,
    skills = [],
    hirerName,
    hirerRating,
  } = job;

  return (
    <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Chip
            size="small"
            label={category}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description?.substring(0, 150)}
          {description?.length > 150 ? '...' : ''}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">${budget}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">{location}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              {new Date(postedDate).toLocaleDateString()}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {skills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
            {hirerName ? hirerName[0].toUpperCase() : 'H'}
          </Avatar>
          <Typography variant="body2">{hirerName}</Typography>
          {hirerRating && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              <Star sx={{ color: 'gold', fontSize: 18, mr: 0.5 }} />
              <Typography variant="body2">{hirerRating}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          variant="contained"
          onClick={() => onViewDetails?.(id)}
          fullWidth
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default JobCard;
