import React from 'react';
import {
  Alert,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';

const TrainingRecommendations = ({ courses = [], onEnroll }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Training Recommendations
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Courses are prioritized to close your top skill gaps first and improve job match quality.
        </Alert>
        <List>
          {courses.map((c) => (
            <ListItem
              key={c.id}
              alignItems="flex-start"
              sx={{ flexWrap: 'wrap', gap: 1 }}
              secondaryAction={
                <Button variant="outlined" onClick={() => onEnroll?.(c)} aria-label={`Enroll in ${c.title}`} sx={{ minHeight: 44 }}>
                  Enroll
                </Button>
              }
            >
              <ListItemText
                primary={c.title}
                secondary={`${c.provider} • ${c.duration || 'Self-paced'}`}
                secondaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
              />
            </ListItem>
          ))}
          {courses.length === 0 && (
            <Box sx={{ py: 1 }}>
              <Typography variant="body2" color="text.secondary">
                No training recommendations yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete your profile skills and recent project history to unlock tailored course suggestions.
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default TrainingRecommendations;
