import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { SPACING, SEMANTIC_SPACING, GRID } from '../../foundations/spacing';

/**
 * Grid System Components
 * 
 * Provides a flexible, responsive grid system for layout
 * Based on CSS Grid with 12-column system support
 */

// Grid Container
const StyledGrid = styled(Box, {
  shouldForwardProp: (prop) => 
    !['columns', 'gap', 'responsive'].includes(prop),
})(({ theme, columns = 12, gap = 'md', responsive = true }) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns}, 1fr)`,
  gap: SEMANTIC_SPACING.layout[gap],
  width: '100%',
  
  // Responsive adjustments
  ...(responsive && {
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: columns > 6 ? 'repeat(2, 1fr)' : `repeat(${columns}, 1fr)`,
      gap: SEMANTIC_SPACING.layout.sm,
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '1fr',
      gap: SEMANTIC_SPACING.layout.xs,
    },
  }),
}));

export const Grid = ({
  children,
  columns = 12,
  gap = 'md',
  responsive = true,
  ...props
}) => {
  return (
    <StyledGrid
      columns={columns}
      gap={gap}
      responsive={responsive}
      {...props}
    >
      {children}
    </StyledGrid>
  );
};

Grid.propTypes = {
  children: PropTypes.node.isRequired,
  columns: PropTypes.number,
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  responsive: PropTypes.bool,
};

// Grid Item
const StyledGridItem = styled(Box, {
  shouldForwardProp: (prop) => 
    !['span', 'start', 'end'].includes(prop),
})(({ span, start, end }) => ({
  ...(span && { gridColumn: `span ${span}` }),
  ...(start && { gridColumnStart: start }),
  ...(end && { gridColumnEnd: end }),
}));

export const GridItem = ({
  children,
  span,
  start,
  end,
  ...props
}) => {
  return (
    <StyledGridItem
      span={span}
      start={start}
      end={end}
      {...props}
    >
      {children}
    </StyledGridItem>
  );
};

GridItem.propTypes = {
  children: PropTypes.node.isRequired,
  span: PropTypes.number,
  start: PropTypes.number,
  end: PropTypes.number,
};

// Flexbox-based Row/Column system
const StyledFlex = styled(Box, {
  shouldForwardProp: (prop) => 
    !['direction', 'wrap', 'justify', 'align', 'gap'].includes(prop),
})(({ direction = 'row', wrap = 'wrap', justify = 'flex-start', align = 'stretch', gap = 'md' }) => ({
  display: 'flex',
  flexDirection: direction,
  flexWrap: wrap,
  justifyContent: justify,
  alignItems: align,
  gap: SEMANTIC_SPACING.layout[gap],
}));

export const Flex = ({
  children,
  direction = 'row',
  wrap = 'wrap',
  justify = 'flex-start',
  align = 'stretch',
  gap = 'md',
  ...props
}) => {
  return (
    <StyledFlex
      direction={direction}
      wrap={wrap}
      justify={justify}
      align={align}
      gap={gap}
      {...props}
    >
      {children}
    </StyledFlex>
  );
};

Flex.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['row', 'column', 'row-reverse', 'column-reverse']),
  wrap: PropTypes.oneOf(['nowrap', 'wrap', 'wrap-reverse']),
  justify: PropTypes.oneOf([
    'flex-start', 'flex-end', 'center', 'space-between', 
    'space-around', 'space-evenly'
  ]),
  align: PropTypes.oneOf([
    'stretch', 'flex-start', 'flex-end', 'center', 'baseline'
  ]),
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

// Stack component for vertical layouts
export const Stack = ({ gap = 'md', ...props }) => (
  <Flex direction="column" gap={gap} {...props} />
);

Stack.propTypes = {
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

// Inline component for horizontal layouts
export const Inline = ({ gap = 'sm', ...props }) => (
  <Flex direction="row" gap={gap} align="center" {...props} />
);

Inline.propTypes = {
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

// Center component for centering content
export const Center = ({ children, ...props }) => (
  <Flex justify="center" align="center" {...props}>
    {children}
  </Flex>
);

Center.propTypes = {
  children: PropTypes.node.isRequired,
};

// Spacer component for flexible spacing
const StyledSpacer = styled(Box, {
  shouldForwardProp: (prop) => !['size'].includes(prop),
})(({ size }) => ({
  ...(size && {
    width: SPACING[size],
    height: SPACING[size],
    flexShrink: 0,
  }),
  ...(!size && {
    flex: 1,
  }),
}));

export const Spacer = ({ size, ...props }) => (
  <StyledSpacer size={size} {...props} />
);

Spacer.propTypes = {
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// Common layout patterns
export const TwoColumnLayout = ({ 
  left, 
  right, 
  leftWidth = 'auto', 
  gap = 'lg',
  ...props 
}) => (
  <Grid columns={12} gap={gap} {...props}>
    <GridItem span={leftWidth === 'auto' ? 8 : leftWidth}>
      {left}
    </GridItem>
    <GridItem span={leftWidth === 'auto' ? 4 : 12 - leftWidth}>
      {right}
    </GridItem>
  </Grid>
);

TwoColumnLayout.propTypes = {
  left: PropTypes.node.isRequired,
  right: PropTypes.node.isRequired,
  leftWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

export const ThreeColumnLayout = ({ 
  left, 
  center, 
  right, 
  leftWidth = 3,
  rightWidth = 3,
  gap = 'lg',
  ...props 
}) => (
  <Grid columns={12} gap={gap} {...props}>
    <GridItem span={leftWidth}>
      {left}
    </GridItem>
    <GridItem span={12 - leftWidth - rightWidth}>
      {center}
    </GridItem>
    <GridItem span={rightWidth}>
      {right}
    </GridItem>
  </Grid>
);

ThreeColumnLayout.propTypes = {
  left: PropTypes.node.isRequired,
  center: PropTypes.node.isRequired,
  right: PropTypes.node.isRequired,
  leftWidth: PropTypes.number,
  rightWidth: PropTypes.number,
  gap: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

export default Grid; 