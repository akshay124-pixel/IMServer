const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    stockName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    dateOfEntry: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Enables the createdAt and updatedAt fields
);

// Create a Stock model using the schema
const Stock = mongoose.model("Stock", stockSchema);

module.exports = Stock;
