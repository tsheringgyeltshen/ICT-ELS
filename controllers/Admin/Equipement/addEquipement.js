const { request } = require("http");
const Category = require("../../../models/Category");
const Item = require("../../../models/item");
const Users = require("../../../models/userModel");
const fs = require('fs');


exports.getAddCategoryItem = async (req, res) => {

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
        const userId = req.user.userData._id;
        const categories = await Category.find();


        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);
        // Use isLogin middleware to check if user is authenticated
        // if (req.user.usertype === 'admin') { 

        const name = req.body.name;
        const category = req.body.category;
        const description = req.body.description;
        const available_items = req.body.available_items;
        const image = req.file.filename;
        const newItem = await Item({ name, category, description, image, available_items });
        await newItem.save();
        //     return res.send(newItem);
        return res.render('admin/add-item', { message1: "Equipment Successfully Added", admin: adminData, categories: categories });
        // }
        // return res.send('not authorized')


    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
exports.getEditCategoryItem = async (req, res) => {
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


exports.postUpdateItem = async (req, res) => {
    try {
        if (req.file) {
            const name = req.body.name;
            const category = req.body.category;
            const description = req.body.description;
            const available_items = req.body.available_items;
            const image = req.file.filename;

            const data = await Item.findByIdAndUpdate(req.params.id, { name, category, description, available_items, image });

            const path = 'images/' + data.image;
            fs.unlink(path, (error) => {
                if (error) {
                    req.flash("error_msg", "Failed to update equipment '" + name + "'");
                } else {
                    req.flash("success_msg", "Equipment ' " + name + "' Successfully Updated");
                }
                res.redirect(`/view-items/${req.params.id}`);
            });
        } else {
            const name = req.body.name;
            const category = req.body.category;
            const description = req.body.description;
            const available_items = req.body.available_items;
            await Item.findByIdAndUpdate(req.params.id, { name, category, description, available_items });
            req.flash("success_msg", "Equipment ' " + name + "' Successfully Updated");
            res.redirect(`/view-items/${req.params.id}`);
        }
    } catch (error) {
        console.log(error.message);
        req.flash("error_msg", "Update failed");
        res.redirect(`/view-items/${req.params.id}`);
    }
};


exports.deleteItemLoad = async (req, res) => {
    try {

        const item = await Item.findById(req.params.id).populate('category', 'name');
        return res.render('admin/itemdetails', { item });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.deleteItem = async (req, res) => {
    try {
        await Item.findByIdAndUpdate(req.params.id, { isDeleted: true });
        req.flash("success_msg", "Equipment Successfully Deleted");
        req.session.save(() => {
            res.redirect('/all-item');
            
        });
    } catch (error) {
        req.flash("error_msg","Failed to Delete Equipment");
        req.session.save(() => {
            res.redirect('/all-item');
        });
    }
};
