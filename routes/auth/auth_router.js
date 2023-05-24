const express = require("express");
const { getRegister, postRegister, getVerify } = require("../../controllers/auth/registration");
const { getLogin, postLogin, getForgetPassword, postForgetPassword, getForgetPasswordLoad, postForgetPasswordLoad } = require("../../controllers/auth/login");
const auth_router = express.Router();
//@des registration
auth_router.route('/register')
    .get(getRegister)
    .post(postRegister)

    //@des verify
auth_router.route('/verify')
    .get(getVerify)

    //@des loginn
auth_router.route('/')
    .get(getLogin)
    .post(postLogin)
//@des 
auth_router.route('/forget')
    .get(getForgetPassword)
    .post(postForgetPassword)
//@des get forgetpass
auth_router.route('/forget-password')
    .get(getForgetPasswordLoad)
    .post(postForgetPasswordLoad)
    
module.exports = auth_router;