import React from 'react';
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
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : theme.palette.grey[700],
  borderRadius: '50%',
  margin: theme.spacing(0, 0.25),
  animation: `${bounce} 1.5s infinite ${delay}s`,
}));

/**
 * A component that displays an animated typing indicator
 */
const TypingIndicator = ({ user }) => {
  return (
    <TypingContainer>
      <Avatar 
        src={user?.avatar || ''} 
        alt={user?.name || 'User'} 
        sx={{ width: 32, height: 32 }}
      />
      
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {user?.name && (
          <Typography 
            variant="caption" 
            sx={{ ml: 1, mb: 0.2, fontSize: '0.7rem', color: 'text.secondary' }}
          >
            {user.name}
          </Typography>
        )}
        
        <BubbleContainer>
          <Dot delay={0} />
          <Dot delay={0.2} />
          <Dot delay={0.4} />
        </BubbleContainer>
      </Box>
    </TypingContainer>
  );
};

TypingIndicator.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string,
  })
};

export default TypingIndicator; 