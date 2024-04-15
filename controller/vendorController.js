const Vendor = require("../models/vendorsModel");
const Admin = require("../models/adminModel");
const User = require("../models/usersModel");
const bcrypt = require("bcryptjs");
const {
  calculateTotalSales,
  calculateTopCategoriesSales,
  getLatest10DaysOrders,
  calculateTotalRevenue,
  getUniqueCustomers,
} = require("../helpers/vendorDashboard");
const { vendorOrders } = require("../helpers/vendorOrders");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../helpers/emailService");
const cloudinary = require("../config/cloudinary");
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
require("dotenv").config();
const PDFDocument = require("pdfkit");
const Excel = require("exceljs");

// VENDOR DASHBOARD PAGE DISPLAY
let dashboard = async (req, res) => {
  try {
    let email = req.user.email;
    let vendor = await Vendor.findOne({ email });
    let vendorId = vendor._id;

    const vendorProducts = await Vendor.findOne({ _id: vendorId }).populate(
      "products"
    );
    const usersWithOrders = await User.find({ "orders.0": { $exists: true } });

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
                cancelReason: product.cancelReason,
              };
              vendorOrders.push(vendorOrder);
            }
          }
        });
      });
    });

    const salesData = calculateTotalSales(vendorOrders);
    const topCategories = calculateTopCategoriesSales(vendorOrders);
    const latestTenOrders = getLatest10DaysOrders(vendorOrders);
    const totalRevenue = calculateTotalRevenue(vendorOrders);
    const customers = getUniqueCustomers(vendorOrders);

    res.status(200).render("vendor/dashboard", {
      vendor,
      salesData,
      vendorOrders,
      topCategories,
      latestTenOrders,
      totalRevenue,
      customers,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send("page not found");
  }
};

// VENDOR LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  try {
    res.status(200).render("vendor/vendorLogin");
  } catch (error) {
    res.status(500).send("server error : ", error);
  }
};

// VENDOR REGISTER PAGE DISPLAY
let registerGetPage = async (req, res) => {
  try {
    res.status(200).render("vendor/vendorRegister");
  } catch (error) {
    res.status(404).send("page not found");
  }
};

// VENDOR REGISTER POST PAGE
let vendorRegisterPostPage = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newVendor = new Vendor({
      vendorName: name,
      email,
      phoneNumber: phone,
      password: hashedPassword,
    });

    await newVendor.save();

    console.log(newVendor);

    res.status(201).redirect("/vendor/login");
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed. Please try again later." });
  }
};

// VENDOR LOGIN POST PAGE
let vendorLoginPostPage = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ email: req.body.email });

    if (vendor.status) {
      return res.render("vendor/vendorLogin", {
        error: "you are restricted by admin",
      });
    } else if (vendor) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        vendor.password
      );

      if (passwordMatch) {
        const token = jwt.sign(
          {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email,
          },
          process.env.JWT_KEY,
          {
            expiresIn: "24h",
          }
        );

        res.cookie("vendor_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry

        res.status(200).redirect("/vendor/dashboard");
        console.log("Vendor logged in successfully");
      } else {
        res
          .status(200)
          .render("vendor/VendorLogin", { error: "Wrong password" });
      }
    } else if (!vendor) {
      console.log("Vendor not found:", req.body.email);
      res.status(200).render("vendor/vendorLogin", { error: "User not found" });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    res
      .status(500)
      .render("vendor/vendorLogin", { error: "Internal server error" });
  }
};

// ADD PRODUCT PAGE DISPLAY
let addProduct = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    const categories = admin.categories.map((category) => ({
      categoryName: category.categoryName,
      subcategories: category.subcategories.map(
        (subcategory) => subcategory.subcategoryName
      ),
    }));

    res.status(200).render("vendor/product-add", { categories });
  } catch (error) {
    console.error(error);
    res.status(404).send("page not found");
  }
};

