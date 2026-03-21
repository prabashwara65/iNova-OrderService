const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getAllOrders);
router.get('/summary', orderController.getOrderSummary);
router.get('/number/:orderNumber', orderController.getOrderByNumber);
router.get('/:id', orderController.getOrderById);

router.post('/', orderController.createOrder);

router.put('/:id', orderController.updateOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/payment-status', orderController.updatePaymentStatus);
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;
