const moment = require("moment");
const mongoose = require("mongoose");
const Vendor = require("../models/vendorsModel");
const User = require("../models/usersModel");

// FUNCTION CALCULATE SALES OF EACH DAY
function calculateTotalSales(vendorOrders) {
  const salesData = {};
  const validOrders = vendorOrders.filter(
    (order) => order.orderStatus === "Delivered"
  );
  validOrders.forEach((order) => {
    const orderDate = moment(order.orderDate, "DD/MM/YYYY").format("YYYY-MM-DD");

    const orderSales = order.quantity * order.price;

    // If the order date already exists in salesData, add orderSales to the total
    if (salesData[orderDate]) {
      salesData[orderDate] += orderSales;
    } else {
      salesData[orderDate] = orderSales;
    }
  });

  // Convert salesData object to an array of objects for charting
  const chartData = Object.keys(salesData).map((date) => ({
    date,
    totalSales: salesData[date],
  }));

  chartData.sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());

  // Return the latest 10 days of total sales data
  const latestSalesData = chartData.slice(-10);

  return latestSalesData;
}

// ORDERS COUNT FOR LAST 10 DAYS
const getOrdersCountForLast10Days = (vendorOrders) => {
  const ordersCount = {};

  for (let i = 0; i < 10; i++) {
    const currentDate = moment().subtract(i, "days").format("MMMM D");
    ordersCount[currentDate] = 0;
  }

  vendorOrders.forEach((order) => {
    const orderDate = moment(order.orderDate, "DD/MM/YYYY").format("MMMM D");
    if (ordersCount[orderDate] !== undefined) {
      ordersCount[orderDate]++;
    }
  });

  return ordersCount;
};

// LATEST 10 ORDERS FOR DISPLAYING IN ADMIN DASHBOARD
const getLatest10Orders = async () => {
  try {
    const allOrders = [];

    // Fetch all products from vendors
    const vendorProducts = await Vendor.find().populate("products");

    // Fetch orders from users
    const usersWithOrders = await User.find({ "orders.0": { $exists: true } });
    usersWithOrders.forEach((user) => {
      user.orders.forEach((order) => {
        order.products.forEach((product) => {
          if (product.productId) {
            const matchingProduct = vendorProducts.find((vendor) =>
              vendor.products.some(
                (vendorProduct) =>
                  vendorProduct._id.toString() === product.productId.toString()
              )
            );

            if (matchingProduct) {
              const matchingProductDetail = matchingProduct.products.find(
                (vendorProduct) =>
                  vendorProduct._id.toString() === product.productId.toString()
              );

              const vendorOrder = {
                userName: user.name,
                userId: user._id,
                orderId: order.orderId,
                productName: matchingProductDetail.productName,
                color: matchingProductDetail.productColor,
                size: matchingProductDetail.productSize,
                productId: product.productId,
                category: matchingProductDetail.productCategory,
                image: matchingProductDetail.productImages[0],
                price: product.price,
                orderStatus: product.orderStatus,
                totalAmount: order.totalAmount,
                orderDate: moment(order.orderDate, "DD/MM/YYYY").format("MMMM D"), // Format order date
                expectedDeliveryDate: moment(order.expectedDeliveryDate, "DD/MM/YYYY").format("MMMM D"), // Format expected delivery date
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                cancelReason: product.cancelReason,
              };
              allOrders.push(vendorOrder);
            }
          }
        });
      });
    });

    // Sort orders by order date (most recent first)
    allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    // Get the latest 10 orders
    const latest10Orders = allOrders.slice(0, 10);

    return latest10Orders;
  } catch (error) {
    console.error("Error fetching latest 10 orders:", error);
    throw error;
  }
};

module.exports = {
  calculateTotalSales,
  getOrdersCountForLast10Days,
  getLatest10Orders,
};
