/**
 * Ghana Payments Controller
 * Thin controller exposing provider-specific endpoints expected by the frontend
 * without requiring database writes. Uses integrations directly.
 */

const MTNMoMoService = require('../integrations/mtn-momo');
const VodafoneCashService = require('../integrations/vodafone-cash');
const AirtelTigoService = require('../integrations/airteltigo');

const mtn = new MTNMoMoService();
const vodafone = new VodafoneCashService();
const airtel = new AirtelTigoService();

module.exports = {
  // MTN MoMo
  async mtnRequestToPay(req, res) {
    const { amount, phoneNumber, description, externalId, payerMessage, payeeNote } = req.body || {};
    if (!amount || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'amount and phoneNumber are required' });
    }
    const result = await mtn.requestToPay({ amount, phoneNumber, description, externalId, payerMessage, payeeNote });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async mtnStatus(req, res) {
    const { referenceId } = req.params;
    const result = await mtn.getTransactionStatus(referenceId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async mtnValidate(req, res) {
    const { phoneNumber } = req.body || {};
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'phoneNumber is required' });
    }
    const result = await mtn.validateAccount(phoneNumber);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  // Vodafone Cash
  async vodafoneRequestToPay(req, res) {
    const { amount, phoneNumber, description, externalId } = req.body || {};
    if (!amount || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'amount and phoneNumber are required' });
    }
    const result = await vodafone.initiatePayment({ amount, phoneNumber, description, externalId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async vodafoneStatus(req, res) {
    const { referenceId } = req.params;
    const result = await vodafone.getPaymentStatus(referenceId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  // AirtelTigo Money
  async airtelRequestToPay(req, res) {
    const { amount, phoneNumber, description, externalId } = req.body || {};
    if (!amount || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'amount and phoneNumber are required' });
    }
    const result = await airtel.requestToPay({ amount, phoneNumber, description, externalId });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  },

  async airtelStatus(req, res) {
    const { referenceId } = req.params;
    const result = await airtel.getTransactionStatus(referenceId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  },
};



