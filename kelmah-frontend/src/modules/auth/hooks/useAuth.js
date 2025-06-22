import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Simple hook to provide access to auth context
const useAuth = () => {
  return useAuthContext();
};

export default useAuth; 
