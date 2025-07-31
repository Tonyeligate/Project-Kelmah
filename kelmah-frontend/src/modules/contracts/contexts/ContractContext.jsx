import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { contractService } from '../services/contractService';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { USE_MOCK_DATA } from '../../../config/env';

const ContractContext = createContext(null);

const mockContracts = [];

export const ContractProvider = ({ children }) => {
  // Skip auth requirement when using mock data
  let user = null;
  if (!USE_MOCK_DATA) {
    try {
      user = useAuth().user;
    } catch (e) {
      user = null;
    }
  }
  let showToast = () => {};
  try {
    showToast = useNotifications().showToast;
  } catch (e) {
    // No NotificationProvider, fallback to no-op showToast
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState([]);

  const fetchContracts = useCallback(async () => {
    // Determine whether to use mock data
    const useMockData = USE_MOCK_DATA;
    if (useMockData) {
      console.log('Using mock contract data.');
      setTimeout(() => {
        setContracts(mockContracts);
        setLoading(false);
      }, 500);
      return;
    }
    if (!user) return;
    setLoading(true);

    try {
      const fetchedContracts = await contractService.getContracts();
      setContracts(fetchedContracts);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setError('Could not load contract information. Please try again later.');
      showToast('Failed to load contracts.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const getContractById = useCallback(
    async (id) => {
      // Also mock if configured
      if (USE_MOCK_DATA) {
        const contract = mockContracts.find((c) => c.id === id);
        return contract || null;
      }

      setLoading(true);
      try {
        return await contractService.getContractById(id);
      } catch (err) {
        showToast(`Failed to retrieve contract ${id}.`, 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const approveMilestone = useCallback(
    async (contractId, milestoneId) => {
      // Mock if configured
      if (USE_MOCK_DATA) {
        showToast('Milestone approved successfully! (Mock)', 'success');
        return;
      }
      try {
        const { success } = await contractService.approveMilestone(
          contractId,
          milestoneId,
        );
        if (success) {
          showToast('Milestone approved successfully!', 'success');
          const updatedContracts = contracts.map((c) => {
            if (c.id === contractId) {
              c.milestones.find((m) => m.id === milestoneId).status = 'paid';
            }
            return c;
          });
          setContracts(updatedContracts);
        } else {
          throw new Error('Milestone approval failed on the backend.');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to approve milestone.', 'error');
      }
    },
    [contracts, showToast],
  );

  const value = {
    loading,
    error,
    contracts,
    getContractById,
    approveMilestone,
    refresh: fetchContracts,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
};
