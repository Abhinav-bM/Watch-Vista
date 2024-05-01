const Admin = require("../models/adminModel");
const User = require("../models/usersModel");
const Vendor = require("../models/vendorsModel");
const {
  calculateTotalSales,
  getOrdersCountForLast10Days,
  getLatest10Orders,
} = require("../helpers/adminDashboard");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

// ADMIN LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  try {
    res.render("admin/adminlogin");
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" });
  }
};

// ADMIN LOGIN
let loginPostPage = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (admin) {
      if (req.body.password === admin.password) {
        const token = jwt.sign(
          {
            id: admin._id,
            name: admin.name,
            email: admin.email,
          },
          process.env.JWT_KEY,
          {
            expiresIn: "24h",
          }
        );
        res.cookie("admin_jwt", token, { httpOnly: true, maxAge: 86400000 }); // 24 hour expiry

        res.redirect("/admin/dashboard");
        console.log("Admin logged in successfully, jwt created");
        return;
      } else {
        res.status(401).render("admin/adminlogin", { error: "Wrong password" });
        return;
      }
    } else {
      console.log("User not found:", req.body.email);
      res.status(404).render("admin/adminlogin", { error: "User not found" });
      return;
    }
  } catch (error) {
    console.error("Internal server error:", error);
    res
      .status(500)
      .render("admin/adminlogin", { error: "Internal server error" });
    return;
  }
};

// ADMIN DASHBOARD DISPLAY
let dashboardPage = async (req, res) => {
  try {
    const user = req.user;
    const vendors = await Vendor.find();
    const users = await User.find({}, "orders");
    const admin = await Admin.findOne();

    const allOrders = users.flatMap((user) => user.orders);

    let productsArr = [];
    allOrders.forEach((prod) => {
      prod.products.forEach((product) => productsArr.push(product));
    });
    const filtered = productsArr.filter(
      (prod) => prod.orderStatus === "Delivered"
    );
    let totalSales = 0;
    filtered.forEach((prod) => (totalSales += prod.qty * prod.price));

    ///////////////////////////////
    const vendorProducts = await Vendor.find().populate("products");

    const usersWithOrders = await User.find({ "orders.0": { $exists: true } });

    const vendorOrders = [];

    usersWithOrders.forEach((user) => {
      user.orders.forEach((order) => {
        order.products.forEach((product) => {
          if (product.productId) {
            // Find the matching product from vendor products
            const matchingProduct = vendorProducts.reduce((acc, vendor) => {
              const foundProduct = vendor.products.find((vendorProduct) =>
                vendorProduct._id.equals(product.productId)
              );
              return foundProduct ? foundProduct : acc;
            }, null);

            if (matchingProduct) {
              const vendorOrder = {
                quantity: product.qty,
                price: product.price,
                orderStatus: product.orderStatus,
                orderDate: order.orderDate,
              };
              vendorOrders.push(vendorOrder);
            }
          }
        });
      });
    });
    ///////////////////////////////

    const salesData = calculateTotalSales(vendorOrders);
    const ordersCountForLast10Days = getOrdersCountForLast10Days(vendorOrders);
    const latest10orders = await getLatest10Orders();

    res.render("admin/dashboard", {
      user,
      vendors,
      totalSales,
      users,
      salesData,
      ordersCountForLast10Days,
      latest10orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "server side error" });
  }
};

// CUSTOMERS LIST
let customersList = async (req, res) => {
  try {
    let users = await User.find();
    const admin = await Admin.findOne();
    res.render("admin/customersList", { user: users, admin });
  } catch (error) {
    console.log(error);
  }
};

let blockUser = async (req, res) => {
  let email = req.body.email;
  try {
    const user = await User.findOne({ email });
    console.log(user);
    if (user) {
      user.blocked = !user.blocked;
      await user.save();
    }
    res.redirect("/admin/customersList");
  } catch (error) {
    res.status(500).send("Error on admin Changing User status");
  }
};

