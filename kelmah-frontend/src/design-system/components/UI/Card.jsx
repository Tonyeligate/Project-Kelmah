import React from 'react';
import { Card as MuiCard, CardContent, CardHeader, CardActions, CardMedia } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { BORDER_RADIUS, SHADOW_SPACING, SEMANTIC_SPACING } from '../../foundations/spacing';
import { THEME_COLORS, PRIMARY_COLORS } from '../../foundations/colors';

/**
 * Card Component - Enhanced card with consistent styling and animations
 * 
 * Features:
 * - Multiple variants (elevated, outlined, filled, gradient)
 * - Interactive hover effects
 * - Flexible content structure
 * - Loading states
 * - Accessibility features
 */

const MotionCard = motion(MuiCard);

const StyledCard = styled(MotionCard, {
  shouldForwardProp: (prop) => !['variant', 'interactive', 'loading'].includes(prop),
})(({ theme, variant = 'elevated', interactive = false, loading = false }) => ({
  borderRadius: BORDER_RADIUS.xl,
  overflow: 'hidden',
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: interactive ? 'pointer' : 'default',
  
  // Base styles for all variants
  border: `1px solid ${theme.palette.divider}`,
  
  // Variant styles
  ...(variant === 'elevated' && {
    boxShadow: SHADOW_SPACING.md,
    backgroundColor: theme.palette.background.paper,
    
    '&:hover': interactive && {
      boxShadow: SHADOW_SPACING.xl,
      transform: 'translateY(-4px)',
      borderColor: theme.palette.primary.main,
    },
  }),
  
  ...(variant === 'outlined' && {
    boxShadow: 'none',
    backgroundColor: theme.palette.background.paper,
    borderWidth: '2px',
    
    '&:hover': interactive && {
      borderColor: theme.palette.primary.main,
      boxShadow: SHADOW_SPACING.lg,
      transform: 'translateY(-2px)',
    },
  }),
  
  ...(variant === 'filled' && {
    backgroundColor: theme.palette.mode === 'dark' 
      ? THEME_COLORS.dark.background.tertiary 
      : THEME_COLORS.light.background.tertiary,
    border: 'none',
    boxShadow: 'none',
    
    '&:hover': interactive && {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateY(-2px)',
    },
  }),
  
  ...(variant === 'gradient' && {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${PRIMARY_COLORS.gold[500]}20, ${PRIMARY_COLORS.gold[600]}30)`
      : `linear-gradient(135deg, ${PRIMARY_COLORS.gold[300]}, ${PRIMARY_COLORS.gold[400]})`,
    border: `1px solid ${PRIMARY_COLORS.gold[500]}40`,
    backdropFilter: 'blur(10px)',
    
    '&:hover': interactive && {
      background: theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${PRIMARY_COLORS.gold[500]}30, ${PRIMARY_COLORS.gold[600]}40)`
        : `linear-gradient(135deg, ${PRIMARY_COLORS.gold[200]}, ${PRIMARY_COLORS.gold[300]})`,
      transform: 'translateY(-2px)',
    },
  }),
  
  // Loading state
  ...(loading && {
    opacity: 0.7,
    pointerEvents: 'none',
    
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(90deg, transparent, ${theme.palette.action.hover}, transparent)`,
      animation: 'shimmer 1.5s infinite',
    },
  }),
  
  // Focus styles for accessibility
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
}));

const StyledCardContent = styled(CardContent)(({ theme, padding = 'md' }) => ({
  padding: SEMANTIC_SPACING.card.padding[padding],
  
  '&:last-child': {
    paddingBottom: SEMANTIC_SPACING.card.padding[padding],
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: SEMANTIC_SPACING.card.padding.md,
  borderBottom: `1px solid ${theme.palette.divider}`,
  
  '& .MuiCardHeader-title': {
    fontWeight: 600,
    fontSize: '1.25rem',
  },
  
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
    opacity: 0.8,
  },
}));

const StyledCardActions = styled(CardActions)(({ theme, justify = 'flex-end' }) => ({
  padding: SEMANTIC_SPACING.card.padding.md,
  borderTop: `1px solid ${theme.palette.divider}`,
  justifyContent: justify,
  gap: SEMANTIC_SPACING.component.sm,
}));

// Animation variants
const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

const Card = ({
  children,
  title,
  subtitle,
  actions,
  media,
  avatar,
  variant = 'elevated',
  interactive = false,
  loading = false,
  padding = 'md',
  onClick,
  href,
  ...props
}) => {
  const hasHeader = title || subtitle || avatar;
  const hasActions = actions && actions.length > 0;

  const handleClick = (e) => {
    if (loading) return;
    onClick?.(e);
  };

  const cardProps = {
    variant,
    interactive: interactive || Boolean(onClick || href),
    loading,
    onClick: handleClick,
    variants: cardVariants,
    initial: 'initial',
    animate: 'animate',
    whileHover: (interactive || onClick || href) && !loading ? 'hover' : undefined,
    whileTap: (interactive || onClick || href) && !loading ? 'tap' : undefined,
    role: (interactive || onClick || href) ? 'button' : undefined,
    tabIndex: (interactive || onClick || href) ? 0 : undefined,
    ...props,
  };

  const cardContent = (
    <>
      {hasHeader && (
        <StyledCardHeader
          title={title}
          subheader={subtitle}
          avatar={avatar}
        />
      )}
      
      {media && (
        <CardMedia
          component="div"
          sx={{
            height: 200,
            backgroundImage: `url(${media})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
            },
          }}
        />
      )}
      
      <StyledCardContent padding={padding}>
        {children}
      </StyledCardContent>
      
      {hasActions && (
        <StyledCardActions>
          {actions}
        </StyledCardActions>
      )}
    </>
  );

  if (href) {
    return (
      <StyledCard
        component="a"
        href={href}
        {...cardProps}
      >
        {cardContent}
      </StyledCard>
    );
  }

  return (
    <StyledCard {...cardProps}>
      {cardContent}
    </StyledCard>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.node),
  media: PropTypes.string,
  avatar: PropTypes.node,
  variant: PropTypes.oneOf(['elevated', 'outlined', 'filled', 'gradient']),
  interactive: PropTypes.bool,
  loading: PropTypes.bool,
  padding: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  onClick: PropTypes.func,
  href: PropTypes.string,
};

