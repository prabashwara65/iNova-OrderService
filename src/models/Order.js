const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  userId: { type: String, required: true, trim: true, index: true },
  items: { type: [orderItemSchema], validate: [(v) => v.length > 0, 'At least one item is required'] },
  subtotal: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  shippingAmount: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'UNPAID',
    index: true
  },
  shippingAddress: {
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'Sri Lanka' }
  },
  note: String
}, { timestamps: true });

orderSchema.pre('validate', function prepareTotals(next) {
  this.items = this.items.map((item) => ({
    ...item.toObject ? item.toObject() : item,
    lineTotal: Number((item.quantity * item.unitPrice).toFixed(2))
  }));

  this.subtotal = Number(this.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  this.totalAmount = Number((this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount).toFixed(2));

  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);
