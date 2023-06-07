const { request } = require("http");
const Category = require("../../../models/Category");
const Item = require("../../../models/item");
const Users = require("../../../models/userModel");
const cloudinary = require('cloudinary').v2;

const fs = require('fs');


exports.getAddCategoryItem = async (req, res) => {
    if (req.user.userData.usertype !== "Admin") {
        req.flash('error_msg', 'You are not authorized');
        return res.redirect('/');
    }

    const userId = req.user.userData._id;


    const adminData = await Users.findById(userId);


    // Fetch categories
    // if (req.user.usertype === 'admin') {
    const categories = await Category.find();
    return res.render('admin/add-item', { categories: categories, admin: adminData });
    // }
    // return res.send('not authorized');
    // Pass categories to view

}


exports.postaddItem = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;
        const categories = await Category.find();
        const adminData = await Users.findById(userId);

        const itemTag = req.body.itemtag;

        // Check if the item tag already exists in the database
        const existingItem = await Item.findOne({ itemtag: itemTag });

        if (existingItem) {
            return res.render('admin/add-item', {
                message2: 'Item tag already exists',
                admin: adminData,
                categories: categories,
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path);

        const name = req.body.name;
        const category = req.body.category;
        const description = req.body.description;

        const newItem = await Item({
            name,
            category,
            description,
            image: result.secure_url,
            itemtag: itemTag,
        });

        await newItem.save();

        return res.render('admin/add-item', {
            message1: 'Equipment Successfully Added',
            admin: adminData,
            categories: categories,
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


exports.postUpdateItem = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const categories = await Category.find();

        const itemTag = req.body.itemtag;

        // Check if the item tag already exists in the database
        // const existingItem = await Item.findOne({ itemtag: itemTag });

        // if (existingItem) {
        //     req.flash('error_msg', "Item tag already exists");
        //     return res.redirect(`/view-items/${req.params.id}`);
        // }
        if (req.file) {
            const itemData = await Item.findById(req.params.id);

            // Upload the new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);

            // Delete the original image from Cloudinary
            const publicId = itemData.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);

            await Item.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        name: req.body.name,
                        category: req.body.category,
                        description: req.body.description,
                        itemtag: req.body.itemtag,
                        // available_items: req.body.available_items,
                        image: result.secure_url, // Update the Cloudinary URL in the MongoDB document
                    },
                }
            );

            req.flash('success_msg', "Equipment '" + req.body.name + "' Updated");
            res.redirect(`/view-items/${req.params.id}`);
        } else {
            await Item.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        name: req.body.name,
                        category: req.body.category,
                        description: req.body.description,
                        // available_items: req.body.available_items
                        itemtag: req.body.itemtag,
                    },
                }
            );
            req.flash('success_msg', "Equipment '" + req.body.name + "' Updated");
            res.redirect(`/view-items/${req.params.id}`);
        }
    } catch (error) {
        console.log(error.message);
        req.flash('error_msg', 'Update failed');
        res.redirect(`/view-items/${req.params.id}`);
    }
};

exports.getEditCategoryItem = async (req, res) => {
    if (req.user.userData.usertype !== "Admin") {
        req.flash('error_msg', 'You are not authorized');
        return res.redirect('/');
    }
    const userId = req.user.userData._id;

    // Query the database for the user with the matching ID
    const adminData = await Users.findById(userId);
    // Fetch item id and categories from database
    // if (req.user.usertype === 'admin') {
    const item = await Item.findById(req.params.id).populate('category', 'name');
    const categories = await Category.find();
    // }
    // return res.send('not authorized');
    return res.render('admin/edit-item', { categories: categories, item: item, admin: adminData }); // Pass categories to view
}
exports.getEditItemLoad = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);
        // Use isLogin middleware to check if user is authenticated
        // if (req.user.usertype === 'admin') {
        const item = await Item.findById(req.params.id).populate('category', 'name');
        return res.render('admin/edit-item', { item, admin: adminData });

        // }
        // return res.send('not authorized');


    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// edit item
// exports.postUpdateItem = async (req, res) => {
//     try {
//         if (req.file) {

//             const name = req.body.name;
//             const category = req.body.category;
//             const description = req.body.description;
//             const available_items = req.body.available_items;
//             const image = req.file.filename;

//             const data = await Item.findByIdAndUpdate(req.params.id, { name, category, description, available_items, image });

//             const path = 'images/' + data.image;
//             fs.unlink(path, (error) => {
//                 if (error) {
//                     req.flash("error_msg", "Failed to update equipment '" + name + "'");
//                 } else {
//                     req.flash("success_msg", "Equipment ' " + name + "' Successfully Updated");
//                 }
//                 res.redirect(`/view-items/${req.params.id}`);
//             });
//         } else {
//             const name = req.body.name;
//             const category = req.body.category;
//             const description = req.body.description;
//             const available_items = req.body.available_items;
//             await Item.findByIdAndUpdate(req.params.id, { name, category, description, available_items });
//             req.flash("success_msg", "Equipment ' " + name + "' Successfully Updated");
//             res.redirect(`/view-items/${req.params.id}`);
//         }
//     } catch (error) {
//         console.log(error.message);
//         req.flash("error_msg", "Update failed");
//         res.redirect(`/view-items/${req.params.id}`);
//     }
// };




exports.deleteItemLoad = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }

        const item = await Item.findById(req.params.id).populate('category', 'name');
        return res.render('admin/itemdetails', { item });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deleteItem = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        await Item.findByIdAndUpdate(req.params.id, { isDeleted: true });
        req.flash("success_msg", "Equipment Successfully Deleted");
        req.session.save(() => {
            res.redirect('/all-item');

        });
    } catch (error) {
        req.flash("error_msg", "Failed to Delete Equipment");
        req.session.save(() => {
            res.redirect('/all-item');
        });
    }
};
