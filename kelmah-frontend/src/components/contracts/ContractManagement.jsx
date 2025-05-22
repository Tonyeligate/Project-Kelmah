import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Stack,
    Tooltip,
    IconButton,
    Menu,
    MenuItem,
    Divider
} from '@mui/material';
import {
    Assignment,
    AttachMoney,
    Person,
    MoreVert,
    Download,
    Edit,
    Cancel,
    CheckCircle,
    Close
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ContractService from '../../services/ContractService';
import DigitalSignature from './DigitalSignature';
import MilestoneTracker from './MilestoneTracker';

function ContractManagement() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedContract, setSelectedContract] = useState(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showSignatureDialog, setShowSignatureDialog] = useState(false);

    useEffect(() => {
        fetchContracts();
    }, [activeTab]);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            // Map tab index to status filter
            const statusFilters = ['active', 'pending_signature', 'completed'];
            const status = activeTab < statusFilters.length ? statusFilters[activeTab] : undefined;
            
            const response = await ContractService.getContracts({
                status: status,
                limit: 20
            });
            
            setContracts(response.data.contracts || response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setError('Failed to load contracts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleViewContract = (contractId) => {
        navigate(`/contracts/${contractId}`);
    };

    const handleEditContract = (contractId) => {
        navigate(`/contracts/edit/${contractId}`);
    };

    const handleDownloadContract = async (contractId) => {
        try {
            await ContractService.downloadContract(contractId);
        } catch (err) {
            console.error('Error downloading contract:', err);
            setError('Failed to download contract. Please try again.');
        }
    };

    const handlePayment = async () => {
        try {
            // This would typically go through a payment service
            // For now we just close the dialog
            setShowPaymentDialog(false);
            // Refresh the contracts list
            fetchContracts();
        } catch (err) {
            console.error('Error processing payment:', err);
            setError('Failed to process payment. Please try again.');
        }
    };

    const handleMenuOpen = (event, contractId) => {
        setAnchorEl(event.currentTarget);
        setSelectedContractId(contractId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedContractId(null);
    };

    const handleContractAction = async (action) => {
        if (!selectedContractId) return;
        
        try {
            handleMenuClose();
            
            switch (action) {
                case 'view':
                    handleViewContract(selectedContractId);
                    break;
                case 'edit':
                    handleEditContract(selectedContractId);
                    break;
                case 'download':
                    await handleDownloadContract(selectedContractId);
                    break;
                case 'sign':
                    // Find the contract and set it as selected
                    const contractToSign = contracts.find(c => c.id === selectedContractId);
                    setSelectedContract(contractToSign);
                    setShowSignatureDialog(true);
                    break;
                case 'cancel':
                    // Show confirm dialog and then cancel
                    if (window.confirm('Are you sure you want to cancel this contract?')) {
                        await ContractService.cancelContract(selectedContractId, 'Cancelled by user');
                        fetchContracts();
                    }
                    break;
                default:
                    console.warn(`Unhandled action: ${action}`);
            }
        } catch (err) {
            console.error(`Error performing ${action} action:`, err);
            setError(`Failed to ${action} contract. Please try again.`);
        }
    };

    const handleOpenSignatureDialog = (contract) => {
        setSelectedContract(contract);
        setShowSignatureDialog(true);
    };

    const handleSignatureComplete = () => {
        setShowSignatureDialog(false);
        fetchContracts(); // Refresh contracts after signing
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'pending_signature':
                return 'warning';
            case 'completed':
                return 'info';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        return status.replace('_', ' ').toUpperCase();
    };

    if (loading && contracts.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Contracts
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Active" />
                    <Tab label="Pending Signature" />
                    <Tab label="Completed" />
                </Tabs>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {contracts.length === 0 && !loading ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No contracts found in this category.
                    </Typography>
                    <Button 
                        variant="contained" 
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/contracts/create')}
                    >
                        Create New Contract
                    </Button>
                </Paper>
            ) : (
            <List>
                {contracts.map((contract) => (
                    <Paper key={contract.id} sx={{ mb: 2 }}>
                        <ListItem>
                            <ListItemAvatar>
                                <Avatar>
                                    <Assignment />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {contract.title || `Contract #${contract.contractNumber}`}
                                        <Chip
                                                label={getStatusLabel(contract.status)}
                                                color={getStatusColor(contract.status)}
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <>
                                        <Typography component="span" variant="body2">
                                            {user.role === 'hirer' ? 'Worker: ' : 'Hirer: '}
                                                {user.role === 'hirer' ? contract.worker?.name : contract.hirer?.name}
                                        </Typography>
                                        <br />
                                        <Typography component="span" variant="body2">
                                                Amount: {contract.currency || '$'}{contract.paymentAmount} • 
                                                Start Date: {new Date(contract.startDate).toLocaleDateString()}
                                        </Typography>
                                    </>
                                }
                            />
                            <Box>
                                    {contract.status === 'pending_signature' && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            sx={{ mr: 1 }}
                                            onClick={() => handleOpenSignatureDialog(contract)}
                                        >
                                            Sign
                                        </Button>
                                    )}
                                    
                                    <IconButton
                                        aria-label="more options"
                                        onClick={(e) => handleMenuOpen(e, contract.id)}
                                        size="small"
                                    >
                                        <MoreVert />
                                    </IconButton>
                                </Box>
                            </ListItem>
                    </Paper>
                ))}
            </List>
            )}

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleContractAction('view')}>
                    View Details
                </MenuItem>
                <MenuItem onClick={() => handleContractAction('edit')}>
                    Edit Contract
                </MenuItem>
                <MenuItem onClick={() => handleContractAction('download')}>
                    Download PDF
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleContractAction('sign')}>
                    Sign Contract
                </MenuItem>
                <MenuItem onClick={() => handleContractAction('cancel')} sx={{ color: 'error.main' }}>
                    Cancel Contract
                </MenuItem>
            </Menu>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
                <DialogTitle>Make Payment</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Amount"
                        type="number"
                        fullWidth
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        margin="normal"
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowPaymentDialog(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handlePayment} variant="contained" color="primary">
                        Process Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Signature Dialog */}
            <Dialog 
                open={showSignatureDialog} 
                onClose={() => setShowSignatureDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Sign Contract
                    <IconButton
                        aria-label="close"
                        onClick={() => setShowSignatureDialog(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedContract && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedContract.title || `Contract #${selectedContract.contractNumber}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Please review the contract carefully before signing.
                            </Typography>
                        <DigitalSignature 
                            contractId={selectedContract.id}
                            onSignComplete={handleSignatureComplete}
                        />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default ContractManagement; 