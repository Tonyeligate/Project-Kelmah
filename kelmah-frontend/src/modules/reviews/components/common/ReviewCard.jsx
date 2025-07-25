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
import { styled, alpha } from '@mui/material/styles';

// Styled Review container with gold accents
const StyledReviewPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.7),
  backdropFilter: 'blur(10px)',
  border: `2px solid ${theme.palette.secondary.main}`,
  boxShadow: `inset 0 0 8px rgba(255, 215, 0, 0.5)`,
  transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
  '&:hover': {
    boxShadow: `0 0 12px rgba(255, 215, 0, 0.3), inset 0 0 8px rgba(255, 215, 0, 0.5)`,
    borderColor: theme.palette.secondary.light,
  },
}));

const ReviewCard = ({ review }) => {
  const { author, rating, content, date, jobTitle } = review;

  return (
    <StyledReviewPaper>
      <Stack spacing={2} height="100%">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={author.avatar}
            alt={author.name}
            sx={{ width: 48, height: 48 }}
          />
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

        <Typography
          variant="body1"
          sx={{ flexGrow: 1, fontStyle: 'italic', color: 'text.secondary' }}
        >
          "{content}"
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          alignSelf="flex-end"
        >
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </Typography>
      </Stack>
    </StyledReviewPaper>
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
