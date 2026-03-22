const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const itemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
  imageUrl: { type: String, default: "" }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, default: "" },
  street: { type: String, default: "" },
  city: { type: String, default: "" },
  postalCode: { type: String, default: "" },
  country: { type: String, default: "" },
  phone: { type: String, default: "" }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: uuidv4
  },
  userId: { type: String, required: true },
  items: [itemSchema],
  shippingAddress: {
    type: shippingAddressSchema,
    default: () => ({
      fullName: "",
      street: "",
      city: "",
      postalCode: "",
      country: "",
      phone: ""
    })
  },
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  shippingAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["UNPAID", "PAID", "FAILED"],
    default: "UNPAID"
  },
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED"],
    default: "PENDING"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
