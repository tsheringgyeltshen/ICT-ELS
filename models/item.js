const mongoose = require('mongoose');
//equipment model
const itemSchema = new mongoose.Schema({
 
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  available_items: {
    type: Number,
    default: 0,
  },
  add_date: { 
    type: Date,
    default: Date.now(),
  },
  isDeleted:{
  type: Boolean,
  default: false,},
  loans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  }]
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
