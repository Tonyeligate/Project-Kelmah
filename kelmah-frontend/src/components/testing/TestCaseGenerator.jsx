import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Button,
    TextField,
    Slider,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    AutoFixHigh,
    Info,
    Add,
    PlayArrow,
    Save,
    Delete
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

function TestCaseGenerator({ workflowId, onGenerate }) {
    const [options, setOptions] = useState({
        strategies: {
            boundary: true,
            path: true,
            data: true,
            error: true
        },
        settings: {
            maxCases: 20,
            complexity: 'medium',
            includeEdgeCases: true,
            dataVariations: 5
        }
    });
    const [generating, setGenerating] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewCases, setPreviewCases] = useState([]);
    const { enqueueSnackbar } = useSnackbar();

    const handleStrategyChange = (strategy) => {
        setOptions(prev => ({
            ...prev,
            strategies: {
                ...prev.strategies,
                [strategy]: !prev.strategies[strategy]
            }
        }));
    };

    const handleSettingChange = (setting, value) => {
        setOptions(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [setting]: value
            }
        }));
    };

    const handlePreviewGenerate = async () => {
        try {
            setGenerating(true);
            const response = await api.post(`/api/workflows/${workflowId}/tests/preview`, options);
            setPreviewCases(response.data);
            setPreviewOpen(true);
        } catch (error) {
            enqueueSnackbar('Error generating test case preview', { variant: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const response = await api.post(`/api/workflows/${workflowId}/tests/generate`, options);
            onGenerate(response.data);
            enqueueSnackbar('Test cases generated successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Error generating test cases', { variant: 'error' });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Test Case Generator
                </Typography>

                <Grid container spacing={3}>
                    {/* Generation Strategies */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Generation Strategies
                                </Typography>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={options.strategies.boundary}
                                                onChange={() => handleStrategyChange('boundary')}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                Boundary Value Testing
                                                <Tooltip title="Generate test cases for boundary conditions and edge cases">
                                                    <IconButton size="small">
                                                        <Info fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={options.strategies.path}
                                                onChange={() => handleStrategyChange('path')}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                Path Coverage
                                                <Tooltip title="Generate test cases to cover different workflow paths">
                                                    <IconButton size="small">
                                                        <Info fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={options.strategies.data}
                                                onChange={() => handleStrategyChange('data')}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                Data Variations
                                                <Tooltip title="Generate test cases with different data combinations">
                                                    <IconButton size="small">
                                                        <Info fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={options.strategies.error}
                                                onChange={() => handleStrategyChange('error')}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                Error Scenarios
                                                <Tooltip title="Generate test cases for error handling">
                                                    <IconButton size="small">
                                                        <Info fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        }
                                    />
                                </FormGroup>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Generation Settings */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Generation Settings
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        Maximum Test Cases
                                    </Typography>
                                    <Slider
                                        value={options.settings.maxCases}
                                        onChange={(e, value) => handleSettingChange('maxCases', value)}
                                        min={5}
                                        max={50}
                                        marks
                                        valueLabelDisplay="auto"
                                    />
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                        Test Complexity
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {['simple', 'medium', 'complex'].map(level => (
                                            <Grid item key={level}>
                                                <Chip
                                                    label={level}
                                                    onClick={() => handleSettingChange('complexity', level)}
                                                    color={options.settings.complexity === level ? 'primary' : 'default'}
                                                    variant={options.settings.complexity === level ? 'filled' : 'outlined'}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={options.settings.includeEdgeCases}
                                            onChange={(e) => handleSettingChange('includeEdgeCases', e.target.checked)}
                                        />
                                    }
                                    label="Include Edge Cases"
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        onClick={handlePreviewGenerate}
                        disabled={generating}
                    >
                        Preview
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AutoFixHigh />}
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        Generate Test Cases
                    </Button>
                </Box>
            </Paper>

            {/* Preview Dialog */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Test Case Preview</DialogTitle>
                <DialogContent>
                    <List>
                        {previewCases.map((testCase, index) => (
                            <ListItem key={index}>
                                <ListItemText
                                    primary={testCase.name}
                                    secondary={
                                        <React.Fragment>
                                            <Typography variant="body2" color="textSecondary">
                                                {testCase.description}
                                            </Typography>
                                            <Chip
                                                label={testCase.type}
                                                size="small"
                                                sx={{ mt: 1 }}
                                            />
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleGenerate}
                        disabled={generating}
                    >
                        Generate All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default TestCaseGenerator; 