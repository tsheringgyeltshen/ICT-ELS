const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
      },
      // quantity: {
      //   type: Number,
      //   required: true
      // },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    }
  ]
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
