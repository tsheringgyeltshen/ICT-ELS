const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const Users = require("../../../models/userModel");
const { DateTime } = require('luxon');


const dotenv = require("dotenv");
dotenv.config();

exports.onloanview = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
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



exports.viewonloandetailforreturn = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
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
    return res.render('admin/viewonloandetailforreturn', { loanDetails, admin: users });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
};




exports.overdueloanitemdetails = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
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
    return res.render('admin/viewoverdueloandetailforreturn', { loanDetails, admin: users });
  } catch (error) {
    // Handle errors
    return res.status(500).render('error', { message: 'Server Error' });
  }
};


exports.acceptloanreturnitems = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
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
    const loanId = req.params.loanId;

    // Find the loan by ID and populate related fields
    const Loan = await loan
      .findById(loanId)
      .populate("user_id", "name email department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category",
        populate: { path: "category", select: "name" },
      });

    const selectedItems = req.body.selectedItems;
    const allItemsSelected = selectedItems.length === Loan.items.length;
    const selectedItemNames = [];
    // Update the loan items based on the selected items
    await Promise.all(
      Loan.items.map(async (loanItem) => {
        if (selectedItems.includes(loanItem._id.toString())) {
          // Set available_items to 1 if the item is checked
          await item.findByIdAndUpdate(loanItem.item._id, {
            $set: { available_items: 1 },
          });
          selectedItemNames.push(loanItem.item.name);

        }

      })
    );

    // Determine the status based on whether all items are selected
    const status = allItemsSelected ? "returned" : "overdue";

    // Update the loan status and items accordingly
    const updatedLoan = await loan.findByIdAndUpdate(
      { _id: loanId },
      {
        $set: {
          status: status,
        },
      },
      { new: true }
    );
    const itemNames = Loan.items.map((item) => item.item.name).join(", ");

    const mailOptions = {
      from: process.env.USER_MAIL,
      to: Loan.user_id.email,
      subject: "Return of ICT Equipment",
      text: `Dear user, you have successfully returned item:${selectedItemNames.join(", ")}`
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent: " + Loan.user_id.email);

    req.flash("success_msg", "Items Successfully Returned");
    req.session.save(() => {
      res.redirect("/on_loanview");
    });
  } catch (error) {
    req.flash("error_msg", "Check at least one item");
    req.session.save(() => {
      res.redirect("/on_loanview");
    });
  }
};

exports.viewoverduereturn = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;

    const adminData = await Users.findById(userId);
    const collectloan = await loan
      .find({
        status: "overdue"
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
    return res.render("admin/viewoverdueloan", {
      collectloan,
      currentUserData,
      admin: adminData
    });

  } catch (error) {

    console.error(error.message);

  }
}


exports.acceptitemsoverduereturn = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
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
    const loanId = req.params.loanId;

    // Find the loan by ID and populate related fields
    const Loan = await loan
      .findById(loanId)
      .populate("user_id", "name email department usertype userid image")
      .populate({
        path: "items.item",
        select: "name available_items image itemtag category",
        populate: { path: "category", select: "name" },
      });

    const selectedItems = req.body.selectedItems;
    var loan_items_unChacked_length = 0
    const selectedItemNames = [];

    // Update the loan items based on the selected items
    await Promise.all(
      Loan.items.map(async (loanItem) => {
        const itemId = loanItem.item._id.toString();
        const selectedItem = selectedItems.includes(itemId);
        if (loanItem.item.available_items === 0) loan_items_unChacked_length++
        if (selectedItems.includes(loanItem._id.toString())) {
          // Set available_items to 1 if the item is checked
          await item.findByIdAndUpdate(loanItem.item._id, {
            $set: { available_items: 1 },
          });
          selectedItemNames.push(loanItem.item.name);

        }

      })
    );
    const allItemsSelected = selectedItems.length === loan_items_unChacked_length;


    // Determine the status based on whether all items are selected
    const status1 = allItemsSelected ? "returned" : "overdue";

    // Update the loan status and items accordingly
    const updatedLoan = await loan.findByIdAndUpdate(
      { _id: loanId },
      {
        $set: {
          status: status1,
        },
      },
      { new: true }
    );
    const itemNames = Loan.items.map((item) => item.item.name).join(", ");

    const mailOptions = {
      from: process.env.USER_MAIL,
      to: Loan.user_id.email,
      subject: "Return of ICT Equipment",
      text: `Dear user, you have successfully returned item: ${selectedItemNames.join(", ")}`
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent: " + Loan.user_id.email);

    req.flash("success_msg", "Items Successfully Returned");
    req.session.save(() => {
      res.redirect("/viewoverdue");
    });
  } catch (error) {
    req.flash("error_msg", "Check at least one item");
    req.session.save(() => {
      res.redirect("/viewoverdue");
    });
  }
};



