import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from '@mui/material';

const WorkerComparisonTable = ({ workers = [] }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Worker Comparison
      </Typography>
      <TableContainer component={Paper} sx={{ p: 2 }}>
        <Table size="small" aria-label="Worker comparison table">
          <TableHead>
            <TableRow>
              <TableCell scope="col">Name</TableCell>
              <TableCell scope="col">Skills</TableCell>
              <TableCell scope="col">Rating</TableCell>
              <TableCell scope="col">Completed Jobs</TableCell>
              <TableCell scope="col">Avg Rate (GHS)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((w, index) => (
              <TableRow key={w?.id || w?._id || index}>
                <TableCell>{w?.name || 'N/A'}</TableCell>
                <TableCell>{Array.isArray(w?.skills) ? w.skills.join(', ') : (w?.skill || 'N/A')}</TableCell>
                <TableCell>{w?.rating != null ? Number(w.rating).toFixed(1) : 'N/A'}</TableCell>
                <TableCell>{w?.completedJobs ?? 'N/A'}</TableCell>
                <TableCell>{w?.avgRate != null ? `₵${w.avgRate}` : 'N/A'}</TableCell>
              </TableRow>
            ))}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No workers selected for comparison
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkerComparisonTable;
