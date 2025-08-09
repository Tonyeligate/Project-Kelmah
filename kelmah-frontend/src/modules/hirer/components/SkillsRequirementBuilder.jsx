import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, TextField, Button, Stack } from '@mui/material';

const SkillsRequirementBuilder = ({ value = [], onChange }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const skills = [...new Set([...value, ...input.split(',').map((s) => s.trim()).filter(Boolean)])];
    onChange?.(skills);
    setInput('');
  };
  const remove = (s) => onChange?.(value.filter((v) => v !== s));
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Skills Requirement</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          {value.map((s) => (
            <Chip key={s} label={s} onDelete={() => remove(s)} />
          ))}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <TextField fullWidth label="Add skills (comma-separated)" value={input} onChange={(e) => setInput(e.target.value)} />
          <Button variant="contained" onClick={add}>Add</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SkillsRequirementBuilder;




