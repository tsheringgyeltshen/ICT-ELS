const mongoose = require('mongoose');
const Users = require('./userModel');
const Item = require('./item');

const loanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

  }],

  request_date: {
    type: Date,
    default: Date.now(),
  },
  return_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected","accept", "collect", "onloan", "overdue", "returned"],
    default: "pending",
  },
  admin_collection_date: {
    type: Date,
  },
  approval: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
  }
});

const loan = mongoose.model('loans', loanSchema);

module.exports = loan;

