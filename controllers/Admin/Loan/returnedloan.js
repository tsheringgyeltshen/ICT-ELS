const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const Users = require("../../../models/userModel");

const dotenv = require("dotenv");
dotenv.config();

exports.returnedloan = async (req, res) => {
    if (req.user.userData.usertype !== "Admin") {
        req.flash('error_msg', 'You are not authorized');
        return res.redirect('/');
    }

    try {
        const userId = req.user.userData._id;

        const adminData = await Users.findById(userId);
        const collectloan = await loan
            .find({
                status: 'returned'
            })
            .populate("user_id", "name department studentorstaff image userid")
            .populate({
                path: "items.item",
                select: "name available_items"
            })
            .select("items status return_date admin_collection_date ")

        console.log(collectloan)
        // Add this line to set the currentUserData variable
        const currentUserData = req.user.userData;
        return res.render("admin/returnedloan", {
            collectloan,
            currentUserData,
            admin: adminData
        });

    } catch (error) {

        console.error(error.message);

    }
}