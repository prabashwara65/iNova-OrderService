const express = require('express');
const router = express.Router()
const controller = require('../controllers/orderController')

router.post("/add", controller.addToCart)
router.post("/checkout", controller.checkout)
router.get("/", controller.getAllOrders)
router.get("/user/:userId", controller.getOrdersByUserId)
router.get("/:orderId", controller.getOrderByOrderId)
router.patch("/:orderId/cancel", controller.cancelOrder)

module.exports = router
