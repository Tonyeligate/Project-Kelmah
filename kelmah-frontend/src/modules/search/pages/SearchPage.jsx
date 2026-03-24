import React from 'react';
import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import WorkerDirectoryExperience from '../components/WorkerDirectoryExperience';

const SearchPage = () => (
  <Box>
    <Paper
      elevation={0}
      sx={{
        display: { xs: 'none', md: 'block' },
        mx: { xs: 1.5, sm: 2, md: 3 },
        mt: { xs: 1.5, md: 2.5 },
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Start with one filter, then refine
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Best recovery path for no results: clear filters, choose one trade, then add location.
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        <Chip size="small" label="1. Pick trade" />
        <Chip size="small" label="2. Add location" />
        <Chip size="small" label="3. Sort by rating" />
      </Stack>
    </Paper>
    <WorkerDirectoryExperience
      variant="public"
      basePath="/find-talents"
      seoTitle="Find Skilled Workers in Ghana | Kelmah"
      seoDescription="Search for skilled workers by trade, location, experience, and availability. Find carpenters, plumbers, electricians, and more across Ghana."
      showHero
    />
  </Box>
);

export default SearchPage;
