const User = require("../models/userModel")
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/AppError')

const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el]
        }
    })
    return newObj
}


exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find()

    // const tours=await Tour.find().where("difficulty").equals("easy")

    res.json({
        status: 'success',
        // requestedAt: req.requestTime,
        results: users.length,
        data: {
            users
        }
    })
})

exports.updateMe = catchAsync(async (req, res, next) => {
    //create error if user post users password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('this route is not used for updating passwords', 400))
    }

    //Filter unwanted field names wihch are not allowed to update
    const filteredBody = filterObj(req.body, 'name', 'email')

    //update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true })

    res.status(200).json({
        status: "success",
        user:updatedUser
    })
})

exports.deleteMe=catchAsync(async(req,res,next)=>{
await User.findByIdAndUpdate(req.user.id,{active:false})
res.status(204).json({
    status:"success",
    data:null
})
})

exports.getUser = (req, res) => {
    res.json({
        status: "error",
        msg: "this route is not yet defined"
    })
}

exports.CreateUser = (req, res) => {
    res.json({
        status: "error",
        msg: "this route is not yet defined"
    })
}

exports.updateUser = (req, res) => {
    res.json({
        status: "error",
        msg: "this route is not yet defined"
    })
}

exports.deleteUser = (req, res) => {
    res.json({
        status: "error",
        msg: "this route is not yet defined"
    })
}
