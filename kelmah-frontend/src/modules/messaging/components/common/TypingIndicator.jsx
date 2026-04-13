import PropTypes from 'prop-types';
import { Box, Avatar, Typography, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

// Animation keyframes
const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
`;

// Styled components
const TypingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  marginBottom: theme.spacing(1),
}));

const BubbleContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  marginLeft: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  borderBottomLeftRadius: 4,
  boxShadow: theme.shadows[1],
  display: 'flex',
  alignItems: 'center',
}));

const Dot = styled(Box)(({ theme, delay }) => ({
  width: 8,
  height: 8,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[500]
      : theme.palette.grey[700],
  borderRadius: '50%',
  margin: theme.spacing(0, 0.25),
  animation: `${bounce} 1.5s infinite ${delay}s`,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
}));

const screenReaderOnlySx = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * A component that displays an animated typing indicator
 */
const TypingIndicator = ({ user }) => {
  const userLabel = user?.name || 'Someone';
  const typingAnnouncement = `${userLabel} is typing`;

  return (
    <TypingContainer role="status" aria-live="polite" aria-atomic="true">
      <Avatar
        src={user?.avatar || ''}
        alt={user?.name || 'User'}
        sx={{ width: 32, height: 32 }}
        aria-hidden="true"
      />

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {user?.name && (
          <Typography
            variant="caption"
            sx={{ ml: 1, mb: 0.2, fontSize: '0.7rem', color: 'text.secondary' }}
            aria-hidden="true"
          >
            {user.name}
          </Typography>
        )}

        <BubbleContainer aria-hidden="true">
          <Dot delay={0} />
          <Dot delay={0.2} />
          <Dot delay={0.4} />
        </BubbleContainer>
      </Box>

      <Box component="span" sx={screenReaderOnlySx}>
        {typingAnnouncement}
      </Box>
    </TypingContainer>
  );
};

TypingIndicator.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string,
  }),
};

export default TypingIndicator;
