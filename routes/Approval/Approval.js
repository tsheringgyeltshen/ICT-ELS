const express = require("express");
const { getUserProfileLoad,postEditProfile, getapprovalHome,viewaboutus } = require("../../controllers/Approval/approvalDashboard/approvalDashboard");
const currentUser = require("../../middlewares/currentUser");
const {viewLoanRequests,viewapprovalLoanRequests, manageLoanRequest,manageapprovalLoanRequest, rejectLoanRequest,rejectapprovalLoanRequest,viewuserloandetail, getLoanRequests,viewapprovalloandetail,acceptapprovalloanitems,cancelapprovalloanRequest} = require("../../controllers/Approval/pendingloans/view-request-loan")
const { viewAllitems, viewItemByid,viewItemsByCategory} = require("../../controllers/Approval/approvalDashboard/approvalDashboard");
const { requestLoan,loanRequestPage,getCart,request_Loan,addToCart,deleteCart,addToCartapprovalhome} = require("../../controllers/Approval/requestloan/loanrequest");
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
    
approval_router.route('/viewapproval-req-loan')
    .get(currentUser, viewapprovalLoanRequests);
    
approval_router.route('/manage_loan/:id')
    .post(currentUser, manageLoanRequest)
    
approval_router.route('/manageapproval_loan/:id')
    .post(currentUser, manageapprovalLoanRequest)
    
approval_router.route('/reject_loan/:id')
    .post(currentUser, rejectLoanRequest )
    
approval_router.route('/rejectapproval_loan/:id')
    .post(currentUser, rejectapprovalLoanRequest)

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
      
approval_router.route('/loan-detailsapproval/:loanId')
    .get(currentUser, viewapprovalloandetail)
    
approval_router.route('/personalloan')
    .get(currentUser, getLoanRequests)
    
approval_router.route('/view-approvalloandetail/:loanId')
    .get(currentUser, viewuserloandetail)
    
approval_router.route('/cancelapprovalloan/:loanId')
    .post(currentUser,cancelapprovalloanRequest)
    
approval_router.route('/accept-item/:loanId')
    .post(currentUser, acceptapprovalloanitems);
    
approval_router.route('/deleteItem1')
    .get(currentUser, deleteCart)
    
approval_router.route('/approvalcategoriesitems/:categoryId')
    .get(currentUser, viewItemsByCategory)
    


module.exports = approval_router;