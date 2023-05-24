const Users = require("../../../models/userModel");
const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

exports.viewLoanRequests = async (req, res) => {
  if (req.user.userData.email !== "tsheringgyeltshentt1999@gmail.com") {
    // return res.status(400).json({ error: "Invalid user type" });
    req.flash("error_msg", "Invalid user type");
    res.session.save(() => {
      res.redirect('/adminhome');
    });
  }
  const userId = req.user.userData._id;

  const adminData = await Users.findById(userId);

  try {
    const loanRequests = await loan
      .find({
        status: "pending",
      })
      .populate("user_id", "name department usertype userid image")
      .populate({
        path: "user_id",
        select: "name department usertype userid image",
        match: { usertype: "Approval" },
      })
      .populate("item", "name available_items")
      .select("item quantity status return_date request_date")
      .exec();

    // Add this line to set the currentUserData variable
    const currentUserData = req.user.userData;

    loanRequests.forEach((loanRequest) => {
      if (loanRequest.user_id && loanRequest.user_id.name) {
        //console.log(loanRequest.user_id.name);
      }
    });

    return res.render("admin/pendingloan", {
      loanRequests,
      currentUserData, admin: adminData
    });
  } catch (error) {
    req.flash("error_msg", "Server Error");
    req.session.save(() => {
      res.redirect('/adminhome');
    });
  }
};

exports.manageLoanRequest = async (req, res) => {
  const userId = req.user.userData._id;


  // Query the database for the user with the matching ID
  const admin = await Users.findById(userId);
  const loanRequests = await loan
    .find({
      status: "pending",
    })
    .populate("user_id", " userid name department usertype image")
    .populate({
      path: "user_id",
      select: "name userid department usertype image",
      match: { usertype: "Approval" },
    })
    .populate("item", "name available_items")
    .select("item quantity status return_date request_date")
    .exec();

  // Add this line to set the currentUserData variable
  const currentUserData = req.user.userData;

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
  if (req.user.userData.email !== "tsheringgyeltshentt1999@gmail.com") {
    return res.redirect('/adminhome');
  }

  const loan_id = req.params.id;
  const Loan = await loan.findById(loan_id).populate("user_id", "email").populate("item");
  const itemId = Loan.item._id;
  const quantity = Loan.quantity;
  const Item = await item.findOne({ _id: itemId });

  if (!Item) {
    return res.render("admin/pendingloan", {
      loanRequests,
      currentUserData,
      admin,
      message: 'Item is not available'
    });
  }

  if (Item.available_items < quantity) {
    transporter.sendMail(
      {
        from: process.env.USER_MAIL,
        to: Loan.user_id.email,
        subject: "GCIT LOAN_A_TECH",
        text: `Dear user, your loan for the item: ${Item.name}, has been gone with insufficient stock, it might be beacause other user had applied for more amount which might had been accepted earlier. Please try to look at items quantity again, and submit your request based on the avaialble item quantity, thank you.`,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );
    return res.render("admin/pendingloan", {
      loanRequests,
      admin,
      currentUserData,
      message: "Insufficient stock or quantity, it might be on loan."
    });
  }

  try {
    // Find the loan request by ID
    // const Loan = await loan.findByIdAndUpdate({id:loan_id},{status:'approved'},{new:true});
    await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          status: "approved",
        },
      },
      { new: true }
    );

    Item.available_items -= quantity;

    if (Item.available_items <= 0) {
      Item.available_items = 0;
    }

    await Item.save();

    transporter.sendMail(
      {
        from: process.env.USER_MAIL,
        to: Loan.user_id.email,
        subject: "GCIT LOAN_A_TECH",
        text: `Your loan for the item: ${Item.name} has been approved`,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      }
    );


    req.flash("success_msg", "Loan Request Approved");
    req.session.save(() => {
      res.redirect("/viewreq-loan");
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};




exports.rejectLoanRequest = async (req, res) => {
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

  try {
    // Find the loan request by ID
    const Loan = await loan.findById(loan_id).populate("user_id", "email").populate("item");
    const itemId = Loan.item._id;
    const quantity = Loan.quantity;
    const Item = await item.findOne({ _id: itemId });
    await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          status: "rejected",
        },
      },
      { new: true }
    );
    const reject = await loan
      .find({
        status: "rejected",
      })
      .populate("user_id", "email");

    //@des extract email
    if (reject) {
      reject.map(async (data) => {
        // console.log(data.user_id.email )
        var mailOptions = {
          from: process.env.USER_MAIL,
          to: await data.user_id.email,
          subject: "GCIT LOAN_A_TECH",
          text: "dear user, Your loan for the item: " + Item.name + ",has been rejected",
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      });
      // Update item availability in database
      // Item.available_items += quantity;
      // await Item.save();

      req.flash("success_msg", "Loan Request Rejected");
      req.session.save(() => {
        res.redirect("/viewreq-loan");
      });
    }


  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }

};
