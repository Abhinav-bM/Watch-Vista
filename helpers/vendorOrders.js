function vendorOrders(vendorProducts, usersWithOrders) {
  const vendorOrders = [];

  usersWithOrders.forEach((user) => {
    user.orders.forEach((order) => {
      order.products.forEach((product) => {
        if (product.productId) {
          const matchingProduct = vendorProducts.products.find(
            (vendorProduct) => vendorProduct._id.equals(product.productId)
          );

          if (matchingProduct) {
            const vendorOrder = {
              userId: user._id,
              orderId: order.orderId,
              productName: matchingProduct.productName,
              color: matchingProduct.productColor,
              size: matchingProduct.productSize,
              productId: product.productId,
              category: matchingProduct.productCategory,
              image: matchingProduct.productImages[0],
              quantity: product.qty,
              price: product.price,
              orderStatus: product.orderStatus,
              totalAmount: order.totalAmount,
              orderDate: order.orderDate,
              expectedDeliveryDate: order.expectedDeliveryDate,
              shippingAddress: order.shippingAddress,
              paymentMethod: order.paymentMethod,
              razorPaymentId:order.razorPaymentId,
              razorpayOrderId : order.razorpayOrderId,              
              cancelReason: product?.cancelReason,
              returnReason : product?.returnReason,
              refundMethod:product?.refundMethod,
              refundDetails :product?.refundDetails
            };
            vendorOrders.push(vendorOrder);
          }
        }
      });
    });
  });

  return vendorOrders
}

module.exports = {vendorOrders}
