import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, useTheme, useMediaQuery, CircularProgress, Alert, Button } from '@mui/material';
import PortfolioGallery from '../components/PortfolioGallery';
import ProjectShowcase from '../components/ProjectShowcase';
import portfolioService from '../services/portfolioService';

const PortfolioPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = () => {
    setLoading(true);
    setError(null);
    portfolioService
      .getMyPortfolio({ sortBy: 'relevance', limit: 12 })
      .then((res) => {
        const list = res?.portfolioItems || [];
        setItems(list);
        setSelected(list[0] || null);
      })
      .catch((err) => {
        console.error('Failed to load portfolio:', err);
        setError('Failed to load portfolio items. Please try again.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    portfolioService
      .getMyPortfolio({ sortBy: 'relevance', limit: 12 })
      .then((res) => {
        if (!mounted) return;
        const list = res?.portfolioItems || [];
        setItems(list);
        setSelected(list[0] || null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Failed to load portfolio items. Please try again.');
        setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchPortfolio}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
        My Portfolio
      </Typography>
      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No portfolio items yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Add examples of your work to showcase your skills to hirers.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mt: 2 }}>
            <PortfolioGallery items={items} />
          </Box>
          {selected && (
            <Box sx={{ mt: 4 }}>
              <ProjectShowcase project={selected} />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default PortfolioPage;
