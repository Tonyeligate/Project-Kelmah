export function getNavLinks(isAuthenticated, user) {
  return [
    { label: 'Home', to: '/' },
    { label: 'Jobs', to: '/jobs' },
    { label: 'Find Work', to: '/search' },
    { label: 'Map Search', to: '/map' },
    {
      label: 'Find Talents',
      to:
        isAuthenticated && user?.role === 'hirer'
          ? '/hirer/find-talent'
          : '/login?redirect=/hirer/find-talent', // ✅ FIXED: Redirect to login instead of non-existent route
    },
    { label: 'Pricing', to: '/premium' },
  ];
}
