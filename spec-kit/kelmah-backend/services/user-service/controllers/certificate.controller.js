/**
 * Certificate Controller (user-service)
 * CRUD and verification endpoints to match frontend certificateService.js
 */

const Certificate = require('../models/Certificate');
const { handleServiceError } = require('../utils/helpers');

class CertificateController {
  static async listByWorker(req, res) {
    try {
      const { workerId } = req.params;
      const items = await Certificate.find({ workerId }).sort({ issuedAt: -1, createdAt: -1 });
      return res.json({ success: true, data: { certificates: items } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to get certificates');
    }
  }

  static async create(req, res) {
    try {
      const { workerId } = req.params;
      const payload = { ...req.body, workerId };
      const created = await Certificate.create(payload);
      return res.status(201).json({ success: true, data: { certificate: created } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to create certificate');
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await Certificate.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Certificate not found' });
      return res.json({ success: true, data: { certificate: updated } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to update certificate');
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Certificate.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Certificate not found' });
      return res.json({ success: true, message: 'Certificate deleted' });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to delete certificate');
    }
  }

  // POST /api/profile/certificates/:id/verify
  static async requestVerification(req, res) {
    try {
      const { id } = req.params;
      const updated = await Certificate.findByIdAndUpdate(
        id,
        {
          status: 'pending',
          verification: { requestedAt: new Date(), result: 'pending' }
        },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Certificate not found' });
      return res.json({ success: true, data: { certificate: updated } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to request verification');
    }
  }

  // GET /api/profile/certificates/:id/verification
  static async getVerificationStatus(req, res) {
    try {
      const { id } = req.params;
      const cert = await Certificate.findById(id).select('status verification');
      if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
      return res.json({ success: true, data: { status: cert.status, verification: cert.verification } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to get verification status');
    }
  }

  // POST /api/profile/certificates/:id/share
  static async share(req, res) {
    try {
      const { id } = req.params;
      const crypto = require('crypto');
      const shareToken = crypto.randomBytes(12).toString('hex');
      const updated = await Certificate.findByIdAndUpdate(id, { shareToken }, { new: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Certificate not found' });
      const base = process.env.FRONTEND_URL || 'https://kelmah-frontend-cyan.vercel.app';
      const link = `${base}/certificates/${id}?t=${shareToken}`;
      return res.json({ success: true, data: { link, shareToken } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to create share link');
    }
  }

  // POST /api/profile/certificates/:id/validate
  static async validate(req, res) {
    try {
      const { id } = req.params;
      const { credentialId } = req.body || {};
      const cert = await Certificate.findById(id);
      if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
      const valid = credentialId ? cert.credentialId === credentialId : true;
      return res.json({ success: true, data: { valid, status: cert.status } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to validate certificate');
    }
  }

  // GET /api/profile/:workerId/certificates/expiring?daysAhead=30
  static async expiring(req, res) {
    try {
      const { workerId } = req.params;
      const daysAhead = parseInt(req.query.daysAhead || '30', 10);
      const now = new Date();
      const until = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      const items = await Certificate.find({ workerId, expiresAt: { $gte: now, $lte: until } }).sort({ expiresAt: 1 });
      return res.json({ success: true, data: { certificates: items } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to get expiring certificates');
    }
  }

  // GET /api/profile/:workerId/certificates/search?name=&issuer=
  static async search(req, res) {
    try {
      const { workerId } = req.params;
      const { name, issuer, status } = req.query;
      const query = { workerId };
      if (name) query.name = { $regex: name, $options: 'i' };
      if (issuer) query.issuer = { $regex: issuer, $options: 'i' };
      if (status) query.status = status;
      const items = await Certificate.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, data: { certificates: items } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to search certificates');
    }
  }

  // GET /api/profile/:workerId/certificates/stats
  static async stats(req, res) {
    try {
      const { workerId } = req.params;
      const [total, verified, pending, rejected, expired] = await Promise.all([
        Certificate.countDocuments({ workerId }),
        Certificate.countDocuments({ workerId, status: 'verified' }),
        Certificate.countDocuments({ workerId, status: 'pending' }),
        Certificate.countDocuments({ workerId, status: 'rejected' }),
        Certificate.countDocuments({ workerId, status: 'expired' }),
      ]);
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const expiringSoon = await Certificate.countDocuments({ workerId, expiresAt: { $gte: new Date(), $lte: in30Days } });
      return res.json({ success: true, data: { total, verified, pending, rejected, expired, expiringSoon } });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to get certificate stats');
    }
  }
}

module.exports = CertificateController;


