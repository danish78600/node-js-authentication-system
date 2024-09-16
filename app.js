const express = require('express')
const fs = require('fs')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const globalErrorHandler = require('./controllers/errorController')
const AppError = require('./utils/AppError')
const morgan = require("morgan")
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const { dirname } = require('path')
// const hpp = require('hpp')
const app = express()

//Global Middlewares

//set security http headers
app.use(helmet())

//developemtn logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

//limit request from same api
const limiter = rateLimit({
    max: 10,
    windowMs: 60 * 60 * 1000,
    message: 'too many requests from this ip please try again after an hour'
})
app.use('/api', limiter)

//body parser reading data from body from req.body
app.use(express.json({ limit: '10kb' }))  //middleware-req goes through it and the data is added to req body in post request

//data sanitization against nosql query injection  
app.use(mongoSanitize())

// data sanitization againts cross type scripting attacks
app.use(xss())

//prevent parameter pollution hpp stands for http parameter pollution
// app.use(hpp({
//     whiteList: ['duration', 'ratingsQuantity', 'ratingsAverage', 'difficulity', 'price', 'maxGroupSize']
// }))

//serving static files
app.use(express.static(`${__dirname}/public`))  //middleware for serving static files

//test middlewares
// app.use((req, res, next) => {
//     console.log('hello from the middleware')
//     next()
// })

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    console.log(req.headers)
    next()
})  

// app.get('/api/v1/tours', getAllTours)

//with ? we can make a parameter optional

// app.get('/api/v1/tours/:id', getTour)
// app.post('/api/v1/tours', createTour)
// app.patch('/api/v1/tours/:id', updateTour)
// app.delete('/api/v1/tours/:id',deleteTour )



app.use('/api/v1/users', userRouter)
app.use('/api/v1/tours', tourRouter)

app.all('*', (req, res, next) => {
    next(new AppError(`cant find ${req.originalUrl}`, 404))
})

//error handling middleware
app.use(globalErrorHandler)

module.exports = app