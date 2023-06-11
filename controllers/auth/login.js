const Users = require("../../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const randomString = require('randomstring');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config()
const nodemailer = require('nodemailer');
const express = require('express')
const app = express()
app.use(cookieParser())

const sendResetPasswordMail = async(name, email, token)=>{
    try {
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: process.env.USER_MAIL,
                pass: process.env.USER_PASS
            }

        });
        const mailOptions = {
            from: process.env.USER_MAIL,
            to:email,
            subject:'Reset Password',
            html:'<p>Hii '+name+', please click here to <a href="https://ict-equipment-loan-system.onrender.com/forget-password?token='+token+'">reset </a> your password.</p>'
        }
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log(error);
            }
            else{
                console.log("Email has been sent:- ",info.response);
            }
        });

    } catch (error) {

        console.log(error.message);
        
    }
}
exports.getLogin = async (req, res) => {
    try {
        
        res.render('../views/user/login');

    } catch (error) {

        console.log(error.message)

    }
}
//@des verify login page
exports.postLogin = async (req, res) => {
    try {
        const { userid, password } = req.body; //  or const userid = req.body.userid
        const userData = await Users.findOne({ userid });
        

        if (userData) {
            
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                // if (userData.is_verified === false) {
                //     res.render('login', { message: "please verify your email." });
                //     return res.send('please verify email');
                // }
                if (userData.usertype === "Admin" && userData.isDeleted === false) {
                    
                    //@des token 
                    const token = jwt.sign({ userData }, process.env.SECRET);
                    res.cookie('access', token, {
                        httpOnly: true
                    });
                    res.redirect('/adminhome');
                    

                    
                }
                else if (userData.usertype === 'Approval'&& userData.isDeleted === false) {
                    const token = jwt.sign({userData} , process.env.SECRET);
                    res.cookie('access', token, {
                        httpOnly: true
                    });
                     res.redirect('/approvalhome')
                }
                else  if (userData.usertype === 'User' && userData.isDeleted === false) {
                    const token = jwt.sign({ userData }, process.env.SECRET);
                    res.cookie('access', token, {
                        httpOnly: true
                    });
                    res.redirect('/userhome');
                    
                }
                else{
                    
                    res.render('../views/user/login', { message1:"Your account has been removed due to inactivity" })
                }
            }
            else {
               res.render('../views/user/login', { message1: "User ID or Password is incorrect!" });
             
            }
            

        }
        else {
           res.render('../views/user/login', { message1: "User ID or Password is incorrect!" });
        }

    } catch (error) {

        console.log(error.message);

    }
}

//@des logout


exports.getForgetPassword = async (req, res) => {
    try {

        res.render('user/forget');

    } catch (error) {

        console.log(error.message);

    }
}
exports.postForgetPassword = async (req, res) => {
    try {

        const {email} = req.body;
        const userData = await Users.findOne({email });
        if (userData) {

            if(userData) {
                const randomstring = randomString.generate();
                const updatedData = await Users.updateOne({email }, { $set: { token: randomstring } });
                sendResetPasswordMail(userData.name, userData.email, randomstring);
                res.render('user/forget', { message1: "Please check your email to reset your password." });


            }
        }
        else {
            res.render('user/forget', { message: "User email is incorrect" });
        }

    } catch (error) {

        console.log(error.message);

    }
}
//@des forget password load

exports. getForgetPasswordLoad= async (req, res) => {
    try {

        const token = req.query.token;
        const tokenData = await Users.findOne({ token: token });
        if (tokenData) {
           res.render('user/forget-password', { user_id: tokenData._id });

        }
        else {
            res.render('404', { message: "token is invalid" });
        }

    } catch (error) {

        console.log(error.message);

    }
}
exports. postForgetPasswordLoad = async (req, res) => {
    try {

        const { user_id, password } = req.body;

        const secure_password = await bcrypt.hash(password, 10);

        const updatedData = await Users.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password, token: '' } });

        res.redirect("/");


    } catch (error) {

        console.log(error.message);

    }
}

