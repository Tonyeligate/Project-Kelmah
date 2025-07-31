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
const mockAppointments = [];

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
      console.warn('Service unavailable:', error.message);
      throw error;
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
      console.warn('Service unavailable:', error.message);
      throw error;
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
      console.warn('Service unavailable:', error.message);
      throw error;
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
