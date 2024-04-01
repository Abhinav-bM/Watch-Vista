const { defaultWorkerPolicies } = require("twilio/lib/jwt/taskrouter/util");
const Admin = require("../models/adminModel");
const User = require("../models/usersModel");
const Vendor = require("../models/vendorsModel");
const jwt = require("jsonwebtoken");

// ADMIN LOGIN PAGE DISPLAY
let loginGetPage = (req, res) => {
  try {
    res.render("admin/adminLogin");
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
let dashboardPage =async (req, res) => {
  try {
    const user = req.user;
    const vendors = await Vendor.find()
    const users = await User.find({} ,'orders');
    const allOrders = users.flatMap(user => user.orders);
    let productsArr = []
    allOrders.forEach((prod) => {
      prod.products.forEach(product=> productsArr.push(product))
    })
    const filtered = productsArr.filter(prod => prod.orderStatus ==="Delivered")
    let totalSales = 0;
    filtered.forEach(prod=> totalSales += (prod.qty * prod.price))
    
    res.render("admin/dashboard", { user ,vendors,totalSales, users});
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "server side error" });
  }
};

// CUSTOMERS LIST
let customersList = async (req, res) => {
  try {
    let user = await User.find();
    res.render("admin/customersList", { user });
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
    res.render("admin/category-list", { data });
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

  console.log("subcategoryID : ",subcategoryId)
  console.log("subcategoryName :", subcategoryName)

  try {
    let admin = await Admin.findOne();
    if (!admin) {
      return res.status(400).send("Admin Not Found");
    }
    let foundSubcategory = null;
    let foundCategory = null;

    // Search through categories and subcategories to find the subcategory with the given ID
    admin.categories.forEach(category => {
      const subcategory = category.subcategories.find(sub => sub._id.toString() === subcategoryId);
      if (subcategory) {
        foundSubcategory = subcategory;
        foundCategory = category;
      }
    });

    // Update the found subcategory name
    foundSubcategory.subcategoryName = subcategoryName;

    await admin.save();
    console.log("subcategory updated successfully")

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
    res.status(200).render("admin/vendorsList", { vendors });
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
};

// LIST PRODUCT PAGE
let productList = async (req, res) => {
  try {
    let products = await Vendor.find().select("products");
    res.status(200).render("admin/product-list", { products });
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

//ADMIN LOGOUT
let adminLogout = (req, res) => {
  try {
    // Clear the JWT cookie
    res.clearCookie("admin_jwt");

    res.redirect("/adminLogin");
    console.log("Admin logged out");
    return;
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).send("Internal Server Error");
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
};