// CATEGORY LIST DISPLAY
let categoryList = async (req, res) => {
  try {
    let admin = await Admin.findOne();
    let data = admin.categories;
    res.render("admin/category-list", { data, user: admin });
  } catch (error) {
    console.error(error);
    res.status(404).send("page not found");
  }
};

// ADD CATEGORY POST PAGE
let addCategory = async (req, res) => {
  let { categoryName } = req.body;
  try {
    let admin = await Admin.findOne();
    const newCategory = {
      categoryName: categoryName,
    };
    admin.categories.push(newCategory);
    console.log("category added successfully :", categoryName);
    admin.save();
    res.redirect("/admin/categoryList");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error adding new category" });
  }
};

// UPDATE CATEGORY
let updateCategory = async (req, res) => {
  let categoryId = req.body.editCategoryId;
  let categoryName = req.body.editCategoryName;

  try {
    const admin = await Admin.updateOne(
      { "categories._id": categoryId },
      { $set: { "categories.$.categoryName": categoryName } }
    );
    console.log("category updated successfully : ", categoryName);

    if (!admin) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).redirect("/admin/categoryList");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal Server Error");
  }
};

// CATEGORY DELETE
let deleteCategory = async (req, res) => {
  const deleteCategoryId = req.body.deleteCategoryId;

  try {
    let admin = await Admin.findOne();

    const categoryIndex = admin.categories.findIndex(
      (cat) => cat._id.toString() === deleteCategoryId
    );

    if (categoryIndex === -1) {
      // Category not found
      return res.status(404).json({ error: "Category not found" });
    }

    admin.categories.splice(categoryIndex, 1);
    console.log("category deleted successfully");

    await admin.save();

    res.status(200).redirect("/admin/categoryList");
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// SUBCATEGORY PAGE DISPLAY
let subcategoryList = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    const categories = admin.categories;
    const subcategoriesWithCategories = admin.categories.reduce(
      (acc, category) => {
        const subcategories = category.subcategories.map((subcategory) => {
          return {
            id: subcategory._id,
            subcategoryName: subcategory.subcategoryName,
            categoryName: category.categoryName,
            createdAt: subcategory.createdAt,
          };
        });
        return acc.concat(subcategories);
      },
      []
    );

    res.render("admin/subcategory-list", {
      subcategories: subcategoriesWithCategories,
      categories,
      user: admin,
    });
  } catch (error) {
    console.error(error);
    res.status(404).send("page not found");
  }
};

let addSubcategory = async (req, res) => {
  const { categoryId, subcategoryName } = req.body;
  try {
    let admin = await Admin.findOne();
    if (!admin) {
      res.status(404).json({ error: "Admin not found" });
    }
    // FIND CATEGORY BY ID
    const category = admin.categories.id(categoryId);
    if (!category) {
      res.status(404).json({ error: "Categroy not found" });
    }

    category.subcategories.push({ subcategoryName });

    admin.save();

    res.redirect("/admin/subcategoryList");
  } catch (error) {
    console.error(error);
  }
};

let updateSubcategory = async (req, res) => {
  let subcategoryId = req.body.editSubcategoryId;
  let subcategoryName = req.body.editSubcategoryName;

  console.log("subcategoryID : ", subcategoryId);
  console.log("subcategoryName :", subcategoryName);

  try {
    let admin = await Admin.findOne();
    if (!admin) {
      return res.status(400).send("Admin Not Found");
    }
    let foundSubcategory = null;
    let foundCategory = null;

    // Search through categories and subcategories to find the subcategory with the given ID
    admin.categories.forEach((category) => {
      const subcategory = category.subcategories.find(
        (sub) => sub._id.toString() === subcategoryId
      );
      if (subcategory) {
        foundSubcategory = subcategory;
        foundCategory = category;
      }
    });

    // Update the found subcategory name
    foundSubcategory.subcategoryName = subcategoryName;

    await admin.save();
    console.log("subcategory updated successfully");

    res.redirect("/admin/subcategoryList");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal Server Error");
  }
};

