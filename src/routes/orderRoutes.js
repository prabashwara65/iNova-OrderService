const express = require('express');
const router = express.Router();
const controller = require('../controllers/orderController');

router.route("/")
  .get(controller.getOrders)
  .post(controller.addToCart);

router.route("/:orderId")
  .get(controller.getOrderByOrderId)
  .put(controller.updateOrder)
  .patch(controller.updateOrder)
  .delete(controller.deleteOrder);

module.exports = router
