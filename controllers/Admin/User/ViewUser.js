const Users = require("../../../models/userModel");
const fs = require('fs');
const cloudinary = require('cloudinary').v2;



const dotenv = require('dotenv')
dotenv.config()

exports.getViewStudentPage = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }

        const userId = req.user.userData._id;

        const adminData = await Users.findById(userId);

        const { search, year, usertype, department } = req.query;
        let query = { studentorstaff: { $in: ["student", "staff"] }, isDeleted: false };
        if (search) {
            query.userid = search;
        }
        if (year) {
            query.year = year;
        }
        if (usertype) {
            query.usertype = usertype;
        }
        if (department) {
            query.department = department;
        }

        const usersData = await Users.find(query);
        res.render("admin/viewstudent", { users: usersData, admin: adminData, search, year, usertype, department });

    } catch (error) {
        console.log(error.message);

    }
}
//view staff page
exports.getViewStaffPage = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const { search, usertype, department } = req.query;
        let query = {
            studentorstaff: "staff"
            // ,usertype:{ $in: ["user", "approval"] }
        };
        if (search) {
            query.userid = search;
        }
        if (usertype) {
            query.usertype = usertype;
        }
        if (department) {
            query.department = department;

        }
        const usersData = await Users.find(query);
        res.render("admin/viewstaff", { users: usersData, admin: adminData, search, usertype, department });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("server error");
    }
};

//admin psrticular user load
exports.getviewoneStudentPage = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const id = req.query.id;
        const userData = await Users.findById({ _id: id });


        res.render('admin/viewuser', { users: userData, admin: adminData });



    } catch (error) {
        console.log(error.message);

    }
}

//admin psrticular staff load
exports.getviewoneStaffPage = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const id = req.query.id;
        const userData = await Users.findById({ _id: id });

        res.render('admin/viewonestaff', { users: userData, admin: adminData });



    } catch (error) {
        console.log(error.message);

    }
}

//admin edit user load
exports.geteditUserPage = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }

        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const id = req.query.id;
        const userData = await Users.findById({ _id: id });

        res.render('admin/edituser', { users: userData, admin: adminData });



    } catch (error) {
        console.log(error.message);

    }
}


exports.posteditUserPage = async (req, res) => {
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
            return res.redirect(`/view-user?id=${req.body.id}`);
        }

        if (req.file) {
            const userData = await Users.findById(req.body.id);

            // Upload the new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);

            // Delete the original image from Cloudinary
            const publicId = userData.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);

            await Users.findByIdAndUpdate(
                { _id: req.body.id },
                {
                    $set: {
                        name: req.body.name,
                        userid: req.body.userid,
                        email: req.body.email,
                        mobilenumber: req.body.mno,
                        year: req.body.year,
                        department: req.body.department,
                        image: result.secure_url, // Update the Cloudinary URL in the MongoDB document
                    },
                }
            );

            req.flash('success_msg', "User Updated");
            req.session.save(() => {
                res.redirect(`/view-user?id=${req.body.id}`);
            });
        } else {
            await Users.findByIdAndUpdate(
                { _id: req.body.id },
                {
                    $set: {
                        name: req.body.name,
                        userid: req.body.userid,
                        email: req.body.email,
                        mobilenumber: req.body.mno,
                        year: req.body.year,
                        department: req.body.department
                    },
                }
            );
            req.flash('success_msg', 'User Successfully Updated');
            req.session.save(() => {
                res.redirect(`/view-user?id=${req.body.id}`);
            });
        }
    } catch (error) {
        req.flash('error_msg', 'Error while updating');
        req.session.save(() => {
            res.redirect(`/view-user?id=${req.body.id}`);
        });
    }
};


// admin edit staff load
exports.geteditstaffPage = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }

        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);


        const id = req.query.id;
        const userData = await Users.findById({ _id: id });

        res.render('admin/editstaff', { users: userData, admin: adminData });



    } catch (error) {
        console.log(error.message);

    }
}



exports.posteditstaffPage = async (req, res) => {
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
            return res.redirect(`/view-onestaff?id=${req.body.id}`);
        }
        if (req.file) {
            const userData = await Users.findById(req.body.id);

            // Upload the new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);

            // Delete the original image from Cloudinary
            const publicId = userData.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);

            await Users.findByIdAndUpdate(
                { _id: req.body.id },
                {
                    $set: {
                        name: req.body.name,
                        userid: req.body.userid,
                        email: req.body.email,
                        mobilenumber: req.body.mno,
                        year: req.body.year,
                        usertype: req.body.usertype,
                        department: req.body.department,
                        image: result.secure_url, // Update the Cloudinary URL in the MongoDB document
                    },
                }
            );

            req.flash('success_msg', 'User Updated');
            req.session.save(() => {
                res.redirect(`/view-onestaff?id=${req.body.id}`);
            });
        } else {
            await Users.findByIdAndUpdate(
                { _id: req.body.id },
                {
                    $set: {
                        name: req.body.name,
                        userid: req.body.userid,
                        email: req.body.email,
                        mobilenumber: req.body.mno,
                        year: req.body.year,
                        usertype: req.body.usertype,
                        department: req.body.department,
                    },
                }
            );
            req.flash('success_msg', 'User Successfully Updated');
            req.session.save(() => {
                res.redirect(`/view-onestaff?id=${req.body.id}`);
            });
        }
    } catch (error) {
        req.flash('error_msg', 'Error while updating');
        req.session.save(() => {
            res.redirect(`/view-onestaff?id=${req.body.id}`);
        });
    }
};





exports.confirmDeleteStaffUser = async (req, res) => {

    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const id = req.body.id;
        await Users.findByIdAndUpdate(id, { isDeleted: true });
        req.flash("success_msg", "User Successfully Deleted");
        req.session.save(() => {
            res.redirect('/viewstudent');
        });

    } catch (error) {
        req.flash("error_msg", "Error While Deleting User");
        req.session.save(() => {
            res.redirect('/viewstudent');
        });

    }
}

exports.confirmDeleteStudentUser = async (req, res) => {

    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const id = req.body.id;
        await Users.findByIdAndUpdate(id, { isDeleted: true });
        req.flash("success_msg", "User Successfully Deleted");
        req.session.save(() => {
            res.redirect('/viewstudent');
        });

    } catch (error) {

        req.flash("error_msg", "Error While Deleting User");
        req.session.save(() => {
            res.redirect('/viewstudent');
        });

    }
}