const Item = require("../../../models/item");
const Loan = require("../../../models/loan");
const User = require("../../../models/userModel");
const Cart = require('../../../models/cart');
const ObjectId = require('mongodb').ObjectId;



exports.loanRequestPage = async (req, res) => {

  try {
    const userId = req.user.userData._id;

    // Query the database for the user with the matching ID
    const userDatas = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

    const item_id = req.params.id;
    const item = await Item.findById(item_id).populate('category', 'name');
    return res.render('user/loan', { user: userDatas, item, message: null, cartItemCount: cart ? cart.items.length : 0});
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
    const item_id = req.params.id;
    const user_id = req.user.userData;
    const item = await Item.findById(item_id).populate('category', 'name');
    const { return_date } = req.body;

    // Check if user has proper permissions
    if (req.user.userData.usertype !== 'User' && req.user.userData.usertype !== 'Approval') {
      const message = "Unauthorized"
      return res.render('user/loan', { message, cartItemCount: cart ? cart.items.length : 0});
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
    const userId = req.user.userData._id;
    const users = await User.findById(userId);
    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


    const userLoan = await Loan
      .find({
        user_id: userId
      })
      .populate("user_id", "name department studentorstaff image userid")
      .populate({
        path: "items.item",
        select: "name available_items"
      })
      .select("items status return_date request_date admin_collection_date")
      .exec();

    // Add this line to set the currentUserData variable
    const currentUserData = req.user.userData;

    return res.render("user/personalloan", {
      userLoan,users,
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
    const loanDetails = await Loan.findById(loanId)
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
    return res.render('user/loandetail', { loanDetails, users, cartItemCount: cart ? cart.items.length : 0});
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
};

exports.addToCart = async (req, res) => {
  try {
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
    const userId = req.user.userData._id;
    const itemId = req.params.id;

    const item = await Item.findById(itemId);
    if (item.available_items === 0) {
      req.flash('error_msg', "Equipment is on loan");
      req.session.save(() => {
        return res.redirect('/userlhome');
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
    const userId = req.user.userData._id;
    const users = await User.findById(userId);

    const approvals = await User.find({ usertype: 'Approval' });


    const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
    if (!cart) {

      return res.render('user/add_to_card', {
        approvals, cartItemCount: cart ? cart.items.length : 0,
        cart,
        users,
        user: req.user.userData,
        message: 'Item successfully added to cart',
        cartItemCount: cartItemCount
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
      user: req.user.userData, cartItemCount: cart ? cart.items.length : 0,
      message: 'Item successfully added to cart',
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCart = async (req, res) => {
  try {
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