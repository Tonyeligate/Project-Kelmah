const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Model for contract disputes
const ContractDisputeSchema = new Schema(
  {
    contract: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "resolved", "rejected"],
      default: "open",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ContractDispute", ContractDisputeSchema);
