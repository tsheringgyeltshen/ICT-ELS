const Category = require('../../.././models/Category');
const Users = require("../../../models/userModel");



exports.viewCategories = async (req, res) => {
    try {
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);


        // const data = await Category.find();
        // Use isLogin middleware to check if user is authenticated
        //    (req, res, async () => {
        const searchQuery = req.query.q || ''; // get search query parameter or default to empty string
        const categories = await Category.find({ name: { $regex: searchQuery, $options: 'i' } }); // filter categories based on search query
        // res.render('admin/category', { categories, searchQuery });
        // return res.status(200).json({ "categories": categories, "searchQuery": searchQuery })
        // });


        res.render('./admin/category', { admin: adminData, searchQuery: searchQuery, categories: categories, admin: adminData });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
//@des add category

// exports. postaddCategory = async (req, res) => {
//     try {

//             const { name } = req.body;
//             const newCategory = await Category({ name });
//             await newCategory.save();
//             return res.redirect('/categories');



//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };



exports.postaddCategory = async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        const categories = await Category.find({ name: { $regex: searchQuery, $options: 'i' } });

        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const { name } = req.body;
        const lowerCaseName = name.toLowerCase();

        // Check if a category with the same name already exists
        const existingCategory = await Category.findOne({ name: lowerCaseName });
        if (existingCategory) {
            const message = 'Category already exists';
            return res.render('admin/category', { message, admin: adminData, categories: categories });
        }

        const newCategory = await Category({ name: lowerCaseName });
        await newCategory.save();
        const message1 = 'Category created successfully';
        return res.render('admin/category', { message1, admin: adminData, categories: categories });

        // return res.redirect('/categories');

    } catch (error) {
        console.error(error);
        const message = 'Server Error';
        return res.render('admin/category', { message, admin: adminData, categories: categories });
    }

};






exports.getEditCategories = async (req, res) => {
    try {
        // Use isLogin middleware to check if user is authenticated
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);

        const category = await Category.findById(req.params.category_id);
        res.render('admin/edit-category', { category, admin: adminData });


    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
exports.postUpdateCategory = async (req, res) => {
    try {
        // Use isLogin middleware to check if user is authenticated
        // if (req.user.usertype === 'admin') {

        const { name } = req.body;
        const data = await Category.findByIdAndUpdate(req.params.category_id, { name });
        req.flash("success_msg", "Category '"+name+ "' has been updated");
        req.session.save(() => {
            res.redirect('/categories');

        });
        


    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getDeleteCategoryLoad = async (req, res) => {
    try {

        
        const category = await Category.findById(req.params.category_id);
        return res.render('admin/category', { category });
        


    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


exports.postDeleteCategory = async (req, res) => {
    try {
        
        const data = await Category.findByIdAndDelete(req.params.category_id);
        return res.redirect('/categories')
        


    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}