import React, { useState } from 'react';
import {
    Box,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Alert,
    CircularProgress
} from '@mui/material';
import { JsonEditor } from 'jsoneditor-react';

function TemplateValidation({ template, onValidate }) {
    const [validating, setValidating] = useState(false);
    const [results, setResults] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleValidate = async () => {
        setValidating(true);
        try {
            const response = await api.post('/api/templates/validate', template);
            setResults(response.data);
            onValidate(response.data);
        } catch (error) {
            setResults({ valid: false, errors: [error.message] });
        } finally {
            setValidating(false);
        }
    };

    return (
        <Box>
            <Button
                variant="outlined"
                onClick={handleValidate}
                disabled={validating}
            >
                Validate Template
            </Button>
            <Button
                variant="outlined"
                onClick={() => setPreviewOpen(true)}
                sx={{ ml: 1 }}
            >
                Preview
            </Button>

            {results && (
                <Alert severity={results.valid ? 'success' : 'error'} sx={{ mt: 2 }}>
                    {results.valid ? 'Template is valid' : results.errors.join(', ')}
                </Alert>
            )}

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Template Preview</DialogTitle>
                <DialogContent>
                    <JsonEditor
                        value={template}
                        mode="view"
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default TemplateValidation; 