const Vendor = require("../models/vendorsModel");

function findUserOrders(user, allVendors) {
  let cart = [];
  user.orders.forEach((order) => {
    order.products.forEach((product) => {
      const productId = product.productId;

      // Find the product and its vendor in allVendors
      allVendors.forEach((vendor) => {
        const foundProduct = vendor.products.find((p) =>
          p._id.equals(productId)
        );

        if (foundProduct) {
          const vendorInfo = {
            vendorId: vendor._id,
            vendorName: vendor.vendorName,
          };

          const productDetails = {
            _id: foundProduct._id,
            name: foundProduct.productName,
            category: foundProduct.productCategory,
            subcategory: foundProduct.productSubCategory,
            brand: foundProduct.productBrand,
            color: foundProduct.productColor,
            size: product.size,
            quantity: product.qty,
            price: foundProduct.productPrice,
            mrp: foundProduct.productMRP,
            discount: foundProduct.productDiscount,
            images: foundProduct.productImages,
            description: foundProduct.productDescription,
            vendor: vendorInfo,
            orderId: order.orderId,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount,
            expectedDeliveryDate: order.expectedDeliveryDate,
            orderStatus: product.orderStatus,
          };

          cart.push(productDetails);
        }
      });
    });
  });
  return cart
}

module.exports = {findUserOrders}