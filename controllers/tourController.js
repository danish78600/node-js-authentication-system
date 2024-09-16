// const fs = require('fs')
const Tour = require("../models/tourModel")
const APIFeatures = require('../utils/apiFeatures')
const AppError = require("../utils/AppError")
const catchAsync = require('../utils/catchAsync')

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5',
        req.query.sort = '-ratingsAverage,price',
        req.query.fields = 'name,price,ratingsAverage'
    next()
}

// const tours = JSON.parse(
//     fs.readFileSync(`dev-data/data/tours-simple.json`)
// )

//RouteHandlers

// exports.checkId = (req, res, next, val) => {
//     console.log(`tour id is ${val}`)
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({ status: "failed", msg: 'invalid' })
//     }
//     next()
// }

// exports.checkBody = (req, res, next) => {
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             msg: 'failed name or price is not there'
//         })
//     }
//     next()
// }




exports.getAllTours = catchAsync(async (req, res, next) => {

    //executes a query
    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate()
    const tours = await features.query

    // const tours=await Tour.find().where("difficulty").equals("easy")

    res.json({
        status: 'success',
        // requestedAt: req.requestTime,
        results: tours.length,
        data: {
            tours
        }
    })
})

exports.getTour = catchAsync(async (req, res, next) => {
    // Tour.findOne({_id:req.params.id})
    const tour = await Tour.findById(req.params.id).populate('guides') //populate means to fill up the guides with actual data

    if (!tour) {
        return next(new AppError('no tour found with that id', 404))
    }

    res.json(
        {
            status: 'success',
            data: {
                tour
            }
        })
}
)

//may give error due to not calling next()
exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body) 
    res.status(201).json({
        status: 'success',
        data: {
            tours: newTour
        }
    })
})

exports.updateTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    
    if (!tour) {
        return next(new AppError('no tour found with that id', 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            tour
        }
    })
}
)


exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id)
    
    if (!tour) { 
        return next(new AppError('no tour found with that id', 404))
    }

    res.status(202).json({
        status: "success",
        data: tour
    })


}
)


exports.getTourStats = catchAsync(async (req, res, next) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$difficulty',  //it will fetch  the data for each phases of difficulty seperately
                num: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $min: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ])
    res.json({
        data: stats
    })
}

)

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year * 1
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStats: { $sum: 1 },  //for each of the tour 1 is added
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStats: -1 }
        },
        {
            $limit: 12
        }
    ])

    res.json({
        data: {
            plan
        }
    })
})