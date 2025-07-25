import axios from '../../common/services/axios';

class SchedulingService {
  /**
   * Fetch all appointments
   * @param {Object} params Optional query params for pagination or filtering
   */
  async getAppointments(params = {}) {
    try {
      const response = await axios.get('/api/appointments', { params });
      // Assuming API returns { data: [...] }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Fetch appointments by job ID
   * @param {string} jobId The job ID to filter appointments by
   * @param {Object} params Optional query params for pagination or filtering
   */
  async getAppointmentsByJob(jobId, params = {}) {
    try {
      const response = await axios.get(`/api/appointments/job/${jobId}`, {
        params,
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching appointments for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch appointments by user ID (either hirer or worker)
   * @param {string} userId The user ID to filter appointments by
   * @param {string} role Optional role ('hirer' or 'worker')
   * @param {Object} params Optional query params for pagination or filtering
   */
  async getAppointmentsByUser(userId, role = null, params = {}) {
    const queryParams = { ...params };
    if (role) {
      queryParams.role = role;
    }

    try {
      const response = await axios.get(`/api/appointments/user/${userId}`, {
        params: queryParams,
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching appointments for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch upcoming appointments
   * @param {number} days Number of days to look ahead (default: 7)
   * @param {Object} params Optional query params for pagination or filtering
   */
  async getUpcomingAppointments(days = 7, params = {}) {
    try {
      const response = await axios.get('/api/appointments/upcoming', {
        params: { ...params, days },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   * @param {string} appointmentId The appointment ID
   */
  async getAppointment(appointmentId) {
    try {
      const response = await axios.get(`/api/appointments/${appointmentId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching appointment ${appointmentId}:`, error);
      throw error;
    }
  }

  // Create a new appointment
  async createAppointment(appointmentData) {
    try {
      const response = await axios.post('/api/appointments', appointmentData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Update an appointment
  async updateAppointment(appointmentId, updateData) {
    try {
      const response = await axios.patch(
        `/api/appointments/${appointmentId}`,
        updateData,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Delete an appointment
  async deleteAppointment(appointmentId) {
    try {
      await axios.delete(`/api/appointments/${appointmentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  /**
   * Change appointment status
   * @param {string} appointmentId The appointment ID
   * @param {string} status The new status ('pending', 'confirmed', 'completed', 'cancelled')
   */
  async updateAppointmentStatus(appointmentId, status) {
    try {
      const response = await axios.patch(
        `/api/appointments/${appointmentId}/status`,
        { status },
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error updating appointment ${appointmentId} status:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reschedule an appointment
   * @param {string} appointmentId The appointment ID
   * @param {Date} newDate The new appointment date
   */
  async rescheduleAppointment(appointmentId, newDate) {
    try {
      const response = await axios.patch(
        `/api/appointments/${appointmentId}/reschedule`,
        { date: newDate },
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error rescheduling appointment ${appointmentId}:`, error);
      throw error;
    }
  }

  /**
   * Send appointment reminder
   * @param {string} appointmentId The appointment ID
   */
  async sendAppointmentReminder(appointmentId) {
    try {
      const response = await axios.post(
        `/api/appointments/${appointmentId}/send-reminder`,
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error sending reminder for appointment ${appointmentId}:`,
        error,
      );
      throw error;
    }
  }
}

export default new SchedulingService();
