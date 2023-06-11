const Item = require("../../../models/item");
const Loan = require("../../../models/loan");
const Users = require("../../../models/userModel");
const Cart = require('../../../models/cart');
const ObjectId = require('mongodb').ObjectId;

exports.loanRequestPage = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const approvals = await Users.find({ usertype: 'Approval' });
    const userId = req.user.userData._id;
    const user = await Users.findById(userId);
    const item_id = req.params.id;
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    const currentUserData = req.user.userData;
    const approvalDepartment = currentUserData.department;

    let pendingapprovalLoanCount = 0;
    const userloanRequests = await Loan
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
    pendingapprovalLoanCount = await Loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans
    // Filter out the current user from the approvals
    const filteredApprovals = approvals.filter(approval => String(approval._id) !== String(userId));

    const item = await Item.findById(item_id).populate('category', 'name');
    return res.render('approval/loan', { item, user, message: null, approvals: filteredApprovals, cartItemCount: cart ? cart.items.length : 0,pendingLoansCount: pendingLoansCount,
      pendingapprovalLoanCount });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.requestLoan = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const item_id = req.params.id;
    const item = await Item.findById(item_id);

    // Check if the item is on loan or available for loan
    if (item.available_items === 0) {
      req.flash("error_msg", "The item is on loan and you cannot loan it.");
      return res.redirect('/loan');
    }

    const loan = new Loan({
      user_id: req.user.userData,
      return_date: req.body.return_date,
      approval: req.body.approval,
      request_date: Date.now(),
      items: [{
        item: item

      }]
    });

    await loan.save();

    req.flash("success_msg", "Loan request successfully submitted. Check your loan section for more information.");
    return res.redirect('/all-equipment');
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.addToCart = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const itemId = req.params.id;

    const item = await Item.findById(itemId);
    if (item.available_items === 0) {
      req.flash('error_msg', "Equipment is on loan");
      return res.redirect('/all-equipment');
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
        return res.redirect('/all-equipment');
      } else {
        cart.items.push({ item: itemId, quantity: 1 });
      }
    }
    await cart.save();
    req.flash("success_msg", "Added to cart");
    res.redirect('/all-equipment');

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addToCartapprovalhome = async (req, res, next) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const itemId = req.params.id;
    req.userId = userId

    const item = await Item.findById(itemId);
    if (item.available_items === 0) {
      req.flash('error_msg', "Equipment is on loan");
      req.session.save(() => {
        return res.redirect('/approvalhome');
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
          return res.redirect('/approvalhome');
        });
        return; // Stop further execution
      } else {
        cart.items.push({ item: itemId, quantity: 1 });
      }
    }

    await cart.save();
    req.flash("success_msg", "Added to cart");
    req.session.save(() => {
      return res.redirect('/approvalhome');
    });
    next()
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const cart_id = req.query.id;
    const cart = await Cart.findOne({ user: userId }).populate('items.item');

    const itemIdToRemove = new ObjectId(cart_id);
    cart.items = cart.items.filter(item => !item._id.equals(itemIdToRemove));

    await cart.save();

    const cartItemCount = cart.items.length;

    req.flash("success_msg", "Equipment removed from cart");
    req.session.cartItemCount = cartItemCount; // Set the cart item count in the session
    req.session.save(() => {
      res.redirect('/cart1');
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCart = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    console.log(userId);
    const users = await Users.findById(userId);
    const approval = await Users.find({ usertype: 'Approval' });
    const currentUserData = req.user.userData;
    const approvalDepartment = currentUserData.department;

    let pendingapprovalLoanCount = 0;
    const userloanRequests = await Loan
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
    pendingapprovalLoanCount = await Loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans
    const filteredApprovals = approval.filter(approval => String(approval._id) !== String(userId));

    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    if (!cart) {
      return res.render('approval/add_to_card', {
        approval,
        cartItemCount: 0, // Set cart item count to 0 if cart is null
        cart: null, // Set cart to null
        users,pendingLoansCount: pendingLoansCount,
        pendingapprovalLoanCount,
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


    return res.render('approval/add_to_card', {
      approvals: filteredApprovals,
      cart: cartData,
      users,pendingLoansCount: pendingLoansCount,
      pendingapprovalLoanCount,
      user: req.user.userData,
      message: 'Item successfully added to cart',
      cartItemCount: cart ? cart.items.length : 0
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};




exports.request_Loan = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Approval") {
      req.flash('error_msg', 'You are not authorized');

      return res.redirect('/');
    }
    const userId = req.user.userData._id;
    const users = await Users.findById(userId);

    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    if (!cart) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const loanRequest = {
      user_id: userId,
      approval: req.body.approval,
      return_date: req.body.return_date,
      items: [],
    };

    for (const cartItem of cart.items) {
      const itemId = cartItem.item._id;
      const itemCategory = await Item.findById(itemId).populate('category', 'name');
      const categoryName = itemCategory.category.name;

      loanRequest.items.push({
        item: itemId,
        approval: req.body.approval,
        return_date: req.body.return_date,
        request_date: Date.now(),
      });
    }

    const savedLoanRequest = await Loan.create(loanRequest);
    await Cart.deleteOne({ user: userId }); // Remove cart after loan request
    req.flash('success_msg', "Loan requested successfully submitted. Check your loan section for more information.");
    req.session.save(() => {
      res.redirect('/all-equipment');
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};




