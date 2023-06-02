const User = require("../../../models/userModel");
const item = require("../../../models/item");
const loan = require("../../../models/loan");
const Cart = require('../../../models/cart');

var nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

exports.viewLoanRequests = async (req, res) => {
  const userId = req.user.userData._id;
  const users = await User.findById(userId);
  const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

  if (req.user.userData.usertype !== "Approval") {
    return res.status(400).json({ error: "Invalid user type" });
  }
  try {
    const approvalDepartment = req.user.userData.department;
    const loanRequests = await loan
      .find({ status: "pending" })
      .populate({
        path: "user_id",
        select: "name department year usertype userid image",
        match: { department: approvalDepartment, usertype: "User" },
      })
      .populate({
        path: "items.item",
        select: "name available_items",
      })
      .select("items status return_date request_date")
      .exec();

    const currentUserData = req.user.userData;
    return res.render("approval/pendingloan", {
      loanRequests: loanRequests.filter((loanRequest) => loanRequest.user_id),
      currentUserData, cartItemCount: cart ? cart.items.length : 0,
      users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.viewapprovalLoanRequests = async (req, res) => {
  try {
    const currentUserData = req.user.userData;
    const userId = req.user.userData._id;
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

    const approvalDepartment = currentUserData.department;
    console.log(approvalDepartment);
    const loanRequests = await loan
      .find({
        $or: [
          {
            status: "pending",
            approval: userId
          },

        ]
      })
      .populate("user_id", "name userid department year usertype image")
      .populate("items.item", "name available_items")
      .select("items status return_date request_date approval")
      .exec();




    const users = await User.findById(userId);
    console.log(loanRequests)

    return res.render("approval/approvalpendingloan", {
      loanRequests,
      users,
      currentUserData, cartItemCount: cart ? cart.items.length : 0
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};



exports.viewuserloandetail = async (req, res) => {
  try {
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


    // Retrieve the loan details using the loanId
    const loanDetails = await loan.findById(loanId)
      .populate("user_id", "name department usertype userid image")
      .populate("items.item", "name available_items image itemtag ");

    if (!loanDetails) {
      // Handle loan not found
      return res.status(404).render('error', { message: 'Loan not found' });
    }

    // Render the loan details page with the loanDetails data
    return res.render('approval/loan-detailsapproval', { loanDetails, users, cartItemCount: cart ? cart.items.length : 0 });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
}


exports.manageLoanRequest = async (req, res) => {
  const userId = req.user.userData._id;
  const users = await User.findById(userId);
  const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
  const approvalDepartment = req.user.userData.department;

  const loanRequests = await loan
    .find({
      status: "pending",
    })
    .populate("user_id", "name department year usertype")
    .populate({
      path: "user_id",
      select: "name department year usertype image",
      match: { department: approvalDepartment, usertype: "User" },
    })
    .populate("items.item", "name available_items")
    .select("items.item status return_date request_date")
    .exec();

  const currentUserData = req.user.userData;

  var transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.USER_PASS,
    },
  });

  const loan_id = req.params.id;
  const Loan = await loan
    .findById(loan_id)
    .populate("user_id", "email")
    .populate("items.item");
  const items = Loan.items;
  const itemIds = items.map((item) => item.item._id);
  const Items = await item.find({ _id: { $in: itemIds } });

  if (!Items) {
    return res.render("approval/pendingloan", {
      loanRequests,
      currentUserData,
      users, cartItemCount: cart ? cart.items.length : 0,
      message: "Item is not available",
    });
  }

  let insufficientStock = false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const Item = Items.find((obj) => obj._id.toString() === item.item._id.toString());

    if (Item.available_items < 1) {
      insufficientStock = true;
      transporter.sendMail(
        {
          from: process.env.USER_MAIL,
          to: Loan.user_id.email,
          subject: "ICT Equipment Loan System",
          text: `Dear user, your loan for the item: ${Item.name}, has been gone with insufficient stock, it might be because another user has applied for the item earlier. Please try to look at the item availability again and submit your request based on the availability of item. Thank you.`,
        },
        function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        }
      );
      break;
    }
  }

  if (insufficientStock) {
    return res.render("approval/pendingloan", {
      loanRequests,
      users,
      currentUserData,
      users, cartItemCount: cart ? cart.items.length : 0,
      message: "Insufficient stock or quantity, the item is on loan.",
    });
  }

  try {
    await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          status: "approved",
        },
      },
      { new: true }
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const Item = Items.find((obj) => obj._id.toString() === item.item._id.toString());
      Item.available_items--;

      if (Item.available_items <= 0) {
        Item.available_items = 0;
      }

      await Item.save();
    }

    transporter.sendMail(
      {
        from: process.env.USER_MAIL,
        to: Loan.user_id.email,
        subject: "ICT Equipment Loan System",
        text: `Your loan for the items has been approved. Soon you will be notified with collection date.`,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );

    req.flash("success_msg", "Loan Request Approved");
    req.session.save(() => {
      res.redirect("/view-req-loan");
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.manageapprovalLoanRequest = async (req, res) => {
  const userId = req.user.userData._id;
  const users = await User.findById(userId);
  const approvalDepartment = req.user.userData.department;
  const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


  const loanRequests = await loan
    .find({
      status: "pending",
    })
    .populate("user_id", "name department year usertype")
    .populate({
      path: "user_id",
      select: "name department year usertype image",
      match: { department: approvalDepartment, usertype: "User" },
    })
    .populate("items.item", "name available_items")
    .select("items.item status return_date request_date")
    .exec();

  const currentUserData = req.user.userData;

  var transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.USER_PASS,
    },
  });

  const loan_id = req.params.id;
  const Loan = await loan
    .findById(loan_id)
    .populate("user_id", "email")
    .populate("items.item");
  const items = Loan.items;
  const itemIds = items.map((item) => item.item._id);
  const Items = await item.find({ _id: { $in: itemIds } });

  if (!Items) {
    return res.render("approval/approvalpendingloan", {
      loanRequests,
      currentUserData,
      users, users, cartItemCount: cart ? cart.items.length : 0,

      message: "Item is not available",
    });
  }

  let insufficientStock = false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const Item = Items.find((obj) => obj._id.toString() === item.item._id.toString());

    if (Item.available_items < 1) {
      insufficientStock = true;
      transporter.sendMail(
        {
          from: process.env.USER_MAIL,
          to: Loan.user_id.email,
          subject: "ICT Equipment Loan System",
          text: `Dear user, your loan for the item: ${Item.name}, has been gone with insufficient stock, it might be because another user has applied for the item earlier. Please try to look at the item availability again and submit your request based on the availability of item. Thank you.`,
        },
        function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        }
      );
      break;
    }
  }

  if (insufficientStock) {
    return res.render("approval/approvalpendingloan", {
      loanRequests,
      users, users, cartItemCount: cart ? cart.items.length : 0,
      currentUserData,
      message: "Insufficient stock or quantity, the item is on loan.",
    });
  }

  try {
    await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          status: "approved",
        },
      },
      { new: true }
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const Item = Items.find((obj) => obj._id.toString() === item.item._id.toString());
      Item.available_items--;

      if (Item.available_items <= 0) {
        Item.available_items = 0;
      }

      await Item.save();
    }

    transporter.sendMail(
      {
        from: process.env.USER_MAIL,
        to: Loan.user_id.email,
        subject: "ICT Equipment Loan System",
        text: `Your loan for the items has been approved. Soon you will be notified with collection date.`,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );

    req.flash("success_msg", "Loan Request Approved");
    req.session.save(() => {
      res.redirect("/viewapproval-req-loan");
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.rejectLoanRequest = async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.USER_PASS,
    },
  });

  if (req.user.userData.usertype !== "Approval") {
    return res.status(400).json({ error: "Invalid user type" });
  }

  const loan_id = req.params.id;

  try {
    // Find the loan request by ID
    const Loan = await loan
      .findById(loan_id)
      .populate("user_id", "email")
      .populate("items.item");

    const items = Loan.items.map(item => item.item.name);
    const itemsText = items.join(", ");

    await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          status: "rejected",
        },
      },
      { new: true }
    );

    transporter.sendMail(
      {
        from: process.env.USER_MAIL,
        to: Loan.user_id.email,
        subject: "ICT Equipment Loan System",
        text: `Dear user, your loan for the following item: ${itemsText}, has been rejected.`,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );

    req.flash("success_msg", "Loan Request Rejected");
    req.session.save(() => {
      res.redirect("/view-req-loan");
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getLoanRequests = async (req, res) => {
  try {
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


    // Retrieve the loan details using the loanId
    const userLoan = await loan
      .find({
        user_id: userId
      })
      .populate("user_id", "name department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category", // Include the 'category' field from the item schema
        populate: { path: "category", select: "name" } // Populate the 'category' field from the item schema
      });



    // Render the loan details page with the loanDetails data
    return res.render('approval/personalapprovalloan', { userLoan, users, users, cartItemCount: cart ? cart.items.length : 0,    });
  } catch (error) {
    // Handle errors
    console.log(error.message);
  }
};



exports.viewapprovalloandetail = async (req, res) => {
  try {
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


    // Retrieve the loan details using the loanId
    const loanDetails = await loan.findById(loanId)
      .populate("user_id", "name department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category", // Include the 'category' field from the item schema
        populate: { path: "category", select: "name" } // Populate the 'category' field from the item schema
      });

    console.log(loanDetails);

    if (!loanDetails) {
      // Handle loan not found
      return res.status(404).render('error', { message: 'Loan not found' });
    }

    // Render the loan details page with the loanDetails data
    return res.render('approval/approvalloandetail', { loanDetails, users,users, cartItemCount: cart ? cart.items.length : 0,
    });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
};


exports.rejectapprovalLoanRequest = async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.USER_MAIL,
      pass: process.env.USER_PASS,
    },
  });

  if (req.user.userData.usertype !== "Approval") {
    return res.status(400).json({ error: "Invalid user type" });
  }

  const loan_id = req.params.id;

  try {
    // Find the loan request by ID
    const Loan = await loan
      .findById(loan_id)
      .populate("user_id", "email")
      .populate("items.item");

    const items = Loan.items.map(item => item.item.name);
    const itemsText = items.join(", ");

    await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          status: "rejected",
        },
      },
      { new: true }
    );

    transporter.sendMail(
      {
        from: process.env.USER_MAIL,
        to: Loan.user_id.email,
        subject: "ICT Equipment Loan System",
        text: `Dear user, your loan for the following item: ${itemsText}, has been rejected.`,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );

    req.flash("success_msg", "Loan Request Rejected");
    req.session.save(() => {
      res.redirect("/viewapproval-req-loan");
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};





