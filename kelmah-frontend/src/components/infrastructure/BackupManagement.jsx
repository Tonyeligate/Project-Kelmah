import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Button, 
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip 
} from '@mui/material';
import { 
    Backup, 
    Delete, 
    CloudDownload,
    Add 
} from '@mui/icons-material';

export function BackupManagement() {
    const [backups] = useState([
        { id: 1, name: 'Daily Backup', date: '2024-03-20', size: '1.2GB', status: 'completed' },
        { id: 2, name: 'Weekly Backup', date: '2024-03-19', size: '5.6GB', status: 'completed' },
    ]);

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Backup /> Backup Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                >
                    Create Backup
                </Button>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <List>
                        {backups.map((backup) => (
                            <ListItem key={backup.id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                                <ListItemText
                                    primary={backup.name}
                                    secondary={`Date: ${backup.date} | Size: ${backup.size}`}
                                />
                                <ListItemSecondaryAction>
                                    <Chip 
                                        label={backup.status} 
                                        color="success" 
                                        size="small" 
                                        sx={{ mr: 2 }} 
                                    />
                                    <IconButton>
                                        <CloudDownload />
                                    </IconButton>
                                    <IconButton color="error">
                                        <Delete />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </Grid>
            </Grid>
        </Paper>
    );
} 