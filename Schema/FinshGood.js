const mongoose = require("mongoose");

const FinishedGoodSchema = new mongoose.Schema({
  id: Number,
  productName: String,
  quantity: Number,
  date: String,
});

module.exports = mongoose.model("FinishedGood", FinishedGoodSchema);
