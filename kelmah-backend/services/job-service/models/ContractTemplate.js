const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Model for contract templates
const ContractTemplateSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        dueDate: { type: Date },
        amount: { type: Number, required: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ContractTemplate", ContractTemplateSchema);
