import React, { useState } from 'react';
import { Container, Grid, Button, Typography, Paper, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SkillsRequirementBuilder from '../components/SkillsRequirementBuilder';
import BudgetEstimator from '../components/BudgetEstimator';

const HirerToolsPage = () => {
  const [skills, setSkills] = useState([]);
  const navigate = useNavigate();

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Helmet>
        <title>Hirer Tools | Kelmah</title>
      </Helmet>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Hirer Tools
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Post a New Job
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a detailed job posting to find skilled workers.
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/hirer/jobs/post')}
                size="large"
                sx={{ minHeight: 48 }}
              >
                Create Job Posting
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Find Skilled Workers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Search and connect with verified professionals.
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/hirer/find-talent')}
                size="large"
                sx={{ minHeight: 48 }}
              >
                Search Workers
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <SkillsRequirementBuilder value={skills} onChange={setSkills} />
        </Grid>
        <Grid item xs={12} md={6}>
          <BudgetEstimator />
        </Grid>
      </Grid>
    </Container>
  );
};

export default HirerToolsPage;
