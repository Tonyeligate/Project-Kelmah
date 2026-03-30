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
  padding: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2.5),
  },
  borderRadius: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.paper, 0.96),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? `0 10px 24px ${alpha('#000', 0.35)}`
      : `0 8px 20px ${alpha('#0f172a', 0.08)}`,
  transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
  '@media (hover: hover)': {
    '&:hover': {
      boxShadow:
        theme.palette.mode === 'dark'
          ? `0 14px 28px ${alpha(theme.palette.secondary.main, 0.2)}`
          : `0 10px 24px ${alpha(theme.palette.secondary.main, 0.16)}`,
      borderColor: alpha(theme.palette.secondary.main, 0.6),
    },
  },
}));

const ReviewCard = ({ review }) => {
  const { author, rating, content, date, jobTitle } = review;
  const authorName = author?.name?.trim() || 'Anonymous reviewer';
  const ratingValue = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  const reviewTitle = jobTitle?.trim() || 'Client project';
  const reviewContent =
    typeof content === 'string' && content.trim().length > 0
      ? content.trim()
      : 'No written feedback provided for this review.';
  const authorAvatar = resolveMediaAssetUrl(author?.avatar);
  const jobImage = resolveMediaAssetUrl(
    review?.jobImage || review?.job?.image || review?.projectImage,
  );

  return (
    <StyledReviewPaper>
      <Stack spacing={2} height="100%">
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={authorAvatar}
              alt={authorName}
              sx={{ width: 48, height: 48 }}
            >
              {authorName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {authorName}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', lineHeight: 1.45 }}
              >
                Review for &quot;{reviewTitle}&quot;
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
                alt={reviewTitle}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <WorkIcon sx={{ color: 'secondary.main' }} />
            )}
          </Box>
        </Stack>

        <Divider />

        <Stack direction="row" alignItems="center" spacing={1}>
          <Rating
            value={ratingValue}
            precision={0.5}
            readOnly
            aria-label={`Rating ${ratingValue.toFixed(1)} out of 5`}
          />
          <Typography variant="body2" fontWeight="bold">
            ({ratingValue.toFixed(1)})
          </Typography>
        </Stack>

        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            fontStyle: 'italic',
            color: 'text.primary',
            lineHeight: 1.65,
          }}
        >
          &quot;{reviewContent}&quot;
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          alignSelf="flex-end"
        >
          {date ? safeFormatRelative(date, { addSuffix: true }) : 'Recently'}
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
    projectImage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    job: PropTypes.shape({
      image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    }),
  }).isRequired,
};

export default ReviewCard;
