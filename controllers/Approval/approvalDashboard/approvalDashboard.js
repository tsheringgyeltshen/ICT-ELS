const Item = require("../../../models/item");
const Users = require("../../../models/userModel");
const Category = require("../../../models/Category");
const cloudinary = require('cloudinary').v2;
const loan = require("../../../models/loan");
const mongoose = require('mongoose');
const fs = require('fs');
const { request } = require("http");
const Cart = require("../../../models/cart");


exports.getapprovalHome = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Approval") {
            req.flash('error_msg', 'You are not authorized');

            return res.redirect('/');
        }
        const userId = req.user.userData._id;
        const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

        const currentUserData = req.user.userData;
        const approvalDepartment = currentUserData.department;

        let pendingapprovalLoanCount = 0;
        const userloanRequests = await loan
            .find({ status: "pending" })
            .populate({
                path: "user_id",
                select: "name department year usertype userid image",
                match: { department: approvalDepartment, usertype: "User" },
            })
            .populate({
                path: "items.item",
                select: "name available_items",
            })
            .select("items status return_date request_date")
            .exec();// Variable to store the count of pending loans

        const loanRequests = await loan
            .find({
                $or: [
                    {
                        status: "pending",
                        approval: userId
                    },
                ]
            })
            .populate("user_id", "name userid department year usertype image")
            .populate("items.item", "name available_items")
            .select("items status return_date request_date approval")
            .exec();
        const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
        pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

        console.log(req.user.userData._id);
        const cardsPerPage = 12;
        const currentPage = 1;

        const user = await Users.findById(userId);
        const items = await Item.find({ isDeleted: false }).sort({ added_date: -1 }).populate('category', 'name');

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.render('../views/approval/approvalhome', {
            cardsPerPage: cardsPerPage, currentPage: currentPage, cartItemCount: cart ? cart.items.length : 0, pendingLoansCount: pendingLoansCount,
            pendingapprovalLoanCount,

            user, items,
        });
        // res.send(req.user)
    } catch (error) {
        console.log(error.message);
    }
};

//@des user details 
exports.getUserProfileLoad = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Approval") {
            req.flash('error_msg', 'You are not authorized');

            return res.redirect('/');
        }

        const userId = req.user.userData._id;

        const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');

        const userData = await Users.findById(userId);

        const currentUserData = req.user.userData;
        const approvalDepartment = currentUserData.department;

        let pendingapprovalLoanCount = 0;
        const userloanRequests = await loan
            .find({ status: "pending" })
            .populate({
                path: "user_id",
                select: "name department year usertype userid image",
                match: { department: approvalDepartment, usertype: "User" },
            })
            .populate({
                path: "items.item",
                select: "name available_items",
            })
            .select("items status return_date request_date")
            .exec();// Variable to store the count of pending loans

        const loanRequests = await loan
            .find({
                $or: [
                    {
                        status: "pending",
                        approval: userId
                    },
                ]
            })
            .populate("user_id", "name userid department year usertype image")
            .populate("items.item", "name available_items")
            .select("items status return_date request_date approval")
            .exec();
        const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
        pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

        return res.render('approval/approvalprofile', {
            approval: userData, cartItemCount: cart ? cart.items.length : 0, pendingLoansCount: pendingLoansCount,
            pendingapprovalLoanCount
        });


    } catch (error) {
        console.log(error.message);

    }
}



exports.postEditProfile = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Approval") {
            req.flash('error_msg', 'You are not authorized');

            return res.redirect('/');
        }
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
                res.redirect(`/approval-profile?id=${req.body.id}`);
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
                res.redirect(`/approval-profile?id=${req.body.id}`);
            });
        }
    } catch (error) {
        req.flash("error_msg", "Error while updating");
        req.session.save(() => {
            res.redirect(`/approval-profile?id=${req.body.id}`);
        });
    }
};



exports.viewaboutus = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Approval") {
            req.flash('error_msg', 'You are not authorized');

            return res.redirect('/');
        }

        const userId = req.user.userData._id;
        const users = await Users.findById(userId);
        const currentUserData = req.user.userData;
        const approvalDepartment = currentUserData.department;

        let pendingapprovalLoanCount = 0;
        const userloanRequests = await loan
            .find({ status: "pending" })
            .populate({
                path: "user_id",
                select: "name department year usertype userid image",
                match: { department: approvalDepartment, usertype: "User" },
            })
            .populate({
                path: "items.item",
                select: "name available_items",
            })
            .select("items status return_date request_date")
            .exec();// Variable to store the count of pending loans

        const loanRequests = await loan
            .find({
                $or: [
                    {
                        status: "pending",
                        approval: userId
                    },
                ]
            })
            .populate("user_id", "name userid department year usertype image")
            .populate("items.item", "name available_items")
            .select("items status return_date request_date approval")
            .exec();
        const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
        pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

        const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


        res.render('approval/ABOUTUS', {
            users, cartItemCount: cart ? cart.items.length : 0, pendingLoansCount: pendingLoansCount,
            pendingapprovalLoanCount
        });


    } catch (error) {

        console.log(error.message);

    }
}


