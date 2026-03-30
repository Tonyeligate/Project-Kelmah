import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
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
        setError('Unable to load saved jobs right now');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          Saved Jobs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Keep promising jobs here so you can return when you are ready to
          apply.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tip: Save jobs you trust first, then compare location, budget, and
          required skills before applying.
        </Typography>
        {loading && (
          <Typography color="text.secondary">
            Loading your saved jobs...
          </Typography>
        )}
        {error && (
          <Typography color="error">
            {error}. Please check your connection, then try again.
          </Typography>
        )}
        {!loading && !error && jobs.length === 0 && (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              bgcolor: 'background.default',
            }}
          >
            <BookmarkBorderIcon
              sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No saved jobs yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tap the save icon on jobs you want to revisit later. Saved jobs
              help you compare options before choosing.
            </Typography>
            <Button
              component={Link}
              to="/jobs"
              variant="contained"
              sx={{ minHeight: 44 }}
            >
              Browse Jobs
            </Button>
          </Box>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {jobs.map((job) => {
            const jobId = job?.id || job?._id;
            if (!jobId) return null;
            return (
              <Grid item xs={12} md={6} key={jobId}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 3, height: '100%' }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{ mb: 1 }}
                    >
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 2,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          flexShrink: 0,
                        }}
                      >
                        <WorkOutlineIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, wordBreak: 'break-word' }}
                        >
                          {job.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1, wordBreak: 'break-word' }}
                        >
                          {job.employer?.name ||
                            (job.hirer?.firstName
                              ? `${job.hirer?.firstName} ${job.hirer?.lastName || ''}`.trim()
                              : job.companyName || 'Employer')}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5, wordBreak: 'break-word' }}
                    >
                      {job.location?.city ||
                        job.location ||
                        'Location flexible'}
                    </Typography>
                    {Array.isArray(job.skills) &&
                      job.skills.slice(0, 4).map((s) => (
                        <Chip
                          key={s}
                          label={s}
                          size="small"
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            maxWidth: '100%',
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            },
                          }}
                        />
                      ))}
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}
                    >
                      <Button
                        component={Link}
                        to={`/jobs/${jobId}`}
                        variant="contained"
                        aria-label={`View saved job ${job.title}`}
                        sx={{ minHeight: 44 }}
                      >
                        View Job
                      </Button>
                      <Button
                        component={Link}
                        to={`/jobs/${jobId}/apply`}
                        variant="outlined"
                        aria-label={`Apply to saved job ${job.title}`}
                        sx={{ minHeight: 44 }}
                      >
                        Apply
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Container>
  );
}

export default SavedJobs;
