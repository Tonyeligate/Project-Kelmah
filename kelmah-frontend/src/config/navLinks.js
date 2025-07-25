export function getNavLinks(isAuthenticated, user) {
  return [
    { label: 'Home', to: '/' },
    { label: 'Jobs', to: '/jobs' },
    { label: 'Find Work', to: '/search' },
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
