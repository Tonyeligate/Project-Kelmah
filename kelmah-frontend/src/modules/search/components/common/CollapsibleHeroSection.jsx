/**
 * Collapsible Hero Section for Find Workers Page
 * Optimized for mobile - reduces hero height from ~250px to ~100px
 * Expandable on user request for full messaging
 */

import { useState } from 'react';
import { Box, Typography, Button, Collapse } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { useBreakpointDown } from '@/hooks/useResponsive';

const CollapsibleHeroSection = ({ isAuthenticated = false }) => {
  const isMobile = useBreakpointDown('md');
  const [expanded, setExpanded] = useState(false);

  // On desktop, always show full content
  if (!isMobile) {
    return (
      <Box
        aria-label="Worker search hero"
        sx={{
          mb: 3,
          textAlign: 'center',
          py: 3,
          px: 2,
          background:
            'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0.05) 100%)',
          borderRadius: 2,
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          Discover Skilled Workers in Ghana
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 2, maxWidth: '800px', mx: 'auto' }}
        >
          Browse carpenters, plumbers, electricians, masons, and other skilled
          professionals ready to help with your project.
        </Typography>
        {!isAuthenticated && (
          <Typography variant="body2" color="text.secondary">
            Sign up to contact workers and post jobs in one place.
          </Typography>
        )}
      </Box>
    );
  }

  // Mobile: Collapsible version
  return (
    <Box
      aria-label="Worker search quick hero"
      sx={{
        mb: 2,
        textAlign: 'center',
        py: 1.5,
        px: 2,
        background:
          'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(0,0,0,0.03) 100%)',
        borderRadius: 2,
        border: '1px solid rgba(212,175,55,0.15)',
      }}
    >
      {/* Compact Header - Always Visible */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography
          variant="h6"
          component="h1"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            fontSize: '1.1rem',
            flex: 1,
            textAlign: 'left',
          }}
        >
          Discover Workers
        </Typography>
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          aria-label={
            expanded ? 'Show less search guidance' : 'Show more search guidance'
          }
          sx={{
            color: '#D4AF37',
            fontSize: '0.75rem',
            minWidth: 'auto',
            px: 1.5,
            py: 0.75,
            minHeight: 44,
            textTransform: 'none',
          }}
        >
          {expanded ? 'Less' : 'More'}
        </Button>
      </Box>

      {/* Expandable Content */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(212,175,55,0.2)' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, lineHeight: 1.6 }}
          >
            Browse available carpenters, plumbers, electricians, masons, and
            other skilled professionals ready to help with your project.
          </Typography>
          {!isAuthenticated && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', fontStyle: 'italic' }}
            >
              Sign up to contact workers and post jobs when you are ready.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

CollapsibleHeroSection.propTypes = {
  isAuthenticated: PropTypes.bool,
};

export default CollapsibleHeroSection;
