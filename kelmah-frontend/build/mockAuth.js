// Mock authentication script for development mode
(function () {
  console.log('Mock authentication script running...');

  // Mock user data
  const mockUser = {
    id: 'dev-user-123',
    email: 'dev@example.com',
    firstName: 'Development',
    lastName: 'User',
    name: 'Development User',
    role: 'worker',
    skills: ['Carpentry', 'Plumbing', 'Electrical'],
    rating: 4.8,
    profileImage: null,
  };

  // Set up authentication data in localStorage
  localStorage.setItem('kelmah_auth_token', 'dev-mode-fake-token-12345');
  localStorage.setItem('user', JSON.stringify(mockUser));

  console.log('Mock authentication data injected into localStorage');
})();
