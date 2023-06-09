const Item = require("../../../models/item");
const Loan = require("../../../models/loan");
const User = require("../../../models/userModel");
const Cart = require('../../../models/cart');
const ObjectId = require('mongodb').ObjectId;
const moment = require('moment');
var nodemailer = require("nodemailer");



exports.loanRequestPage = async (req, res) => {

  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;

    // Query the database for the user with the matching ID
    const userDatas = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

    const item_id = req.params.id;
    const item = await Item.findById(item_id).populate('category', 'name');
    return res.render('user/loan', { user: userDatas, item, message: null, cartItemCount: cart ? cart.items.length : 0 });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.requestLoan = async (req, res) => {
  const userId = req.user.userData._id;

  // Query the database for the user with the matching ID
  const userDatas = await User.findById(userId);
  const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const item_id = req.params.id;
    const user_id = req.user.userData;
    const item = await Item.findById(item_id).populate('category', 'name');
    const { return_date } = req.body;

    // Check if user has proper permissions
    if (req.user.userData.usertype !== 'User' && req.user.userData.usertype !== 'Approval') {
      const message = "Unauthorized"
      return res.render('user/loan', { message, cartItemCount: cart ? cart.items.length : 0 });
    }

    if (item.available_items === 0) {
      req.flash("error_msg", "The item is on loan and you cannot loan it.");
      return res.redirect('/claim-loan');
    }

    // Create new loan object and save to the database
    const loan = new Loan({
      user_id: req.user.userData,
      return_date: req.body.return_date,
      request_date: Date.now(),
      items: [{
        item: item

      }]
    });

    await loan.save();

    req.flash("success_msg", "Loan request successfully submitted. Check your loan section for more information");
    req.session.save(() => {

      res.redirect('/all-items');
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};






exports.getLoanRequests = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "User") {
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

    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


    const userLoan = await Loan
      .find({
        user_id: userId
      })
      .populate("user_id", "name email department studentorstaff image userid")
      .populate({
        path: "items.item",
        select: "name available_items"
      })
      .select("items status return_date request_date admin_collection_date")
      .exec();

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
    for (const Loan of loansToUpdate) {
      Loan.status = 'rejected';

      // Update the 'available_items' field to 1 for each item in the loan
      for (const item of Loan.items) {
        item.item.available_items = 1;
        await item.item.save();
      }

      await Loan.save();

      // Send email to the user here
      // Compose the email options
      var mailOptions = {
        from: process.env.USER_MAIL,
        to: Loan.user_id.email,
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
    // Add this line to set the currentUserData variable
    const currentUserData = req.user.userData;

    return res.render("user/personalloan", {
      userLoan, users,
      currentUserData, cartItemCount: cart ? cart.items.length : 0
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};





exports.viewuserloandetail = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

    // Retrieve the loan details using the loanId
    const loanDetails = await Loan.findById(loanId)
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
    return res.render('user/loandetail', { loanDetails, acceptItems, users, cartItemCount: cart ? cart.items.length : 0 });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
};



exports.cancelloanRequest = async (req, res) => {
  // Get the loan ID from the request parameters
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;

    console.log(loanId);

    // Find the loan by ID
    const loan = await Loan.findById(loanId)
      .populate("user_id", "name email department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category",
        populate: { path: "category", select: "name" }
      });

    // Delete the loan
    await Loan.findByIdAndDelete(loanId);

    // Set available_items to 1 for each item in the loan
    for (const loanItem of loan.items) {
      const itemId = loanItem.item._id;
      await Item.findByIdAndUpdate(itemId, { available_items: 1 });
    }

    // Redirect to the desired page
    req.flash("success_msg", "Loan cancelled successfully");
    req.session.save(() => {
      res.redirect("/get_loan");
    });

  } catch (error) {
    req.flash("error_msg", "Something went wrong");
    req.session.save(() => {
      res.redirect("/get_loan");
    });
  }
}


exports.acceptloanitems = async (req, res) => {
  // Get the loan ID from the request parameters
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const loanId = req.params.loanId;
    console.log(loanId);

    const loan = await Loan.findById(loanId)
      .populate("user_id", "name email department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category",
        populate: { path: "category", select: "name" }
      });

    // Retrieve the selected item IDs from the request body
    const selectedItems = req.body.selectedItems;

    // Update the loan items based on the selected items
    const updatedLoanItems = await Promise.all(loan.items.map(async (loanItem) => {
      if (selectedItems.includes(loanItem._id.toString())) {
        return loanItem;
      } else {
        // Update the available_items count of the item in the Item schema
        await Item.findByIdAndUpdate(loanItem.item._id, { $inc: { available_items: 1 } });

        return null; // Remove the item from the loan by returning null
      }
    }));

    // Filter out null values (unchecked items) from the updatedLoanItems array
    const filteredLoanItems = updatedLoanItems.filter(Boolean);

    // Update the loan with the filteredLoanItems and set the status to 'collect'
    const updatedLoan = await Loan.findByIdAndUpdate(
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
      res.redirect("/get_loan");
    });
  } catch (error) {
    req.flash("error_msg", "Check at least one item");
    req.session.save(() => {
      res.redirect("/get_loan");

    });
  }
}


