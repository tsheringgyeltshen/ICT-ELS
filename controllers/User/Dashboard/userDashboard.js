const Users = require("../../../models/userModel");
const Item = require("../../../models/item");
const Category = require("../../../models/Category");
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');



exports.getUserHome = async (req, res) => {
    try {
        const userId = req.user.userData._id;
        const cardsPerPage = 12;
        const currentPage = 1;

        const userData = await Users.findById(userId);
        const items = await Item.find({ isDeleted: false }).populate('category', 'name');

        res.render('../views/user/userhome', { items, cardsPerPage:cardsPerPage,currentPage:currentPage,user: userData });
        // res.send(req.user)

    } catch (error) {

        console.log(error.message);

    }
}
//@des user details 
exports.getUserProfileLoad = async (req, res) => {
    try {
        const userId = req.user.userData._id;

        const userData = await Users.findById(userId);
        return res.render('user/userprofile', { user: userData });


    } catch (error) {
        console.log(error.message);

    }
}

// exports.postEditProfile = async (req, res) => {
//     try {
//         if (req.file) {
//             const userData = await Users.findByIdAndUpdate(
//                 { _id: req.body.id },
//                 {
//                     $set: {
//                         mobilenumber: req.body.mno,
//                         image: req.file.filename
//                     }
//                 }
//             );

//             const path = 'images/' + userData.image;
//             fs.unlink(path, (error) => {
//                 if (error) {
//                     req.flash("error_msg", "Error Updating Profile");
//                 } else {
//                     req.flash("success_msg", "Your profile has been updated");
//                 }

//                 req.session.save(() => {
//                     res.redirect(`/user-profile?id=${req.body.id}`);
//                 });
//             });
//         } else {
//             await Users.findByIdAndUpdate(
//                 { _id: req.body.id },
//                 {
//                     $set: {
//                         mobilenumber: req.body.mno
//                     }
//                 }
//             );

//             req.flash("success_msg", "Your profile has been updated");
//             req.session.save(() => {
//                 res.redirect(`/user-profile?id=${req.body.id}`);
//             });
//         }
//     } catch (error) {
//         req.flash("error_msg", "Error while updating");
//         req.session.save(() => {
//             res.redirect(`/user-profile?id=${req.body.id}`);
//         });
//     }
// };

exports.postEditProfile = async (req, res) => {
    try {
        const userId = req.user.userData._id;

        if (req.file) {
            const userData = await Users.findById(userId);

            // Upload the new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);

            // Delete the original image from Cloudinary
            const publicId = userData.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);

            await Users.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        mobilenumber: req.body.mno,
                        image: result.secure_url // Update the Cloudinary URL in the MongoDB document
                    }
                }
            );

            req.flash("success_msg", "Your profile has been updated");
            req.session.save(() => {
                res.redirect(`/user-profile?id=${req.body.id}`);
            });
        } else {
            await Users.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        mobilenumber: req.body.mno
                    }
                }
            );

            req.flash("success_msg", "Your profile has been updated");
            req.session.save(() => {
                res.redirect(`/user-profile?id=${req.body.id}`);
            });
        }
    } catch (error) {
        req.flash("error_msg", "Error while updating");
        req.session.save(() => {
            res.redirect(`/user-profile?id=${req.body.id}`);
        });
    }
};

exports.viewAboutuspage = async (req, res) => {
    try {

        const userId = req.user.userData._id;
        const users = await Users.findById(userId);

        res.render('user/aboutus', { users });


    } catch (error) {

        console.log(error.message);

    }
}

exports.viewAllitems = async (req, res) => {
    try {
        const userId = req.user.userData._id;
        const userData = await Users.findById(userId);
        const categories = await Category.find();
        const cardsPerPage = 9;
        const currentPage = 1;

        // Query the database for the user with the matching ID
        const searchQuery = req.query.search;

        let items = await Item.find({ isDeleted: false }).populate('category', 'name');

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.category?.name?.toLowerCase().includes(query)
            );
        }

        return res.render('user/useritem', { items, user: userData, searchQuery, cardsPerPage:cardsPerPage,currentPage:currentPage,categories });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
exports.viewItemByid = async (req, res) => {
    try {
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const userData = await Users.findById(userId);

        const itemId = req.params.id;

        const item = await Item.findById(itemId).populate('category', 'name');
        return res.render('../views/user/itemdetails', { item, user: userData });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }

};

exports.viewItemsByCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        // Query the database for the user with the matching ID
        const userId = req.user.userData._id;
        const cardsPerPage = 9;
        const currentPage = 1;

        // Query the database for the user with the matching ID
        const user = await Users.findById(userId);

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).send('Invalid category ID');
        }
        const category = await Category.findById(categoryId);
        let items = await Item.find({ category: categoryId, isDeleted: false }).populate('category', 'name');
        const categories = await Category.find(); // add this line to find all categories
        
        const searchQuery = req.query.search;
    
        if (searchQuery) {
          items = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        return res.render('user/categoryitems', { category, items, categories, user, cardsPerPage:cardsPerPage,currentPage:currentPage,searchQuery });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};