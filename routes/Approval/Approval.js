const express = require("express");
const { getUserProfileLoad,postEditProfile, getapprovalHome,viewaboutus } = require("../../controllers/Approval/approvalDashboard/approvalDashboard");
const currentUser = require("../../middlewares/currentUser");
const {viewLoanRequests, manageLoanRequest, rejectLoanRequest} = require("../../controllers/Approval/pendingloans/view-request-loan")
const { viewAllitems, viewItemByid,viewItemsByCategory} = require("../../controllers/Approval/approvalDashboard/approvalDashboard");
const { requestLoan,loanRequestPage, getLoanRequests,getCart,request_Loan,addToCart,deleteCart,addToCartapprovalhome} = require("../../controllers/Approval/requestloan/loanrequest");
const approval_router = express.Router();


//@des registrationn
approval_router.route('/approvalhome')
     .get(currentUser, getapprovalHome)


//@des user profile load
approval_router.route('/approval-profile')
    .get(currentUser,getUserProfileLoad)
    .post(currentUser,postEditProfile)

approval_router.route('/view-req-loan')
    .get(currentUser, viewLoanRequests)
    
approval_router.route('/manage_loan/:id')
    .post(currentUser, manageLoanRequest)
    
approval_router.route('/reject_loan/:id')
    .post(currentUser, rejectLoanRequest )

approval_router.route('/all-equipment')
    .get(currentUser, viewAllitems)
    
approval_router.route('/addto_card1/:id')
    .post(currentUser, addToCart)

approval_router.route('/addto_card1approvalhome/:id')
    .post(currentUser, addToCartapprovalhome)
    
approval_router.route('/cart1')
    .get(currentUser, getCart);
    
approval_router.route('/card1')
    .post(currentUser,request_Loan)
    
approval_router.route('/aboutus1')
    .get(currentUser,viewaboutus);

    
approval_router.route('/view-equipment/:id')
    .get(currentUser, viewItemByid)    

approval_router.route('/loan/:id')
    .get(currentUser, loanRequestPage)
    .post(currentUser,requestLoan)
    
approval_router.route('/view_loans')
    .get(currentUser, getLoanRequests)
    
approval_router.route('/deleteItem1')
    .get(currentUser, deleteCart)
    
approval_router.route('/approvalcategoriesitems/:categoryId')
    .get(currentUser, viewItemsByCategory)
    


module.exports = approval_router;