// exports.returnloan = async (req, res) => {
//     //@dde

//     // Create a nodemailer transporter using Gmail SMTP settings
//     var transporter = nodemailer.createTransport({
//         service: "gmail",
//         port: 587,
//         secure: false,
//         requireTLS: true,
//         auth: {
//             user: process.env.USER_MAIL,
//             pass: process.env.USER_PASS,
//         },
//     });

//     // Get the loan ID from the request parameters
//     const loan_id = req.params.id;

//     // Find the loan by ID, populate the associated user's email and item details
//     const Loan = await loan
//         .findById(loan_id)
//         .populate("user_id", "email")
//         .populate("items.item");

//     // Convert the collection date from the request body to a Date object
//     const collectionDate = new Date(req.body.admin_collection_date);

//     try {
//         // Calculate the time difference between now and the collection date
//         const timeDiff = collectionDate.getTime() - new Date().getTime();
//         const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

//         if (daysDiff === 1) {
//             // Send reminder email
//             const itemNames = Loan.items.map((item) => item.item.name).join(", ");
//             const mailOptions = {
//                 from: process.env.USER_MAIL,
//                 to: Loan.user_id.email,
//                 subject: "Reminder: Return of ICT Equipment Loan",
//                 text: `Dear user, this is a reminder that your loan for item(s): ${itemNames} is due tomorrow on ${collectionDate}. Please return the item(s) on time to avoid late fees.`
//             };
//             transporter.sendMail(mailOptions, function (error, info) {
//                 if (error) {
//                     console.log(error);
//                 } else {
//                     console.log("Email sent: " + info.response);
//                 }
//             });
//         }

//         // Update the loan with the new status and collection date
//         await loan.findByIdAndUpdate(
//             { _id: loan_id },
//             {
//                 $set: {
//                     status: "returned",
//                 },
//             },
//             { new: true }
//         );

//         // Update the available_items value for all items in the loan
//         const items = Loan.items.map((item) => item.item._id);
//         await item.updateMany(
//             { _id: { $in: items } },
//             { $inc: { available_items: 1 } }
//         );

//         // Find all loans with the same collection date and populate user emails
//         const approve = await loan
//             .find({
//                 status: "returned",
//             })
//             .populate("user_id", "email");

//         //@des extract email
//         if (approve) {
//             // Send emails to all approved loan users
//             approve.map(async (data) => {
//                 // Extract the item names from the loan and join them into a comma-separated string
//                 const itemNames = Loan.items.map((item) => item.item.name).join(", ");

//                 // Compose the email options
//                 var mailOptions = {
//                     from: process.env.USER_MAIL,
//                     to: await data.user_id.email,
//                     subject: "ICT Equipment Loan System",
//                     text: `Dear user, you have returned the item:${itemNames}`,
//                 };

//                 // Send the email
//                 transporter.sendMail(mailOptions, function (error, info) {
//                     if (error) {
//                         console.log(error);
//                     } else {
//                         console.log("Email sent: " + info.response);
//                     }
//                 });
//             });

//             // Set a flash message indicating successful addition of collection date
//             req.flash("success_msg", "Item Successfully Returned");
//             req.session.save(() => {
//                 res.redirect("/on_loanview");
//             });
//         }
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "Server error" });
//     }
// };



exports.notifyreturndate = async (req, res) => {
  if (req.user.userData.usertype !== "Admin") {
    req.flash('error_msg', 'You are not authorized');
    return res.redirect('/');
  }
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
