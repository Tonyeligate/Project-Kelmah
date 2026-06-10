const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BillSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue"],
      default: "unpaid",
    },
  },
  { timestamps: true },
);

const Bill = mongoose.model("Bill", BillSchema);

module.exports = Bill;
