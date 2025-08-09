import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contractService } from './contractService';

// Async thunks
export const fetchContracts = createAsyncThunk(
  'contracts/fetchContracts',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await contractService.getContracts(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchContractById = createAsyncThunk(
  'contracts/fetchContractById',
  async (contractId, { rejectWithValue }) => {
    try {
      const response = await contractService.getContractById(contractId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createContract = createAsyncThunk(
  'contracts/createContract',
  async (contractData, { rejectWithValue }) => {
    try {
      const response = await contractService.createContract(contractData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateContract = createAsyncThunk(
  'contracts/updateContract',
  async ({ contractId, contractData }, { rejectWithValue }) => {
    try {
      const response = await contractService.updateContract(
        contractId,
        contractData,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const signContract = createAsyncThunk(
  'contracts/signContract',
  async ({ contractId, signatureData }, { rejectWithValue }) => {
    try {
      const response = await contractService.signContract(
        contractId,
        signatureData,
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const sendContractForSignature = createAsyncThunk(
  'contracts/sendContractForSignature',
  async (contractId, { rejectWithValue }) => {
    try {
      const response =
        await contractService.sendContractForSignature(contractId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchContractMilestones = createAsyncThunk(
  'contracts/fetchContractMilestones',
  async (contractId, { rejectWithValue }) => {
    try {
      const response = await contractService.getContractMilestones(contractId);
      return { contractId, milestones: response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createMilestone = createAsyncThunk(
  'contracts/createMilestone',
  async ({ contractId, milestoneData }, { rejectWithValue }) => {
    try {
      const response = await contractService.createMilestone(
        contractId,
        milestoneData,
      );
      return { contractId, milestone: response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const completeMilestone = createAsyncThunk(
  'contracts/completeMilestone',
  async ({ contractId, milestoneId, completionData }, { rejectWithValue }) => {
    try {
      const response = await contractService.completeMilestone(
        contractId,
        milestoneId,
        completionData,
      );
      return { contractId, milestoneId, updatedMilestone: response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const cancelContract = createAsyncThunk(
  'contracts/cancelContract',
  async ({ contractId, reason }, { rejectWithValue }) => {
    try {
      const response = await contractService.cancelContract(contractId, reason);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createDispute = createAsyncThunk(
  'contracts/createDispute',
  async ({ contractId, disputeData }, { rejectWithValue }) => {
    try {
      const response = await contractService.createDispute(
        contractId,
        disputeData,
      );
      return { contractId, dispute: response };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchContractTemplates = createAsyncThunk(
  'contracts/fetchContractTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await contractService.getContractTemplates();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Initial state
const initialState = {
  contracts: [],
  currentContract: null,
  contractMilestones: {},
  contractTemplates: [],
  disputes: [],
  loading: {
    contracts: false,
    currentContract: false,
    milestones: false,
    templates: false,
    createContract: false,
    updateContract: false,
    signContract: false,
    dispute: false,
  },
  error: {
    contracts: null,
    currentContract: null,
    milestones: null,
    templates: null,
    createContract: null,
    updateContract: null,
    signContract: null,
    dispute: null,
  },
};

// Contract slice
const contractSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    resetContractErrors: (state) => {
      state.error = {
        contracts: null,
        currentContract: null,
        milestones: null,
        templates: null,
        createContract: null,
        updateContract: null,
        signContract: null,
        dispute: null,
      };
    },
    clearCurrentContract: (state) => {
      state.currentContract = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch contracts
    builder
      .addCase(fetchContracts.pending, (state) => {
        state.loading.contracts = true;
        state.error.contracts = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.loading.contracts = false;
        state.contracts = action.payload;
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.loading.contracts = false;
        state.error.contracts = action.payload;
      })

      // Fetch contract by ID
      .addCase(fetchContractById.pending, (state) => {
        state.loading.currentContract = true;
        state.error.currentContract = null;
      })
      .addCase(fetchContractById.fulfilled, (state, action) => {
        state.loading.currentContract = false;
        state.currentContract = action.payload;
      })
      .addCase(fetchContractById.rejected, (state, action) => {
        state.loading.currentContract = false;
        state.error.currentContract = action.payload;
      })

      // Create contract
      .addCase(createContract.pending, (state) => {
        state.loading.createContract = true;
        state.error.createContract = null;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.loading.createContract = false;
        state.contracts.push(action.payload);
        state.currentContract = action.payload;
      })
      .addCase(createContract.rejected, (state, action) => {
        state.loading.createContract = false;
        state.error.createContract = action.payload;
      })

      // Update contract
      .addCase(updateContract.pending, (state) => {
        state.loading.updateContract = true;
        state.error.updateContract = null;
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.loading.updateContract = false;
        const updatedContract = action.payload;

        state.contracts = state.contracts.map((contract) =>
          contract.id === updatedContract.id ? updatedContract : contract,
        );

        if (
          state.currentContract &&
          state.currentContract.id === updatedContract.id
        ) {
          state.currentContract = updatedContract;
        }
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.loading.updateContract = false;
        state.error.updateContract = action.payload;
      })

      // Sign contract
      .addCase(signContract.pending, (state) => {
        state.loading.signContract = true;
        state.error.signContract = null;
      })
      .addCase(signContract.fulfilled, (state, action) => {
        state.loading.signContract = false;
        const signedContract = action.payload;

        state.contracts = state.contracts.map((contract) =>
          contract.id === signedContract.id ? signedContract : contract,
        );

        if (
          state.currentContract &&
          state.currentContract.id === signedContract.id
        ) {
          state.currentContract = signedContract;
        }
      })
      .addCase(signContract.rejected, (state, action) => {
        state.loading.signContract = false;
        state.error.signContract = action.payload;
      })

      // Send contract for signature
      .addCase(sendContractForSignature.pending, (state) => {
        state.loading.currentContract = true;
        state.error.currentContract = null;
      })
      .addCase(sendContractForSignature.fulfilled, (state, action) => {
        state.loading.currentContract = false;
        const updatedContract = action.payload;

        state.contracts = state.contracts.map((contract) =>
          contract.id === updatedContract.id ? updatedContract : contract,
        );

        if (
          state.currentContract &&
          state.currentContract.id === updatedContract.id
        ) {
          state.currentContract = updatedContract;
        }
      })
      .addCase(sendContractForSignature.rejected, (state, action) => {
        state.loading.currentContract = false;
        state.error.currentContract = action.payload;
      })

      // Fetch contract milestones
      .addCase(fetchContractMilestones.pending, (state) => {
        state.loading.milestones = true;
        state.error.milestones = null;
      })
      .addCase(fetchContractMilestones.fulfilled, (state, action) => {
        state.loading.milestones = false;
        const { contractId, milestones } = action.payload;
        state.contractMilestones[contractId] = milestones;
      })
      .addCase(fetchContractMilestones.rejected, (state, action) => {
        state.loading.milestones = false;
        state.error.milestones = action.payload;
      })

      // Create milestone
      .addCase(createMilestone.pending, (state) => {
        state.loading.milestones = true;
        state.error.milestones = null;
      })
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.loading.milestones = false;
        const { contractId, milestone } = action.payload;

        if (state.contractMilestones[contractId]) {
          state.contractMilestones[contractId].push(milestone);
        } else {
          state.contractMilestones[contractId] = [milestone];
        }
      })
      .addCase(createMilestone.rejected, (state, action) => {
        state.loading.milestones = false;
        state.error.milestones = action.payload;
      })

      // Complete milestone
      .addCase(completeMilestone.pending, (state) => {
        state.loading.milestones = true;
        state.error.milestones = null;
      })
      .addCase(completeMilestone.fulfilled, (state, action) => {
        state.loading.milestones = false;
        const { contractId, milestoneId, updatedMilestone } = action.payload;

        if (state.contractMilestones[contractId]) {
          state.contractMilestones[contractId] = state.contractMilestones[
            contractId
          ].map((milestone) =>
            milestone.id === milestoneId ? updatedMilestone : milestone,
          );
        }
      })
      .addCase(completeMilestone.rejected, (state, action) => {
        state.loading.milestones = false;
        state.error.milestones = action.payload;
      })

      // Cancel contract
      .addCase(cancelContract.pending, (state) => {
        state.loading.currentContract = true;
        state.error.currentContract = null;
      })
      .addCase(cancelContract.fulfilled, (state, action) => {
        state.loading.currentContract = false;
        const cancelledContract = action.payload;

        state.contracts = state.contracts.map((contract) =>
          contract.id === cancelledContract.id ? cancelledContract : contract,
        );

        if (
          state.currentContract &&
          state.currentContract.id === cancelledContract.id
        ) {
          state.currentContract = cancelledContract;
        }
      })
      .addCase(cancelContract.rejected, (state, action) => {
        state.loading.currentContract = false;
        state.error.currentContract = action.payload;
      })

      // Create dispute
      .addCase(createDispute.pending, (state) => {
        state.loading.dispute = true;
        state.error.dispute = null;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.loading.dispute = false;
        const { dispute } = action.payload;
        state.disputes.push(dispute);
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.loading.dispute = false;
        state.error.dispute = action.payload;
      })

      // Fetch contract templates
      .addCase(fetchContractTemplates.pending, (state) => {
        state.loading.templates = true;
        state.error.templates = null;
      })
      .addCase(fetchContractTemplates.fulfilled, (state, action) => {
        state.loading.templates = false;
        state.contractTemplates = action.payload;
      })
      .addCase(fetchContractTemplates.rejected, (state, action) => {
        state.loading.templates = false;
        state.error.templates = action.payload;
      });
  },
});

// Selectors
export const selectContracts = (state) => state.contract.contracts;
export const selectCurrentContract = (state) => state.contract.currentContract;
export const selectContractMilestones = (state, contractId) =>
  state.contract.contractMilestones[contractId] || [];
export const selectContractTemplates = (state) =>
  state.contract.contractTemplates;
export const selectDisputes = (state) => state.contract.disputes;
export const selectContractsLoading = (state) => state.contract.loading;
export const selectContractsError = (state) => state.contract.error;

// Actions
export const { resetContractErrors, clearCurrentContract } =
  contractSlice.actions;

// Reducer
export default contractSlice.reducer;