exports.addToCart = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const itemId = req.params.id;

    const item = await Item.findById(itemId);

    if (item.available_items === 0) {
      req.flash('error_msg', "Equipment is on loan");
      return res.redirect('/all-items');
    }

    // Save cart item to the database
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ item: itemId, quantity: 1 }]
      });
    } else {
      const existingItem = cart.items.find(item => item.item.toString() === itemId);
      if (existingItem) {
        req.flash('error_msg', 'Item already exists in cart');
        return res.redirect('/all-items');
      } else {
        cart.items.push({ item: itemId, quantity: 1 });
      }
    }
    await cart.save();
    req.flash("success_msg", "Added to cart");
    res.redirect('/all-items');

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addToCartuserhome = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const itemId = req.params.id;

    const item = await Item.findById(itemId);
    if (item.available_items === 0) {
      req.flash('error_msg', "Equipment is on loan");
      req.session.save(() => {
        return res.redirect('/userhome');
      });
      return; // Stop further execution
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ item: itemId, quantity: 1 }]
      });
    } else {
      const existingItem = cart.items.find(item => item.item.toString() === itemId);
      if (existingItem) {
        req.flash('error_msg', 'Item already exists in cart');
        req.session.save(() => {
          return res.redirect('/userhome');
        });
        return; // Stop further execution
      } else {
        cart.items.push({ item: itemId, quantity: 1 });
      }
    }

    await cart.save();
    req.flash("success_msg", "Added to cart");
    req.session.save(() => {
      return res.redirect('/userhome');
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};



exports.getCart = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const users = await User.findById(userId);

    const approvals = await User.find({ usertype: 'Approval' });

    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    if (!cart) {
      return res.render('user/add_to_card', {
        approvals,
        cartItemCount: 0, // Set cart item count to 0 if cart is null
        cart: null, // Set cart to null
        users,
        user: req.user.userData,
        message: 'Item successfully added to cart',
      });
    }

    const cartData = [];
    for (const cartItem of cart.items) {
      const itemId = cartItem.item._id;
      const itemCategory = await Item.findById(itemId).populate('category', 'name');
      const categoryName = itemCategory.category.name;

      cartData.push({
        id: cartItem._id,
        item: cartItem.item,
        quantity: cartItem.quantity,
        available_items: cartItem.item.available_items,
        categoryName: categoryName
      });
    }

    return res.render('user/add_to_card', {
      approvals,
      cart: cartData,
      users,
      user: req.user.userData,
      cartItemCount: cart.items.length,
      message: 'Item successfully added to cart',
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.deleteCart = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const cart_id = req.query.id;
    const cart = await Cart.findOne({ user: userId }).populate('items.item');

    const itemIdToRemove = new ObjectId(cart_id);
    cart.items = cart.items.filter(item => !item._id.equals(itemIdToRemove));

    await cart.save();

    req.flash("success_msg", "Equipment removed from cart")
    req.session.save(() => {
      res.redirect('/cart');
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.request_Loan = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "User") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const users = await User.findById(userId);

    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    if (!cart) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const loanRequest = {
      user_id: userId,
      return_date: req.body.return_date,
      items: [],
    };

    for (const cartItem of cart.items) {
      const itemId = cartItem.item._id;
      const itemCategory = await Item.findById(itemId).populate('category', 'name');
      const categoryName = itemCategory.category.name;

      loanRequest.items.push({
        item: itemId,
        return_date: req.body.return_date,
        request_date: Date.now(),
      });
    }

    const savedLoanRequest = await Loan.create(loanRequest);
    await Cart.deleteOne({ user: userId }); // Remove cart after loan request
    req.flash('success_msg', "Loan requested successfully submitted. Check your loan section for more information.");
    req.session.save(() => {
      res.redirect('/all-items');
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};