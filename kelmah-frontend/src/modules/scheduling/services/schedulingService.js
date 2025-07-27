import axios from 'axios';
import { SERVICES } from '../../../config/environment';

// Create dedicated scheduling service client (could be part of user service or separate)
const schedulingClient = axios.create({
  baseURL: SERVICES.USER_SERVICE, // Assuming scheduling is part of user service
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
schedulingClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kelmah_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Mock appointments data
const mockAppointments = [
  {
    id: 'apt-1',
    title: 'Kitchen Cabinet Installation Meeting',
    description: 'Initial consultation for custom kitchen cabinet project',
    jobId: 'job-1',
    jobTitle: 'Kitchen Renovation - Custom Cabinets',
    hirerId: 'client-1',
    hirerName: 'Sarah Mitchell',
    workerId: '7a1f417c-e2e2-4210-9824-08d5fac336ac',
    workerName: 'Tony Gate',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 90), // 1.5 hours later
    location: 'Mitchell Residence, Accra',
    type: 'consultation',
    status: 'confirmed',
    meetingType: 'in-person',
    notes: 'Bring measuring tools and sample materials',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
  {
    id: 'apt-2',
    title: 'Plumbing Assessment',
    description: 'Emergency bathroom plumbing inspection and quote',
    jobId: 'job-2',
    jobTitle: 'Emergency Bathroom Plumbing Repair',
    hirerId: 'client-2',
    hirerName: 'David Chen',
    workerId: 'worker-2',
    workerName: 'Emmanuel Asante',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 6), // 6 hours from now
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 6 + 1000 * 60 * 60), // 1 hour later
    location: 'Chen Family Home, Kumasi',
    type: 'assessment',
    status: 'pending',
    meetingType: 'in-person',
    notes: 'Urgent - water damage possible',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: 'apt-3',
    title: 'Project Progress Review',
    description: 'Weekly progress check for electrical rewiring project',
    jobId: 'job-3',
    jobTitle: 'Complete House Rewiring Project',
    hirerId: 'client-3',
    hirerName: 'Lisa Thompson',
    workerId: 'worker-3',
    workerName: 'Kwame Osei',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 45), // 45 minutes later
    location: 'Thompson Residence, Takoradi',
    type: 'progress-review',
    status: 'confirmed',
    meetingType: 'in-person',
    notes: 'Review completed rooms and plan next phase',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    id: 'apt-4',
    title: 'Virtual Consultation',
    description:
      'Online discussion about painting requirements and color selection',
    jobId: 'job-4',
    jobTitle: 'Interior House Painting',
    hirerId: 'client-4',
    hirerName: 'Robert Johnson',
    workerId: '7a1f417c-e2e2-4210-9824-08d5fac336ac',
    workerName: 'Tony Gate',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 + 1000 * 60 * 30), // 30 minutes later
    location: 'Online Meeting',
    type: 'consultation',
    status: 'confirmed',
    meetingType: 'virtual',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Prepare color samples and room photos',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
];

