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
} from '@mui/material';

const WorkerComparisonTable = ({ workers = [] }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Worker Comparison
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Skill</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Completed Jobs</TableCell>
              <TableCell>Avg Rate (GHS)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.skill}</TableCell>
                <TableCell>{w.rating}</TableCell>
                <TableCell>{w.completedJobs}</TableCell>
                <TableCell>{w.avgRate}</TableCell>
              </TableRow>
            ))}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No workers selected
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default WorkerComparisonTable;