// ADD PRODUCT POST PAGE
let addProductpost = async (req, res) => {
  try {
    let { email } = req.user;
    let imageData = req.files;
    let productData = req.body;

    let vendor = await Vendor.findOne({ email });

    const imageUrls = [];

    if (productData) {
      for (const file of imageData) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
    } else {
      console.log("No product data found");
    }

    // Create a new Product instance with uploaded image URLs
    const newProduct = {
      productName: req.body.productName,
      productCategory: req.body.productCategory,
      productSubCategory: req.body.productSubcategory,
      productBrand: req.body.productBrand,
      productColor: req.body.productColor,
      productSize: req.body.productSize,
      productQTY: req.body.productQuantity,
      productPrice: req.body.productPrice,
      productMRP: req.body.productMRP,
      productDiscount: req.body.productDiscount,
      productImages: imageUrls,
      productDescription: req.body.productDescription,
    };
    vendor.products.push(newProduct);
    await vendor.save();
    res.redirect("/vendor/productList");
    console.log("product added successful");
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
};

// PRODUCT LIST
let producList = async (req, res) => {
  try {
    let _id = req.user.id;
    const vendor = await Vendor.findOne({ _id });
    let products = vendor.products;
    res.status(200).render("vendor/product-list", { products });
  } catch (error) {
    console.error("vendor product list error", error);
    res.status(404).send("page not found");
  }
};

// EDIT PRODUCT GET PAGE
let editProduct = async (req, res) => {
  try {
    let productId = req.params.id;

    let vendorId = req.user.id;
    let vendor = await Vendor.findOne({ _id: vendorId });
    if (!vendor) {
      res.status(400).send("Vendor not found");
    }

    let admin = await Admin.findOne();
    let product = vendor.products.find(
      (prod) => prod._id.toString() === productId
    );
    if (!product) {
      return res.status(404).send("Product Not Found");
    }

    const categories = admin.categories.map((category) => ({
      categoryName: category.categoryName,
      subcategories: category.subcategories.map(
        (subcategory) => subcategory.subcategoryName
      ),
    }));
    res.render("vendor/product-edit", { product, categories });
  } catch (error) {
    console.error(error);
    res.status(500).send("failed to get editproduct page");
  }
};

// EDIT PRODUDT POST PAGE
let editProductPost = async (req, res) => {
  try {
    let productId = req.params.id;
    let vendorId = req.user.id;
    const imageUrls = [];

    if (req.files) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      }
    }

    let vendor = await Vendor.findOne({ _id: vendorId });

    let productIndex = await vendor.products.findIndex(
      (product) => product._id.toString() === productId
    );

    if (productIndex === -1) {
      res.status(404).send("Product Not Found");
    } else {
      let updatedProduct = vendor.products[productIndex];
      updatedProduct.productName = req.body.productName;
      updatedProduct.productCategory = req.body.productCategory;
      updatedProduct.productSubCategory = req.body.productSubcategory;
      updatedProduct.productBrand = req.body.productBrand;
      updatedProduct.productColor = req.body.productColor;
      updatedProduct.productSize = req.body.productSize;
      updatedProduct.productQTY = req.body.productQuantity;
      updatedProduct.productPrice = req.body.productPrice;
      updatedProduct.productMRP = req.body.productMRP;
      updatedProduct.productDiscount = req.body.productDiscount;
      updatedProduct.productDescription = req.body.productDescription;
      updatedProduct.productImages = imageUrls;
      await vendor.save();

      res.status(200).redirect("/vendor/productList");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("server error edit failed");
  }
};

