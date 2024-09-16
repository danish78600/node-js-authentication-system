const fs = require('fs')
const tour = require("../../models/tourModel")
const dotenv = require('dotenv')
const mongoose = require("mongoose")
const Tour = require('../../models/tourModel')
dotenv.config({ path: './config.env' })
mongoose.connect("mongodb://localhost:27017/natours").then((con) => {
    console.log("success")
})


//reading json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
console.log(tours)
//importing data in the database
const importData = async () => {
    try {
        await Tour.create(tours)
        console.log("data successfully loaded")
    }
    catch (e) {
        console.log(e)
    }
    process.exit()
}
 
//delete all data from DB
const deleteData = async () => {
    try {
        await Tour.deleteMany()
        console.log("data successfully deleted")
    }
    catch (e) {
        console.log(e)
    }
}

if(process.argv[2]==='--import')
{
    importData()
}

else if(process.argv[2]='--delete')
{
    deleteData()
}

console.log(process.argv)