let deleteSubcategory = async (req, res) => {
  const { deleteSubcategoryId } = req.body;
  console.log(deleteSubcategoryId);
  try {
    // Find the admin document
    let admin = await Admin.findOne();

    let categoryIndex = -1;
    let subcategoryIndex = -1;

    admin.categories.forEach((category, i) => {
      const index = category.subcategories.findIndex(
        (sub) => sub._id.toString() === deleteSubcategoryId
      );
      if (index !== -1) {
        categoryIndex = i;
        subcategoryIndex = index;
        return;
      }
    });

    admin.categories[categoryIndex].subcategories.splice(subcategoryIndex, 1);
    admin.save();
    console.log("subcategory deleted successfully");
    res.status(200).redirect("/admin/subcategoryList");
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// VENODRS LIST
let vendorsList = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    const admin = await Admin.findOne({});
    res.status(200).render("admin/vendorsList", { vendors, user: admin });
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
};

// LIST PRODUCT PAGE
let productList = async (req, res) => {
  try {
    const user = await Admin.findOne();
    const products = await Vendor.aggregate([
      { $unwind: "$products" },
      {
        $project: {
          _id: "$products._id",
          productName: "$products.productName",
          productCategory: "$products.productCategory",
          productSubCategory: "$products.productSubCategory",
          productBrand: "$products.productBrand",
          productColor: "$products.productColor",
          productSize: "$products.productSize",
          productQTY: "$products.productQTY",
          productPrice: "$products.productPrice",
          productMRP: "$products.productMRP",
          productDiscount: "$products.productDiscount",
          productImages: "$products.productImages",
          productDescription: "$products.productDescription",
        },
      },
    ]);
    res.status(200).render("admin/product-list", { products, user });
  } catch (error) {
    console.error("vendor product list error", error);
    res.status(404).send("page not found");
  }
};

// BLOCK AND UNBLOCK VENDORS
let verifyVendor = async (req, res) => {
  try {
    let email = req.body.email;
    const vendor = await Vendor.findOne({ email });
    if (vendor) {
      vendor.status = !vendor.status;
      await vendor.save();
    }
    res.redirect("/admin/vendorsList");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error on vendor verification");
  }
};

// COUPON LIST GET PAGE
let couponList = async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    const coupons = admin.coupons;
    res.render("admin/coupons-list", { coupons, user: admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ADD COUPON GET PAGE
let couponAddGet = async (req, res) => {
  try {
    const categories = await Admin.aggregate([
      { $unwind: "$categories" },
      { $project: { _id: 0, categoryName: "$categories.categoryName" } },
    ]);
    const admin = await Admin.findOne({});
    res.status(200).render("admin/coupon-add", { categories, user: admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

// ADD COUPON POST
let couponAddPost = async (req, res) => {
  console.log("added coupon: ", req.body);
  const { couponCode, couponStatus, couponType, discountValue, endDate } =
    req.body;
  try {
    const admin = await Admin.findOne();
    const coupon = {
      couponCode,
      couponStatus,
      couponType,
      discountValue,
      endDate,
    };
    admin.coupons.push(coupon);
    admin.save();
    res.status(200).redirect("/admin/couponList");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EDIT COUPON PAGE
let editCouponGet = async (req, res) => {
  const couponId = req.params.id;
  try {
    const admin = await Admin.findOne();
    const coupon = admin.coupons;

    const couponForEdit = coupon.find(
      (coupon) => coupon._id.toString() === couponId
    );

    const categories = await Admin.aggregate([
      { $unwind: "$categories" },
      { $project: { _id: 0, categoryName: "$categories.categoryName" } },
    ]);

    res
      .status(200)
      .render("admin/coupon-edit", { couponForEdit, categories, user: admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

// EDIT COUPON POST PAGE
let editCouponPost = async (req, res) => {
  const couponId = req.body.id;
  const data = req.body.data;
  try {
    const admin = await Admin.findOne();
    const index = admin?.coupons.findIndex(
      (coupon) => coupon._id.toString() == couponId
    );
    admin.coupons[index] = data;
    console.log(data);
    await admin.save();
    res.status(200).json({ message: "Coupon updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: "Internal server error" });
  }
};

// COUPON DELETE
let deleteCoupon = async (req, res) => {
  const couponId = req.params.id;
  console.log("id for delete coupn :", couponId);
  try {
    const admin = await Admin.findOne({});
    const index = admin?.coupons.findIndex(
      (coupon) => coupon._id.toString() == couponId
    );
    admin?.coupons.splice(index, 1);
    admin.save();
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// BANNER GET PAGE
let bannerGetPage = async (req, res) => {
  try {
    const admin = await Admin.findOne();
    const banner = admin.banner;
    res.status(200).render("admin/banner", { banner, user: admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
};

// BANNER ADD POST
let bannerAddPost = async (req, res) => {
  const { placement } = req.body;
  let imageData = req.files;

  try {
    let admin = await Admin.findOne();
    console.log(placement, admin);

    let imageUrl = ""; // Variable to store single image URL

    if (placement) {
      if (imageData.length > 0) {
        const result = await cloudinary.uploader.upload(imageData[0].path);
        imageUrl = result.secure_url;
      } else {
        console.log("No image data found");
      }
    } else {
      console.log("No placement data found");
    }

    const newBanner = {
      image: imageUrl, // Assign single image URL
      placement,
    };

    admin.banner.push(newBanner);

    await admin.save();
    res.status(200).redirect("/admin/banner");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server error" });
  }
};

// DELETE BANNER
let deleteBanner = async (req, res) => {
  const bannerId = req.params.bannerId;
  try {
    const admin = await Admin.findOne();
    const banner = admin.banner;
    const index = banner.findIndex((ban) => ban._id.toString() === bannerId);
    banner.splice(index, 1);
    await admin.save();
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//ADMIN LOGOUT
let adminLogout = (req, res) => {
  try {
    // Clear the JWT cookie
    res.clearCookie("admin_jwt");

    res.redirect("/admin/login");
    console.log("Admin logged out");
    return;
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
  }
};

// ORDERS LIST PAGE
const ordersList = async (req, res) => {
  try {
    const ordersWithProducts = await User.aggregate([
      {
        $unwind: "$orders",
      },
      {
        $lookup: {
          from: "vendors",
          localField: "orders.products.productId",
          foreignField: "products._id",
          as: "vendorDetails",
        },
      },
      {
        $unwind: "$vendorDetails",
      },
      {
        $unwind: "$vendorDetails.products",
      },
      {
        $unwind: "$orders.products",
      },
      {
        $sort: { "orders.orderDate": -1 },
      },
      {
        $project: {
          _id: "$orders._id",
          orderId: "$orders.orderId",
          userName: "$name",
          userEmail: "$email",
          productName: "$vendorDetails.products.productName",
          productImages: "$vendorDetails.products.productImages",
          size: "$orders.products.size",
          qty: "$orders.products.qty",
          price: "$orders.products.price",
          orderStatus: "$orders.products.orderStatus",
          cancelReason: "$orders.products.cancelReason",
          totalAmount: "$orders.totalAmount",
          orderDate: "$orders.orderDate",
          expectedDeliveryDate: "$orders.expectedDeliveryDate",
          shippingAddress: "$orders.shippingAddress",
          paymentMethod: "$orders.paymentMethod",
        },
      },
    ]);

    const admin = await Admin.findOne();

    console.log("admin side orders with aggregation :", ordersWithProducts);

    res
      .status(200)
      .render("admin/orders-list", { orders: ordersWithProducts, admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  loginGetPage,
  loginPostPage,
  dashboardPage,
  customersList,
  blockUser,
  adminLogout,
  categoryList,
  addCategory,
  updateCategory,
  deleteCategory,
  subcategoryList,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  vendorsList,
  productList,
  verifyVendor,
  couponList,
  couponAddGet,
  couponAddPost,
  editCouponGet,
  editCouponPost,
  deleteCoupon,
  bannerGetPage,
  bannerAddPost,
  deleteBanner,
  ordersList,
};
