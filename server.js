const dotenv=require('dotenv')
const mongoose=require("mongoose")

process.on('uncaughtException',err=>{
    console.log("unhandled exception shutting down")
    console.log(err.name,err.message)
    process.exit(1)
})

dotenv.config({path:'./config.env'})
const app=require('./app')
mongoose.connect("mongodb://localhost:27017/natours").then((con)=>{
    console.log("success")
})

// console.log(app.get('env'))
// console.log(process.env)


//example of creating documents

// const testTour=new Tour({
//     name:"the forest prince",
//     rating:4.9,
//     price:1001
// })

// testTour.save()  //save this to Tour collection
// .then(doc=>{
//     console.log(doc)
// }).catch(err=>console.log(err))

const port =process.env.PORT || 3000

//Start the server
const server=app.listen(port, () => { 
    console.log("listening")
}) 

process.on('unhandledRejection',(err)=>{
   
    console.log("unhandled rejection shutting down")
    console.log(err)
    //only when the server tasks are finsihed then the process is closed
    server.close(()=>{
        process.exit(1)
    })
})


// console.log(x)