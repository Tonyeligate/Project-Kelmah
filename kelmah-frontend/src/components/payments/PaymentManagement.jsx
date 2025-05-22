import React, { useState } from 'react';
import { 
    Tabs,
    Tab,
    Box,
    Paper 
} from '@mui/material';
import PaymentMethodForm from './PaymentMethodForm';
import TransactionHistory from './TransactionHistory';

function PaymentManagement() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ mb: 3 }}
            >
                <Tab label="Payment Methods" />
                <Tab label="Transactions" />
            </Tabs>

            <Box role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && <PaymentMethodForm />}
            </Box>

            <Box role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && <TransactionHistory />}
            </Box>
        </Paper>
    );
}

export default PaymentManagement; 