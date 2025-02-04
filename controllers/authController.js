const { promisify } = require("util")
const email = require('../utils/email')
const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const crypto = require('crypto')
const catchAsync = require('../utils/catchAsync')
const AppError = require('./../utils/AppError')
const sendEmail = require("../utils/email")

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}



const createSendToken = (user, statuscode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true
    res.cookie('jwt', token, cookieOptions)

    user.password = undefined

    res.status(statuscode).json({
        status: "sucess",
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    //creating new user by input details
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    })

    //returns token which is generated by id of newuser
    createSendToken(newUser, 201, res)

})

exports.login = catchAsync(async (req, res, next) => {

    //getting email and password from users request
    const { email, password } = req.body

    //1st- if email and password exists
    if (!email || !password) {
        return next(new AppError('please provide email and pass', 400))
    }
    //2- if user exists and pass is correct
    const user = await User.findOne({ email }).select('+password') //+ is used as suffix for non selected fields

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("password is false or email is incorrect", 401))
    }


    //3- send token to user
    createSendToken(user, 200, res)

})

exports.protect = catchAsync(async (req, res, next) => {
    //1-get the token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    // console.log(token)

    if (!token) {
        next(new AppError('you are not logged in please login to get access', 401))
    }

    //2-validate the token (verifcation)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

    //3-check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('the token does no longer exists danish', 401))
    }

    //4-check if user change password after jwt token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('recently password has been changed please login again', 401))
    }

    //grant access to protected routes
    req.user = currentUser
    console.log(currentUser)
    next()
})

exports.restrictTo = (...role) => {
    return (req, res, next) => {
        if (!role.includes(req.user.role)) {
            return (new AppError('dont have permission', 403))
        }
        next()
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {

    //1 get user based on post address
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('no user with that email', 404))
    }


    //2 then generate random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false })

    //3 send back to user
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

    const message = `forgot password send a patch request to update it on ${resetURL} if didnt forgot then ignore this email `

    try {
        await sendEmail({
            email: user.email,
            subject: 'your pass reset token sent valid for 10 minutes',
            message
        })
        res.status(200).json({
            status: "success",
            message: "token sent to email"
        })
    }
    catch (e) {
        user.passwordResetToken = undefined,
            user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })

        return next(new AppError('error for sending email try again later', 500))
    }

})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1 get user based on token
    const hashedToken = crypto.createHash('sha-256').update(req.params.token).digest('hex')

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })

    //2 if token has not expired and there is user then set a new password

    if (!user) {
        return next(new AppError("token  is invalid or it is expired", 400))
    }
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined,
        user.passwordResetExpires = undefined
    await user.save()

    //3 update passwordChangedAt property  for the user

    //4 log the user in send jwt token
    createSendToken(user, 200, res)


})

exports.updatePassword = catchAsync(async (req, res, next) => {
    //get user from collection
    const user = await User.findById(req.user.id).select('+password')

    //if pass is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('your current password is wrong ', 401))
    }

    //update the password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    //log user in send jwt
    createSendToken(user, 200, res)

})