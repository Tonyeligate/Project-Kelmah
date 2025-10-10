import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Checkbox,
} from '@mui/material';

const GoalTracker = ({ goals = [], onToggle }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Goal Tracker
      </Typography>
      <Paper sx={{ p: 2 }}>
        <List dense>
          {goals.map((g) => (
            <ListItem key={g.id} disableGutters>
              <Checkbox
                checked={!!g.completed}
                onChange={() => onToggle?.(g.id)}
              />
              <ListItemText
                primary={g.title}
                secondary={g.deadline ? `Due: ${g.deadline}` : null}
              />
            </ListItem>
          ))}
          {goals.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No goals yet. Create your first goal.
            </Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default GoalTracker;
