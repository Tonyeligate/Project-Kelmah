import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

const SkillsVerificationPanel = ({
  skills = [],
  onStartAssessment,
  onUploadCertificate,
}) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Skills Verification
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Verified Skills
        </Typography>
        <List dense>
          {skills.map((skill) => (
            <ListItem
              key={skill.id}
              secondaryAction={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onStartAssessment?.(skill)}
                >
                  Take Test
                </Button>
              }
            >
              <ListItemText primary={skill.name} secondary={skill.status} />
            </ListItem>
          ))}
          {skills.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No skills added yet.
            </Typography>
          )}
        </List>
        <Divider sx={{ my: 2 }} />
        <Button variant="contained" onClick={() => onUploadCertificate?.()}>
          Upload Certificate
        </Button>
      </Paper>
    </Box>
  );
};

export default SkillsVerificationPanel;
