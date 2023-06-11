const User = require("../../../models/userModel");
const item = require("../../../models/item");
const loan = require("../../../models/loan");
const Cart = require('../../../models/cart');
const moment = require('moment');

var nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

exports.viewLoanRequests = async (req, res) => {
  const userId = req.user.userData._id;
  const users = await User.findById(userId);
  const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

  if (req.user.userData.usertype !== "Approval") {
    req.flash('error_msg', 'You are not authorized');
    return res.redirect('/');
  }

  try {
    const approvalDepartment = req.user.userData.department;
    let pendingapprovalLoanCount = 0; // Variable to store the count of pending loans

    // Find the pending loan requests for the current approval user's department
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

    // Count the number of pending loans for the current approval user
    const pendingLoansCount = loanRequests.filter((loanRequest) => loanRequest.user_id).length;
    pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

    const currentUserData = req.user.userData;
    return res.render("approval/pendingloan", {
      loanRequests: loanRequests.filter((loanRequest) => loanRequest.user_id),
      currentUserData,
      cartItemCount: cart ? cart.items.length : 0,
      users,
      pendingLoansCount: pendingLoansCount,
      pendingapprovalLoanCount // Pass the pendingLoanCount variable to the view

    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.viewapprovalLoanRequests = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }

    const currentUserData = req.user.userData;
    const userId = req.user.userData._id;
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    const approvalDepartment = currentUserData.department;

    let pendingapprovalLoanCount = 0;
    const userloanRequests = await loan
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
      .exec();// Variable to store the count of pending loans

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
    const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
    pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

    const users = await User.findById(userId);
    console.log(loanRequests);

    return res.render("approval/approvalpendingloan", {
      loanRequests,
      users,
      currentUserData,
      cartItemCount: cart ? cart.items.length : 0,
      pendingLoansCount: pendingLoansCount,
      pendingapprovalLoanCount // Pass the pendingLoanCount variable to the view
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.viewuserloandetail = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const currentUserData = req.user.userData;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    const approvalDepartment = currentUserData.department;

    let pendingapprovalLoanCount = 0;
    const userloanRequests = await loan
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
      .exec();// Variable to store the count of pending loans

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
    const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
    pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

    // Retrieve the loan details using the loanId
    const loanDetails = await loan.findById(loanId)
      .populate("user_id", "name department usertype userid image")
      .populate("items.item", "name available_items image itemtag ");

    if (!loanDetails) {
      // Handle loan not found
      return res.status(404).render('error', { message: 'Loan not found' });
    }

    // Render the loan details page with the loanDetails data
    return res.render('approval/loan-detailsapproval', {
      loanDetails, users, cartItemCount: cart ? cart.items.length : 0, pendingLoansCount: pendingLoansCount,
      pendingapprovalLoanCount
    });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
}


exports.manageLoanRequest = async (req, res) => {
  if (req.user.userData.usertype !== "Approval") {
    req.flash('error_msg', 'You are not authorized');

    return res.redirect('/');
  }
  const userId = req.user.userData._id;

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
    req.flash('error_msg', 'Item not available');
    return res.redirect('/view-req-loan');
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
    req.flash('error_msg', 'Insufficient stock or quantity, the item is on loan.');
    return res.redirect('/view-req-loan');

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
  if (req.user.userData.usertype !== "Approval") {
    req.flash('error_msg', 'You are not authorized');

    return res.redirect('/');
  }
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
    req.flash('error_msg', 'Equipment not found');
    return res.redirect('/viewapproval-req-loan');
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
    req.flash('error_msg', 'Insufficient stock or quantity, the item is on loan.');
    return res.redirect('/viewapproval-req-loan');
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
    req.flash('error_msg', 'You are not authorized');

    return res.redirect('/');
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
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
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
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    const currentUserData = req.user.userData;
    const approvalDepartment = currentUserData.department;

    let pendingapprovalLoanCount = 0;
    const userloanRequests = await loan
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
      .exec();// Variable to store the count of pending loans


    const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
    pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

    // Retrieve the loan details using the loanId
    const userLoan = await loan
      .find({
        user_id: userId
      })
      .populate("user_id", "name email department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category", // Include the 'category' field from the item schema
        populate: { path: "category", select: "name" } // Populate the 'category' field from the item schema
      });

    const currentDate = moment().startOf('day'); // Get the current date
    const loansToUpdate = userLoan.filter(loan => {
      const collectionDate = moment(loan.admin_collection_date).startOf('day');
      const newDateStarts = moment(loan.admin_new_date_start).startOf('day');
      const isCollectionDatePassed = collectionDate.isBefore(currentDate);
      const isNewDateStarted = newDateStarts.isSameOrBefore(currentDate);
      const isLoanAccepted = loan.status === 'accept';
      return isCollectionDatePassed && isNewDateStarted && isLoanAccepted;
    });

    // Loop through the loans to update and send emails
    for (const loan of loansToUpdate) {
      loan.status = 'rejected';

      // Update the 'available_items' field to 1 for each item in the loan
      for (const item of loan.items) {
        item.item.available_items = 1;
        await item.item.save();
      }

      await loan.save();

      // Send email to the user here
      // Compose the email options
      var mailOptions = {
        from: process.env.USER_MAIL,
        to: loan.user_id.email,
        subject: "ICT Equipment Loan System",
        text: `Dear user, you have not accepted the item collection and your loan has been rejected`,
      };

      // Send the email
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }

    // Render the loan details page with the loanDetails data
    return res.render('approval/personalapprovalloan', {
      userLoan, users, users, pendingLoansCount: pendingLoansCount,
      pendingapprovalLoanCount,
      cartItemCount: cart ? cart.items.length : 0
    });
  } catch (error) {
    // Handle errors
    console.log(error.message);
  }
};





exports.viewapprovalloandetail = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    const currentUserData = req.user.userData;
    const approvalDepartment = currentUserData.department;

    let pendingapprovalLoanCount = 0;
    const userloanRequests = await loan
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
      .exec();// Variable to store the count of pending loans

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
    const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
    pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans
    // Retrieve the loan details using the loanId
    const loanDetails = await loan.findById(loanId)
      .populate("user_id", "name department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category", // Include the 'category' field from the item schema
        populate: { path: "category", select: "name" } // Populate the 'category' field from the item schema
      });

    if (!loanDetails) {
      // Handle loan not found
      return res.status(404).render('error', { message: 'Loan not found' });
    }

    // Check if the loan status is 'accept'
    const acceptItems = loanDetails.status === 'accept' ? loanDetails.items : [];

    // Render the loan details page with the loanDetails data and acceptItems
    return res.render('approval/approvalloandetail', {
      pendingLoansCount: pendingLoansCount,
      pendingapprovalLoanCount,
      loanDetails, acceptItems, users, cartItemCount: cart ? cart.items.length : 0
    });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
};

