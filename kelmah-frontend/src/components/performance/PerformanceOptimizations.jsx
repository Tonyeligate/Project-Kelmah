import React, { Suspense, lazy, useCallback, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { LoadingAnimations } from '../interactive/LoadingAnimations';

// Lazy loaded components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const DataGrid = lazy(() => import('./DataGrid'));

// Image optimization component
const OptimizedImage = ({ src, alt, ...props }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    rootMargin: '50px 0px',
  });

  return (
    <Box ref={ref} sx={{ overflow: 'hidden' }}>
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          {...props}
          style={{
            width: '100%',
            height: 'auto',
            transition: 'transform 0.3s ease-in-out',
          }}
        />
      )}
    </Box>
  );
};

// Virtual list for large data sets
const VirtualList = ({ items, rowHeight, visibleRows }) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const getVisibleItems = useCallback(() => {
    const startIndex = Math.floor(scrollTop / rowHeight);
    const endIndex = Math.min(startIndex + visibleRows, items.length);
    return items.slice(startIndex, endIndex);
  }, [scrollTop, items, rowHeight, visibleRows]);

  const visibleItems = useMemo(() => getVisibleItems(), [getVisibleItems]);

  return (
    <Box
      sx={{
        height: visibleRows * rowHeight,
        overflow: 'auto',
      }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <Box sx={{ height: items.length * rowHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: (Math.floor(scrollTop / rowHeight) + index) * rowHeight,
              height: rowHeight,
              width: '100%',
            }}
          >
            {item}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const PerformanceOptimizations = () => {
  return (
    <Suspense fallback={<LoadingAnimations />}>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Optimized content loading */}
        <VirtualList
          items={Array.from({ length: 1000 }, (_, i) => `Item ${i}`)}
          rowHeight={50}
          visibleRows={10}
        />
        
        {/* Lazy loaded components */}
        <Suspense fallback={<CircularProgress />}>
          <HeavyComponent />
        </Suspense>
        
        {/* Optimized images */}
        <OptimizedImage
          src="/path/to/image.jpg"
          alt="Optimized"
          width={800}
          height={600}
        />
      </Box>
    </Suspense>
  );
}; 