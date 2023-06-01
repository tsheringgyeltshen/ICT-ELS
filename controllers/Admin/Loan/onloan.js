const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const Users = require("../../../models/userModel");
const { DateTime } = require('luxon');


const dotenv = require("dotenv");
dotenv.config();

exports.onloanview = async (req, res) => {
    try {
        const userId = req.user.userData._id;

        const adminData = await Users.findById(userId);
        const collectloan = await loan
            .find({
                status: "onloan",
                return_date: { $ne: null } // Filter where collection_date is not null
            })
            .populate("user_id", "name department studentorstaff image userid")
            .populate({
                path: "items.item",
                select: "name available_items"
            })
            .select("items status return_date admin_collection_date ")
            .exec();

        // Add this line to set the currentUserData variable
        const currentUserData = req.user.userData;
        return res.render("admin/onloanview", {
            collectloan,
            currentUserData,
            admin: adminData
        });

    } catch (error) {

        console.error(error.message);

    }
}


exports.returnloan = async (req, res) => {
    //@dde

    // Create a nodemailer transporter using Gmail SMTP settings
    var transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.USER_MAIL,
            pass: process.env.USER_PASS,
        },
    });

    // Get the loan ID from the request parameters
    const loan_id = req.params.id;

    // Find the loan by ID, populate the associated user's email and item details
    const Loan = await loan
        .findById(loan_id)
        .populate("user_id", "email")
        .populate("items.item");

    // Convert the collection date from the request body to a Date object
    const collectionDate = new Date(req.body.admin_collection_date);

    try {
        // Calculate the time difference between now and the collection date
        const timeDiff = collectionDate.getTime() - new Date().getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff === 1) {
            // Send reminder email
            const itemNames = Loan.items.map((item) => item.item.name).join(", ");
            const mailOptions = {
                from: process.env.USER_MAIL,
                to: Loan.user_id.email,
                subject: "Reminder: Return of ICT Equipment Loan",
                text: `Dear user, this is a reminder that your loan for item(s): ${itemNames} is due tomorrow on ${collectionDate}. Please return the item(s) on time to avoid late fees.`
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Email sent: " + info.response);
                }
            });
        }

        // Update the loan with the new status and collection date
        await loan.findByIdAndUpdate(
            { _id: loan_id },
            {
                $set: {
                    status: "returned",
                },
            },
            { new: true }
        );

        // Update the available_items value for all items in the loan
        const items = Loan.items.map((item) => item.item._id);
        await item.updateMany(
            { _id: { $in: items } },
            { $inc: { available_items: 1 } }
        );

        // Find all loans with the same collection date and populate user emails
        const approve = await loan
            .find({
                status: "returned",
            })
            .populate("user_id", "email");

        //@des extract email
        if (approve) {
            // Send emails to all approved loan users
            approve.map(async (data) => {
                // Extract the item names from the loan and join them into a comma-separated string
                const itemNames = Loan.items.map((item) => item.item.name).join(", ");

                // Compose the email options
                var mailOptions = {
                    from: process.env.USER_MAIL,
                    to: await data.user_id.email,
                    subject: "ICT Equipment Loan System",
                    text: `Dear user, you have returned the item:${itemNames}`,
                };

                // Send the email
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("Email sent: " + info.response);
                    }
                });
            });

            // Set a flash message indicating successful addition of collection date
            req.flash("success_msg", "Item Successfully Returned");
            req.session.save(() => {
                res.redirect("/on_loanview");
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};



exports.notifyreturndate = async (req, res) => {
    // Create a nodemailer transporter using Gmail SMTP settings
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.USER_MAIL,
            pass: process.env.USER_PASS,
        },
    });

    // Get the loan ID from the request parameters
    const loan_id = req.params.id;

    // Find the loan by ID, populate the associated user's email and item details
    const Loan = await loan
        .findById(loan_id)
        .populate("user_id", "email")
        .populate("items.item");

    // Convert the collection date from the request body to a Date object

    try {
        const currentDate = DateTime.local();
        const tomorrowDate = currentDate.plus({ days: 1 });
        const tomorrowFormatted = tomorrowDate.toFormat('dd-MM-yy'); // Example format: dd-mm-yy



        // Send reminder email
        const itemNames = Loan.items.map((item) => item.item.name).join(", ");
        const mailOptions = {
            from: process.env.USER_MAIL,
            to: Loan.user_id.email,
            subject: "Reminder: Return of ICT Equipment Loan",
            text: `Dear user, this is a reminder that your loan for item: ${itemNames} is due tomorrow on ${tomorrowFormatted}. Please return the item on time to avoid late fees.`
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent: " + Loan.user_id.email);



        // Set a flash message indicating successful addition of collection date
        req.flash("success_msg", "Successfully Notified");
        req.session.save(() => {
            res.redirect("/on_loanview");
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};
