const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const Users = require("../../../models/userModel");

const dotenv = require("dotenv");
dotenv.config();


exports.readyforcollection = async (req, res) => {
  try {
    const userId = req.user.userData._id;

    const adminData = await Users.findById(userId);
    const collectloan = await loan
      .find({
        status: "approved",
        admin_collection_date: { $ne: null } // Filter where collection_date is not null
      })
      .populate("user_id", "name department studentorstaff image userid")
      .populate({
        path: "items.item",
        select: "name available_items"
      })
      .select("items status return_date admin_collection_date")
      .exec();

    // Add this line to set the currentUserData variable
    const currentUserData = req.user.userData;
    return res.render("admin/readyforcollection", {
      collectloan,
      currentUserData,
      admin: adminData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.collected = async (req, res) => {
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
          text: `Dear user, you have collect the item:${itemNames}`,
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

exports.Collectedoverdueloan = async (req, res) => {
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
  const collectionDate = new Date();

  try {
    // Check if return is not passed and present date is not greater than return date
    if (
      Loan.status !== "returned" &&
      new Date(Loan.return_date) >= new Date()
    ) {
      // Update the loan with the new collection date and status
      await loan.findByIdAndUpdate(
        { _id: loan_id },
        {
          $set: {
            status: "onloan",
            admin_collection_date: collectionDate,
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
            text: `Dear user, you have collected the item: ${itemNames}`,
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
        req.flash("success_msg", "Collection Successful");
        req.session.save(() => {
          res.redirect("/ready-forcollect");
        });
      } else if (new Date(Loan.return_date) < new Date()) {
        // Handle case where return date has passed
        req.flash(
          "error_msg",
          "The Loan cannot be collected since return date has passed."
        );
        req.session.save(() => {
          res.redirect("/ready-forcollect");
        });
      } else {
        // Handle case where no loans match the conditions
        req.flash("error_msg", "No loans match the conditions for collection.");
        req.session.save(() => {
          res.redirect("/ready-forcollect");
        });
      }
    } else {
      // Handle case where return is passed or present date is greater than return date
      req.flash("error_msg", "The Loan cannot be collected since return date has passed");
      req.session.save(() => {
        res.redirect("/ready-forcollect");
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


exports.collectionoverdue = async (req, res) => {
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

  try {
    // Update the loan with the new collection date and status
    const updatedLoan = await loan
      .findByIdAndUpdate(
        { _id: loan_id },
        {
          $set: {
            status: "rejected",
          },
        },
        { new: true }
      )
      .populate("items.item")
      .populate("user_id", "email");

    // Update the available_items field for each item in the loan
    await Promise.all(
      updatedLoan.items.map(async (loanItem) => {
        await item.findByIdAndUpdate(loanItem.item._id, { $inc: { available_items: 1 } });
      })
    );

    // Send an email to the user whose loan has been rejected
    const mailOptions = {
      from: process.env.USER_MAIL,
      to: updatedLoan.user_id.email,
      subject: "ICT Equipment Loan System",
      text: `Dear user, your loan for item(s): ${updatedLoan.items
        .map((loanItem) => loanItem.item.name)
        .join(", ")}, has been rejected.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent");
    } catch (error) {
      console.log(error);
    }

    // Set a flash message indicating successful rejection of the loan
    req.flash("success_msg", "Loan Successfully Rejected");
    req.session.save(() => {
      res.redirect("/ready-forcollect");
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
