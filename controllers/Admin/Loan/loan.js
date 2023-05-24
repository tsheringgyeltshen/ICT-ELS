const item = require("../../../models/item");
const loan = require("../../../models/loan");
var nodemailer = require("nodemailer");
const Users = require("../../../models/userModel");

const dotenv = require("dotenv");
dotenv.config();

exports.viewApprovedloan = async (req, res) => {
  try {
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
      .populate("item", "name available_items")
      .select("item quantity status return_date admin_collection_date ")
      .exec();

    // Add this line to set the currentUserData variable
    const currentUserData = req.user.userData;

    loanApproved.forEach((loanApproved) => {
      if (loanApproved.user_id && loanApproved.user_id.name) {
        //console.log(loanRequest.user_id.name);
      }
    });

    return res.render("admin/Approvedloan", {
      loanApproved,
      currentUserData,admin:adminData
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updateloan = async (req, res) => {
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
  const loan_id = req.params.id;
  const Loan = await loan.findById(loan_id).populate("user_id", "email").populate("item");
  //const returndate = Loan.return_date;
  //const quantity = Loan.quantity;
  const itemId = Loan.item._id;
  const Item = await item.findOne({_id: itemId});

  try {
    console.log(req.body.admin_collection_date);
    // Find the loan request by ID
    // const Loan = await loan.findByIdAndUpdate({id:loan_id},{status:'approved'},{new:true});
    const updatedLoan = await loan.findByIdAndUpdate(
      { _id: loan_id },
      {
        $set: {
          admin_collection_date: req.body.admin_collection_date,
        },
      },
      { new: true }
    );
    // Use the updated value of admin_collection_date 
   // retrieved from the updated loan document
    const approve = await loan
      .find({
        admin_collection_date: updatedLoan.admin_collection_date,
      })
      .populate("user_id", "email");

    //@des extract email
    if (approve) {
      approve.map(async (data) => {
        // console.log(data.user_id.email )
        var mailOptions = {
          from: process.env.USER_MAIL,
          to: await data.user_id.email,
          subject: "GCIT LOAN_A_TECH",
          text: "Dear user, your loan for " + Item.name+", which has been approved, the admin has given the collection dates that is on:"  +updatedLoan.admin_collection_date+",kindly come for collection before the given date",
        };
        console.log(updatedLoan.admin_collection_date);
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      });
      // const currentDate = new Date();
      // if (currentDate.getTime() === returndate.getTime()) {
      //     // Update item availability in database
      //     Item.available_items += quantity;
      //     await Item.save();
      // }
      req.flash("success_msg","Collection Date Successfully Added");
      req.session.save(()=>{
        res.redirect("/view-approved-loan");
      });
       
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};



