import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, useTheme, useMediaQuery } from '@mui/material';
import PortfolioGallery from '../components/PortfolioGallery';
import ProjectShowcase from '../components/ProjectShowcase';
import portfolioService from '../services/portfolioService';

const PortfolioPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);

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
      .catch(() => setItems([]));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
        My Portfolio
      </Typography>
      <Box sx={{ mt: 2 }}>
        <PortfolioGallery items={items} />
      </Box>
      {selected && (
        <Box sx={{ mt: 4 }}>
          <ProjectShowcase project={selected} />
        </Box>
      )}
    </Container>
  );
};

export default PortfolioPage;
