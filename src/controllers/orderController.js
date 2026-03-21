const Order = require('../models/Order');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  return { page, limit };
};

const orderController = {
  getAllOrders: async (req, res) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { status, paymentStatus, userId } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (userId) filter.userId = userId;

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Order.countDocuments(filter);

      res.json({
        orders,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getOrderByNumber: async (req, res) => {
    try {
      const order = await Order.findOne({ orderNumber: req.params.orderNumber });
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createOrder: async (req, res) => {
    try {
      const order = await Order.create(req.body);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateOrder: async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updatePaymentStatus: async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { paymentStatus: req.body.paymentStatus },
        { new: true, runValidators: true }
      );

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'DELIVERED') {
        return res.status(400).json({ error: 'Delivered order cannot be cancelled' });
      }

      order.status = 'CANCELLED';
      await order.save();

      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getOrderSummary: async (req, res) => {
    try {
      const [summary] = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$totalAmount', 0]
              }
            },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] }
            }
          }
        }
      ]);

      res.json(summary || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        cancelledOrders: 0
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = orderController;
