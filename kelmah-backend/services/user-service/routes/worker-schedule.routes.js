const express = require('express');
const router = express.Router();

// Temporary authentication middleware
const authMiddleware = {
  authenticate: (req, res, next) => {
    // For development, just add a mock user to the request
    req.user = { id: req.params.userId || 'development-user-id' };
    next();
  }
};

// Mock data for worker scheduling
const workerScheduleData = {
  availability: {
    id: 'avail-123',
    userId: 'user-123',
    generalAvailability: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isAvailable: true },
      { dayOfWeek: 7, startTime: '00:00', endTime: '00:00', isAvailable: false }
    ],
    specialDays: [
      { date: '2025-04-15', startTime: '12:00', endTime: '17:00', isAvailable: true, note: 'Only available afternoon' },
      { date: '2025-04-20', startTime: '00:00', endTime: '00:00', isAvailable: false, note: 'Family event' },
      { date: '2025-05-01', startTime: '00:00', endTime: '00:00', isAvailable: false, note: 'Holiday' }
    ],
    workRadius: 25, // miles
    preferredLocations: ['Boston', 'Cambridge', 'Somerville'],
    isRemoteAvailable: true,
    minimumJobDuration: 2, // hours
    noticeRequired: 48, // hours
    updatedAt: '2025-03-15T14:30:00Z'
  },
  appointments: [
    {
      id: 'appt-1',
      title: 'Kitchen Remodeling - Initial Consultation',
      jobId: 'job-1',
      clientName: 'Robert Johnson',
      clientId: 'client-101',
      location: {
        address: '123 Main St, Boston, MA',
        latitude: 42.3601,
        longitude: -71.0589
      },
      date: '2025-03-22',
      startTime: '09:00',
      endTime: '11:00',
      status: 'confirmed',
      description: 'Discuss final countertop installation details and timeline',
      notes: 'Bring measurement tools and countertop samples',
      reminderSent: true,
      createdAt: '2025-03-15T10:00:00Z'
    },
    {
      id: 'appt-2',
      title: 'Bathroom Plumbing Repair',
      jobId: 'job-2',
      clientName: 'Emily Davis',
      clientId: 'client-102',
      location: {
        address: '456 Oak St, Cambridge, MA',
        latitude: 42.3736,
        longitude: -71.1097
      },
      date: '2025-03-19',
      startTime: '10:00',
      endTime: '13:00',
      status: 'confirmed',
      description: 'Install new shower fixtures',
      notes: 'Client has purchased fixtures already',
      reminderSent: true,
      createdAt: '2025-03-16T14:30:00Z'
    },
    {
      id: 'appt-3',
      title: 'Initial Consultation - Deck Project',
      jobId: null, // No job yet, just an initial consultation
      clientName: 'Thomas Brown',
      clientId: 'client-105',
      location: {
        address: '789 Pine St, Medford, MA',
        latitude: 42.4184,
        longitude: -71.1061
      },
      date: '2025-03-25',
      startTime: '14:00',
      endTime: '15:00',
      status: 'pending',
      description: 'Discuss potential deck construction project',
      notes: 'Bring portfolio and material samples',
      reminderSent: false,
      createdAt: '2025-03-18T09:45:00Z'
    }
  ],
  timeBlocks: [
    {
      id: 'block-1',
      title: 'Personal Time',
      date: '2025-03-24',
      startTime: '10:00',
      endTime: '14:00',
      isRecurring: false,
      priority: 'high',
      notes: 'Doctor appointment',
      createdAt: '2025-03-10T08:30:00Z'
    },
    {
      id: 'block-2',
      title: 'Weekly Team Meeting',
      dayOfWeek: 1, // Monday
      startTime: '08:00',
      endTime: '09:00',
      isRecurring: true,
      frequency: 'weekly',
      priority: 'medium',
      notes: 'Weekly sync with crew',
      createdAt: '2025-01-05T14:00:00Z'
    }
  ],
  preferredHours: {
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    preferredStartTime: '08:00',
    preferredEndTime: '17:00'
  }
};

// Get worker availability
router.get('/availability', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: workerScheduleData.availability
  });
});

// Update general availability
router.put('/availability/general', authMiddleware.authenticate, (req, res) => {
  const { availabilityData } = req.body;
  
  if (!availabilityData || !Array.isArray(availabilityData)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid availability data format'
    });
  }
  
  // Validate each day's data
  for (const day of availabilityData) {
    if (!day.dayOfWeek || day.dayOfWeek < 1 || day.dayOfWeek > 7) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day of week'
      });
    }
    
    if (day.isAvailable && (!day.startTime || !day.endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Start time and end time are required for available days'
      });
    }
  }
  
  // In a real implementation, we would update the general availability
  // For now, just return success response
  
  res.status(200).json({
    success: true,
    message: 'General availability updated successfully',
    data: {
      generalAvailability: availabilityData,
      updatedAt: new Date().toISOString()
    }
  });
});

