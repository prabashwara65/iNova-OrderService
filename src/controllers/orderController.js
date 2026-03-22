const Order = require("../models/Order");
const userService = require("../services/userService");
const productService = require("../services/productService");
const paymentService = require("../services/paymentService");

const sortByNewest = { createdAt: -1 };

//add to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, shippingAddress, imageUrl } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }
   
    //validate user
    await userService.validateUser(userId)

    //get product
    const product = await productService.getProduct(productId)

    if(!product) {
        return res.status(404).json({message: "Product not found"});
    }

    if(product.stock < quantity){
        return res.status(400).json({message: "Insufficient stock"})
    }

    //find exisiting pending cart 
    let order = await Order.findOne({userId, status: "PENDING" })

    //if no cart - create new cart
      if (!order) {
      order = new Order({
        userId,
        orderId: `ORD-${Date.now()}`, // unique order ID
        items: [],
        status: "PENDING",
      });
    }

    // add item 
    order.items.push({
        productId,
        quantity, 
        priceAtPurchase: product.price,
        imageUrl: imageUrl || "",
    })

    if (typeof shippingAddress === "string" && shippingAddress.trim()) {
      order.shippingAddress = shippingAddress.trim();
    }

    //recalculate total
    order.totalAmount = order.items.reduce(
        (sum, item) => sum + item.quantity * item.priceAtPurchase,
        0
    );

    await order.save();

    res.status(200).json({
        message: "Item added to cart",
        order,
    })

  } catch (err) {
    console.error("Add to cart error:", err.message);
    res.status(500).json({ message: err.message });
  }
}

//check out
exports.checkout = async (req, res) => {
    try {
        const { userId, shippingAddress } = req.body

        if(!userId){
            return res.status(400).json({message: "UserId required"});
        }

        //find pending cart
        const order = await Order.findOne({
            userId,
            status: "PENDING",
        })

        if(!order){
            return res.status(400).json({message: "Cart empty"})
        }

        if (typeof shippingAddress === "string" && shippingAddress.trim()) {
            order.shippingAddress = shippingAddress.trim();
        }

        //process payement
        const payment = await paymentService.processPayment(
            order.orderId,
            userId,
            order.totalAmount
        )

         if (!payment || payment.status !== "SUCCESS") {
           order.status = "CANCELLED";
           await order.save();

           return res.status(400).json({
             message: "Payment failed",
           });
         }

         //Reduce stock
         for (const item of order.items) {
           await productService.reduceStock(item.productId, item.quantity);
         }

         //confirm order
          order.status = "CONFIRMED";
          await order.save();

          res.status(200).json({
            message: "Order confirmed",
            order,
          });

    } catch (err){
         console.error("Checkout error:", err.message);
         res.status(500).json({ message: err.message });
    }
}

exports.getOrderByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ order });
    } catch (err) {
        console.error("Get order error:", err.message);
        res.status(500).json({ message: err.message });
    }
}

exports.getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "UserId required" });
        }

        await userService.validateUser(userId);

        const orders = await Order.find({ userId }).sort(sortByNewest);

        res.status(200).json({ orders });
    } catch (err) {
        console.error("Get user orders error:", err.message);
        res.status(500).json({ message: err.message });
    }
}

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).sort(sortByNewest);

        res.status(200).json({ orders });
    } catch (err) {
        console.error("Get all orders error:", err.message);
        res.status(500).json({ message: err.message });
    }
}

exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending orders can be cancelled",
            });
        }

        order.status = "CANCELLED";
        await order.save();

        res.status(200).json({
            message: "Order cancelled successfully",
            order,
        });
    } catch (err) {
        console.error("Cancel order error:", err.message);
        res.status(500).json({ message: err.message });
    }
}
