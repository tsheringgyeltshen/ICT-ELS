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

// exports.collected = async (req, res) => {
//     //@dde
  
//     // Create a nodemailer transporter using Gmail SMTP settings
//     var transporter = nodemailer.createTransport({
//       service: "gmail",
//       port: 587,
//       secure: false,
//       requireTLS: true,
//       auth: {
//         user: process.env.USER_MAIL,
//         pass: process.env.USER_PASS,
//       },
//     });
  
//     // Get the loan ID from the request parameters
//     const loan_id = req.params.id;
  
//     // Find the loan by ID, populate the associated user's email and item details
//     const Loan = await loan
//       .findById(loan_id)
//       .populate("user_id", "email")
//       .populate("items.item");
  
//     // Convert the collection date from the request body to a Date object
//     const collectionDate = new Date(req.body.admin_collection_date);
  
//     try {
//       // Update the loan with the new collection date
//       await loan.findByIdAndUpdate(
//         { _id: loan_id },
//         {
//           $set: {
//             status:"onloan",
//           },
//         },
//         { new: true }
//       );
  
//       // Find all loans with the same collection date and populate user emails
//       const approve = await loan
//         .find({
//           status: "onloan",
//         })
//         .populate("user_id", "email");
  
//       //@des extract email
//       if (approve) {
//         // Send emails to all approved loan users
//         approve.map(async (data) => {
//           // Extract the item names from the loan and join them into a comma-separated string
//           const itemNames = Loan.items.map((item) => item.item.name).join(", ");
  
//           // Compose the email options
//           var mailOptions = {
//             from: process.env.USER_MAIL,
//             to: await data.user_id.email,
//             subject: "ICT Equipment Loan System",
//             text: `Dear user, you have collect the item:${itemNames}`,
//           };
  
//           // Send the email
//           transporter.sendMail(mailOptions, function (error, info) {
//             if (error) {
//               console.log(error);
//             } else {
//               console.log("Email sent: " + info.response);
//             }
//           });
//         });
  
//         // Set a flash message indicating successful addition of collection date
//         req.flash("success_msg", "Collection Successfully");
//         req.session.save(() => {
//           res.redirect("/ready-forcollect");
//         });
//       }
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ error: "Server error" });
//     }
//   };

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

    let shouldReject = false;

    if (approve) {
      // Send emails to all approved loan users
      approve.map(async (data) => {
        if (new Date(loan.admin_collection_date).toDateString() !== new Date().toDateString()) {
          if (new Date() > new Date(loan.admin_collection_date)) {
            shouldReject = true;
          } else {
            return;
          }
        }

        if (shouldReject) {
          // Reject the loan and set available_items to 1
          await loan.findByIdAndUpdate(
            { _id: loan._id },
            {
              $set: {
                status: "rejected",
                available_items: 1,
              },
            },
            { new: true }
          );
          
          const itemName = Loan.items.map((item) => item.item.name).join(", ");


          // Compose the email options for rejection notification
          var rejectionMailOptions = {
            from: process.env.USER_MAIL,
            to: await data.user_id.email,
            subject: "Loan Rejected",
            text: `Dear user, your loan for ${itemName} has been rejected because you didn't show up on the collection date.`,
          };

          // Send the rejection email
          transporter.sendMail(rejectionMailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Rejection email sent: " + info.response);
            }
          });

          return;
        }

        // Extract the item names from the loan and join them into a comma-separated string
        const itemNames = Loan.items.map((item) => item.item.name).join(", ");

        // Compose the email options
        var mailOptions = {
          from: process.env.USER_MAIL,
          to: await data.user_id.email,
          subject: "ICT Equipment Loan System",
          text: `Dear user, you have collected the following item(s): ${itemNames}`,
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

      if (shouldReject) {
        // Set a flash message indicating loan rejection
        req.flash("error_msg", "Loan rejected because you didn't show up on the collection date");
      } else if (approve.length === 0) {
        // Set a flash message indicating no loans ready for collection
        req.flash("success_msg", "No loans ready for collection");
      } else {
        // Set a flash message indicating successful collection
        req.flash("success_msg", "Collection successful");
      }

      req.session.save(() => {
        res.redirect("/ready-forcollect");
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
