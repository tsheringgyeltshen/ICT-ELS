const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const Users = require("../../../models/userModel");
const moment = require('moment');


const dotenv = require("dotenv");
dotenv.config();

exports.readyforcollection = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
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
    const userId = req.user.userData._id;
    const currentUserData = req.user.userData;

    const adminData = await Users.findById(userId);
    const collectloan = await loan
      .find({
        status: "collect",
        admin_collection_date: { $ne: null } // Filter where collection_date is not null
      })
      .populate("user_id", "name email department studentorstaff image userid")
      .populate({
        path: "items.item",
        select: "name available_items"
      })
      .select("items status return_date admin_collection_date")
      .exec();

    const currentDate = moment().startOf('day'); // Get the current date
    const loansToUpdate = collectloan.filter(loan => {
      const collectionDate = moment(loan.admin_collection_date).startOf('day');
      const newDateStarts = moment(loan.admin_new_date_start).startOf('day');
      const isCollectionDatePassed = collectionDate.isBefore(currentDate);
      const isNewDateStarted = newDateStarts.isSameOrBefore(currentDate);
      const isLoanAccepted = loan.status === 'accept';
      return isCollectionDatePassed && isNewDateStarted && isLoanAccepted;
    });

    // Loop through the loans to update and send emails
    for (const loan of loansToUpdate) {
      loan.status = 'rejected';

      // Update the 'available_items' field to 1 for each item in the loan
      for (const item of loan.items) {
        item.item.available_items = 1;
        await item.item.save();
      }

      await loan.save();

      // Send email to the user here
      // Compose the email options
      var mailOptions = {
        from: process.env.USER_MAIL,
        to: loan.user_id.email,
        subject: "ICT Equipment Loan System",
        text: `Dear user, you have not collected the item and your loan has been rejected`,
      };

      // Send the email
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }

    // Render the view with the updated 'collectloan' array
    return res.render("admin/readyforcollection", {
      collectloan: collectloan.filter(loan => loan.status === 'collect'), // Filter out rejected loans
      currentUserData,
      admin: adminData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};



exports.collected = async (req, res) => {
  if (req.user.userData.usertype !== "Admin") {
    req.flash('error_msg', 'You are not authorized');
    return res.redirect('/');
  }
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
    // Update the loan with the new collection date
    await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          status: "onloan",
        },
      },
      { new: true }
    );

    // Find all loans with the same collection date and populate user emails
    const approve = await loan
      .find({
        status: "onloan",
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
          text: `Dear user, you have collected the item:${itemNames}`,
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
      req.flash("success_msg", "Collection Successfully");
      req.session.save(() => {
        res.redirect("/ready-forcollect");
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
