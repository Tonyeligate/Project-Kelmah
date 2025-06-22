import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { contractService } from '../services/contractService';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useNotifications } from '../../notifications/contexts/NotificationContext';
import { USE_MOCK_DATA } from '../../../config/env';

const ContractContext = createContext(null);

const mockContracts = [
    {
        id: '1',
        title: 'Complete Kitchen Remodel',
        hirer: { name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?u=alice' },
        value: 5000,
        amountPaid: 2500,
        endDate: '2024-09-15T23:59:59Z',
        status: 'active',
    },
    {
        id: '2',
        title: 'New Website Design',
        hirer: { name: 'Bob Williams', avatar: 'https://i.pravatar.cc/150?u=bob' },
        value: 3000,
        amountPaid: 3000,
        endDate: '2024-07-20T23:59:59Z',
        status: 'completed',
    },
    {
        id: '3',
        title: 'Initial Plumbing Consultation',
        hirer: { name: 'Charlie Brown', avatar: 'https://i.pravatar.cc/150?u=charlie' },
        value: 250,
        amountPaid: 0,
        endDate: '2024-08-05T23:59:59Z',
        status: 'pending',
    },
    {
        id: '4',
        title: 'Garden Landscaping Project',
        hirer: { name: 'Diana Miller', avatar: 'https://i.pravatar.cc/150?u=diana' },
        value: 7500,
        amountPaid: 1000,
        endDate: '2024-10-01T23:59:59Z',
        status: 'dispute',
    },
    {
        id: '5',
        title: 'House Repainting (Exterior)',
        hirer: { name: 'Ethan Davis', avatar: 'https://i.pravatar.cc/150?u=ethan' },
        value: 4200,
        amountPaid: 4200,
        endDate: '2024-06-30T23:59:59Z',
        status: 'completed',
    },
];

export const ContractProvider = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useNotifications();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contracts, setContracts] = useState([]);

    const fetchContracts = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        // Determine whether to use mock data
        const useMockData = USE_MOCK_DATA;

        if (useMockData) {
            console.log("Using mock contract data.");
            setTimeout(() => {
                setContracts(mockContracts);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const fetchedContracts = await contractService.getContracts();
            setContracts(fetchedContracts);
        } catch (err) {
            console.error("Failed to fetch contracts:", err);
            setError("Could not load contract information. Please try again later.");
            showToast("Failed to load contracts.", "error");
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const getContractById = useCallback(async (id) => {
        // Also mock if configured
        if (USE_MOCK_DATA) {
            const contract = mockContracts.find(c => c.id === id);
            return contract || null;
        }
        
        setLoading(true);
        try {
            return await contractService.getContractById(id);
        } catch(err) {
            showToast(`Failed to retrieve contract ${id}.`, "error");
            return null;
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const approveMilestone = useCallback(async (contractId, milestoneId) => {
        // Mock if configured
        if (USE_MOCK_DATA) {
            showToast("Milestone approved successfully! (Mock)", "success");
            return;
        }
        try {
            const { success } = await contractService.approveMilestone(contractId, milestoneId);
            if (success) {
                showToast("Milestone approved successfully!", "success");
                const updatedContracts = contracts.map(c => {
                    if (c.id === contractId) {
                        c.milestones.find(m => m.id === milestoneId).status = 'paid';
                    }
                    return c;
                });
                setContracts(updatedContracts);
            } else {
                throw new Error("Milestone approval failed on the backend.");
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to approve milestone.", "error");
        }
    }, [contracts, showToast]);

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
