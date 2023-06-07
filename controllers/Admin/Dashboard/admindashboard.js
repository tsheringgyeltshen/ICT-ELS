const Users = require("../../../models/userModel");
const Loan = require("../../../models/loan");
const Item = require("../../../models/item");
const Chart = require('chart.js');



exports.getAdminHome = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const pendingLoanCount = await Loan.countDocuments({ status: 'pending' });
    const approvedLoanCount = await Loan.countDocuments({ status: 'approved' });
    const onLoanCount = await Loan.countDocuments({ status: 'onloan' });
    const pendingcount = await Loan.countDocuments({ status: 'pending' });
    const overduecount = await Loan.countDocuments({ status: 'overdue' });

    const itemonloancount = await Item.countDocuments({ available_items: '0', isDeleted: false });
    const availableitem = await Item.countDocuments({ available_items: '1', isDeleted: false });

    const itemcount = await Item.countDocuments({ isDeleted: false });

    const userId = req.user.userData._id;

    const itemData = await Item.find({ isDeleted: false });

    const itemCounts = itemData.reduce((counts, item) => {
      counts[item.name] = (counts[item.name] || 0) + 1;
      return counts;
    }, {});

    const itemCountsArray = Object.entries(itemCounts).map(([name, count]) => ({ name, count }));
    itemCountsArray.sort((a, b) => b.count - a.count);
    const topItems = itemCountsArray.slice(0, 10);

    const adminData = await Users.findById(userId);
    const now = new Date();

    const collectionCount = await Loan.countDocuments({
      status: "approved",
      admin_collection_date: now.toISOString().substr(0, 10),
    });

    const userCount = await Users.countDocuments({
      studentorstaff: { $in: ["student", "staff"] }
    });

    const image1 = adminData.image.split('\\')[1];

    res.render('../views/admin/adminhome', {
      itemcount,
      approvedLoanCount,
      pendingLoanCount,
      admin: adminData,
      userCount,
      image1,
      collectionCount,
      onLoanCount,
      pendingcount,
      overduecount,
      availableitem,
      itemonloancount,
      itemNamesJSON: JSON.stringify(Object.keys(itemCounts)),
      itemCountsJSON: JSON.stringify(Object.values(itemCounts)),
      topItems
    });
  } catch (error) {
    console.log(error.message);
  }
}

//@des user details 
exports.getUserProfileLoad = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const userData = await Users.findById(req.user._id);
    //res.render('userprofile', {user: userData });
    res.send(userData);

    //     res.render("userprofile", {
    //       currentuserData:userData
    //   })
  } catch (error) {
    console.log(error.message);

  }
}

exports.getEditUserProfile = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }


    const userData = await Users.findById({ _id: req.user._id });
    if (userData) {
      return res.send(userData)
      // res.render('edituserprofile', { user: userData });
    }
    //else {
    return


  }


  catch (error) {

    console.log(error);

  }
}

exports.postEditUserProfile = async (req, res) => {
  try {
    if (req.user.userData.usertype !== "Admin") {
      req.flash('error_msg', 'You are not authorized');
      return res.redirect('/');
    }
    const { user_id } = req.params;
    const { mobilenumber } = req.body;
    const image = req.file
    const imageUrl = image.path

    const userData = await Users.findByIdAndUpdate({ _id: user_id }, { mobilenumber, image: imageUrl }, { new: true });
    return res.send(userData)

    //  return res.redirect('/userprofile')

  } catch (error) {

    console.log(error.message);

  }
}