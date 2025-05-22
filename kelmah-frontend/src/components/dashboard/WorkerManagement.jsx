import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    Typography,
    TextField,
    InputAdornment,
    Chip,
    Avatar,
    Rating,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Search,
    FilterList,
    MoreVert,
    LocationOn,
    Engineering,
    Star
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';

function WorkerManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [selectedTrade, setSelectedTrade] = useState('all');
    const workers = useSelector(state => state.dashboard.data.workers);

    const trades = ['Electrical', 'Plumbing', 'Carpentry', 'HVAC', 'Masonry'];

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                {/* Search and Filters */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search workers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                        >
                            Filter
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                        {trades.map(trade => (
                            <Chip
                                key={trade}
                                label={trade}
                                onClick={() => setSelectedTrade(trade)}
                                color={selectedTrade === trade ? 'primary' : 'default'}
                            />
                        ))}
                    </Box>
                </Grid>

                {/* Workers Table */}
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Worker</TableCell>
                                    <TableCell>Trade</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Rating</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {workers?.map(worker => (
                                    <TableRow key={worker.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar src={worker.avatar} />
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {worker.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {worker.specialization}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={<Engineering />}
                                                label={worker.trade}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LocationOn fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {worker.location}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Rating value={worker.rating} readOnly size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={worker.status}
                                                color={worker.status === 'available' ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton>
                                                <MoreVert />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    );
}

export default WorkerManagement; 