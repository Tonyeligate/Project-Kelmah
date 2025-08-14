export default function useAuth() {
  return {
    isAuthenticated: true,
    loading: false,
    user: { id: 'test-user', role: 'admin', email: 'test@example.com' },
  };
}


