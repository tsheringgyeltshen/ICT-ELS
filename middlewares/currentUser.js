const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const  currentUser = (req, res, next) => {
    const token = req.cookies.access;
    jwt.verify(token, process.env.SECRET, (err, loginUser) => {
        if (!token) {
            return res.render('user/login',{message3:"You are not authorized!"});
        }
        req.user = loginUser

        next();

        


    })
}
module.exports = currentUser

