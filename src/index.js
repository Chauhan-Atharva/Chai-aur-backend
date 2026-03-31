// require("dotenv").config({path: './env'}) //this is ok but disturbs the consistency of the code
import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({
    path : './env'
})

console.log("ENV CHECK:", process.env.MONGODB_URI);

//A async method always return a promise 
connectDB()
.then(
    app.listen(process.env.PORT || 8000 , ()=> {
        console.log(`Server is running at port : ${process.env.PORT}`);
        
    })
)
.catch((err) => {
    console.log("MONGO db connection failed !! " , err);
    
})













//1st approach - less preferred as it makes index.js crowded 
// import express from 'express'
// const app = express()

// // iffes in JS - always started with a semicolon
// ;(async ()=> { 
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error" , (rrror)=> {
//             console.log("ERROR: ", error)
//             throw error
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })
        
//     } catch (error) {
//         console.log("ERROR: ", error)
//         throw error
        
//     }
// })()   