const mongoose= require("mongoose");
const validator = require ('validator')

const userSchema  = new mongoose.Schema({

    name:{
        type:String,
        required:[true, 'Please tell us your name!']
    },
    userid:{
        type:String,
        unique:true,
        requred:[true, 'Please provide your User ID'] 
    },
    email:{
        type:String,
        required:[true, 'Please provide your email address'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail, 'please provide a valid email address']
    },
    mobilenumber:{
        type:Number,
        required:[true, 'Please provide yourobilenumber'],
        minlength:8,
        maxlength:8
    },
    image:{
        type:String,
        required:[true, 'Please provide your image'],
    },
    password:{
        type:String,
        required:[true, 'Please provide your password'],
        minlength:8
    },
    usertype:{
        type:String,
        required:[true, 'Please provide your user type'],
    },
    studentorstaff:{
        type:String,
        required:[true, 'Please provide your student or staff member']
    },
    year:{
        type:Number,
        required:[true,'Please provide your year']

    },
    
    department:{
        type:String,
        required:[true,'Please provide your department'],

    },
    is_verified: {
        type: Boolean,
        default:false
    },
    
    isDeleted:{
        type:Boolean,
        default:false
    },
    token: {
        type: String,
        default:''
    },
    
    loans: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Loan",
        },
      ]
  

});


const Users = mongoose.model("User", userSchema);
module.exports = Users
//usermodel