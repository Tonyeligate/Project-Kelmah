import { userServiceClient as schedulingClient } from '../../common/services/axios';

// Use centralized userServiceClient as scheduling lives in user-service

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
      console.warn('Scheduling service unavailable:', error.message);
      return [];
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
      console.warn(`Scheduling service unavailable for job ${jobId}:`, error.message);
      return [];
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
      console.warn(`Scheduling service unavailable for user ${userId}:`, error.message);
      return [];
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
      console.warn('Scheduling service unavailable:', error.message);
      throw error;
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
      console.warn('Scheduling service unavailable:', error.message);
      return null;
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
      console.warn('Scheduling service unavailable:', error.message);
      return [];
    }
  }
}

export default new SchedulingService();
