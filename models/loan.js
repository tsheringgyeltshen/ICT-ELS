const mongoose = require('mongoose');
const Users = require('./userModel');
const Item = require('./item');

const loanSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
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
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  admin_collection_date: {
    type: Date,
  },
  return_date_status: {
    type: String,
    enum: ["not_returned", "returned"],
    default: "not_returned",

  }
});



const loan = mongoose.model('loans', loanSchema);

module.exports = loan;

