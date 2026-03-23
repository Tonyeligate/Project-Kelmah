import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, useTheme, CircularProgress, Alert, Button } from '@mui/material';
import { CollectionsOutlined as CollectionsOutlinedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PortfolioGallery from '../components/PortfolioGallery';
import ProjectShowcase from '../components/ProjectShowcase';
import portfolioService from '../services/portfolioService';
import { Helmet } from 'react-helmet-async';
import { useBreakpointDown } from '@/hooks/useResponsive';

const PortfolioPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useBreakpointDown('md');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = (signal) => {
    setLoading(true);
    setError(null);
    portfolioService
      .getMyPortfolio({ sortBy: 'relevance', limit: 12 })
      .then((res) => {
        if (signal?.aborted) return;
        const list = Array.isArray(res) ? res : res?.portfolioItems || res?.items || [];
        setItems(list);
        setSelected(list[0] || null);
      })
      .catch((err) => {
        if (signal?.aborted) return;
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_FRONTEND === 'true') console.error('Failed to load portfolio:', err);
        setError('Failed to load portfolio items. Please try again.');
        setItems([]);
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchPortfolio(controller.signal);
    return () => controller.abort();
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
            <Button color="inherit" size="small" onClick={() => fetchPortfolio()}>
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
      <Helmet><title>My Portfolio | Kelmah</title></Helmet>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
        My Portfolio
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
        Add photos, screenshots, or project summaries so hirers can quickly see the quality of your work.
      </Typography>
      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <CollectionsOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No portfolio items yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            Add examples of your work to show hirers what you can do.
          </Typography>
          <Button variant="contained" color="secondary" sx={{ minHeight: 44 }} onClick={() => navigate('/worker/portfolio/manage')}>
            Add Work Sample
          </Button>
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