exports.viewAllitems = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Approval") {
            req.flash('error_msg', 'You are not authorized');

            return res.redirect('/');
        }
        const userId = req.user.userData._id;
        const currentUserData = req.user.userData;
        const approvalDepartment = currentUserData.department;

        let pendingapprovalLoanCount = 0;
        const userloanRequests = await loan
            .find({ status: "pending" })
            .populate({
                path: "user_id",
                select: "name department year usertype userid image",
                match: { department: approvalDepartment, usertype: "User" },
            })
            .populate({
                path: "items.item",
                select: "name available_items",
            })
            .select("items status return_date request_date")
            .exec();// Variable to store the count of pending loans

        const loanRequests = await loan
            .find({
                $or: [
                    {
                        status: "pending",
                        approval: userId
                    },
                ]
            })
            .populate("user_id", "name userid department year usertype image")
            .populate("items.item", "name available_items")
            .select("items status return_date request_date approval")
            .exec();
        const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
        pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans


        const userData = await Users.findById(userId);
        const categories = await Category.find();
        const cardsPerPage = 9;
        const currentPage = 1;
        const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');


        // Query the database for the user with the matching ID
        const searchQuery = req.query.search1;

        let items = await Item.find({ isDeleted: false }).populate('category', 'name');

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.category?.name?.toLowerCase().includes(query)
            );
        }

        return res.render('approval/approvalitem', {
            items, cardsPerPage: cardsPerPage, currentPage: currentPage, user: userData, searchQuery, categories, cartItemCount: cart ? cart.items.length : 0, pendingLoansCount: pendingLoansCount,
            pendingapprovalLoanCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.viewItemByid = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Approval") {
            req.flash('error_msg', 'You are not authorized');

            return res.redirect('/');
        }
        const userId = req.user.userData._id;

        const user = await Users.findById(userId);
        // Query the database for the user with the matching ID
        const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
        const currentUserData = req.user.userData;
        const approvalDepartment = currentUserData.department;

        let pendingapprovalLoanCount = 0;
        const userloanRequests = await loan
            .find({ status: "pending" })
            .populate({
                path: "user_id",
                select: "name department year usertype userid image",
                match: { department: approvalDepartment, usertype: "User" },
            })
            .populate({
                path: "items.item",
                select: "name available_items",
            })
            .select("items status return_date request_date")
            .exec();// Variable to store the count of pending loans

        const loanRequests = await loan
            .find({
                $or: [
                    {
                        status: "pending",
                        approval: userId
                    },
                ]
            })
            .populate("user_id", "name userid department year usertype image")
            .populate("items.item", "name available_items")
            .select("items status return_date request_date approval")
            .exec();
        const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
        pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans
        const itemId = req.params.id;
        const item = await Item.findById(itemId).populate('category', 'name');
        return res.render('approval/itemdetails', {
            item, user, cartItemCount: cart ? cart.items.length : 0, pendingLoansCount: pendingLoansCount,
            pendingapprovalLoanCount
        });

        //return res.send(item)
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }

};

exports.viewItemsByCategory = async (req, res) => {
    try {
        if (req.user.userData.usertype !== "Approval") {
            req.flash('error_msg', 'You are not authorized');

            return res.redirect('/');
        }
        const categoryId = req.params.categoryId;
        // Query the database for the user with the matching ID
        const userId = req.user.userData._id;
        const cardsPerPage = 9;
        const currentPage = 1;

        // Query the database for the user with the matching ID
        const user = await Users.findById(userId);
        const cart = await Cart.findOne({ user: userId }).populate('items.item').populate('items.category', 'name');
        const currentUserData = req.user.userData;
        const approvalDepartment = currentUserData.department;

        let pendingapprovalLoanCount = 0;
        const userloanRequests = await loan
            .find({ status: "pending" })
            .populate({
                path: "user_id",
                select: "name department year usertype userid image",
                match: { department: approvalDepartment, usertype: "User" },
            })
            .populate({
                path: "items.item",
                select: "name available_items",
            })
            .select("items status return_date request_date")
            .exec();// Variable to store the count of pending loans

        const loanRequests = await loan
            .find({
                $or: [
                    {
                        status: "pending",
                        approval: userId
                    },
                ]
            })
            .populate("user_id", "name userid department year usertype image")
            .populate("items.item", "name available_items")
            .select("items status return_date request_date approval")
            .exec();
        const pendingLoansCount = userloanRequests.filter((userloanRequests) => userloanRequests.user_id).length;
        pendingapprovalLoanCount = await loan.countDocuments({ status: "pending", approval: userId }); // Count of pending loans

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
        return res.render('approval/categoryitems', { category, items, categories, user, cardsPerPage: cardsPerPage, currentPage: currentPage, searchQuery, cartItemCount: cart ? cart.items.length : 0,pendingLoansCount: pendingLoansCount,
            pendingapprovalLoanCount});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};