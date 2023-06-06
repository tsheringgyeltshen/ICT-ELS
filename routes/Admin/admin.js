const express = require("express");
const {getAdminHome}=require("../../controllers/Admin/Dashboard/admindashboard");

const { viewCategories,
    postaddCategory,
    getEditCategories,
    postUpdateCategory,
    getDeleteCategoryLoad,
    postDeleteCategory } = require("../../controllers/Admin/Category/category");
    
const  currentUser  = require("../../middlewares/currentUser");

const { getRegister1, postRegister1,bulkaddload,postaddusebulk } = require("../../controllers/Admin/User/AddUser");
const { getViewStudentPage,
    getViewStaffPage,
    getviewoneStudentPage,
    getviewoneStaffPage,
    geteditUserPage,
    posteditUserPage,
    geteditstaffPage,
    posteditstaffPage,
    confirmDeleteStaffUser,
    confirmDeleteStudentUser
    } = require("../../controllers/Admin/User/ViewUser");
    
const { viewAllitems, viewItemByid,getLoanRequestsForItem } = require("../../controllers/Admin/Equipement/viewEquipement");
const { getAddCategoryItem,
    postaddItem, 
    getEditCategoryItem,
    getEditItemLoad, 
    postUpdateItem, 
    deleteItemLoad, 
    deleteItem} = require("../../controllers/Admin/Equipement/addEquipement");
    
const {getAdminProfilePage,
    getAdminEditProfile,
    postAdminEditProfile,
    confirmDeleteAdmin,
    adminlogout} = require("../../controllers/Admin/profile/adminprofile");
    

const {viewPresentCollectionDates} = require("../../controllers/Admin/Loan/todayscollection");

const {viewApprovedloan, updateloan, viewuserapprovalloandetail} = require("../../controllers/Admin/Loan/loan")
const {readyforcollection,collected} = require("../../controllers/Admin/Loan/collection_date")
const {onloanview,notifyreturndate,viewonloandetailforreturn,acceptloanreturnitems,viewoverduereturn,overdueloanitemdetails,acceptitemsoverduereturn} = require("../../controllers/Admin/Loan/onloan")


const {returnedloan } = require("../../controllers/Admin/Loan/returnedloan")

const admin_router = express.Router();

admin_router.route('/adminhome').get(currentUser, getAdminHome);


//const { getUserProfileLoad,postUserProfileLoad } = require("../../controllers/User/Dashboard/userDashboard");

//@des registration
admin_router.route('/new-user')
    .get(currentUser, getRegister1)
    .post(currentUser, postRegister1)

    
//@des studnet vieww
admin_router.route('/viewstudent')
    .get(currentUser, getViewStudentPage)
    
//@des particular std view
admin_router.route('/view-user')
    .get(currentUser, getviewoneStudentPage)
    
//@des particular staff view
admin_router.route('/view-onestaff')
    .get(currentUser, getviewoneStaffPage)
    
    
//@des staff view
admin_router.route('/viewstaff')
    .get(currentUser, getViewStaffPage)
    
//admin view edit user page
admin_router.route('/edit-user')
    .get(currentUser,geteditUserPage)
    .post(currentUser,posteditUserPage)
    
admin_router.route('/edit-staff')
    .get(currentUser,geteditstaffPage)
    .post(currentUser,posteditstaffPage)
    
    
//@des user category load
admin_router.route('/categories')
    .get(currentUser,viewCategories)
    .post(currentUser,postaddCategory)

// admin_router.route('/add-category')

admin_router.route('/edit-category/:category_id')
    .get(currentUser, getEditCategories)
    .post(currentUser, postUpdateCategory)
    

admin_router.route('/delete-category/:category_id')
    .get(currentUser, getDeleteCategoryLoad)
    .post(currentUser, postDeleteCategory)
//@des items 
admin_router.route('/add-item')
    .get(currentUser, getAddCategoryItem)
    .post(currentUser, postaddItem)

admin_router.route('/all-item')
    .get(currentUser, viewAllitems)
    
admin_router.route('/view-items/:id')
    .get(currentUser, viewItemByid)

// admin_router.route('/loan-details/:loanId')
//     .get(currentUser, viewloandetail)
    
admin_router.route('/edit-item/:id')
    .get(currentUser, getEditCategoryItem)
    .get(currentUser, getEditItemLoad)
    .post(currentUser, postUpdateItem)
    
    
admin_router.route('/delete-item/:id')
    .get(currentUser, deleteItemLoad)
    .post(currentUser, deleteItem)

    
// @des admin profile
admin_router.route('/adminprofile')
    .get(currentUser, getAdminProfilePage)
    
admin_router.route('/edit-adminprofile')
    .get(currentUser, getAdminEditProfile)
    .post(currentUser, postAdminEditProfile)
    
admin_router.route('/delete-staff')
    .post(currentUser, confirmDeleteStaffUser)
    
admin_router.route('/delete-student')
    .post(currentUser, confirmDeleteStudentUser)
    
//@des delete admin
admin_router.route('/delete-admin')
    .post(currentUser, confirmDeleteAdmin)
    
//@des viewapproval approved loan
admin_router.route('/view-approved-loan')
    .get(currentUser, viewApprovedloan)
    
admin_router.route('/view-approvaluserdetail/:loanId')
    .get(currentUser, viewuserapprovalloandetail)
    
    
admin_router.route('/onloandetailforreturn/:loanId')
    .get(currentUser, viewonloandetailforreturn)
    
admin_router.route('/accept-itemsreturn/:loanId')
    .post(currentUser, acceptloanreturnitems);
    
admin_router.route('/onloandetailforoverduereturn/:loanId')
    .get(currentUser, overdueloanitemdetails)

admin_router.route('/accept-itemsoverduereturn/:loanId')
    .post(currentUser, acceptitemsoverduereturn)

    
admin_router.route('/ready-forcollect')
    .get(currentUser, readyforcollection)
    
admin_router.route('/on_loan/:id')
    .post(currentUser, collected)

    
    
admin_router.route('/on_loanview')
    .get(currentUser, onloanview)
    
// admin_router.route('/returnloan/:id')
//     .post(currentUser, returnloan)

admin_router.route('/viewoverdue')
    .get(currentUser, viewoverduereturn)
    
admin_router.route('/notifyuser/:id')
    .post(currentUser, notifyreturndate)
    
admin_router.route('/returnedloan_view')
    .get(currentUser, returnedloan)
    
admin_router.route('/update_loan/:id')
    .post(currentUser, updateloan)
    
    
//@des bulk add
admin_router.route('/bulkadd')
    .get(currentUser, bulkaddload)
    .post(currentUser, postaddusebulk)
    
//@des logout admin
admin_router.route('/logout')
    .get(currentUser, adminlogout)
    
    
// admin_router.route('/Collection-date')
//     .get(currentUser, viewPresentCollectionDates ) 


// admin_router.route('/return-date')
//     .get(currentUser, viewPresentReturnDates ) 
    
// admin_router.route('/loan-reminder')
//     .post(currentUser, sendLoanReminderEmail )
    
// admin_router.route('/update_returndate/:id')
//         .post(currentUser, updateReturnDate)
        
admin_router.route('/view_loan_for_item/:id')
        .get(currentUser, getLoanRequestsForItem)

module.exports = admin_router;