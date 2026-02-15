import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  Button,
  Stack,
} from '@mui/material';

const MAX_SKILLS = 20;

const SkillsRequirementBuilder = ({ value = [], onChange }) => {
  const [input, setInput] = useState('');
  const add = () => {
    if (!input.trim()) return;
    const newSkills = input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const skills = [...new Set([...value, ...newSkills])].slice(0, MAX_SKILLS);
    onChange?.(skills);
    setInput('');
  };
  const remove = (s) => onChange?.(value.filter((v) => v !== s));
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Skills Requirement
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {value.map((s) => (
            <Chip
              key={s}
              label={s}
              onDelete={() => remove(s)}
              aria-label={`Remove skill: ${s}`}
            />
          ))}
        </Stack>
        {value.length >= MAX_SKILLS && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
            Maximum of {MAX_SKILLS} skills reached.
          </Typography>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Add skills (comma-separated)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Enter skills to add"
            disabled={value.length >= MAX_SKILLS}
          />
          <Button
            variant="contained"
            onClick={add}
            aria-label="Add skills"
            disabled={!input.trim() || value.length >= MAX_SKILLS}
            sx={{ minHeight: 44, minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Add
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SkillsRequirementBuilder;
