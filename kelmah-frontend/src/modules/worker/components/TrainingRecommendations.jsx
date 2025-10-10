import React from 'react';
import {
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
        <List>
          {courses.map((c) => (
            <ListItem
              key={c.id}
              secondaryAction={
                <Button variant="outlined" onClick={() => onEnroll?.(c)}>
                  Enroll
                </Button>
              }
            >
              <ListItemText
                primary={c.title}
                secondary={`${c.provider} • ${c.duration || 'Self-paced'}`}
              />
            </ListItem>
          ))}
          {courses.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No recommendations yet.
            </Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default TrainingRecommendations;
