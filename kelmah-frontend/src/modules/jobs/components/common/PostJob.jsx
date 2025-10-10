import React, { useState } from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { Work as WorkIcon, Add as AddIcon } from '@mui/icons-material';
import JobCreationForm from '../job-creation/JobCreationForm';

function PostJob() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          sx={{
            p: 4,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            border: '1px solid #D4AF37',
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <WorkIcon sx={{ fontSize: 64, color: '#D4AF37', mb: 2 }} />
            </motion.div>

            <Typography
              variant="h4"
              sx={{
                color: '#D4AF37',
                fontWeight: 'bold',
                mb: 2,
                background: 'linear-gradient(45deg, #D4AF37, #FFD700)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Post a Job
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                mb: 3,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Find the perfect skilled worker for your project. Post your job
              and connect with qualified professionals across Ghana.
            </Typography>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  bgcolor: '#D4AF37',
                  color: 'black',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#B8941F',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(212,175,55,0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Create New Job Posting
              </Button>
            </motion.div>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography
              variant="h6"
              sx={{ color: '#D4AF37', mb: 3, textAlign: 'center' }}
            >
              Why Post on Kelmah?
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                  Verified Workers
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  All workers are verified with skills, experience, and reviews
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                  Secure Payments
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  Escrow system ensures secure payments and project completion
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                  Quality Guarantee
                </Typography>
                <Typography variant="body2" sx={{ color: '#ccc' }}>
                  We stand behind the quality of work delivered by our
                  professionals
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <JobCreationForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </Container>
  );
}

export default PostJob;
