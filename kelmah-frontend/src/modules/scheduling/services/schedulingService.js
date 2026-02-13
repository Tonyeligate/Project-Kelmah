import { api } from '../../../services/apiClient';

// Use centralized api client

const APPOINTMENTS_STORAGE_KEY = 'kelmah_local_appointments';

const normalizeAppointment = (appointment = {}, index = 0) => ({
  ...appointment,
  id: appointment?.id || appointment?._id || `appointment-${index}`,
  date:
    appointment?.date ||
    appointment?.startTime ||
    appointment?.scheduledAt ||
    new Date().toISOString(),
});

const readStoredAppointments = () => {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((appointment, index) =>
          normalizeAppointment(appointment, index),
        )
      : [];
  } catch {
    return [];
  }
};

const writeStoredAppointments = (appointments = []) => {
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
};

const buildLocalAppointment = (appointmentData = {}) => ({
  ...appointmentData,
  id: `local-appointment-${Date.now()}`,
  date: appointmentData?.date || new Date().toISOString(),
  status: appointmentData?.status || 'pending',
});

class SchedulingService {
  /**
   * Fetch all appointments
   */
  async getAppointments(params = {}) {
    try {
      const response = await api.get('/appointments', {
        params,
      });
      const payload = response?.data?.data || response?.data || [];
      const appointments = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.appointments)
          ? payload.appointments
          : [];
      return appointments.map((appointment, index) =>
        normalizeAppointment(appointment, index),
      );
    } catch (error) {
      console.warn('Scheduling service unavailable:', error.message);
      return readStoredAppointments();
    }
  }

  /**
   * Fetch appointments by job ID
   */
  async getAppointmentsByJob(jobId, params = {}) {
    try {
      const response = await api.get(`/appointments/job/${jobId}`, { params });
      const payload = response?.data?.data || response?.data || [];
      const appointments = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.appointments)
          ? payload.appointments
          : [];
      return appointments.map((appointment, index) =>
        normalizeAppointment(appointment, index),
      );
    } catch (error) {
      console.warn(
        `Scheduling service unavailable for job ${jobId}:`,
        error.message,
      );
      return readStoredAppointments().filter(
        (appointment) => String(appointment.jobId) === String(jobId),
      );
    }
  }

  /**
   * Fetch appointments by user ID
   */
  async getAppointmentsByUser(userId, role = null, params = {}) {
    try {
      const queryParams = { ...params };
      if (role) queryParams.role = role;

      const response = await api.get(`/appointments/user/${userId}`, {
        params: queryParams,
      });
      const payload = response?.data?.data || response?.data || [];
      const appointments = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.appointments)
          ? payload.appointments
          : [];
      return appointments.map((appointment, index) =>
        normalizeAppointment(appointment, index),
      );
    } catch (error) {
      console.warn(
        `Scheduling service unavailable for user ${userId}:`,
        error.message,
      );
      return readStoredAppointments().filter(
        (appointment) =>
          String(appointment.hirerId) === String(userId) ||
          String(appointment.workerId) === String(userId),
      );
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData) {
    try {
      const response = await api.post('/appointments', appointmentData);
      return normalizeAppointment(response.data.data || response.data, 0);
    } catch (error) {
      console.warn('Scheduling service unavailable:', error.message);
      const appointments = readStoredAppointments();
      const localAppointment = buildLocalAppointment(appointmentData);
      appointments.push(localAppointment);
      writeStoredAppointments(appointments);
      return localAppointment;
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      const response = await api.put(
        `/appointments/${appointmentId}`,
        updateData,
      );
      return normalizeAppointment(response.data.data || response.data, 0);
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      const appointments = readStoredAppointments();
      const updatedAppointments = appointments.map((appointment) =>
        String(appointment.id) === String(appointmentId)
          ? normalizeAppointment(
              { ...appointment, ...updateData, id: appointment.id },
              0,
            )
          : appointment,
      );
      writeStoredAppointments(updatedAppointments);
      return (
        updatedAppointments.find(
          (appointment) => String(appointment.id) === String(appointmentId),
        ) || null
      );
    }
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(appointmentId) {
    try {
      const response = await api.delete(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      const appointments = readStoredAppointments();
      const updatedAppointments = appointments.filter(
        (appointment) => String(appointment.id) !== String(appointmentId),
      );
      writeStoredAppointments(updatedAppointments);
      return { success: true };
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId) {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return normalizeAppointment(response.data.data || response.data, 0);
    } catch (error) {
      console.warn('Scheduling service unavailable:', error.message);
      return (
        readStoredAppointments().find(
          (appointment) => String(appointment.id) === String(appointmentId),
        ) || null
      );
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, status) {
    try {
      const response = await api.patch(
        `/appointments/${appointmentId}/status`,
        { status },
      );
      return normalizeAppointment(response.data.data || response.data, 0);
    } catch (error) {
      console.warn('Service unavailable:', error.message);
      return this.updateAppointment(appointmentId, { status });
    }
  }

  /**
   * Get available time slots for scheduling
   */
  async getAvailableTimeSlots(workerId, date, duration = 60) {
    try {
      const response = await api.get(`/appointments/availability/${workerId}`, {
        params: { date, duration },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.warn('Scheduling service unavailable:', error.message);
      return [];
    }
  }
}

export default new SchedulingService();
