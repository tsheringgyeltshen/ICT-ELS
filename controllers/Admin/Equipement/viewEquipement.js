const Item = require("../../../models/item");
const Users = require("../../../models/userModel");
const Loan = require("../../../models/loan");



exports.viewItemByid = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;


        const adminData = await Users.findById(userId);

        const itemId = req.params.id;
        const item = await Item.findById(itemId).populate('category');
        return res.render('admin/itemdetails', { item, admin: adminData });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }

};


exports.getLoanRequestsForItem = async (req, res) => {
    if (req.user.userData.usertype !== "Admin") {
        req.flash('error_msg', 'You are not authorized');
        return res.redirect('/');
    }
    const itemID = req.params.id;
    const userId = req.user.userData._id;

    // Query the database for the user with the matching ID
    const admin = await Users.findById(userId);
    const item = await Item.findById(itemID);
    const loans = await Loan.find({ "items.item": itemID }).populate("user_id");

    const loanObjects = loans.map((loan) => {
        const { name, userid, department, image } = loan.user_id;
        const {
            return_date,
            status,
            admin_collection_date,
            request_date,
        } = loan;
        return {
            name: name,
            image: image,
            userid: userid,
            department: department,
            requestDate: request_date, // Add request_date
            returnDate: return_date,
            status,
            collectionDate: admin_collection_date || "To be determined",
        };
    });

    res.render("admin/item_loan_requests", {
        loanRequests: loanObjects,
        item,
        admin
    });
};

exports.viewAllitems = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Admin") {
            req.flash('error_msg', 'You are not authorized');
            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        // Query the database for the user with the matching ID
        const adminData = await Users.findById(userId);
        const searchQuery = req.query.search;

        const items = await Item.find({ isDeleted: false }).populate('category', 'name');

        if (searchQuery) {
            items = items.filter(item => item.name.includes(searchQuery) || item.category?.name?.includes(searchQuery));
        }

        return res.render('admin/item', { items, admin: adminData, searchQuery });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};