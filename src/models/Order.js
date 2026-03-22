const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const itemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
  imageUrl: {type: String, default:""}
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: uuidv4
  },
  userId: { type: String, required: true },
  items: [itemSchema],
  shippingAddress: {type:String, default:""},
  totalAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED"],
    default: "PENDING"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);