// Add special day (exception to general availability)
router.post('/availability/special-days', authMiddleware.authenticate, (req, res) => {
  const { date, startTime, endTime, isAvailable, note } = req.body;
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required'
    });
  }
  
  if (isAvailable && (!startTime || !endTime)) {
    return res.status(400).json({
      success: false,
      message: 'Start time and end time are required for available days'
    });
  }
  
  // Create a new special day
  const newSpecialDay = {
    date,
    startTime: startTime || '00:00',
    endTime: endTime || '00:00',
    isAvailable: isAvailable === undefined ? false : isAvailable,
    note: note || ''
  };
  
  res.status(201).json({
    success: true,
    message: 'Special day added successfully',
    data: newSpecialDay
  });
});

// Delete special day
router.delete('/availability/special-days/:date', authMiddleware.authenticate, (req, res) => {
  const { date } = req.params;
  
  // Check if special day exists
  const specialDay = workerScheduleData.availability.specialDays.find(day => day.date === date);
  
  if (!specialDay) {
    return res.status(404).json({
      success: false,
      message: 'Special day not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Special day removed successfully',
    data: {
      date
    }
  });
});

// Update availability preferences
router.put('/availability/preferences', authMiddleware.authenticate, (req, res) => {
  const { workRadius, preferredLocations, isRemoteAvailable, minimumJobDuration, noticeRequired } = req.body;
  
  // Create updated preferences object, keeping existing values if not provided
  const updatedPreferences = {
    workRadius: workRadius !== undefined ? workRadius : workerScheduleData.availability.workRadius,
    preferredLocations: preferredLocations || workerScheduleData.availability.preferredLocations,
    isRemoteAvailable: isRemoteAvailable !== undefined ? isRemoteAvailable : workerScheduleData.availability.isRemoteAvailable,
    minimumJobDuration: minimumJobDuration !== undefined ? minimumJobDuration : workerScheduleData.availability.minimumJobDuration,
    noticeRequired: noticeRequired !== undefined ? noticeRequired : workerScheduleData.availability.noticeRequired,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json({
    success: true,
    message: 'Availability preferences updated successfully',
    data: updatedPreferences
  });
});

// Get all appointments
router.get('/appointments', authMiddleware.authenticate, (req, res) => {
  // Optional query parameters for filtering
  const { startDate, endDate, status } = req.query;
  
  let filteredAppointments = workerScheduleData.appointments;
  
  // Filter by date range if provided
  if (startDate && endDate) {
    filteredAppointments = filteredAppointments.filter(appt => {
      return appt.date >= startDate && appt.date <= endDate;
    });
  }
  
  // Filter by status if provided
  if (status) {
    filteredAppointments = filteredAppointments.filter(appt => appt.status === status);
  }
  
  res.status(200).json({
    success: true,
    count: filteredAppointments.length,
    data: filteredAppointments
  });
});

// Get appointment by ID
router.get('/appointments/:appointmentId', authMiddleware.authenticate, (req, res) => {
  const { appointmentId } = req.params;
  
  // Find appointment
  const appointment = workerScheduleData.appointments.find(appt => appt.id === appointmentId);
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: appointment
  });
});

// Create new appointment
router.post('/appointments', authMiddleware.authenticate, (req, res) => {
  const { title, jobId, clientName, clientId, location, date, startTime, endTime, description, notes } = req.body;
  
  // Validate required fields
  if (!title || !clientName || !date || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Create new appointment
  const newAppointment = {
    id: `appt-${Date.now()}`,
    title,
    jobId: jobId || null,
    clientName,
    clientId: clientId || null,
    location: location || null,
    date,
    startTime,
    endTime,
    status: 'pending',
    description: description || '',
    notes: notes || '',
    reminderSent: false,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Appointment created successfully',
    data: newAppointment
  });
});

// Update appointment
router.put('/appointments/:appointmentId', authMiddleware.authenticate, (req, res) => {
  const { appointmentId } = req.params;
  const updateData = req.body;
  
  // Find appointment
  const appointment = workerScheduleData.appointments.find(appt => appt.id === appointmentId);
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }
  
  // Update appointment fields
  const updatedAppointment = {
    ...appointment,
    ...updateData,
    id: appointmentId // Ensure ID doesn't change
  };
  
  res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    data: updatedAppointment
  });
});

