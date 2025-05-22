import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Typography,
    Paper,
    Box
} from '@mui/material';
import { Preview } from '@mui/icons-material';

function TemplatePreview({ template, open, onClose }) {
    const [variables, setVariables] = useState({});
    const [preview, setPreview] = useState('');

    const handleVariableChange = (name, value) => {
        setVariables(prev => ({
            ...prev,
            [name]: value
        }));

        // Update preview
        let content = template.content;
        Object.entries({ ...variables, [name]: value }).forEach(([key, val]) => {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), val || `{{${key}}}`);
        });
        setPreview(content);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    {/* Variables */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Template Variables
                        </Typography>
                        {JSON.parse(template.variables).map(variable => (
                            <TextField
                                key={variable}
                                fullWidth
                                label={variable}
                                value={variables[variable] || ''}
                                onChange={(e) => handleVariableChange(variable, e.target.value)}
                                margin="normal"
                                size="small"
                            />
                        ))}
                    </Grid>

                    {/* Preview */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Preview
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, minHeight: 200 }}>
                            <Typography
                                component="div"
                                sx={{ whiteSpace: 'pre-wrap' }}
                            >
                                {preview || template.content}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default TemplatePreview; 