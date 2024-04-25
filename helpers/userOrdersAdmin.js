const User = require("../models/usersModel");
const getOrdersWithProducts = async () => {
  try {
    const ordersWithProducts = await User.aggregate([
      // Unwind the orders array
      { $unwind: "$orders" },
      // Lookup to fetch product details for each order
      {
        $lookup: {
          from: "vendors",
          localField: "orders.products.productId",
          foreignField: "products._id",
          as: "productDetails",
        },
      },
      // Unwind the productDetails array
      { $unwind: "$productDetails" },
      // Project to reshape the output
      {
        $project: {
          _id: "$orders._id",
          orderId: "$orders.orderId",
          totalAmount: "$orders.totalAmount",
          orderDate: "$orders.orderDate",
          expectedDeliveryDate: "$orders.expectedDeliveryDate",
          shippingAddress: "$orders.shippingAddress",
          paymentMethod: "$orders.paymentMethod",
          razorPaymentId: "$orders.razorPaymentId",
          razorpayOrderId: "$orders.razorpayOrderId",
          products: "$productDetails.products", // Include only products for each order
        },
      },
    ]);
    return ordersWithProducts;
  } catch (error) {
    console.error("Error fetching orders with products:", error);
    throw error;
  }
};

module.exports = { getOrdersWithProducts };
