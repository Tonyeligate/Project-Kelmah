const { Bill, BillAudit, User } = require("../models");

exports.getBills = async (req, res) => {
  try {
    // Fetch bills: all bills for admin, own bills for regular users
    let bills;
    if (req.user.role === "admin") {
      bills = await Bill.find().sort({ dueDate: 1 });
    } else {
      bills = await Bill.find({ userId: req.user.id }).sort({ dueDate: 1 });
    }
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bills", error: error.message });
  }
};

exports.payBill = async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await Bill.findOne({ _id: billId, userId: req.user.id });
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    if (bill.status === "paid") {
      // Idempotent: already paid
      return res.json({ success: true, bill });
    }

    // Mark bill as paid
    bill.status = "paid";
    await bill.save();
    // Audit log payment
    await BillAudit.create({
      billId: bill._id,
      userId: req.user.id,
      action: "paid",
      details: { amount: bill.amount },
    });

    res.json({ success: true, bill });
  } catch (error) {
    console.error("Error paying bill:", error);
    res
      .status(500)
      .json({ message: "Failed to pay bill", error: error.message });
  }
};
