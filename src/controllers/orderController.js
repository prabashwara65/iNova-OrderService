const Order = require("../models/Order");
const userService = require("../services/userService");
const productService = require("../services/productService");
const paymentService = require("../services/paymentService");

const sortByNewest = { createdAt: -1 };

const normalizeShippingAddress = (shippingAddress) => {
  if (!shippingAddress) {
    return undefined;
  }

  if (typeof shippingAddress === "string") {
    return {
      street: shippingAddress.trim(),
      country: "",
    };
  }

  return {
    fullName: shippingAddress.fullName || "",
    street: shippingAddress.street || "",
    city: shippingAddress.city || "",
    postalCode: shippingAddress.postalCode || "",
    country: shippingAddress.country || "",
    phone: shippingAddress.phone || "",
  };
};

const recalculateAmounts = (order) => {
  order.subtotal = order.items.reduce(
    (sum, item) => sum + item.quantity * item.priceAtPurchase,
    0
  );
  order.taxAmount = 0;
  order.shippingAmount = 0;
  order.discountAmount = 0;
  order.totalAmount =
    order.subtotal + order.taxAmount + order.shippingAmount - order.discountAmount;
};

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

    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);

    if (normalizedShippingAddress) {
      order.shippingAddress = normalizedShippingAddress;
    }

    recalculateAmounts(order);

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

        const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);

        if (normalizedShippingAddress) {
            order.shippingAddress = normalizedShippingAddress;
        }

        //process payement
        const payment = await paymentService.processPayment(
            order.orderId,
            userId,
            order.totalAmount
        )

         if (!payment || payment.status !== "SUCCESS") {
           order.status = "CANCELLED";
           order.paymentStatus = "FAILED";
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
          order.paymentStatus = "PAID";
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

exports.getOrders = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = {};

        if (userId) {
            await userService.validateUser(userId);
            query.userId = userId;
        }

        const orders = await Order.find(query).sort(sortByNewest);

        res.status(200).json({ orders });
    } catch (err) {
        console.error("Get orders error:", err.message);
        res.status(500).json({ message: err.message });
    }
}

exports.updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action, shippingAddress } = req.body;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (action === "cancel") {
            if (order.status !== "PENDING") {
                return res.status(400).json({
                    message: "Only pending orders can be cancelled",
                });
            }

            order.status = "CANCELLED";
            await order.save();

            return res.status(200).json({
                message: "Order cancelled successfully",
                order,
            });
        }

        if (action === "checkout") {
            req.body = {
                userId: order.userId,
                shippingAddress: shippingAddress || order.shippingAddress,
            };

            return exports.checkout(req, res);
        }

        return res.status(400).json({
            message: "Unsupported order action",
        });
    } catch (err) {
        console.error("Update order error:", err.message);
        res.status(500).json({ message: err.message });
    }
}

exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending orders can be deleted",
            });
        }

        await order.deleteOne();

        res.status(200).json({
            message: "Order deleted successfully",
        });
    } catch (err) {
        console.error("Delete order error:", err.message);
        res.status(500).json({ message: err.message });
    }
}
