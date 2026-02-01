import {
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  WorkspacePremium as PremiumIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

export const getDifficultyColorKey = (difficulty) => {
  switch (difficulty) {
    case 'beginner':
      return 'success';
    case 'intermediate':
      return 'warning';
    case 'advanced':
      return 'error';
    case 'expert':
      return 'primary';
    default:
      return 'info';
  }
};

export const getDifficultyIcon = (difficulty) => {
  switch (difficulty) {
    case 'beginner':
      return <StarIcon />;
    case 'intermediate':
      return <TrendingUpIcon />;
    case 'advanced':
      return <EmojiEventsIcon />;
    case 'expert':
      return <PremiumIcon />;
    default:
      return <AssignmentIcon />;
  }
};

export const formatDifficultyLabel = (difficulty = '') => {
  if (!difficulty || typeof difficulty !== 'string') {
    return 'General';
  }

  return `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
};
