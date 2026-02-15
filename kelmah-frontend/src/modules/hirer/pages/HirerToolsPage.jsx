import React, { useState } from 'react';
import { Container, Grid, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SkillsRequirementBuilder from '../components/SkillsRequirementBuilder';
import BudgetEstimator from '../components/BudgetEstimator';
import WorkerComparisonTable from '../components/WorkerComparisonTable';
import BackgroundChecker from '../components/BackgroundChecker';

const HirerToolsPage = () => {
  const [skills, setSkills] = useState([]);
  const navigate = useNavigate();

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Post a New Job
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a detailed job posting to find skilled workers.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/hirer/jobs/post')}
              size="large"
            >
              Create Job Posting
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <SkillsRequirementBuilder value={skills} onChange={setSkills} />
          <BudgetEstimator />
        </Grid>
        <Grid item xs={12}>
          <WorkerComparisonTable workers={[]} />
        </Grid>
        <Grid item xs={12}>
          <BackgroundChecker onCheck={async () => ({ ok: true })} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default HirerToolsPage;
