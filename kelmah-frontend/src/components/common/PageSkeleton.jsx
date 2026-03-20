import { Box, Skeleton, Stack } from '@mui/material';

/**
 * PageSkeleton — shows a loading placeholder suitable for different page types.
 *
 * Accessibility:
 * - aria-busy="true" + aria-label tell assistive tech the page is loading
 * - role="progressbar" communicates loading state semantically
 *
 * @param {'list'|'detail'|'dashboard'|'form'|'grid'} variant
 */
export default function PageSkeleton({ variant = 'list' }) {
  const wrapperProps = {
    role: 'progressbar',
    'aria-busy': true,
    'aria-label': 'Loading page content',
  };
  if (variant === 'dashboard') {
    return (
      <Box {...wrapperProps} sx={{ p: { xs: 2, md: 3 } }}>
        {/* Stat cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 3, overflowX: 'auto' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={`dashboard-stat-skeleton-${i}`} variant="rounded" width={180} height={100} sx={{ flexShrink: 0 }} />
          ))}
        </Stack>
        {/* Content blocks */}
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={160} />
        </Stack>
      </Box>
    );
  }

  if (variant === 'detail') {
    return (
      <Box {...wrapperProps} sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>
        <Skeleton variant="rounded" height={40} width="60%" sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={20} width="40%" sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={`detail-line-skeleton-${i}`} variant="text" height={20} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (variant === 'grid') {
    return (
      <Box {...wrapperProps} sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={`grid-card-skeleton-${i}`} variant="rounded" height={200} />
          ))}
        </Box>
      </Box>
    );
  }

  if (variant === 'form') {
    return (
      <Box {...wrapperProps} sx={{ p: { xs: 2, md: 3 }, maxWidth: 600, mx: 'auto' }}>
        <Skeleton variant="rounded" height={36} width="50%" sx={{ mb: 3 }} />
        <Stack spacing={2.5}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={`form-row-skeleton-${i}`} variant="rounded" height={56} />
          ))}
          <Skeleton variant="rounded" height={48} width={120} />
        </Stack>
      </Box>
    );
  }

  // Default: list variant
  return (
    <Box {...wrapperProps} sx={{ p: { xs: 2, md: 3 } }}>
      <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
      <Stack spacing={1.5}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Stack key={`list-row-skeleton-${i}`} direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={44} height={44} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={22} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
