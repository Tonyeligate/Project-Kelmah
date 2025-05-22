import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider,
    Switch,
    FormControlLabel,
    Button,
    Chip,
    ColorPicker,
    Dialog
} from '@mui/material';

const CHART_TYPES = {
    line: {
        options: ['curved', 'stepped', 'linear'],
        features: ['dots', 'area', 'gradient']
    },
    bar: {
        options: ['grouped', 'stacked', 'horizontal'],
        features: ['labels', 'gradient', 'rounded']
    },
    area: {
        options: ['stacked', 'stream', 'normalized'],
        features: ['gradient', 'smooth', 'dots']
    }
};

function ChartConfigurator({ config, onChange }) {
    const [localConfig, setLocalConfig] = useState(config);

    const handleChange = (key, value) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        onChange(newConfig);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Chart Configuration</Typography>
            
            <Grid container spacing={3}>
                {/* Chart Type Selection */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Chart Type</InputLabel>
                        <Select
                            value={localConfig.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            {Object.keys(CHART_TYPES).map(type => (
                                <MenuItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Style Options */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Style Variant</InputLabel>
                        <Select
                            value={localConfig.style}
                            onChange={(e) => handleChange('style', e.target.value)}
                        >
                            {CHART_TYPES[localConfig.type]?.options.map(option => (
                                <MenuItem key={option} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Features */}
                <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Features</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {CHART_TYPES[localConfig.type]?.features.map(feature => (
                            <FormControlLabel
                                key={feature}
                                control={
                                    <Switch
                                        checked={localConfig.features?.[feature] || false}
                                        onChange={(e) => handleChange('features', {
                                            ...localConfig.features,
                                            [feature]: e.target.checked
                                        })}
                                    />
                                }
                                label={feature.charAt(0).toUpperCase() + feature.slice(1)}
                            />
                        ))}
                    </Box>
                </Grid>

                {/* Colors */}
                <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Colors</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {localConfig.colors?.map((color, index) => (
                            <ColorPicker
                                key={index}
                                value={color}
                                onChange={(newColor) => {
                                    const newColors = [...localConfig.colors];
                                    newColors[index] = newColor;
                                    handleChange('colors', newColors);
                                }}
                            />
                        ))}
                        <Button
                            size="small"
                            onClick={() => handleChange('colors', [...localConfig.colors, '#000000'])}
                        >
                            Add Color
                        </Button>
                    </Box>
                </Grid>

                {/* Dimensions */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Height</Typography>
                    <Slider
                        value={localConfig.height}
                        onChange={(e, value) => handleChange('height', value)}
                        min={200}
                        max={800}
                        step={50}
                        marks
                        valueLabelDisplay="auto"
                    />
                </Grid>

                {/* Margins */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Margins</Typography>
                    <Grid container spacing={2}>
                        {['top', 'right', 'bottom', 'left'].map(side => (
                            <Grid item xs={3} key={side}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{side}</InputLabel>
                                    <Select
                                        value={localConfig.margins?.[side] || 0}
                                        onChange={(e) => handleChange('margins', {
                                            ...localConfig.margins,
                                            [side]: e.target.value
                                        })}
                                    >
                                        {[0, 10, 20, 30, 40, 50].map(value => (
                                            <MenuItem key={value} value={value}>{value}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default ChartConfigurator; 