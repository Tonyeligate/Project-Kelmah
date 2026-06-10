/**
 * Certificate Model (Mongoose)
 * Stores worker certificates and verification lifecycle
 */

const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, required: true, trim: true, maxlength: 200 },
    credentialId: { type: String, trim: true },
    url: { type: String, trim: true },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'rejected', 'expired'],
      default: 'draft'
    },
    verification: {
      requestedAt: { type: Date },
      verifiedAt: { type: Date },
      verifier: { type: String },
      result: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      notes: { type: String }
    },
    metadata: { type: Object, default: {} },
    shareToken: { type: String },
  },
  { timestamps: true, collection: 'certificates' }
);

// Index for soon-to-expire queries
CertificateSchema.index({ expiresAt: 1 });
// Index for worker certificates lookup
CertificateSchema.index({ workerId: 1, status: 1 });
// Index for credential lookup
CertificateSchema.index({ credentialId: 1 });
// Index for share token lookup
CertificateSchema.index({ shareToken: 1 });

// Use standard mongoose.model() - it auto-binds to the default connection
module.exports = mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);


