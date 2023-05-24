const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
//   Item: [{
//     type: Schema.Types.ObjectId, 
//     ref: 'Item',
// }]
});


const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
//category model
