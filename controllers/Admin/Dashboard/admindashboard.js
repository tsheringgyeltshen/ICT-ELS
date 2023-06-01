const Users = require("../../../models/userModel");
const Loan = require("../../../models/loan");
const Item = require("../../../models/item");
const Chart = require('chart.js');



exports.getAdminHome = async (req, res) => {
    try {
        const pendingLoanCount = await Loan.countDocuments({ status: 'pending' });
        const approvedLoanCount = await Loan.countDocuments({ status: 'approved' });
        const onLoanCount = await Loan.countDocuments({ status: 'onloan' });
        const usercount = await Users.countDocuments({ usertype: 'User' });
        const approvalcount = await Users.countDocuments({ usertype: 'Approval' });
        const admincount = await Users.countDocuments({ usertype: 'Admin' });

        const itemonloancount = await Item.countDocuments({ available_items:'0', isDeleted: false });
        const availableitem = await Item.countDocuments({ available_items:'1', isDeleted: false });

        const itemcount = await Item.countDocuments({ isDeleted: false, });

        const userId = req.user.userData._id;


        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);
        const now = new Date();

        // Count the number of collections due for today
        const collectionCount = await Loan.countDocuments({
            status: "approved",
            admin_collection_date: now.toISOString().substr(0, 10),
        });
        // Count the number of users with usertype "user"
        const userCount = await Users.countDocuments({
            studentorstaff: { $in: ["student", "staff"] }
        });

        const image1 = (adminData.image).split('\\')[1];

        res.render('../views/admin/adminhome', { itemcount,
        approvedLoanCount, pendingLoanCount,
        admin: adminData, userCount, image1,
        collectionCount,
        onLoanCount, usercount, approvalcount, admincount,
        availableitem,itemonloancount});

    } catch (error) {

        console.log(error.message);

    }
}
//@des user details 
exports.getUserProfileLoad = async (req, res) => {
    try {
        const userData = await Users.findById(req.user._id);
        //res.render('userprofile', {user: userData });
        res.send(userData);

        //     res.render("userprofile", {
        //       currentuserData:userData
        //   })
    } catch (error) {
        console.log(error.message);

    }
}

exports.getEditUserProfile = async (req, res) => {
    try {


        const userData = await Users.findById({ _id: req.user._id });
        if (userData) {
            return res.send(userData)
            // res.render('edituserprofile', { user: userData });
        }
        //else {
        return


    }


    catch (error) {

        console.log(error);

    }
}

exports.postEditUserProfile = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { mobilenumber } = req.body;
        const image = req.file
        const imageUrl = image.path

        const userData = await Users.findByIdAndUpdate({ _id: user_id }, { mobilenumber, image: imageUrl }, { new: true });
        return res.send(userData)

        //  return res.redirect('/userprofile')

    } catch (error) {

        console.log(error.message);

    }
}