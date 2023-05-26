//@des import
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const multer = require("multer");
const flash = require('connect-flash');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken')



const session = require("express-session");
const cookieParser = require('cookie-parser');
const csv = require('csv-parser');


// const adminRoute = require('./routes/adminRoute');
// const { isLogin } = require("./middleware/auth");
//


const dotenv = require('dotenv');
const auth_router = require("./routes/auth/auth_router");
const { Logger } = require("./middlewares/logger");
const user_router = require("./routes/User/userRouter");
const admin_router = require("./routes/Admin/admin");
const approval_router = require("./routes/Approval/Approval");

cloudinary.config({
    cloud_name: 'dzfz6ljuy',
    api_key: '896239687242672',
    api_secret: 'mwbjhupVIyvn3flQgz_WbFcSGW4'
  });



dotenv.config();
const app = express();

var ejs = require('ejs');
// app.use(express.static("images"))
// app.use(express.static("excel"));

app.set("view engine", "ejs");

//@des middlewares
// const storageEngine = multer.diskStorage({
//     destination: "./images",
//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}--${file.originalname}`);
//     },
// });

// const fileFilter = (req, file, cb) => {
//     if (
//         file.mimetype === 'image/png' ||
//         file.mimetype === 'image/jpg' ||
//         file.mimetype === 'image/jpeg'
//     ) {
//         cb(null, true);
//     } else {
//         cb(null, false);
//     }
// };

// Multer middleware to handle file upload
// const storage1 = multer.diskStorage({
//     destination: "./excel",

//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`);
//     }
// });
const storageEngine = multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}--${file.originalname}`);
    }
  });
  
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
  




//@des render static files 
app.use(express.static(path.join(__dirname, "static")));
mongoose.connect(process.env.URI);



//for user routes
// const userRoute = require('./routes/userRoute');
// const user_route = require("./routes/userRoute");
//@des multer middlewares

app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true
}));

app.use(Logger)
app.use(express.json());
app.use(cookieParser());
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash(('success_msg'));
    res.locals.error_msg = req.flash(('error_msg'));
    res.locals.error = req.flash(('error')); // Login error
    res.locals.currentUser = req.user; // To see only the authenticated user can access some features.
    next();
})

//@des
app.use(express.urlencoded({ extended: true }))
app.use(multer({ storage: storageEngine, fileFilter: fileFilter }).single('image'))
// app.use(multer({ storage: storage1 }).single('csvFileInput'))

// app.use(session({
//     secret: process.env.SECRET, resave: false, // set to false to avoid deprecated warning
//     saveUninitialized: false // set to false to avoid deprecated warning
// }));
//@des set payload in cookies

//@des login and register
app.use('/', auth_router);
//@des user router
app.use(user_router);

//for admin routes
app.use(admin_router)
//fro approval middleware
app.use(approval_router)

//app.use(isLogin);
//@des middleware for login and registartion routes

//@des middlewares for user routes

//app.use('/admin', adminRoute);
const PORT = process.env.PORT || 5000

// app.listen(PORT, function () {
//     console.log(`server running on ${process.env.NODE_ENV} mode ${PORT} `);
// });

mongoose.set('strictQuery', false);
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    })
});