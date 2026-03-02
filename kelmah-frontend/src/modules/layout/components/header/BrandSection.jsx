/**
 * BrandSection — renders the brand logo (desktop) or current-page title pill (mobile).
 * Extracted from Header.jsx for maintainability.
 */
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrandLogo, LogoIcon, BrandText, TaglineText } from './HeaderStyles';
import { BRAND_COLORS } from '../../../../theme';

/** Reusable page-title pill used on mobile screens. */
const PageTitlePill = ({ icon: Icon, name, theme }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 215, 0, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 2,
      px: 1.5,
      py: 0.5,
      mr: 1,
    }}
  >
    <Icon
      sx={{
        fontSize: '1.2rem',
        color: theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black,
        mr: 0.5,
      }}
    />
    <Typography
      variant="subtitle1"
      fontWeight={600}
      color={theme.palette.mode === 'dark' ? BRAND_COLORS.gold : BRAND_COLORS.black}
      noWrap
    >
      {name}
    </Typography>
  </Box>
);

const BrandSection = ({ isMobile, showUserFeatures, isOnAuthPage, currentPage, user }) => {
  const theme = useTheme();

  return (
    <motion.div
      whileHover={{ scale: isMobile ? 1 : 1.02 }}
      whileTap={{ scale: isMobile ? 1 : 0.98 }}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {isMobile && showUserFeatures ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PageTitlePill icon={currentPage.icon} name={currentPage.name} theme={theme} />
          {user && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: '0.7rem',
                }}
              >
                {user.firstName || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.65rem',
                  textTransform: 'capitalize',
                }}
              >
                {user.role || user.userType || 'User'}
              </Typography>
            </Box>
          )}
        </Box>
      ) : isMobile && isOnAuthPage ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PageTitlePill icon={currentPage.icon} name={currentPage.name} theme={theme} />
        </Box>
      ) : (
        <BrandLogo component={RouterLink} to="/">
          <LogoIcon>K</LogoIcon>
          <Box>
            <BrandText variant="h6">elmah</BrandText>
            <TaglineText>Ghana's Skilled Trades Platform</TaglineText>
          </Box>
        </BrandLogo>
      )}
    </motion.div>
  );
};

export default BrandSection;
