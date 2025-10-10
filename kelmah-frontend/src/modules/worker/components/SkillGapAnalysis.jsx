import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';

const SkillGapAnalysis = ({ skills = [] }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Skill Gap Analysis
      </Typography>
      <Paper sx={{ p: 2 }}>
        <List dense>
          {skills.map((s) => (
            <ListItem
              key={s.name}
              sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <ListItemText
                primary={s.name}
                secondary={`Required: ${s.required}/100 • Current: ${s.current}/100`}
              />
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  100,
                  Math.max(0, (s.current / s.required) * 100),
                )}
                sx={{ width: '100%', mb: 1 }}
              />
            </ListItem>
          ))}
          {skills.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No skills to analyze yet.
            </Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default SkillGapAnalysis;
