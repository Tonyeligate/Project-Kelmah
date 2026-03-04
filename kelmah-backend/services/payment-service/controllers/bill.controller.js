const { Bill, BillAudit } = require("../models");
const logger = require('../utils/logger') || console;

exports.getBills = async (req, res) => {
  try {
    // Fetch bills: all bills for admin (bounded), own bills for regular users
    let bills;
    if (req.user.role === "admin") {
      bills = await Bill.find().sort({ dueDate: 1 }).limit(500);
    } else {
      bills = await Bill.find({ userId: req.user.id }).sort({ dueDate: 1 }).limit(200);
    }
    return res.json({ success: true, data: bills });
  } catch (error) {
    logger.error("Error fetching bills:", error);
    return res
      .status(500)
      .json({ success: false, error: { message: "Failed to fetch bills" } });
  }
};

exports.payBill = async (req, res) => {
  try {
    const { billId } = req.params;

    // Atomic status update: only mark as paid if currently unpaid (prevents race conditions)
    const bill = await Bill.findOneAndUpdate(
      { _id: billId, userId: req.user.id, status: { $ne: 'paid' } },
      { $set: { status: 'paid' } },
      { new: true }
    );

    if (!bill) {
      // Either not found or already paid — check which
      const existing = await Bill.findOne({ _id: billId, userId: req.user.id });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Bill not found" });
      }
      // Already paid — idempotent success
      return res.json({ success: true, data: existing });
    }

    // Audit log payment
    await BillAudit.create({
      billId: bill._id,
      userId: req.user.id,
      action: "paid",
      details: { amount: bill.amount },
    });

    return res.json({ success: true, data: bill });
  } catch (error) {
    logger.error("Error paying bill:", error);
    return res
      .status(500)
      .json({ success: false, error: { message: "Failed to pay bill" } });
  }
};
