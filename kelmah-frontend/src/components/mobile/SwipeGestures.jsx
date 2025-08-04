import React, { useState, useRef, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { motion, useMotionValue, useTransform } from 'framer-motion';

/**
 * Enhanced Swipe Gestures Component for Ghana Mobile Experience
 * Provides intuitive swipe-based interactions optimized for mobile usage patterns
 */

const SwipeGestures = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enableHorizontal = true,
  enableVertical = true,
  threshold = 50,
  className,
  style
}) => {
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Visual feedback transforms
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0.3, 0.8, 1, 0.8, 0.3]);
  const scale = useTransform(x, [-200, -50, 0, 50, 200], [0.95, 0.98, 1, 0.98, 0.95]);
  const backgroundColor = useTransform(
    x,
    [-200, -50, 0, 50, 200],
    [
      'rgba(244, 67, 54, 0.1)',
      'rgba(244, 67, 54, 0.05)',
      'transparent',
      'rgba(76, 175, 80, 0.05)',
      'rgba(76, 175, 80, 0.1)'
    ]
  );

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    
    const { offset, velocity } = info;
    
    // Calculate if swipe meets threshold (distance or velocity)
    const horizontalSwipe = Math.abs(offset.x) > threshold || Math.abs(velocity.x) > 500;
    const verticalSwipe = Math.abs(offset.y) > threshold || Math.abs(velocity.y) > 500;
    
    if (enableHorizontal && horizontalSwipe) {
      if (offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    if (enableVertical && verticalSwipe) {
      if (offset.y > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (offset.y < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
    
    // Reset position
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{
        ...style,
        opacity,
        scale,
        backgroundColor,
        touchAction: 'pan-y', // Allow vertical scrolling but capture horizontal
      }}
      drag={enableHorizontal || enableVertical}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileDrag={{ 
        cursor: 'grabbing',
        zIndex: 1000,
      }}
      animate={{
        x: isDragging ? x : 0,
        y: isDragging ? y : 0,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 400
      }}
    >
      {children}
    </motion.div>
  );
};

// Higher-order component for swipeable cards
export const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  showSwipeHints = false,
  ...props 
}) => {
  const [showHint, setShowHint] = useState(showSwipeHints);
  
  useEffect(() => {
    if (showSwipeHints) {
      const timer = setTimeout(() => setShowHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHints]);

  return (
    <Box sx={{ position: 'relative' }}>
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#FFD700',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 1000,
            whiteSpace: 'nowrap'
          }}
        >
          👈 Swipe to interact 👉
        </motion.div>
      )}
      
      <SwipeGestures
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        {...props}
      >
        {children}
      </SwipeGestures>
    </Box>
  );
};

// Swipeable list component for job/worker cards
export const SwipeableList = ({ 
  items, 
  renderItem, 
  onSwipeLeft, 
  onSwipeRight,
  keyExtractor = (item, index) => index,
  emptyMessage = "No items to display",
  ...props 
}) => {
  if (!items || items.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          color: 'text.secondary',
          fontSize: '14px'
        }}
      >
        {emptyMessage}
      </Box>
    );
  }

  return (
    <Box {...props}>
      {items.map((item, index) => (
        <SwipeableCard
          key={keyExtractor(item, index)}
          onSwipeLeft={() => onSwipeLeft?.(item, index)}
          onSwipeRight={() => onSwipeRight?.(item, index)}
          showSwipeHints={index === 0} // Show hints on first item
        >
          {renderItem(item, index)}
        </SwipeableCard>
      ))}
    </Box>
  );
};

// Pull-to-refresh component
export const PullToRefresh = ({ 
  children, 
  onRefresh, 
  refreshing = false,
  threshold = 80,
  ...props 
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const y = useMotionValue(0);
  
  const handleDragStart = () => {
    setIsPulling(true);
  };

  const handleDrag = (event, info) => {
    const distance = Math.max(0, info.offset.y);
    setPullDistance(distance);
    y.set(distance);
  };

  const handleDragEnd = (event, info) => {
    setIsPulling(false);
    
    if (info.offset.y > threshold && onRefresh && !refreshing) {
      onRefresh();
    }
    
    setPullDistance(0);
    y.set(0);
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const refreshIconRotation = pullProgress * 180;

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }} {...props}>
      {/* Pull indicator */}
      <motion.div
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
          borderRadius: '0 0 30px 30px',
          color: '#000',
          fontWeight: 600,
          fontSize: '14px',
          zIndex: 1000,
          opacity: pullProgress,
          width: `${Math.max(100, pullProgress * 200)}px`,
        }}
      >
        <motion.div
          style={{
            marginRight: 8,
            transform: `rotate(${refreshIconRotation}deg)`
          }}
        >
          🔄
        </motion.div>
        {pullProgress < 1 ? 'Pull to refresh' : 'Release to refresh'}
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.3}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          y: refreshing ? 40 : y,
        }}
        animate={{
          y: refreshing ? 40 : 0,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 400
        }}
      >
        {/* Refreshing indicator */}
        {refreshing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              top: -40,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFC000 100%)',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              🔄
            </motion.div>
            Refreshing...
          </motion.div>
        )}
        
        {children}
      </motion.div>
    </Box>
  );
};

// Quick action swipe component for Ghana-specific actions
export const QuickActionSwipe = ({ 
  children, 
  leftAction, 
  rightAction,
  leftColor = '#4CAF50',
  rightColor = '#F44336',
  ...props 
}) => {
  const [revealAction, setRevealAction] = useState(null);
  const x = useMotionValue(0);
  
  const handleDrag = (event, info) => {
    const offset = info.offset.x;
    
    if (offset > 50) {
      setRevealAction('right');
    } else if (offset < -50) {
      setRevealAction('left');
    } else {
      setRevealAction(null);
    }
  };

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    
    if (offset > 100 && rightAction) {
      rightAction.onAction();
    } else if (offset < -100 && leftAction) {
      leftAction.onAction();
    }
    
    setRevealAction(null);
    x.set(0);
  };

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }} {...props}>
      {/* Left action background */}
      {leftAction && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: leftColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            opacity: revealAction === 'left' ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>
              {leftAction.icon}
            </div>
            <div style={{ fontSize: '10px' }}>
              {leftAction.label}
            </div>
          </Box>
        </Box>
      )}

      {/* Right action background */}
      {rightAction && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '100px',
            background: rightColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            opacity: revealAction === 'right' ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>
              {rightAction.icon}
            </div>
            <div style={{ fontSize: '10px' }}>
              {rightAction.label}
            </div>
          </Box>
        </Box>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: leftAction ? -120 : 0, right: rightAction ? 120 : 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileDrag={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    </Box>
  );
};

export default SwipeGestures;