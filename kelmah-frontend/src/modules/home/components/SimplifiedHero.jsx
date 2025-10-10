import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Build as CarpenterIcon,
  Construction as MasonIcon,
  Plumbing as PlumberIcon,
  ElectricalServices as ElectricianIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  PersonAdd as RegisterIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

const SimplifiedHero = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const jobTypes = [
    { icon: <CarpenterIcon />, label: 'Carpenter', color: '#8B4513' },
    { icon: <MasonIcon />, label: 'Mason', color: '#808080' },
    { icon: <PlumberIcon />, label: 'Plumber', color: '#4169E1' },
    { icon: <ElectricianIcon />, label: 'Electrician', color: '#FFD700' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Text Content */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h2"
                fontWeight={800}
                color="white"
                gutterBottom
                sx={{
                  fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
                  lineHeight: 1.2,
                }}
              >
                Find Work.
                <br />
                Get Hired.
                <br />
                <span style={{ color: '#FFD700' }}>Earn Money.</span>
              </Typography>

              <Typography
                variant="h5"
                color="white"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                Connect with people who need your skills
              </Typography>

              {/* Visual Job Types */}
              <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                {jobTypes.map((job, index) => (
                  <motion.div
                    key={job.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: job.color,
                        width: 56,
                        height: 56,
                      }}
                    >
                      {job.icon}
                    </Avatar>
                  </motion.div>
                ))}
              </Stack>

              {/* Call to Action Buttons */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<WorkIcon />}
                  onClick={() => navigate('/worker/find-work')}
                  sx={{
                    bgcolor: '#FFD700',
                    color: '#000',
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 3,
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: '#FFC700',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  I WANT WORK
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<SearchIcon />}
                  onClick={() => navigate('/search')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 3,
                    fontWeight: 'bold',
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: '#FFD700',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 2,
                    },
                  }}
                >
                  I NEED WORKER
                </Button>
              </Stack>

              {/* Login/Register for new users */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography color="white" variant="body1">
                  New here?
                </Typography>
                <Button
                  startIcon={<RegisterIcon />}
                  onClick={() => navigate('/register')}
                  sx={{
                    color: '#FFD700',
                    fontWeight: 'bold',
                  }}
                >
                  Sign Up Free
                </Button>
                <Typography color="white">or</Typography>
                <Button
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  Login
                </Button>
              </Stack>
            </motion.div>
          </Grid>

          {/* Right Side - Visual Cards */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Grid container spacing={2}>
                {/* How it Works Cards */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 3,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        gutterBottom
                        sx={{ color: '#764ba2' }}
                      >
                        🚀 How It Works
                      </Typography>

                      <Stack spacing={2}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{ bgcolor: '#4CAF50', width: 48, height: 48 }}
                          >
                            1
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              Sign Up
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Create your free account in 2 minutes
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{ bgcolor: '#2196F3', width: 48, height: 48 }}
                          >
                            2
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              Find Jobs
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Browse jobs that match your skills
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{ bgcolor: '#FF9800', width: 48, height: 48 }}
                          >
                            3
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              Apply & Work
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Get hired and start earning
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{ bgcolor: '#FFD700', width: 48, height: 48 }}
                          >
                            4
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              Get Paid
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Receive payment for your work
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Stats */}
                <Grid item xs={6}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(255, 215, 0, 0.95)',
                      borderRadius: 2,
                      textAlign: 'center',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h3" fontWeight={800}>
                        5000+
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        Active Jobs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.95)',
                      borderRadius: 2,
                      textAlign: 'center',
                      color: 'white',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h3" fontWeight={800}>
                        10K+
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        Workers
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SimplifiedHero;
