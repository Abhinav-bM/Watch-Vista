const moment = require("moment");

// FUNCTION CALCULATE SALES OF EACH DAY
function calculateTotalSales(vendorOrders) {
  const salesData = {};
  const validOrders = vendorOrders.filter(
    (order) => order.orderStatus !== "Cancelled"
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

  console.log("sales data :", salesData);

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
  
    // Iterate through each vendor order
    vendorOrders.forEach((order) => {
      // Get the category
      const category = order.category;
  
      // If the order status is not "Cancelled"
      if (order.orderStatus !== 'Cancelled') {
        // If the category already exists, increment the total orders
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
  


module.exports = {calculateTotalSales , calculateTopCategoriesSales}
