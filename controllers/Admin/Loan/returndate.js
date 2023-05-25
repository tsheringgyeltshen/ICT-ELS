const item = require("../../../models/item");
const Users = require("../../../models/userModel");
const Loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

exports.viewPresentReturnDates = async (req, res) => {
    try {
        const userId = req.user.userData._id;

        const admin = await Users.findById(userId);
        // Get the current date/time
        const now = new Date();

        // Find all approved loans with a non-null admin_collection_date and return_date set to the current date
        const loans = await Loan.find({
            status: "approved",
            return_date_status: "not_returned",
            admin_collection_date: { $ne: null },
            return_date: now.toISOString().substr(0, 10),
        })
            .populate("user_id", "name department studentorstaff year")
            .populate("item", "name available_items")
            .select("item quantity status request_date return_date admin_collection_date return_date_status");

        // Add this line to set the currentUserData variable
        const currentUserData = req.user.userData;

        return res.render("admin/return_date", {
            loans, admin,
            currentUserData,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};
exports.sendLoanReminderEmail = async (req, res) => {
    try {
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const admin = await Users.findById(userId);
        // Add this line to set the currentUserData variable
        const currentUserData = req.user.userData;
        const now = new Date();

        // Find all approved loans with a non-null admin_collection_date and return_date set to the current date
        const loans = await Loan.find({
            status: "approved",
            return_date_status: "not_returned",
            admin_collection_date: { $ne: null },
            return_date: now.toISOString().substr(0, 10),
        })
            .populate("user_id", "name email department studentorstaff year ")
            .populate("item", "name")
            .select("item quantity status return_date request_date admin_collection_date return_date_status");


        // Send reminder emails for each loan that matches the criteria
        for (const loan of loans) {
            // Send the reminder email using Nodemailer
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

            // Set up the email message
            const mailOptions = {
                from: process.env.USER_MAIL,
                to: loan.user_id.email,
                subject: `ICT Equipment Loan System-Reminder: Please return ${loan.quantity} ${loan.item.name}(s)`,
                html: ` 
          <p>Hi ${loan.user_id.name},</p>
          <p>This is a friendly reminder that you borrowed ${loan.quantity} ${loan.item.name}(s) from our inventory and they are due back today (${loan.return_date.toDateString()}). Please return them as soon as possible so we can make them available for other users.</p>
          <p>If you have already returned the items, please disregard this message.</p>
          <p>Thank you for using our inventory system!</p>
        `,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
        }

        return res.render("admin/return_date", {
            loans, admin,
            currentUserData,
            message: "Reminder email sent successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};
exports.updateReturnDate = async (req, res) => {
    //@dde

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

    //@des
    if (req.user.userData.usertype !== "Admin") {
        return res.status(400).json({ error: "Invalid user type" });
    }

    const loan_id = req.params.id;
    const loan = await Loan.findById(loan_id).populate("user_id", "email").populate("item");
    const itemId = loan.item._id;
    const quantity = loan.quantity;
    const Item = await item.findOne({ _id: itemId });

    try {
        // Find the loan request by ID
        // const Loan = await loan.findByIdAndUpdate({id:loan_id},{status:'approved'},{new:true});
        await Loan.findByIdAndUpdate(
            { _id: loan_id },
            {
                $set: {
                    return_date_status: "returned",
                },
            },
            { new: true }
        );
        const returned = await Loan
            .find({
                return_date_status: "returned",
            })
            .populate("user_id", "email");

        //@des extract email
        if (returned) {
            returned.map(async (data) => {
                // console.log(data.user_id.email )
                var mailOptions = {
                    from: process.env.USER_MAIL,
                    to: await data.user_id.email,
                    subject: "ICT Equipment Loan System",
                    text: "Dear user, your loan for the item: " + Item.name + ", which date of return was today, you have submitted it on time, thank you for the service.",
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("Email sent: " + info.response);
                    }
                });
            });


            Item.available_items += quantity;

            if (Item.available_items <= 0) {
                Item.available_items = 0;
            }

            await Item.save();

            req.flash("success_msg", "Equipment' " + Item.name + " 'Successfully Returned");
            req.session.save(() => {
                res.redirect("/return-date");
            });


        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
};