const mongoose = require("mongoose")
const slugify = require("slugify")
const validator = require('validator')
const User = require("./userModel")

//schema ignores all the data which is outside it
const toursSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'a tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'too long name for a tour'],
        minlength: [10, 'a tour name must have more than 10 characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'a tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'tour must have group size']
    },
    difficulty: {
        type: String,
        required: [true, 'tour must have difficulity'],
        enum: {
            values: ['easy', 'medium', 'difficult'],  //enum means how much can be the possible values
            message: 'difficulty is either easy medium difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'rating must be above 1'],
        max: [5, 'rating must be below 5']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'a tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                //this only points to current docs on new document creation
                return val < this.price  //value can be +ve or -ve if -ve then it will throw an error
            },
            message: "discount price ({VALUE}) should be lesser than the regular price"
        }
    },
    summary: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        // required: [true, 'a tour must have a description']
    },
    imageCover: {
        type: String,
        required: [true, 'a tour must have a image']
    },
    images: [String],  //array of strings
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        //geojson data
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],  //for latitude and longitude
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],  //for latitude and longitude
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

toursSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7
})

//document middleware - pre will runs before the save command and .create() command
toursSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true })
    next()
})

//Embedding
// toursSchema.pre('save',async function(next){
//    const guidesPromises= this.guides.map(async id=>User.findById(id))
//    this.guides=await Promise.all(guidesPromises);

// })

// toursSchema.pre('save',function(next)
// {
//     console.log('will save document......')
//     next()
// })

// //post middleware function will be executed after all pre middleware function are executed
// toursSchema.post('save',function(doc,next){
// console.log(doc)
// next()
// })

//query middleware
// toursSchema.pre('find',function(next){
toursSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    this.start = Date.now()
    next()
})

toursSchema.post(/^find/, function (docs, next) {
    console.log(`query tooks ${Date.now() - this.start} milliseconds`)
    // console.log(docs)
    next()
})

//Aggregation middleware
toursSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
    console.log(this.pipeline())
    next()
})

const Tour = mongoose.model('Tour', toursSchema)  //blueprint for creating documents

module.exports = Tour

/*
virtual properties - properties which are not saved in the database but are for schemaas

pipeline

mongoose also has middleware as express has

document middleware-middleware runnning before and after saving 

query middleware - middleware runnign before and after a query 

aggreagration middleware - allows us add hooks before or after aggregation

*/