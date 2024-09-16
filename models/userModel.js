const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const crypto = require('crypto')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please entern name']
    },
    email: {
        type: String,
        required: [true, 'please enter the email'],
        unique: true,
        lowerCase: true,
        validate: [validator.isEmail, 'please enter a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'please provide a password'],
        minlength: [8, 'please enter at lease 8 letters password'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {

            //this only works on create and save
            validator: function (el) {
                return el === this.password
            },
            message: "passwords are not the same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }

})

userSchema.pre('save', async function (next) {
    //only run this function if password is actually modified
    if (!this.isModified('password')) {
        return
        next()
    }

    //hash the password with salt round 12
    this.password = await bcrypt.hash(this.password, 12)
    //delete the confirm password
    this.passwordConfirm = undefined
    next()
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next()
    }
    this.passwordChangedAt = Date.now() - 1000
    next()
})

//query middleware
userSchema.pre(/^find/, function (next) {
    //this points to the current query
    this.find({ active: { $ne: false } })
    next()
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        console.log(changedTimeStamp, JWTTimeStamp)
        return JWTTimeStamp < changedTimeStamp
    }
    return false  //means user has never changed the password

}

userSchema.methods.createPasswordResetToken = function () {
    //random token which we will send to user in plain
    const resetToken = crypto.randomBytes(32).toString('hex')

    //encrypted version of token
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    console.log({ resetToken }, this.passwordResetToken)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User;
