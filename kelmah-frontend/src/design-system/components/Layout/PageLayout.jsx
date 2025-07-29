import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { SPACING, SEMANTIC_SPACING, Z_INDEX } from '../../foundations/spacing';
import Container from './Container';
import { Stack, Flex } from './Grid';

/**
 * PageLayout Component - Provides consistent page structure
 * 
 * Features:
 * - Header, main content, and footer areas
 * - Sidebar support
 * - Responsive behavior
 * - Theme-aware styling
 */

const LayoutRoot = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

const LayoutHeader = styled(Box)(({ theme, sticky = false }) => ({
  flexShrink: 0,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: sticky ? Z_INDEX.sticky : Z_INDEX.base,
  ...(sticky && {
    position: 'sticky',
    top: 0,
  }),
}));

const LayoutMain = styled(Box)(({ theme, hasSidebar }) => ({
  flex: 1,
  display: 'flex',
  minHeight: 0, // Allow flex items to shrink
  ...(hasSidebar && {
    [theme.breakpoints.up('md')]: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: SEMANTIC_SPACING.layout.md,
    },
  }),
}));

const LayoutSidebar = styled(Box)(({ theme, width = '280px', collapsible = false }) => ({
  flexShrink: 0,
  width: width,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  
  // Mobile: Hidden by default, can be shown as overlay
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: Z_INDEX.overlay,
    transform: 'translateX(-100%)',
    transition: theme.transitions.create('transform'),
    
    '&.open': {
      transform: 'translateX(0)',
    },
  },
  
  ...(collapsible && {
    transition: theme.transitions.create('width'),
    '&.collapsed': {
      width: '64px',
    },
  }),
}));

const LayoutContent = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0, // Prevent flex item from overflowing
  padding: SEMANTIC_SPACING.layout.md,
  
  [theme.breakpoints.down('sm')]: {
    padding: SEMANTIC_SPACING.layout.sm,
  },
}));

const LayoutFooter = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: SEMANTIC_SPACING.layout.md,
}));

const PageLayout = ({
  children,
  header,
  sidebar,
  footer,
  stickyHeader = false,
  sidebarWidth = '280px',
  collapsibleSidebar = false,
  sidebarOpen = false,
  onSidebarToggle,
  maxWidth = 'xl',
  ...props
}) => {
  const hasSidebar = Boolean(sidebar);

  return (
    <LayoutRoot {...props}>
      {/* Header */}
      {header && (
        <LayoutHeader sticky={stickyHeader}>
          <Container size={maxWidth} padding="sm">
            {header}
          </Container>
        </LayoutHeader>
      )}

      {/* Main Content Area */}
      <LayoutMain hasSidebar={hasSidebar}>
        {/* Sidebar */}
        {sidebar && (
          <LayoutSidebar
            width={sidebarWidth}
            collapsible={collapsibleSidebar}
            className={sidebarOpen ? 'open' : ''}
          >
            {sidebar}
          </LayoutSidebar>
        )}

        {/* Content */}
        <LayoutContent>
          <Container size={maxWidth} padding="none" fluid>
            {children}
          </Container>
        </LayoutContent>
      </LayoutMain>

      {/* Footer */}
      {footer && (
        <LayoutFooter>
          <Container size={maxWidth} padding="sm">
            {footer}
          </Container>
        </LayoutFooter>
      )}
    </LayoutRoot>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  sidebar: PropTypes.node,
  footer: PropTypes.node,
  stickyHeader: PropTypes.bool,
  sidebarWidth: PropTypes.string,
  collapsibleSidebar: PropTypes.bool,
  sidebarOpen: PropTypes.bool,
  onSidebarToggle: PropTypes.func,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
};

// Specialized layout variants
export const DashboardLayout = ({ 
  children, 
  header, 
  sidebar, 
  sidebarOpen = false,
  onSidebarToggle,
  ...props 
}) => (
  <PageLayout
    header={header}
    sidebar={sidebar}
    stickyHeader
    collapsibleSidebar
    sidebarOpen={sidebarOpen}
    onSidebarToggle={onSidebarToggle}
    maxWidth="2xl"
    {...props}
  >
    {children}
  </PageLayout>
);

export const ContentLayout = ({ children, header, footer, ...props }) => (
  <PageLayout
    header={header}
    footer={footer}
    maxWidth="lg"
    {...props}
  >
    <Stack gap="xl">
      {children}
    </Stack>
  </PageLayout>
);

export const AuthLayout = ({ children, ...props }) => (
  <PageLayout maxWidth="sm" {...props}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 4,
      }}
    >
      {children}
    </Box>
  </PageLayout>
);

export const LandingLayout = ({ children, header, footer, ...props }) => (
  <PageLayout
    header={header}
    footer={footer}
    stickyHeader
    maxWidth="2xl"
    {...props}
  >
    {children}
  </PageLayout>
);

export default PageLayout; 