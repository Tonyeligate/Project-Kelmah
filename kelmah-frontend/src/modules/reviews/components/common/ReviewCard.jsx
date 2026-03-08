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
import { Work as WorkIcon } from '@mui/icons-material';
import { safeFormatRelative } from '@/modules/common/utils/formatters';
import { resolveMediaAssetUrl } from '@/modules/common/utils/mediaAssets';
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
  const authorAvatar = resolveMediaAssetUrl(author?.avatar);
  const jobImage = resolveMediaAssetUrl(
    review?.jobImage || review?.job?.image || review?.projectImage,
  );

  return (
    <StyledReviewPaper>
      <Stack spacing={2} height="100%">
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={authorAvatar}
              alt={author.name}
              sx={{ width: 48, height: 48 }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {author.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review for &quot;{jobTitle}&quot;
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              bgcolor: alpha('#000', 0.18),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {jobImage ? (
              <Box
                component="img"
                src={jobImage}
                alt={jobTitle}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <WorkIcon sx={{ color: 'secondary.main' }} />
            )}
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
          &quot;{content}&quot;
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          alignSelf="flex-end"
        >
          {safeFormatRelative(date, { addSuffix: true })}
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
      avatar: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    }).isRequired,
    rating: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    jobTitle: PropTypes.string.isRequired,
    jobImage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
};

export default ReviewCard;
