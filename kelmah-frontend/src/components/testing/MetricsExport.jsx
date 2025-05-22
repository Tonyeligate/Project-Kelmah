import React, { useState } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    CircularProgress
} from '@mui/material';
import {
    Download,
    TableChart,
    PictureAsPdf
} from '@mui/icons-material';

function MetricsExport({ data }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [exporting, setExporting] = useState(false);

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const response = await api.post('/api/metrics/export', {
                data,
                format
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `metrics-report.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
            setAnchorEl(null);
        }
    };

    return (
        <>
            <Button
                startIcon={<Download />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                disabled={exporting}
            >
                {exporting ? <CircularProgress size={24} /> : 'Export'}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => handleExport('xlsx')}>
                    <TableChart sx={{ mr: 1 }} /> Excel
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                    <TableChart sx={{ mr: 1 }} /> CSV
                </MenuItem>
                <MenuItem onClick={() => handleExport('pdf')}>
                    <PictureAsPdf sx={{ mr: 1 }} /> PDF
                </MenuItem>
            </Menu>
        </>
    );
}

export default MetricsExport; 