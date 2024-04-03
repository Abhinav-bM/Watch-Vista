const moment = require("moment");

// FUNCTION CALCULATE SALES OF EACH DAY
function calculateTotalSales(vendorOrders) {
  const salesData = {};
  const validOrders = vendorOrders.filter(
    (order) => order.orderStatus === "Delivered"
  );
  validOrders.forEach((order) => {
    const orderDate = moment(order.orderDate).format("YYYY-MM-DD");

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

// FUNCTION TO FIND OUT TOP CATEGORIES IN SALES
function calculateTopCategoriesSales(vendorOrders) {
  const categoryOrders = {};

  vendorOrders.forEach((order) => {
    const category = order.category;

    if (order.orderStatus == "Delivered") {
      if (categoryOrders[category]) {
        categoryOrders[category] += 1;
      } else {
        categoryOrders[category] = 1;
      }
    }
  });

  // Convert categoryOrders object to an array of objects for charting
  const chartData = Object.keys(categoryOrders).map((category) => ({
    category,
    totalOrders: categoryOrders[category],
  }));

  // Sort the chartData by total orders in descending order
  chartData.sort((a, b) => b.totalOrders - a.totalOrders);

  // Return the top categories with their total orders
  const topCategories = chartData.slice(0, 10); // You can change this number to get more or fewer top categories

  return topCategories;
}

function getLatest10DaysOrders(orders) {
  const sortedOrders = orders.sort(
    (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
  );
  const latest10DaysOrders = sortedOrders.slice(0, 10);
  return latest10DaysOrders;
}

function calculateTotalRevenue(orders) {
  console.log("total revenue orders :",orders);
    let totalRevenue = 0;
  
    // Iterate through each order and calculate revenue
    orders.forEach((order) => {
      if(order.orderStatus === "Delivered"){
        const revenue = order.quantity * order.price;
        totalRevenue += revenue;
      }
     
    });
  
    return totalRevenue;
}

function getUniqueCustomers(orders) {
    
    const uniqueUserIds = [...new Set(orders.map(order => order.userId.toString()))];
  
    const uniqueCustomers = uniqueUserIds.map(userId => {
      return orders.find(order => order.userId.toString() === userId);
    });
  
    return uniqueCustomers;
  }

module.exports = {
  calculateTotalSales,
  calculateTopCategoriesSales,
  getLatest10DaysOrders,
  calculateTotalRevenue,
  getUniqueCustomers,
};
