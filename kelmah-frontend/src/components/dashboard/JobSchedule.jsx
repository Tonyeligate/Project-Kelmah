import React from 'react';
import { 
    Paper, 
    Typography, 
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton
} from '@mui/material';
import { 
    Event as EventIcon,
    MoreVert as MoreVertIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

function JobSchedule({ schedule }) {
    const getStatusColor = (status) => {
        const colors = {
            'scheduled': 'primary',
            'in-progress': 'warning',
            'completed': 'success',
            'cancelled': 'error'
        };
        return colors[status] || 'default';
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                    Weekly Schedule
                </Typography>
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date & Time</TableCell>
                            <TableCell>Job</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {schedule?.map((job) => (
                            <TableRow key={job.id} hover>
                                <TableCell>
                                    {format(new Date(job.datetime), 'PPp')}
                                </TableCell>
                                <TableCell>{job.title}</TableCell>
                                <TableCell>{job.client}</TableCell>
                                <TableCell>{job.location}</TableCell>
                                <TableCell>
                                    <Chip
                                        icon={<CircleIcon sx={{ fontSize: '12px !important' }} />}
                                        label={job.status}
                                        size="small"
                                        color={getStatusColor(job.status)}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small">
                                        <MoreVertIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

export default JobSchedule; 