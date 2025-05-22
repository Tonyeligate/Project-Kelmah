import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    Alert,
    Chip
} from '@mui/material';
import {
    Merge,
    CallSplit,
    Delete,
    Lock,
    LockOpen,
    History,
    Compare,
    BranchingPoint
} from '@mui/icons-material';
import * as d3 from 'd3';

function BranchVisualization({ templateId }) {
    const [branches, setBranches] = useState([]);
    const [commits, setCommits] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [newBranchDialog, setNewBranchDialog] = useState(false);
    const svgRef = useRef(null);

    useEffect(() => {
        loadBranchData();
    }, [templateId]);

    useEffect(() => {
        if (branches.length && commits.length) {
            renderBranchGraph();
        }
    }, [branches, commits]);

    const loadBranchData = async () => {
        try {
            const [branchesRes, commitsRes] = await Promise.all([
                api.get(`/api/templates/${templateId}/branches`),
                api.get(`/api/templates/${templateId}/commits`)
            ]);
            setBranches(branchesRes.data);
            setCommits(commitsRes.data);
        } catch (error) {
            console.error('Failed to load branch data:', error);
        }
    };

    const renderBranchGraph = () => {
        const svg = d3.select(svgRef.current);
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        // Clear previous rendering
        svg.selectAll('*').remove();

        // Create graph layout
        const graph = createGraphLayout(commits, branches);

        // Add links (branch lines)
        svg.append('g')
            .selectAll('line')
            .data(graph.links)
            .enter()
            .append('line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', d => d.color)
            .attr('stroke-width', 2);

        // Add nodes (commits)
        const nodes = svg.append('g')
            .selectAll('circle')
            .data(graph.nodes)
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 6)
            .attr('fill', d => d.color)
            .on('click', handleCommitClick)
            .on('mouseover', handleCommitHover);

        // Add commit messages
        svg.append('g')
            .selectAll('text')
            .data(graph.nodes)
            .enter()
            .append('text')
            .attr('x', d => d.x + 10)
            .attr('y', d => d.y + 5)
            .text(d => d.message.substring(0, 30) + (d.message.length > 30 ? '...' : ''))
            .style('font-size', '12px');

        // Add branch labels
        svg.append('g')
            .selectAll('text')
            .data(branches)
            .enter()
            .append('text')
            .attr('x', d => d.x)
            .attr('y', d => d.y - 15)
            .text(d => d.name)
            .style('font-size', '14px')
            .style('font-weight', 'bold');
    };

    const createGraphLayout = (commits, branches) => {
        // Create graph layout logic here
        // This would involve creating a DAG (Directed Acyclic Graph)
        // and calculating positions for nodes and edges
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Branch Visualization</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        startIcon={<CallSplit />}
                        onClick={() => setNewBranchDialog(true)}
                    >
                        New Branch
                    </Button>
                    <Button
                        startIcon={<Merge />}
                        disabled={!selectedBranch}
                        onClick={handleMerge}
                    >
                        Merge
                    </Button>
                </Box>
            </Box>

            <Box sx={{ height: 500 }}>
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    style={{ border: '1px solid #eee' }}
                />
            </Box>

            {/* Branch creation dialog */}
            <Dialog
                open={newBranchDialog}
                onClose={() => setNewBranchDialog(false)}
            >
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Branch Name"
                        sx={{ mt: 2 }}
                    />
                    <Select
                        fullWidth
                        label="Source Branch"
                        sx={{ mt: 2 }}
                    >
                        {branches.map(branch => (
                            <MenuItem key={branch.id} value={branch.id}>
                                {branch.name}
                            </MenuItem>
                        ))}
                    </Select>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewBranchDialog(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleCreateBranch}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

// Conflict Resolution UI
function ConflictResolution({ conflicts, onResolve }) {
    const [resolutions, setResolutions] = useState({});
    const [selectedConflict, setSelectedConflict] = useState(null);

    const handleResolveConflict = (conflictId, resolution) => {
        setResolutions(prev => ({
            ...prev,
            [conflictId]: resolution
        }));
    };

    const handleSaveResolutions = async () => {
        try {
            await api.post('/api/merge/resolve', {
                resolutions
            });
            onResolve();
        } catch (error) {
            console.error('Failed to save resolutions:', error);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Resolve Conflicts
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="error">
                    {conflicts.length} conflicts need to be resolved
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', height: 500 }}>
                <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', p: 2 }}>
                    {conflicts.map(conflict => (
                        <Box
                            key={conflict.id}
                            sx={{
                                p: 2,
                                mb: 1,
                                cursor: 'pointer',
                                bgcolor: selectedConflict?.id === conflict.id ? 'action.selected' : 'transparent',
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                }
                            }}
                            onClick={() => setSelectedConflict(conflict)}
                        >
                            <Typography variant="subtitle2">
                                {conflict.path}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {conflict.type}
                            </Typography>
                            {resolutions[conflict.id] && (
                                <Chip
                                    size="small"
                                    label="Resolved"
                                    color="success"
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </Box>
                    ))}
                </Box>

                <Box sx={{ flex: 1, p: 2 }}>
                    {selectedConflict && (
                        <>
                            <Typography variant="subtitle1" gutterBottom>
                                Resolving: {selectedConflict.path}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <Button
                                    size="small"
                                    onClick={() => handleResolveConflict(selectedConflict.id, 'source')}
                                >
                                    Use Source
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => handleResolveConflict(selectedConflict.id, 'target')}
                                >
                                    Use Target
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => handleResolveConflict(selectedConflict.id, 'custom')}
                                >
                                    Custom Resolution
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Source Version
                                    </Typography>
                                    <pre style={{ 
                                        backgroundColor: '#f5f5f5',
                                        padding: 16,
                                        borderRadius: 4,
                                        overflow: 'auto'
                                    }}>
                                        {selectedConflict.sourceContent}
                                    </pre>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Target Version
                                    </Typography>
                                    <pre style={{
                                        backgroundColor: '#f5f5f5',
                                        padding: 16,
                                        borderRadius: 4,
                                        overflow: 'auto'
                                    }}>
                                        {selectedConflict.targetContent}
                                    </pre>
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={handleSaveResolutions}
                    disabled={Object.keys(resolutions).length !== conflicts.length}
                >
                    Save Resolutions
                </Button>
            </Box>
        </Paper>
    );
}

export { BranchVisualization, ConflictResolution }; 