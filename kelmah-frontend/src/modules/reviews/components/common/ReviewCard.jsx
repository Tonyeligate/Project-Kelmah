import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Rating,
  Stack,
  Divider,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

const ReviewCard = ({ review }) => {
  const { author, rating, content, date, jobTitle } = review;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        height: '100%',
      }}
    >
      <Stack spacing={2} height="100%">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={author.avatar} alt={author.name} sx={{ width: 48, height: 48 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {author.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review for "{jobTitle}"
            </Typography>
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" alignItems="center" spacing={1}>
          <Rating value={rating} precision={0.5} readOnly />
          <Typography variant="body2" fontWeight="bold">
            ({rating.toFixed(1)})
          </Typography>
        </Stack>
        
        <Typography variant="body1" sx={{ flexGrow: 1, fontStyle: 'italic', color: 'text.secondary' }}>
          "{content}"
        </Typography>

        <Typography variant="caption" color="text.secondary" alignSelf="flex-end">
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </Typography>
      </Stack>
    </Paper>
  );
};

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.any.isRequired,
    author: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string,
    }).isRequired,
    rating: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    jobTitle: PropTypes.string.isRequired,
  }).isRequired,
};

export default ReviewCard; 