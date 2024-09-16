const express = require('express')
const tourController = require('./../controllers/tourController')
const authController = require('../controllers/authController')

//Routes
const router = express.Router()  //creating a new router (which is actually a real middleware)

//param middleware is used for a specific parameter and the val refers to the id 

// router.param('id',(req,res,next,val)=>{  
// // console.log(`tour id is ${val}`)
// next()
// })

//create a checkbody middleware to check that body contains properties and if not then 400 request and if yes then add it to post handler

// router.param('id', tourController.checkId)
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)
router.route('/tour-stats').get(tourController.getTourStats)
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)

router.route('/')
    .get(authController.protect, tourController.getAllTours)
    .post(tourController.createTour)  //chaining multiple middleware functionsko

router.route('/:id')
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(authController.protect,authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour)

module.exports = router