exports.cancelapprovalloanRequest = async (req, res) => {
  // Get the loan ID from the request parameters
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const loanId = req.params.loanId;

    console.log(loanId);

    // Find the loan by ID
    const Loan = await loan.findById(loanId)
      .populate("user_id", "name email department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category",
        populate: { path: "category", select: "name" }
      });

    // Delete the loan
    await loan.findByIdAndDelete(loanId);

    // Set available_items to 1 for each item in the loan
    for (const loanItem of Loan.items) {
      const itemId = loanItem.item._id;
      await item.findByIdAndUpdate(itemId, { available_items: 1 });
    }

    // Redirect to the desired page
    req.flash("success_msg", "Loan cancelled successfully");
    req.session.save(() => {
      res.redirect("/personalloan");
    });

  } catch (error) {
    req.flash("error_msg", "Something went wrong");
    req.session.save(() => {
      res.redirect("/personalloan");
    });
  }
}



exports.acceptapprovalloanitems = async (req, res) => {
  // Get the loan ID from the request parameters
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const loanId = req.params.loanId;

    const Loan = await loan.findById(loanId)
      .populate("user_id", "name email department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category",
        populate: { path: "category", select: "name" }
      });

    // Retrieve the selected item IDs from the request body
    const selectedItems = req.body.selectedItems;

    // Update the loan items based on the selected items
    const updatedLoanItems = await Promise.all(Loan.items.map(async (loanItem) => {
      if (selectedItems.includes(loanItem._id.toString())) {
        return loanItem;
      } else {
        // Update the available_items count of the item in the Item schema
        await item.findByIdAndUpdate(loanItem.item._id, { $inc: { available_items: 1 } });

        return null; // Remove the item from the loan by returning null
      }
    }));

    // Filter out null values (unchecked items) from the updatedLoanItems array
    const filteredLoanItems = updatedLoanItems.filter(Boolean);

    // Update the loan with the filteredLoanItems and set the status to 'collect'
    const updatedLoan = await loan.findByIdAndUpdate(
      { _id: loanId },
      {
        $set: {
          items: filteredLoanItems,
          status: 'collect'
        },
      },
      { new: true }
    );

    // Set a flash message indicating successful acceptance of items
    req.flash("success_msg", "Items Successfully Accepted");
    req.session.save(() => {
      res.redirect("/personalloan");
    });
  } catch (error) {
    req.flash("error_msg", "Check at least one item");
    req.session.save(() => {
      res.redirect("/personalloan");

    });
  }
}



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
    req.flash('error_msg', 'You are not authorized');

    return res.redirect('/');
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





