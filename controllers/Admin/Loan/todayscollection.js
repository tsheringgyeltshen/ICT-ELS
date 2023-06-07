const item = require("../../../models/item");
const Loan = require("../../../models/loan");
const Users = require("../../../models/userModel");
var nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

exports.viewPresentCollectionDates = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized'); 
            return  res.redirect('/');
          }
        const userId = req.user.userData._id;

        const admin = await Users.findById(userId);
        // Get the current date/time
        const now = new Date();

        // Find all approved loans with a non-null admin_collection_date and return_date set to the current date
        const loans = await Loan.find({
            status: "approved",
            admin_collection_date: now.toISOString().substr(0, 10),
        })
            .populate("user_id", "name department studentorstaff year")
            .populate("item", "name available_items")
            .select("item quantity status request_date return_date admin_collection_date");

        // Add this line to set the currentUserData variable
        const currentUserData = req.user.userData;

        return res.render("admin/collection_date", {
            loans,admin,
            currentUserData,
            message: "Today's Due of Collection Date"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};