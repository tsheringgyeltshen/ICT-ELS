const mongoose = require('mongoose');
//equipment model
const itemSchema = new mongoose.Schema({
 
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  
  name: {
    type: String,
    required: true,
  },
  itemtag:{
  type: String,
  required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required:true,
  },
  available_items: {
    type: Number,
    default: 1,
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