// DELETE PRODUCT POST PAGE
let deleteProduct = async (req, res) => {
  try {
    let vendorId = req.user.id;
    let productId = req.params.id;

    // FINDING VENDOR
    let vendor = await Vendor.findOne({ _id: vendorId });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // FINDING THE INDEX OF THE PRODUCT
    const productIndex = vendor.products.findIndex((product) => {
      product._id.toString() === productId;
    });

    // REMOVING PRODUCTS FORM THE PRODUCT ARRAY
    vendor.products.splice(productIndex, 1);

    await vendor.save();

    res.status(200).redirect("/vendor/productList");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// FORGOT PASSWORD
let forgotEmail = async (req, res) => {
  try {
    res.status(200).render("vendor/vendorForgotEmail");
  } catch (error) {
    res.statusf(404).send("page not found");
  }
};
let forgotPassEmailPost = async (req, res) => {
  try {
    const email = req.body.email;
    const vendor = await Vendor.find({ email });
    if (!vendor) {
      return res
        .status(404)
        .render("vendor/vendorForgotEmail", { error: "User not found" });
    }
    const otp = generateOTP();
    req.session.otp = otp;
    req.session.email = email;
    const message = `your otp for reset password is ${otp}`;
    await sendOtpEmail(email, message);

    res.status(200).render("vendor/forgotOtp");
  } catch (error) {
    console.error(error);
    res.status(500).send("error occured try after some time");
  }
};
let forgotOrpVerify = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const email = req.session.email;
    const storedOTP = req.session.otp;
    const vendor = await Vendor.findOne({ email });
    const bcryptedPass = await bcrypt.hash(newPassword, 10);
    if (otp == storedOTP) {
      vendor.password = bcryptedPass;
      vendor.save();

      delete req.session.otp;
      delete req.session.email;
      console.log("vendor password resetted");
      res.render("vendor/vendorLogin");
    } else {
      res.status(400).render("vendor/forgotOtp", { error: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occured try again later");
  }
};

// VENDOR LOGOUT
let vendorLogout = (req, res) => {
  try {
    // Clear the JWT cookie
    res.clearCookie("vendor_jwt");

    res.redirect("/vendor/login");
    console.log("vendor logged out");
    return;
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
  }
};

// VENDOR ORDER DISPLAY
let getOrdersForVendor = async (req, res) => {
  const vendorId = req.user.id;
  try {
    const vendorProducts = await Vendor.findOne({ _id: vendorId }).populate(
      "products"
    );
    const usersWithOrders = await User.find({ "orders.0": { $exists: true } });

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
                quantity: product.qty,
                price: product.price,
                orderStatus: product.orderStatus,
                totalAmount: order.totalAmount,
                orderDate: order.orderDate,
                expectedDeliveryDate: order.expectedDeliveryDate,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                cancelReason: product.cancelReason,
              };
              vendorOrders.push(vendorOrder);
            }
          }
        });
      });
    });

    res.render("vendor/order-list", { vendorOrders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ORDER STATUS UPDATE
let updateOrderStatus = async (req, res) => {
  const { orderId, productId } = req.params;
  const { status } = req.body;

  try {
    const user = await User.findOne({
      orders: { $elemMatch: { orderId: orderId } },
    });

    if (!user) {
      return res.status(404).json({ message: "User or order not found" });
    }

    const order = user.orders.find((order) => order.orderId === orderId);

    const product = order.products.find(
      (prod) => prod.productId.toString() === productId
    );

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found in the order" });
    }

    product.orderStatus = status;

    await user.save();

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET VENDOR PROFILE
let vendorProfile = async (req, res) => {
  const vendorId = req.user.id;
  try {
    const vendor = await Vendor.findOne({ _id: vendorId });

    res.status(200).render("vendor/vendor-profile", { vendor });
  } catch (error) {}
};

// SALES REPORT PDF
let salesPdf = async (req, res) => {
  const { startDate, endDate } = req.body;
  const vendorId = req.user.id;

  try {
    const vendorProducts = await Vendor.findOne({ _id: vendorId }).populate(
      "products"
    );
    const usersWithOrders = await User.find({ "orders.0": { $exists: true } });

    // Check if vendorProducts or usersWithOrders are not found
    if (!vendorProducts || !usersWithOrders) {
      return res.status(404).json({ error: "Vendor or users data not found" });
    }

    const orders = vendorOrders(vendorProducts, usersWithOrders);

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ error: "No orders found for the specified date range" });
    }

    // Create a new PDF document
    const doc = new PDFDocument();
    const fileName = `sales_report_${vendorId}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "..", "pdf-reports", fileName);

    // Pipe the PDF document to a write stream
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("Sales Report", { align: "center" }).moveDown();

    // Asynchronous loop function to process orders
    const processOrders = async () => {
      for (let index = 0; index < orders.length; index++) {
        const order = orders[index];
        console.log(`Processing Order ${index + 1}`);

        // Print order details
        doc.text(`Order ${index + 1}`);
        doc.text(`Order ID: ${order.orderId}`);
        doc.text(`Order Date: ${order.orderDate.toISOString().split("T")[0]}`);

        // Check if expectedDeliveryDate is a valid date before using toISOString
        const expectedDelivery =
          order.expectedDeliveryDate instanceof Date
            ? order.expectedDeliveryDate.toISOString().split("T")[0]
            : "";
        doc.text(`Expected Delivery Date: ${expectedDelivery}`);

        doc.text(`Shipping Address:`);
        doc.text(`Name: ${order.shippingAddress.name}`);
        doc.text(`Address: ${order.shippingAddress.address}`);
        doc.text(`District: ${order.shippingAddress.district}`);
        doc.text(`State: ${order.shippingAddress.state}`);
        doc.text(`Zip: ${order.shippingAddress.zip}`);
        doc.text(`Phone: ${order.shippingAddress.phone}`);
        doc.text(`Email: ${order.shippingAddress.email}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Total Amount: ${order.totalAmount}`);

        // Print products in the order
        doc.moveDown();
        doc.text(`Products:`);
        // Print product details
        doc.text(
          `- ${order.productName} - ${order.price} - Quantity: ${order.quantity}`
        );

        doc.moveDown();

        // Wait for the write stream to finish writing
        await new Promise((resolve) => doc.on("data", resolve));
      }

      // When all orders are processed, end the document
      doc.end();
    };

    // Call the async function to process orders
    await processOrders();

    // Wait for the write stream to finish writing
    writeStream.on("finish", () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).json({ error: "Internal Server Error" });
        } else {
          deleteFile(filePath);
        }
      });
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to delete file
const deleteFile = (filePath) => {
  try {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file: ${filePath}`, error);
  }
};

