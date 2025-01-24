const mongoose = require("mongoose");

const OutFinishedGoodsSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  address: { type: String, required: true },
  price: { type: Number, required: true },
  recipientName: { type: String, required: true },
  dateOfIssue: { type: Date, required: true },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Assuming 'Product' is the model name for the products collection
  },
});

module.exports = mongoose.model("OutFinishedGoods", OutFinishedGoodsSchema);
