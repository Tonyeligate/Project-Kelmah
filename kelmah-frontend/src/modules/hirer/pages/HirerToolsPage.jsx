import React, { useState } from 'react';
import { Container, Grid } from '@mui/material';
import JobCreationWizard from '../components/JobCreationWizard';
import SkillsRequirementBuilder from '../components/SkillsRequirementBuilder';
import BudgetEstimator from '../components/BudgetEstimator';
import WorkerComparisonTable from '../components/WorkerComparisonTable';
import BackgroundChecker from '../components/BackgroundChecker';

const HirerToolsPage = () => {
  const [skills, setSkills] = useState([]);
  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <JobCreationWizard
            onSubmit={(data) => console.log('Submit job', data)}
          />
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