// SALES REPORT EXCEL
let salesExcel = async (req, res) => {
  const { startDate, endDate } = req.body;
  const vendorId = req.user.id;

  try {
    const vendorProducts = await Vendor.findOne({ _id: vendorId }).populate(
      "products"
    );
    const usersWithOrders = await User.find({ "orders.0": { $exists: true } });

    if (!vendorProducts || !usersWithOrders) {
      return res.status(404).json({ error: "Vendor or users data not found" });
    }

    const orders = vendorOrders(vendorProducts, usersWithOrders);

    // If there are no orders, send a response
    if (orders.length === 0) {
      return res.status(404).json({ error: "No orders found" });
    }

    console.log("Orders: ", orders);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    // Add headers to the worksheet
    worksheet.columns = [
      { header: "Order ID", key: "orderNumber" },
      { header: "Product", key: "productName" },
      { header: "Price", key: "price"},
      { header: "Quantity", key: "quantity"},
    ];

    // Populate the Excel sheet with orders
    orders.forEach((order) => {
      worksheet.addRow({
        orderNumber: order.orderId,
        productName: order.productName, // Corrected key to "productName"
        price: order.price, // Corrected key to "price"
        quantity: order.quantity,
      });
    });

    // Set response headers for Excel file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.xlsx"
    );

    // Write the workbook to the response stream
    await workbook.xlsx.write(res);

    // End the response
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  loginGetPage,
  registerGetPage,
  vendorRegisterPostPage,
  vendorLoginPostPage,
  forgotEmail,
  forgotPassEmailPost,
  forgotOrpVerify,
  dashboard,
  vendorLogout,
  addProduct,
  addProductpost,
  producList,
  editProduct,
  editProductPost,
  deleteProduct,
  getOrdersForVendor,
  updateOrderStatus,
  vendorProfile,
  salesPdf,
  salesExcel,
};
