import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  LinearProgress,
  Divider,
  Stack
} from '@mui/material';
import { 
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * Component to display a summary of a worker's tasks with progress indicators
 */
const WorkerTaskSummary = ({ tasks }) => {
  // Format date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get status chip based on task status
  const getStatusChip = (status) => {
    const statusConfig = {
      'completed': { color: 'success', icon: <CompletedIcon fontSize="small" />, label: 'Completed' },
      'in-progress': { color: 'warning', icon: null, label: 'In Progress' },
      'pending': { color: 'info', icon: <PendingIcon fontSize="small" />, label: 'Pending' }
    };
    
    const config = statusConfig[status] || { color: 'default', icon: null, label: status };
    
    return (
      <Chip 
        size="small" 
        icon={config.icon}
        label={config.label} 
        color={config.color}
        variant={status === 'completed' ? 'filled' : 'outlined'}
      />
    );
  };
  
  if (!tasks || tasks.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Tasks</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            No tasks assigned yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Tasks</Typography>
        <Divider sx={{ mb: 2 }} />
        <List disablePadding>
          {tasks.map((task, index) => (
            <React.Fragment key={task.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" component="div" fontWeight="medium">
                        {task.title}
                      </Typography>
                      {getStatusChip(task.status)}
                    </Box>
                  }
                  secondary={
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Due: {formatDate(task.dueDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Priority: {task.priority}
                        </Typography>
                      </Box>
                      
                      {task.status !== 'completed' && (
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Progress</Typography>
                            <Typography variant="caption" color="text.secondary">{`${task.progress || 0}%`}</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={task.progress || 0} 
                            sx={{ height: 4, borderRadius: 2 }} 
                          />
                        </Box>
                      )}
                    </Stack>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

WorkerTaskSummary.propTypes = {
  /**
   * Array of task objects to display
   */
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      dueDate: PropTypes.string.isRequired,
      priority: PropTypes.string,
      progress: PropTypes.number
    })
  ).isRequired
};

export default WorkerTaskSummary; 