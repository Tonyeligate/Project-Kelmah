const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BillAuditSchema = new Schema({
  billId: { type: Schema.Types.ObjectId, ref: "Bill", required: true },
  userId: { type: String, required: true },
  action: { type: String, enum: ["paid", "status_changed"], required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: Object },
});

module.exports = mongoose.model("BillAudit", BillAuditSchema);
