const express = require("express");

const { getUserProfileLoad, postEditProfile, getUserHome, viewAboutuspage } = require("../../controllers/User/Dashboard/userDashboard");
const { viewAllitems, viewItemByid, viewItemsByCategory } = require("../../controllers/User/Dashboard/userDashboard");

const currentUser = require("../../middlewares/currentUser");
const { requestLoan, loanRequestPage, getLoanRequests, addToCart, getCart, request_Loan, deleteCart, addToCartuserhome, viewuserloandetail, acceptloanitems,cancelloanRequest } = require("../../controllers/User/requestLoan/requrest-loan");
// const { requestLoan } = require("../../controllers/User/requestLoan/requrest-loan");


//const { getUserProfileLoad,postUserProfileLoad } = require("../../controllers/User/Dashboard/userDashboard");

const user_router = express.Router();

//@des registrationn
user_router.route('/userhome').get(currentUser, getUserHome)
//@des user profile load
user_router.route('/user-profile')
    .get(currentUser, getUserProfileLoad)
    .post(currentUser, postEditProfile)


user_router.route('/all-items')
    .get(currentUser, viewAllitems)

user_router.route('/aboutus')
    .get(currentUser, viewAboutuspage)

user_router.route('/view-item/:id')
    .get(currentUser, viewItemByid)

user_router.route('/claim-loan/:id')
    .get(currentUser, loanRequestPage)
    .post(currentUser, requestLoan)

user_router.route('/view-userloandetail/:loanId')
    .get(currentUser, viewuserloandetail)
    
user_router.route('/cancelloanrequest/:loanId')
    .post(currentUser, cancelloanRequest)

user_router.route('/accept-items/:loanId')
    .post(currentUser, acceptloanitems);

user_router.route('/addto_card/:id')
    .post(currentUser, addToCart)

user_router.route('/addto_carduserhome/:id')
    .post(currentUser, addToCartuserhome)

user_router.route('/cart')
    .get(currentUser, getCart);

user_router.route('/card')
    .post(currentUser, request_Loan)

user_router.route('/get_loan')
    .get(currentUser, getLoanRequests)

user_router.route('/deleteItem')
    .get(currentUser, deleteCart)

user_router.route('/categoriesitems/:categoryId')
    .get(currentUser, viewItemsByCategory)

module.exports = user_router;