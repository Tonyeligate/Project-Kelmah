const Appointment = require('../models/Appointment');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all appointments for the current worker
 */
exports.getAppointments = async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const appointments = await Appointment.find({ worker: workerId }).sort('date');
    return successResponse(res, 200, 'Appointments retrieved successfully', appointments);
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new appointment for the current worker
 */
exports.createAppointment = async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const { jobTitle, hirer, date, status } = req.body;
    const appointment = await Appointment.create({ worker: workerId, jobTitle, hirer, date, status });
    return successResponse(res, 201, 'Appointment created successfully', appointment);
  } catch (error) {
    return next(error);
  }
};

/**
 * Update an existing appointment
 */
exports.updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, worker: req.user.id },
      updates,
      { new: true }
    );
    if (!appointment) {
      return errorResponse(res, 404, 'Appointment not found');
    }
    return successResponse(res, 200, 'Appointment updated successfully', appointment);
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete an appointment
 */
exports.deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findOneAndDelete({ _id: id, worker: req.user.id });
    if (!appointment) {
      return errorResponse(res, 404, 'Appointment not found');
    }
    return successResponse(res, 200, 'Appointment deleted successfully');
  } catch (error) {
    return next(error);
  }
}; 