const Users = require("../../../models/userModel");
const fs = require('fs');

exports.getAdminProfilePage = async (req, res) => {
    try {

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

        // Retrieve the user ID from the JWT token
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);
        return res.render('admin/editadminprofile', { admin: adminData });

    } catch (error) {

        console.log(error.message);
    }
}

// exports.postAdminEditProfile = async (req, res) => {
//     try {

//         const userData = await Users.findByIdAndUpdate({ _id: req.body.id },
//             {
//                 $set: {
//                     name: req.body.name,
//                     userid: req.body.userid,
//                     email: req.body.email,
//                     mobilenumber: req.body.mno,
//                     department: req.body.department1,
//                     // usertype:req.body.usertype,

//                 }
//             });

//         res.redirect(`/adminprofile?id=${req.body.id}`);

//     } catch (error) {

//         console.log(error.message);
//     }
// }

exports.postAdminEditProfile = async (req, res) => {
    try {

        if (req.file) {

            const userData = await Users.findByIdAndUpdate({ _id: req.body.id },

                {
                    $set: {
                        name: req.body.name,
                        userid: req.body.userid,
                        email: req.body.email,
                        mobilenumber: req.body.mno,
                        department: req.body.department1,
                        image: req.file.filename
                    }
                });

            const path = 'images/' + userData.image;
            fs.unlink(path, (error) => {
                if (error) {
                    req.flash("error_msg", "Error Updating Profile");
                } else {
                    req.flash("success_msg", "Your profile has been updated");
                }

                req.session.save(() => {
                    res.redirect(`/adminprofile?id=${req.body.id}`);
                });
            })


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