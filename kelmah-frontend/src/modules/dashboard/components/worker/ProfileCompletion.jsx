import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Stack,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as SkillIcon,
  Photo as PhotoIcon,
  Description as DocumentIcon,
  Star as VerificationIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileCompletion = ({
  completion = 75,
  profileData = {},
  onComplete = () => {},
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  // Profile completion items
  const profileItems = [
    { id: 'basic', label: 'Basic Info', completed: !!profileData.name, weight: 20 },
    { id: 'skills', label: 'Skills & Experience', completed: profileData.skills?.length > 0, weight: 25 },
    { id: 'portfolio', label: 'Portfolio', completed: profileData.portfolio?.length > 0, weight: 20 },
    { id: 'certifications', label: 'Certifications', completed: profileData.certifications?.length > 0, weight: 15 },
    { id: 'availability', label: 'Availability', completed: !!profileData.availability, weight: 10 },
    { id: 'contact', label: 'Contact Info', completed: !!profileData.phone, weight: 10 },
  ];

  const completedItems = profileItems.filter((item) => item.completed);
  const actualCompletion = profileItems.reduce((acc, item) => {
    return acc + (item.completed ? item.weight : 0);
  }, 0);

  const getCompletionColor = (percentage) => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 70) return '#FFD700';
    if (percentage >= 50) return '#FF9800';
    return '#F44336';
  };

  const completionColor = getCompletionColor(actualCompletion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          background:
            'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${completionColor} ${actualCompletion}%, rgba(255,255,255,0.1) ${actualCompletion}%)`,
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Typography
              variant="h6"
              sx={{
                color: '#FFD700',
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              Profile Strength
            </Typography>
            <Tooltip title={expanded ? 'Show less' : 'Show details'}>
              <IconButton
                onClick={() => setExpanded(!expanded)}
                size="small"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: '#FFD700',
                    background: alpha('#FFD700', 0.1),
                  },
                }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Progress Section */}
          <Box sx={{ mb: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: completionColor,
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {Math.round(actualCompletion)}%
        </Typography>
              <Chip
                label={`${completedItems.length}/${profileItems.length} Complete`}
                size="small"
                sx={{
                  backgroundColor: alpha(completionColor, 0.2),
                  color: completionColor,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Stack>

            <Box sx={{ position: 'relative', mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={actualCompletion}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${completionColor} 0%, ${alpha(completionColor, 0.8)} 100%)`,
                  },
                }}
              />
          </Box>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                lineHeight: 1.4,
              }}
            >
              {actualCompletion >= 90
                ? 'Excellent! Your profile is complete and attractive to clients.'
                : actualCompletion >= 70
                  ? 'Good progress! Complete a few more sections to boost visibility.'
                  : actualCompletion >= 50
                    ? 'Keep going! More details will help you get better job matches.'
                    : "Let's build your profile to attract quality job opportunities."}
            </Typography>
          </Box>

          {/* Detailed Breakdown */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <List dense sx={{ py: 0 }}>
                  {profileItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ListItem
                        sx={{
                          px: 0,
                          py: 0.5,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.03)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {item.completed ? (
                            <CheckIcon
                              sx={{ color: '#4CAF50', fontSize: 20 }}
                            />
                          ) : (
                            <UncheckedIcon
                              sx={{
                                color: 'rgba(255,255,255,0.3)',
                                fontSize: 20,
                              }}
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{
                                color: item.completed
                                  ? '#fff'
                                  : 'rgba(255,255,255,0.7)',
                                fontWeight: 500,
                                fontSize: '0.85rem',
                              }}
                            >
                              {item.title}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.75rem',
                              }}
                            >
                              {item.description}
                            </Typography>
                          }
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: item.completed
                              ? '#4CAF50'
                              : 'rgba(255,255,255,0.4)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        >
                          {item.weight}%
        </Typography>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
        <Button
          component={RouterLink}
          to="/worker/profile/edit"
            fullWidth
          variant="contained"
            onClick={onComplete}
            sx={{
              mt: 2,
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(255,215,0,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FFC000 0%, #FFB300 100%)',
                boxShadow: '0 6px 20px rgba(255,215,0,0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {actualCompletion >= 90 ? 'View Profile' : 'Complete Profile'}
        </Button>

          {/* Quick Tips */}
          {actualCompletion < 70 && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.2)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#FFD700',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                💡 Quick Tip:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.7rem',
                  lineHeight: 1.3,
                }}
              >
                Profiles with 80%+ completion get 3x more job invitations!
              </Typography>
            </Box>
          )}
      </CardContent>
    </Card>
    </motion.div>
  );
};

export default ProfileCompletion;
