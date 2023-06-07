const Users = require("../../../models/userModel");
const fs = require('fs');
const cloudinary = require('cloudinary').v2;


exports.getAdminProfilePage = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }

        // Retrieve the user ID from the JWT token
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);
        return res.render('admin/adminprofile', { admin: adminData });

    } catch (error) {

        console.log(error.message);

    }
}

exports.getAdminEditProfile = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }

        // Retrieve the user ID from the JWT token
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);
        return res.render('admin/editadminprofile', { admin: adminData });

    } catch (error) {

        console.log(error.message);
    }
}


exports.postAdminEditProfile = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const existingUser = await Users.findOne({
            $or: [
                { email: req.body.email },
                { userid: req.body.userid }
            ],
            _id: { $ne: req.body.id }
        });

        if (existingUser) {
            req.flash('error_msg', 'Email or User ID already exists. Cannot update the user.');
            res.redirect(`/adminprofile?id=${req.body.id}`);
        }

        if (req.file) {
            const userData1 = await Users.findById(req.body.id);

            const result = await cloudinary.uploader.upload(req.file.path);

            // Delete the original image from Cloudinary
            const publicId = userData1.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);

            const userData = await Users.findByIdAndUpdate({ _id: req.body.id },



                {
                    $set: {
                        name: req.body.name,
                        userid: req.body.userid,
                        email: req.body.email,
                        mobilenumber: req.body.mno,
                        department: req.body.department1,
                        image: result.secure_url,
                    }
                });

            req.flash("success_msg", "Your profile has been updated");
            req.session.save(() => {
                res.redirect(`/adminprofile?id=${req.body.id}`);
            });


        }
        else {
            await Users.findByIdAndUpdate({ _id: req.body.id },


                {
                    $set: {
                        name: req.body.name,
                        userid: req.body.userid,
                        email: req.body.email,
                        mobilenumber: req.body.mno,
                        department: req.body.department1
                    }
                });
            req.flash("success_msg", "Your profile has been updated");
            req.session.save(() => {
                res.redirect(`/adminprofile?id=${req.body.id}`);
            });
        }

    } catch (error) {
        console.log(error.message)

    }
}









exports.confirmDeleteAdmin = async (req, res) => {

    try {

        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID

        const id = req.body.id;
        await Users.findByIdAndUpdate(id, { isDeleted: true });
        req.flash("success_msg", "Your Account Successfully Deleted");
        req.session.save(() => {
            res.redirect('/');
        });

    } catch (error) {

        console.log(error.message);

    }
}

exports.adminlogout = async (req, res) => {

    try {

        res.clearCookie('access');
        res.redirect('/');

    } catch (error) {

        console.log(error.message);

    }
}