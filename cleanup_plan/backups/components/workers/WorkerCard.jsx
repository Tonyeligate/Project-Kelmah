import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Box, 
  Chip, 
  Avatar, 
  Stack,
  Rating,
  Divider 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
  borderRadius: 8,
  overflow: 'hidden',
  border: '1px solid #e0e0e0',
}));

const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
  padding: 16,
});

const StyledCardActions = styled(CardActions)({
  padding: '8px 16px 16px',
  justifyContent: 'space-between',
});

const WorkerCard = ({ worker }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/workers/${worker.id}`);
  };

  const handleContact = () => {
    navigate(`/messages/create/${worker.id}`);
  };

  return (
    <StyledCard>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        padding: 2,
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}>
        <Avatar 
          src={worker.avatar} 
          alt={worker.name}
          sx={{ width: 64, height: 64, mr: 2, border: '2px solid #D4AF37' }}
        />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {worker.name}
            </Typography>
            {worker.verified && (
              <VerifiedIcon sx={{ ml: 1, color: '#D4AF37' }} fontSize="small" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ color: '#e0e0e0' }}>
            {worker.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: '#D4AF37' }} />
            <Typography variant="body2" color="text.secondary" sx={{ color: '#e0e0e0' }}>
              {worker.location}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <StyledCardContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" component="span" fontWeight="bold" mr={1}>
              Category:
            </Typography>
            <Chip 
              label={worker.category} 
              size="small" 
              sx={{ 
                backgroundColor: '#f5f5f5',
                fontWeight: 'medium'
              }} 
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" component="span" fontWeight="bold" mr={1}>
              Rating:
            </Typography>
            <Rating 
              value={worker.rating} 
              readOnly 
              precision={0.5} 
              size="small"
              emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
              sx={{ color: '#D4AF37' }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({worker.reviewCount})
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" component="span" fontWeight="bold" mr={1}>
              Hourly Rate:
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="error">
              ${worker.hourlyRate}/hr
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WorkIcon sx={{ fontSize: 16, mr: 0.5, color: '#555' }} />
            <Typography variant="body2" color="text.secondary">
              {worker.completedJobs} jobs completed • {worker.experience} years experience
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Typography variant="body2" component="div" fontWeight="bold" mb={0.5}>
          Skills:
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {worker.skills.map((skill, index) => (
            <Chip 
              key={index} 
              label={skill} 
              size="small" 
              sx={{ 
                mb: 0.5, 
                backgroundColor: '#1a1a1a', 
                color: 'white',
                fontSize: '0.7rem'
              }} 
            />
          ))}
        </Stack>
      </StyledCardContent>
      
      <StyledCardActions>
        <Button 
          variant="outlined" 
          size="small"
          onClick={handleViewProfile}
          sx={{ 
            borderColor: '#D4AF37', 
            color: '#D4AF37',
            '&:hover': {
              borderColor: '#B8860B',
              backgroundColor: 'rgba(212, 175, 55, 0.04)'
            }
          }}
        >
          View Profile
        </Button>
        <Button 
          variant="contained" 
          size="small"
          onClick={handleContact}
          sx={{ 
            backgroundColor: '#D4AF37', 
            color: '#1a1a1a',
            '&:hover': {
              backgroundColor: '#B8860B'
            }
          }}
        >
          Contact
        </Button>
      </StyledCardActions>
    </StyledCard>
  );
};

export default WorkerCard; 