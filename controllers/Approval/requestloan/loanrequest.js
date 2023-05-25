const Item = require("../../../models/item");
const Loan = require("../../../models/loan");
const Users = require("../../../models/userModel");
const Cart = require('../../../models/cart');
const ObjectId = require('mongodb').ObjectId;



exports.loanRequestPage = async (req, res) => {
  try {
    const userId = req.user.userData._id;
    const user = await Users.findById(userId);
    const item_id = req.params.id;
    const item = await Item.findById(item_id).populate('category', 'name');
    return res.render('approval/loan', { item, user, message: null });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.requestLoan = async (req, res) => {
  try {
    const item_id = req.params.id;
    const user_id = req.user.userData;
    //console.log(user_id)
    const item = await Item.findById(item_id);
    const { quantity, return_date } = req.body;

    // Check if user has proper permissions
    if (req.user.userData.usertype !== 'User' && req.user.userData.usertype !== 'Approval') {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Check if enough items are available for loan
    if (item.available_items < quantity || quantity === 0) {
      return res.status(400).json({ message: `Only ${item.available_items} items are available for this loan` });

    }
    // Create new loan object and save to database
    const loan = new Loan({
      user_id: req.user.userData,
      item: item,
      quantity,
      return_date,
      request_date: Date.now(), // Add new property with current date/time

    });
    // Update item availability in database
    item.available_items -= quantity;
    await item.save();

    await loan.save();
    req.flash("success_msg", "Loan request successfully submitted. Check your loan section for more information");
    req.session.save(() => {

      res.redirect('/all-equipment');
    });


  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getLoanRequests = async (req, res) => {
  try {
    const user_id = req.user.userData._id;
    const users = await Users.findById(user_id);

    const loans = await Loan.find({ user_id }).populate('item').sort({ request_date: -1 });

    const loanObjects = loans.map(loan => {
      const { name } = loan.item;
      const { quantity, return_date, status, admin_collection_date, request_date } = loan;
      return {
        itemName: name,
        quantity,
        requestDate: request_date,
        returnDate: return_date,
        status,
        collectionDate: admin_collection_date || "To be determined",
      };
    });

    return res.render('approval/personalapprovalloan', { loans: loanObjects, users });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};






exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userData._id;
    const itemId = req.params.id;

    const item = await Item.findById(itemId);
    if (item.available_items === 0) {
      req.flash('error_msg', "Equipment is not available for loan");
      req.session.save(() => {
        return res.render('approval/item');
      });
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
        existingItem.quantity += 1;
      } else {
        cart.items.push({ item: itemId, quantity: 1 });
      }
    }
    await cart.save();
    req.flash("success_msg", "Added to cart");
    req.session.save(() => {
      res.redirect('/all-equipment');
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addToCartapprovalhome = async (req, res) => {
  try {
    const userId = req.user.userData._id;
    const itemId = req.params.id;

    const item = await Item.findById(itemId);
    if (item.available_items === 0) {
      req.flash('error_msg', "Equipment is not available for loan");
      req.session.save(() => {
        return res.redirect('/approvalhome');
      });
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
        existingItem.quantity += 1;
      } else {
        cart.items.push({ item: itemId, quantity: 1 });
      }
    }
    await cart.save();
    req.flash("success_msg", "Added to cart");
    req.session.save(() => {
      res.redirect('/approvalhome');
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};




exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userData._id;
    const users = await Users.findById(userId);

    const cart = await Cart.findOne({ user: userId }).populate('items.item');

    if (!cart) {
      return res.render('approval/add_to_card', {
        cart,
        users,
        user: req.user.userData,
        message: 'Item successfully added to cart'
      });
    }

    const cartData = cart.items.map((cartItem) => ({
      id: cartItem._id,
      item: cartItem.item,
      quantity: cartItem.quantity,
      available_items: cartItem.item.available_items
    }));

    return res.render('approval/add_to_card', {
      cart: cartData,
      users,
      user: req.user.userData,
      message: 'Item successfully added to cart'
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
      res.redirect('/cart1')

    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.request_Loan = async (req, res) => {
  try {
    const userId = req.user.userData._id;

    // Check if user has proper permissions
    if (req.user.userData.usertype !== 'User' && req.user.userData.usertype !== 'Approval') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.item');
    if (!cart) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const itemIds = req.body.item_ids;
    const quantities = req.body.quantities;
    const loanRequests = [];

    for (let i = 0; i < itemIds.length; i++) {
      const itemId = itemIds[i];
      const quantity = parseInt(quantities[i]);

      const cartItem = cart.items.find((item) => item.item._id.toString() === itemId);
      if (!cartItem || quantity <= 0 || quantity > cartItem.item.available_items) {
        req.flash('error_msg', 'Invalid quantity');
        req.session.save(() => {
          res.redirect('/cart1');
        });
      }

      cartItem.item.available_items -= quantity;

      loanRequests.push(
        new Loan({
          user_id: userId,
          item: cartItem.item,
          quantity,
          return_date: req.body.return_date,
          request_date: Date.now(),
        })
      );
    }

    const savedLoans = await Loan.create(loanRequests);

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
