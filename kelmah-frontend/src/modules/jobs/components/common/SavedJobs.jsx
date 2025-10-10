import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
} from '@mui/material';
import workerService from '../../../worker/services/workerService';

function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await workerService.getSavedJobs();
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setJobs(list);
      } catch (e) {
        setError('Unable to load saved jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Saved Jobs
        </Typography>
        {loading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && jobs.length === 0 && (
          <Typography>No saved jobs yet.</Typography>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {jobs.map((job) => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">{job.title}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {job.company?.name || job.companyName}
                  </Typography>
                  {Array.isArray(job.skills) &&
                    job.skills
                      .slice(0, 4)
                      .map((s) => (
                        <Chip
                          key={s}
                          label={s}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                  <Button href={`/jobs/${job.id}`} sx={{ mt: 1 }}>
                    View
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
}

export default SavedJobs;
