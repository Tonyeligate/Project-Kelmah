export function getNavLinks(isAuthenticated, user) {
  return [
    { label: 'Home', to: '/' },
    { label: 'Jobs', to: '/jobs' },
    // Removed 'Find Work' from global header to avoid redundancy with 'Jobs'
    { label: 'Map Search', to: '/map' },
    {
      label: 'Find Talents',
      to:
        isAuthenticated && user?.role === 'hirer'
          ? '/hirer/find-talent'
          : '/find-talents',
    },
    { label: 'Pricing', to: '/premium' },
  ];
}
