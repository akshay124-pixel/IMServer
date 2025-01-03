const mongoose = require("mongoose");

const outStockSchema = new mongoose.Schema({
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock", // This references the Stock model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  recipientName: {
    type: String,
    required: true,
    trim: true,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfIssue: {
    type: Date,
    required: true,
  },
  dateOfEntry: {
    type: Date,
    default: Date.now,
  },

  assemblyStatus: {
    type: String,
    enum: ["Assembled", "Not Assembled"],
    default: "Not Assembled",
    required: true,
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500,
  },
});

const OutStock = mongoose.model("OutStock", outStockSchema);

module.exports = OutStock;
