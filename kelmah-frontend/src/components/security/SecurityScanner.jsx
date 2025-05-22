import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Button, 
    Grid,
    Alert,
    CircularProgress 
} from '@mui/material';
import { Security, Refresh } from '@mui/icons-material';

export function SecurityScanner() {
    const [scanning, setScanning] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);

    const startScan = async () => {
        setScanning(true);
        try {
            // Simulate a scan
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLastScanResult({
                timestamp: new Date().toISOString(),
                status: 'completed',
                issues: []
            });
        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setScanning(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security /> Security Scanner
                </Typography>
                <Button
                    variant="contained"
                    startIcon={scanning ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                    onClick={startScan}
                    disabled={scanning}
                >
                    {scanning ? 'Scanning...' : 'Start Scan'}
                </Button>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    {lastScanResult ? (
                        <Alert severity="success">
                            Last scan completed at {new Date(lastScanResult.timestamp).toLocaleString()}
                        </Alert>
                    ) : (
                        <Alert severity="info">
                            No recent scan results available. Click "Start Scan" to begin.
                        </Alert>
                    )}
                </Grid>
            </Grid>
        </Paper>
    );
} 