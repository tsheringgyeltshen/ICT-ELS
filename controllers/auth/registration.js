const Users = require("../../models/userModel");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

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
            subject: 'ICT Equipment Loan System has added you.',
            html: '<p>Hii ' + name + ', you has been added to ICT Equipment Loan System <a href="http://127.0.0.1:5000/verify?id=' + user_id + '"></a></p>'
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
exports.getRegister = async (req, res) => {
    try {
        // res.status(200).json({ "message": "registration Page" })
        res.render('../views/user/registration');

    } catch (error) {
        console.log(error.message);
    }
}

exports.postRegister = async (req, res) => {
    try {
        const { name,
            userid,
            email,
            mobilenumber,
            usertype,
            year,
            department,
            studentorstaff,
        } = req.body;
        const image = req.file
        const image_url = image.path
        if (!image) {
            return res.status(422).json({ 'message': 'invalid image formate' })
        }

        const spassword = await securePassword(req.body.password);
        const user = Users({
            name,
            userid,
            email,
            mobilenumber,
            usertype,
            year,
            department,
            studentorstaff,
            password: spassword,
            image: image_url,
        });
        const existUsers = await Users.findOne({ email, userid });
        if (existUsers) {
               return res.render('../views/user/registration', { message: "Email already taken." });
            // return res.status(203).json('user exist ')
        }
        const userData = await user.save();
        if (userData) {
            //verify
            sendVerifyMail(req.body.name, req.body.email, userData._id);
            res.render('../views/user/registration', { message: "Your registration has been successful, Please verify your email!" });
            // return res.send("Your registration has been successful, Please verify your email!")

        }
        else {
            res.render('../views/user/registration', { message: "Your registration has been failed " });d
            // res.send("Your registration has been failed ")
        }



    } catch (error) {

        console.log(error.message)

    }
}

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