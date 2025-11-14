const models = require('../../models');
const CertificateController = require('../certificate.controller');
const { handleServiceError } = require('../../utils/helpers');

module.exports = {
  list: async (req, res) => {
    try {
      const { workerId } = req.params;
      req.query = req.query || {};
      req.params.workerId = workerId;
      return CertificateController.listByWorker(req, res);
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load certificates');
    }
  },
  create: (req, res) => CertificateController.create(req, res),
  update: (req, res) => CertificateController.update(req, res),
  remove: (req, res) => CertificateController.remove(req, res),
};
