import React, { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import PortfolioGallery from '../components/PortfolioGallery';
import ProjectShowcase from '../components/ProjectShowcase';
import portfolioService from '../services/portfolioService';

const PortfolioPage = () => {
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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
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
