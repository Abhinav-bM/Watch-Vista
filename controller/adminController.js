const Admin = require("../models/adminModel");
const User = require("../models/usersModel");
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
let dashboardPage = (req, res) => {
  try {
    const user = req.user;
    res.render("admin/dashboard", { user });
  } catch (error) {
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
    res.redirect("/customersList");
  } catch (error) {
    res.status(500).send("Error on admin Changing User status");
  }
};

// CATEGORY LIST DISPLAY
let categoryList = async (req, res) => {
  try {
    let admin = await Admin.findOne()
    let data = admin.category
    // console.log(data);
    res.render("admin/category-list",{data});
  } catch (error) {
    console.error(error);
    res.status(404).send("page not found");
  }
};

// ADD CATEGORY POST PAGE
let addCategory = async (req, res) => {
  let { categoryName } = req.body;
  try {
    console.log(categoryName);
    let admin = await Admin.findOne()
    admin.category.push({categoryName})
    admin.save()
    res.redirect("/admin/categoryList")
  } catch (error) {
    console.error(error);
  }
};

// UPDATE CATEGORY
let updateCategory = async (req, res) => {
  let categoryId = req.body.editCategoryId;
  let categoryName = req.body.editCategoryName;

  try {
    let admin = await Admin.findOne();
    if (!admin) {
      return res.status(400).send('Admin Not Found');
    }

    let categoryInd = admin.category.findIndex(cat => cat._id == categoryId);
    if (categoryInd === -1) {
      return res.status(400).send('Category Not Found');
    }

    admin.category[categoryInd].categoryName = categoryName;
    await admin.save();

    res.redirect('/admin/categoryList');
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).send('Internal Server Error');
  }
};

// CATEGORY DELETE 
let deleteCategory = async (req, res) => {
  const deleteCategoryId = req.body.deleteCategoryId;

  try {
    // Find the admin document
    let admin = await Admin.findOne();

    // Find the index of the category to be deleted
    const categoryIndex = admin.category.findIndex(
      (cat) => cat._id.toString() === deleteCategoryId
    );

    if (categoryIndex === -1) {
      // Category not found
      return res.status(404).json({ error: "Category not found" });
    }

    // Remove the category from the array
    admin.category.splice(categoryIndex, 1);

    // Save the updated admin document
    await admin.save();

    // Send a success response
    res.status(200).redirect("/admin/categoryList");
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// SUBCATEGORY PAGE DISPLAY
let subcategoryList = async (req, res) =>{
  try {
    let admin = await Admin.findOne()
    let data = admin.subcategory
    console.log(data);
    res.render("admin/subcategory-list",{data});
  } catch (error) {
    console.error(error);
    res.status(404).send("page not found");
  }
}


let addSubcategory = async (req, res) => {
  let { subcategoryName } = req.body;
  try {
    console.log(subcategoryName);
    let admin = await Admin.findOne()
    admin.subcategory.push({subcategoryName})
    admin.save()
    res.redirect("/admin/subcategoryList")
  } catch (error) {
    console.error(error);
  }
}

let updateSubcategory = async (req, res) => {
  let subcategoryId = req.body.editSubcategoryId;
  let subcategoryName = req.body.editSubcategoryName;

  try {
    let admin = await Admin.findOne();
    if (!admin) {
      return res.status(400).send('Admin Not Found');
    }

    let subcategoryInd = admin.subcategory.findIndex(cat => cat._id == subcategoryId);
    if (subcategoryInd === -1) {
      return res.status(400).send('Category Not Found');
    }

    admin.subcategory[subcategoryInd].subcategoryName = subcategoryName;
    await admin.save();

    res.redirect('/admin/subcategoryList');
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).send('Internal Server Error');
  }
}

let deleteSubcategory = async (req, res)=>{
  const deleteSubcategoryId = req.body.deleteSubcategoryId;

  try {
    // Find the admin document
    let admin = await Admin.findOne();

    // Find the index of the category to be deleted
    const subcategoryIndex = admin.subcategory.findIndex(
      (cat) => cat._id.toString() === deleteSubcategoryId
    );

    if (subcategoryIdcategoryIndex === -1) {
      // Category not found
      return res.status(404).json({ error: "Category not found" });
    }

    // Remove the category from the array
    admin.subcategory.splice(subcategoryIndex, 1);

    // Save the updated admin document
    await admin.save();

    // Send a success response
    res.status(200).redirect("/admin/subcategoryList");
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

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
  deleteSubcategory
};
