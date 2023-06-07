const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const Users = require("../../../models/userModel");

const dotenv = require("dotenv");
dotenv.config();

exports.viewApprovedloan = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;

    const adminData = await Users.findById(userId);
    const loanApproved = await loan
      .find({
        status: "approved",
        collection_date: { $in: [null, undefined] }
      })
      .populate("user_id", "name department studentorstaff image userid")
      .populate({
        path: "user_id",
        select: "name department studentorstaff image userid",
      })
      .populate({
        path: "items.item",
        select: "name available_items"
      }
      )
      .select("items status return_date admin_collection_date ")
      .exec();

    // Add this line to set the currentUserData variable
    const currentUserData = req.user.userData;

    return res.render("admin/Approvedloan", {
      loanApproved,
      currentUserData, admin: adminData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.viewuserapprovalloandetail = async (req, res) => {
  if (req.user.userData.usertype !== "Admin") {
    req.flash('error_msg', 'You are not authorized');
    return res.redirect('/');
  }
  try {
    const loanId = req.params.loanId;
    const userId = req.user.userData._id;
    const users = await Users.findById(userId);

    // Retrieve the loan details using the loanId
    const loanDetails = await loan.findById(loanId)
      .populate("user_id", "name department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category", // Include the 'category' field from the item schema
        populate: { path: "category", select: "name" } // Populate the 'category' field from the item schema
      });

    console.log(loanDetails);

    if (!loanDetails) {
      // Handle loan not found
      return res.status(404).render('error', { message: 'Loan not found' });
    }

    // Render the loan details page with the loanDetails data
    return res.render('admin/loan-detailsuserapproval', { loanDetails, admin: users });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
};



exports.updateloan = async (req, res) => {
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
  const today = new Date();

  try {
    // Find the loan to check the return_date
    const loanToUpdate = await loan.findById(loan_id);

    if (collectionDate > loanToUpdate.return_date) {
      // If the collection date is later than the return date, display a flash message
      req.flash("error_msg", "Collection Date cannot be later than the Return Date");
      req.session.save(() => {
        res.redirect("/view-approved-loan");
      });
      return;
    }

    if (isWeekend(collectionDate)) {
      // If the collection date falls on a weekend, display a flash message
      req.flash("error_msg", "Cannot select collection date on weekends");
      req.session.save(() => {
        res.redirect("/view-approved-loan");
      });
      return;
    }

    // Update the loan with the new collection date
    const updatedLoan = await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          admin_collection_date: collectionDate,
          status: 'accept'
        },
      },
      { new: true }
    );

    // Find all loans with the same collection date and populate user emails
    const approve = await loan
      .find({
        admin_collection_date: updatedLoan.admin_collection_date,
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
          text: `Dear user, your loan for ${itemNames}, which has been approved, has been given with a collection date Kindly come for collection on the given day.`,
        };

        if (collectionDate.toDateString() === today.toDateString()) {
          // If the collection date is today, include additional information in the email
          mailOptions.text += `\n\nPlease note that the collection date is today.`;
        } else {
          // If the collection date is not today, include a reminder for the day before collection
          const previousDay = new Date(collectionDate);
          previousDay.setDate(collectionDate.getDate() - 1);
          mailOptions.text += `\n\nPlease note that the collection date is on ${previousDay.toDateString()} and ${collectionDate.toDateString()}.`;
        }

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
      req.flash("success_msg", "Collection Date Successfully Added");
      req.session.save(() => {
        res.redirect("/view-approved-loan");
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // 0: Sunday, 6: Saturday
}