// Update appointment status
router.put('/appointments/:appointmentId/status', authMiddleware.authenticate, (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  // Find appointment
  const appointment = workerScheduleData.appointments.find(appt => appt.id === appointmentId);
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: `Appointment status updated to ${status}`,
    data: {
      id: appointmentId,
      status,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete appointment
router.delete('/appointments/:appointmentId', authMiddleware.authenticate, (req, res) => {
  const { appointmentId } = req.params;
  
  // Find appointment
  const appointment = workerScheduleData.appointments.find(appt => appt.id === appointmentId);
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Appointment deleted successfully',
    data: {
      id: appointmentId
    }
  });
});

// Get time blocks
router.get('/time-blocks', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: workerScheduleData.timeBlocks
  });
});

// Create time block
router.post('/time-blocks', authMiddleware.authenticate, (req, res) => {
  const { title, date, dayOfWeek, startTime, endTime, isRecurring, frequency, priority, notes } = req.body;
  
  // Validate required fields
  if (!title || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // If recurring, require dayOfWeek; otherwise, require date
  if (isRecurring && !dayOfWeek) {
    return res.status(400).json({
      success: false,
      message: 'Day of week is required for recurring time blocks'
    });
  } else if (!isRecurring && !date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required for non-recurring time blocks'
    });
  }
  
  // Create new time block
  const newTimeBlock = {
    id: `block-${Date.now()}`,
    title,
    date: isRecurring ? undefined : date,
    dayOfWeek: isRecurring ? dayOfWeek : undefined,
    startTime,
    endTime,
    isRecurring: isRecurring || false,
    frequency: isRecurring ? frequency : undefined,
    priority: priority || 'medium',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    message: 'Time block created successfully',
    data: newTimeBlock
  });
});

// Update time block
router.put('/time-blocks/:blockId', authMiddleware.authenticate, (req, res) => {
  const { blockId } = req.params;
  const updateData = req.body;
  
  // Find time block
  const timeBlock = workerScheduleData.timeBlocks.find(block => block.id === blockId);
  
  if (!timeBlock) {
    return res.status(404).json({
      success: false,
      message: 'Time block not found'
    });
  }
  
  // Update time block fields
  const updatedTimeBlock = {
    ...timeBlock,
    ...updateData,
    id: blockId // Ensure ID doesn't change
  };
  
  res.status(200).json({
    success: true,
    message: 'Time block updated successfully',
    data: updatedTimeBlock
  });
});

// Delete time block
router.delete('/time-blocks/:blockId', authMiddleware.authenticate, (req, res) => {
  const { blockId } = req.params;
  
  // Find time block
  const timeBlock = workerScheduleData.timeBlocks.find(block => block.id === blockId);
  
  if (!timeBlock) {
    return res.status(404).json({
      success: false,
      message: 'Time block not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Time block deleted successfully',
    data: {
      id: blockId
    }
  });
});

// Get preferred working hours
router.get('/preferred-hours', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: workerScheduleData.preferredHours
  });
});

// Update preferred working hours
router.put('/preferred-hours', authMiddleware.authenticate, (req, res) => {
  const { maxHoursPerDay, maxHoursPerWeek, preferredStartTime, preferredEndTime } = req.body;
  
  // Create updated preferences object, keeping existing values if not provided
  const updatedPreferences = {
    maxHoursPerDay: maxHoursPerDay !== undefined ? maxHoursPerDay : workerScheduleData.preferredHours.maxHoursPerDay,
    maxHoursPerWeek: maxHoursPerWeek !== undefined ? maxHoursPerWeek : workerScheduleData.preferredHours.maxHoursPerWeek,
    preferredStartTime: preferredStartTime || workerScheduleData.preferredHours.preferredStartTime,
    preferredEndTime: preferredEndTime || workerScheduleData.preferredHours.preferredEndTime,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json({
    success: true,
    message: 'Preferred hours updated successfully',
    data: updatedPreferences
  });
});

// Check availability for a specific date range
router.get('/check-availability', authMiddleware.authenticate, (req, res) => {
  const { startDate, endDate, startTime, endTime, excludeAppointments } = req.query;
  
  // Validate required parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }
  
  // In a real implementation, we would check availability against appointments and time blocks
  // For mock data, just return a response indicating availability
  
  const isAvailable = Math.random() > 0.3; // 70% chance of being available
  
  res.status(200).json({
    success: true,
    data: {
      isAvailable,
      conflicts: isAvailable ? [] : [
        {
          date: startDate,
          startTime: '10:00',
          endTime: '12:00',
          type: 'appointment',
          title: 'Existing appointment'
        }
      ]
    }
  });
});

module.exports = router; 