// Specialized card variants
export const FeatureCard = ({ icon, title, description, ...props }) => (
  <Card
    variant="gradient"
    interactive
    padding="lg"
    {...props}
  >
    <div style={{ textAlign: 'center' }}>
      {icon && (
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: SEMANTIC_SPACING.component.md,
          color: PRIMARY_COLORS.gold[500]
        }}>
          {icon}
        </div>
      )}
      {title && (
        <h3 style={{ 
          margin: `0 0 ${SEMANTIC_SPACING.component.sm}`,
          fontSize: '1.5rem',
          fontWeight: 600,
        }}>
          {title}
        </h3>
      )}
      {description && (
        <p style={{ 
          margin: 0,
          opacity: 0.8,
          lineHeight: 1.6,
        }}>
          {description}
        </p>
      )}
    </div>
  </Card>
);

FeatureCard.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
};

export const StatCard = ({ label, value, trend, icon, ...props }) => (
  <Card
    variant="outlined"
    padding="md"
    {...props}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ 
          fontSize: '2rem', 
          fontWeight: 700,
          marginBottom: SEMANTIC_SPACING.component.xs,
          color: PRIMARY_COLORS.gold[500],
        }}>
          {value}
        </div>
        <div style={{ 
          fontSize: '0.875rem',
          opacity: 0.8,
          marginBottom: SEMANTIC_SPACING.component.xs,
        }}>
          {label}
        </div>
        {trend && (
          <div style={{ 
            fontSize: '0.75rem',
            color: trend > 0 ? '#22C55E' : trend < 0 ? '#EF4444' : 'inherit',
          }}>
            {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      {icon && (
        <div style={{ 
          fontSize: '2rem',
          opacity: 0.3,
        }}>
          {icon}
        </div>
      )}
    </div>
  </Card>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.number,
  icon: PropTypes.node,
};

export const ProfileCard = ({ 
  avatar, 
  name, 
  title, 
  location, 
  rating, 
  badges,
  ...props 
}) => (
  <Card
    variant="elevated"
    interactive
    padding="lg"
    {...props}
  >
    <div style={{ textAlign: 'center' }}>
      {avatar && (
        <div style={{ marginBottom: SEMANTIC_SPACING.component.md }}>
          {avatar}
        </div>
      )}
      {name && (
        <h3 style={{ 
          margin: `0 0 ${SEMANTIC_SPACING.component.xs}`,
          fontSize: '1.25rem',
          fontWeight: 600,
        }}>
          {name}
        </h3>
      )}
      {title && (
        <p style={{ 
          margin: `0 0 ${SEMANTIC_SPACING.component.sm}`,
          opacity: 0.8,
        }}>
          {title}
        </p>
      )}
      {location && (
        <p style={{ 
          margin: `0 0 ${SEMANTIC_SPACING.component.sm}`,
          fontSize: '0.875rem',
          opacity: 0.6,
        }}>
          📍 {location}
        </p>
      )}
      {rating && (
        <div style={{ 
          margin: `0 0 ${SEMANTIC_SPACING.component.md}`,
          color: PRIMARY_COLORS.gold[500],
        }}>
          ⭐ {rating}
        </div>
      )}
      {badges && badges.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: SEMANTIC_SPACING.component.xs,
          justifyContent: 'center',
        }}>
          {badges}
        </div>
      )}
    </div>
  </Card>
);

ProfileCard.propTypes = {
  avatar: PropTypes.node,
  name: PropTypes.string,
  title: PropTypes.string,
  location: PropTypes.string,
  rating: PropTypes.number,
  badges: PropTypes.arrayOf(PropTypes.node),
};

export default Card; 