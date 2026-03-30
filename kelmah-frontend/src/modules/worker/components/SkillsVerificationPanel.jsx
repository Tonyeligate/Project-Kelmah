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
  Stack,
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Verified skills help hirers trust your profile faster. Start with your strongest trade skill.
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Verified Skills
        </Typography>
        <List dense>
          {skills.map((skill) => (
            <ListItem
              key={skill.id}
              sx={{ alignItems: 'flex-start' }}
              secondaryAction={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onStartAssessment?.(skill)}
                  aria-label={`Start skill test for ${skill.name}`}
                  sx={{ minHeight: 44, whiteSpace: 'nowrap' }}
                >
                  Start Skill Test
                </Button>
              }
            >
              <ListItemText
                primary={skill.name}
                secondary={skill.status}
                primaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
                secondaryTypographyProps={{ sx: { wordBreak: 'break-word' } }}
              />
            </ListItem>
          ))}
          {skills.length === 0 && (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                mt: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No skills added yet. Add a skill and take a short test so hirers can trust your ability.
              </Typography>
            </Box>
          )}
        </List>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={1} alignItems="flex-start">
          <Button variant="contained" onClick={() => onUploadCertificate?.()} sx={{ minHeight: 44 }}>
            Upload Certificate
          </Button>
          <Typography variant="caption" color="text.secondary">
            Upload clear certificate photos or PDFs so hirers can verify your training.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SkillsVerificationPanel;