class SchedulingService {
  /**
   * Fetch all appointments
   */
  async getAppointments(params = {}) {
    try {
      const response = await schedulingClient.get('/api/appointments', {
        params,
      });
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Scheduling service unavailable, using mock appointments:',
        error.message,
      );

      // Apply basic filtering if params provided
      let filteredAppointments = [...mockAppointments];

      if (params.status) {
        filteredAppointments = filteredAppointments.filter(
          (apt) => apt.status === params.status,
        );
      }

      if (params.type) {
        filteredAppointments = filteredAppointments.filter(
          (apt) => apt.type === params.type,
        );
      }

      if (params.workerId) {
        filteredAppointments = filteredAppointments.filter(
          (apt) => apt.workerId === params.workerId,
        );
      }

      return filteredAppointments;
    }
  }

  /**
   * Fetch appointments by job ID
   */
  async getAppointmentsByJob(jobId, params = {}) {
    try {
      const response = await schedulingClient.get(
        `/api/appointments/job/${jobId}`,
        { params },
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        `Scheduling service unavailable for job ${jobId}, using mock data:`,
        error.message,
      );
      return mockAppointments.filter((apt) => apt.jobId === jobId);
    }
  }

  /**
   * Fetch appointments by user ID
   */
  async getAppointmentsByUser(userId, role = null, params = {}) {
    try {
      const queryParams = { ...params };
      if (role) queryParams.role = role;

      const response = await schedulingClient.get(
        `/api/appointments/user/${userId}`,
        {
          params: queryParams,
        },
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        `Scheduling service unavailable for user ${userId}, using mock data:`,
        error.message,
      );

      return mockAppointments.filter((apt) => {
        if (role === 'hirer') return apt.hirerId === userId;
        if (role === 'worker') return apt.workerId === userId;
        return apt.hirerId === userId || apt.workerId === userId;
      });
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData) {
    try {
      const response = await schedulingClient.post(
        '/api/appointments',
        appointmentData,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Scheduling service unavailable, simulating appointment creation:',
        error.message,
      );

      const newAppointment = {
        id: `apt-${Date.now()}`,
        ...appointmentData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newAppointment;
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      const response = await schedulingClient.put(
        `/api/appointments/${appointmentId}`,
        updateData,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Scheduling service unavailable, simulating appointment update:',
        error.message,
      );

      const existingAppointment = mockAppointments.find(
        (apt) => apt.id === appointmentId,
      );
      return {
        ...existingAppointment,
        ...updateData,
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(appointmentId) {
    try {
      const response = await schedulingClient.delete(
        `/api/appointments/${appointmentId}`,
      );
      return response.data;
    } catch (error) {
      console.warn(
        'Scheduling service unavailable, simulating appointment deletion:',
        error.message,
      );
      return {
        success: true,
        message: 'Appointment deleted successfully (mock)',
      };
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId) {
    try {
      const response = await schedulingClient.get(
        `/api/appointments/${appointmentId}`,
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Scheduling service unavailable, using mock appointment:',
        error.message,
      );
      return mockAppointments.find((apt) => apt.id === appointmentId) || null;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, status) {
    try {
      const response = await schedulingClient.patch(
        `/api/appointments/${appointmentId}/status`,
        { status },
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Scheduling service unavailable, simulating status update:',
        error.message,
      );

      const existingAppointment = mockAppointments.find(
        (apt) => apt.id === appointmentId,
      );
      return {
        ...existingAppointment,
        status,
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Get available time slots for scheduling
   */
  async getAvailableTimeSlots(workerId, date, duration = 60) {
    try {
      const response = await schedulingClient.get(
        `/api/appointments/availability/${workerId}`,
        {
          params: { date, duration },
        },
      );
      return response.data.data || response.data;
    } catch (error) {
      console.warn(
        'Scheduling service unavailable, using mock availability:',
        error.message,
      );

      // Generate mock available time slots
      const selectedDate = new Date(date);
      const timeSlots = [];

      for (let hour = 8; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hour, minute, 0, 0);

          // Skip past times
          if (slotTime <= new Date()) continue;

          // Check if slot conflicts with existing appointments
          const hasConflict = mockAppointments.some((apt) => {
            const aptStart = new Date(apt.startTime);
            const aptEnd = new Date(apt.endTime);
            const slotEnd = new Date(slotTime.getTime() + duration * 60000);

            return (
              apt.workerId === workerId &&
              apt.status !== 'cancelled' &&
              ((slotTime >= aptStart && slotTime < aptEnd) ||
                (slotEnd > aptStart && slotEnd <= aptEnd))
            );
          });

          if (!hasConflict) {
            timeSlots.push({
              startTime: slotTime,
              endTime: new Date(slotTime.getTime() + duration * 60000),
              available: true,
            });
          }
        }
      }

      return timeSlots.slice(0, 10); // Return first 10 available slots
    }
  }
}

export default new SchedulingService();
