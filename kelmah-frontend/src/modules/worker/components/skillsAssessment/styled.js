import { styled, keyframes } from '@mui/material/styles';
import { alpha, Card, Button, Box } from '@mui/material';
import { getDifficultyColorKey } from '@/modules/worker/utils/skillsAssessmentDifficulty';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[20],
  },
}));

export const TestCard = styled(GlassCard)(({ theme, difficulty }) => {
  const colorKey = getDifficultyColorKey(difficulty);
  const paletteColor = theme.palette[colorKey] || theme.palette.info;

  return {
    position: 'relative',
    cursor: 'pointer',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      background: paletteColor.main,
    },
  };
});

export const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: 25,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[12],
  },
}));

export const ProgressRing = styled(Box)(({ theme, progress }) => ({
  position: 'relative',
  display: 'inline-flex',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    background: `conic-gradient(${theme.palette.primary.main} ${progress * 3.6}deg, ${alpha(theme.palette.primary.main, 0.1)} 0deg)`,
    mask: 'radial-gradient(circle at center, transparent 65%, black 65%)',
  },
}));

export const TimerDisplay = styled(Box)(({ theme, urgent }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  padding: theme.spacing(1, 2),
  borderRadius: 20,
  background: urgent
    ? alpha(theme.palette.error.main, 0.1)
    : alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${urgent ? theme.palette.error.main : theme.palette.primary.main}`,
  ...(urgent && {
    animation: `${pulse} 1s infinite`,
  }),
}));
