import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    FormControlLabel,
    Switch,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Stack,
    useTheme,
    alpha
} from '@mui/material';
import {
    Edit as EditIcon,
    AccessTime as TimeIcon,
    Save as SaveIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';

const DAYS = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

function AvailabilityScheduler({ schedule = {}, onSave }) {
    const theme = useTheme();
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [editSchedule, setEditSchedule] = useState({});
    const [tempSchedule, setTempSchedule] = useState({});

    React.useEffect(() => {
        setEditSchedule(schedule);
    }, [schedule]);

    const handleOpenDialog = (day) => {
        setSelectedDay(day);
        setTempSchedule({
            ...editSchedule[day],
            isAvailable: editSchedule[day]?.isAvailable ?? false,
            startTime: editSchedule[day]?.startTime ? 
                parse(editSchedule[day].startTime, 'HH:mm', new Date()) : 
                parse('09:00', 'HH:mm', new Date()),
            endTime: editSchedule[day]?.endTime ? 
                parse(editSchedule[day].endTime, 'HH:mm', new Date()) : 
                parse('17:00', 'HH:mm', new Date())
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedDay(null);
        setTempSchedule({});
    };

    const handleSaveDay = () => {
        if (!selectedDay) return;

        const updatedSchedule = {
            ...editSchedule,
            [selectedDay]: {
                ...tempSchedule,
                startTime: format(tempSchedule.startTime, 'HH:mm'),
                endTime: format(tempSchedule.endTime, 'HH:mm')
            }
        };
        setEditSchedule(updatedSchedule);
        onSave(updatedSchedule);
        handleCloseDialog();
    };

    const handleClearDay = (day) => {
        const updatedSchedule = { ...editSchedule };
        delete updatedSchedule[day];
        setEditSchedule(updatedSchedule);
        onSave(updatedSchedule);
    };

    const getTimeString = (day) => {
        if (!editSchedule[day]?.isAvailable) return 'Unavailable';
        return `${editSchedule[day]?.startTime || '09:00'} - ${editSchedule[day]?.endTime || '17:00'}`;
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Availability Schedule
            </Typography>

            <Grid container spacing={2}>
                {DAYS.map((day) => (
                    <Grid item xs={12} key={day}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: editSchedule[day]?.isAvailable ? 
                                    alpha(theme.palette.success.main, 0.1) : 
                                    'background.paper'
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle1">
                                    {day}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TimeIcon 
                                        fontSize="small" 
                                        sx={{ 
                                            color: editSchedule[day]?.isAvailable ? 
                                                'success.main' : 
                                                'text.secondary' 
                                        }}
                                    />
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                    >
                                        {getTimeString(day)}
                                    </Typography>
                                </Stack>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(day)}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                {editSchedule[day] && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleClearDay(day)}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    Set {selectedDay} Schedule
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={tempSchedule.isAvailable}
                                    onChange={(e) => setTempSchedule(prev => ({
                                        ...prev,
                                        isAvailable: e.target.checked
                                    }))}
                                />
                            }
                            label="Available"
                        />

                        {tempSchedule.isAvailable && (
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Stack spacing={3} sx={{ mt: 2 }}>
                                    <TimePicker
                                        label="Start Time"
                                        value={tempSchedule.startTime}
                                        onChange={(newValue) => setTempSchedule(prev => ({
                                            ...prev,
                                            startTime: newValue
                                        }))}
                                    />
                                    <TimePicker
                                        label="End Time"
                                        value={tempSchedule.endTime}
                                        onChange={(newValue) => setTempSchedule(prev => ({
                                            ...prev,
                                            endTime: newValue
                                        }))}
                                    />
                                </Stack>
                            </LocalizationProvider>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveDay}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default AvailabilityScheduler;
