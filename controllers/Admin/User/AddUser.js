const Users = require("../../../models/userModel");
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;


const csv = require('csv-parser');
const fs = require('fs');


const dotenv = require('dotenv')
dotenv.config()
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {

    console.log(error.message);

  }

}
//to send mail for password and email
const addUserMail = async (name, email, password, user_id) => {
  try {

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      // host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASS
      }

    });
    const mailOptions = {
      from: process.env.USER_MAIL,
      to: email,
      subject: 'You has been added to ICT Equipment Loan System',
      html: '<p>Hii ' + name + ', you have been added to ICT Equipment Loan System<a href="http://127.0.0.1:3000/verify?id=' + user_id + '"></a></p> <br><br> <b>Email:-</b>' + email + '<br><b>Password:-</b>' + password + ''
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      }
      else {
        console.log("Email has been sent:- ", info.response);
      }
    });

  } catch (error) {

    console.log(error.message);

  }
}

//@des send verify mail
const sendVerifyMail = async (name, email, user_id) => {
  try {

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      // host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASS
      }

    });
    const mailOptions = {
      from: process.env.USER_MAIL,
      to: email,
      subject: 'ICT Equipment Loan System-Verification mail',
      html: '<p>Hii ' + name + ', You have been added to ICT Equipment Loan System <a href="http://127.0.0.1:5000/verify?id=' + user_id + '"></a></p>'
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      }
      else {
        console.log("Email has been sent:- ", info.response);
      }
    });

  } catch (error) {

    console.log(error.message);

  }
}
//@des 
exports.getRegister1 = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    // Retrieve the user ID from the JWT token
    const userId = req.user.userData._id;

    // Query the database for the user with the matching ID
    const adminData = await Users.findById(userId);
    // res.status(200).json({ "message": "USER ADDING Page" })
    res.render('admin/addnewuser', { admin: adminData });

  } catch (error) {
    console.log(error.message);
  }
}


exports.postRegister1 = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    // Retrieve the user ID from the JWT token
    const userId = req.user.userData._id;

    // Query the database for the user with the matching ID
    const adminData = await Users.findById(userId);

    const name = req.body.name;
    const userid = req.body.userid;
    const email = req.body.email;
    const mobilenumber = req.body.mobilenumber;
    const usertype = req.body.usertype;
    const year = req.body.year;
    const department = req.body.department;
    const studentorstaff = req.body.studentorstaff;
    const password = randomstring.generate(8);

    const finduser = await Users.findOne({ userid: userid });
    const finduser1 = await Users.findOne({ email: email });

    if (finduser || finduser1) {
      res.render('admin/addnewuser', { message: 'Email or userid has already taken.', admin: adminData });
    } else {
      const spassword = await securePassword(password);

      // Upload the image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      const user = new Users({
        name: name,
        userid: userid,
        email: email,
        mobilenumber: mobilenumber,
        usertype: usertype,
        studentorstaff: studentorstaff,
        year: year,
        department: department,
        image: result.secure_url, // Store the Cloudinary URL in the MongoDB document
        password: spassword,
      });

      const userData = await user.save();

      if (userData) {
        addUserMail(name, email, password, userData._id);
        res.render('admin/addnewuser', { message1: 'User has been successfully added', admin: adminData });
      } else {
        res.render('admin/addnewuser', { message: 'Something went wrong', admin: adminData });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};


exports.getVerify = async (req, res) => {
  try {


    const updateInfo = await Users.updateOne({ _id: req.query.id }, { $set: { is_verified: true } });

    console.log(updateInfo);
    // res.render("email-verified");
    return res.send('you have bee varified')


  } catch (error) {

    console.log(error.message);

  }
}


//@des bulk add user
exports.bulkaddload = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    // Retrieve the user ID from the JWT token
    const userId = req.user.userData._id;

    const adminData = await Users.findById(userId);
    res.render('admin/bulkadduser', { admin: adminData });

  } catch (error) {

    console.log(error.message);

  }
}

//@future work
exports.postaddusebulk = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userId = req.user.userData._id;

    const userData = [];
    const adminData = await Users.findById(userId);
    csv()
      .fromFile(req.file.path)
      .then(async (response) => {
        for (let i = 0; i < response.length; i++) {
          const uData = {
            name: response[i].name,
            userid: response[i].userid,
            email: response[i].email,
            mobilenumber: response[i].mobilenumber,
            usertype: response[i].usertype,
            year: response[i].year,
            department: response[i].department,
            studentorstaff: response[i].studentorstaff,
            image: response[i].image,
            password: randomstring.generate(8)
          };
          userData.push(uData);
        }

        // Use Mongoose to insert multiple documents
        Users.insertMany(userData)
          .then(() => {
            res.render('admin/bulkadduser', { admin: adminData, message: 'Registration successful' });
          })
          .catch((error) => {
            // Check for duplicate key error
            if (error.code === 11000) {
              res.render('admin/bulkadduser', { admin: adminData, message: 'Student ID already exist!! Cannot be same' });
            } else {
              res.render('admin/bulkadduser', { admin: adminData, message: error.message });
            }
          });
      });
  } catch (error) {
    res.send({ status: 400, success: false, msg: error.message });
  }
};



