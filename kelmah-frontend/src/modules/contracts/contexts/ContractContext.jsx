import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { contractService } from '../services/contractService';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import {
  createFeatureLogger,
  devError,
} from '@/modules/common/utils/devLogger';

const contractsLog = createFeatureLogger({
  flagName: 'VITE_DEBUG_CONTRACTS',
  level: 'log',
});

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const { user } = useAuth();
  // Call hook unconditionally (Rules of Hooks) - the context returns null
  // when there is no NotificationProvider ancestor.
  const notifications = useNotifications();
  const rawShowToast = notifications?.showToast;
  const showToast = useCallback(
    (...args) => { if (rawShowToast) rawShowToast(...args); },
    [rawShowToast]
  );

  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState([]);

  const fetchContracts = useCallback(async () => {
    // Always use real API data - no mock data fallbacks
    if (!user) return;
    setListLoading(true);
    contractsLog('Fetching real contract data from API...');

    try {
      const response = await contractService.getContracts();
      // Extract contracts array from response object
      const fetchedContracts = Array.isArray(response)
        ? response
        : response?.contracts || [];
      setContracts(fetchedContracts);
    } catch (err) {
      devError('Failed to fetch contracts:', err);
      setError('Could not load contract information. Please try again later.');
      showToast('Failed to load contracts.', 'error');
    } finally {
      setListLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const getContractById = useCallback(
    async (id) => {
      setDetailLoading(true);
      try {
        return await contractService.getContractById(id);
      } catch (err) {
        showToast(`Failed to retrieve contract ${id}.`, 'error');
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [showToast],
  );

  const approveMilestone = useCallback(
    async (contractId, milestoneId) => {
      try {
        const { success } = await contractService.approveMilestone(
          contractId,
          milestoneId,
        );
        if (success) {
          showToast('Milestone approved successfully!', 'success');
          setContracts((prev) =>
            prev.map((c) => {
              if (c.id !== contractId) return c;
              return {
                ...c,
                milestones: c.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, status: 'approved' } : m,
                ),
              };
            }),
          );
        } else {
          throw new Error('Milestone approval failed on the backend.');
        }
      } catch (err) {
        devError(err);
        showToast('Failed to approve milestone.', 'error');
      }
    },
    [showToast],
  );

  const value = {
    loading: listLoading || detailLoading, // backward-compatible aggregate
    listLoading,
    detailLoading,
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


