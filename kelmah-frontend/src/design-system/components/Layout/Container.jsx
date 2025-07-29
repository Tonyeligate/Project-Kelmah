import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { SPACING, SEMANTIC_SPACING, GRID } from '../../foundations/spacing';

/**
 * Container Component - Provides consistent page and content containers
 * 
 * Features:
 * - Responsive max-widths
 * - Consistent padding
 * - Flexible sizing options
 * - Theme-aware styling
 */

const StyledContainer = styled(Box, {
  shouldForwardProp: (prop) => 
    !['size', 'padding', 'centered', 'fluid'].includes(prop),
})(({ theme, size = 'lg', padding = 'md', centered = true, fluid = false }) => ({
  width: '100%',
  marginLeft: centered ? 'auto' : 0,
  marginRight: centered ? 'auto' : 0,
  
  // Max width based on size
  maxWidth: fluid ? 'none' : GRID.container[size],
  
  // Padding based on padding prop and responsive breakpoints
  paddingLeft: SEMANTIC_SPACING.container[padding],
  paddingRight: SEMANTIC_SPACING.container[padding],
  
  // Responsive padding adjustments
  [theme.breakpoints.up('sm')]: {
    paddingLeft: padding === 'xs' ? SEMANTIC_SPACING.container.sm : SEMANTIC_SPACING.container[padding],
    paddingRight: padding === 'xs' ? SEMANTIC_SPACING.container.sm : SEMANTIC_SPACING.container[padding],
  },
  
  [theme.breakpoints.up('md')]: {
    paddingLeft: ['xs', 'sm'].includes(padding) ? SEMANTIC_SPACING.container.md : SEMANTIC_SPACING.container[padding],
    paddingRight: ['xs', 'sm'].includes(padding) ? SEMANTIC_SPACING.container.md : SEMANTIC_SPACING.container[padding],
  },
  
  [theme.breakpoints.up('lg')]: {
    paddingLeft: ['xs', 'sm', 'md'].includes(padding) ? SEMANTIC_SPACING.container.lg : SEMANTIC_SPACING.container[padding],
    paddingRight: ['xs', 'sm', 'md'].includes(padding) ? SEMANTIC_SPACING.container.lg : SEMANTIC_SPACING.container[padding],
  },
  
  [theme.breakpoints.up('xl')]: {
    paddingLeft: SEMANTIC_SPACING.container.xl,
    paddingRight: SEMANTIC_SPACING.container.xl,
  },
}));

const Container = ({
  children,
  size = 'lg',
  padding = 'md',
  centered = true,
  fluid = false,
  component = 'div',
  ...props
}) => {
  return (
    <StyledContainer
      component={component}
      size={size}
      padding={padding}
      centered={centered}
      fluid={fluid}
      {...props}
    >
      {children}
    </StyledContainer>
  );
};

Container.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  padding: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  centered: PropTypes.bool,
  fluid: PropTypes.bool,
  component: PropTypes.elementType,
};

// Specialized container variants
export const PageContainer = (props) => (
  <Container size="xl" padding="lg" {...props} />
);

export const ContentContainer = (props) => (
  <Container size="lg" padding="md" {...props} />
);

export const SectionContainer = (props) => (
  <Container size="lg" padding="sm" {...props} />
);

export const CompactContainer = (props) => (
  <Container size="md" padding="xs" {...props} />
);

export const FluidContainer = (props) => (
  <Container fluid padding="md" {...props} />
);

export default Container; 