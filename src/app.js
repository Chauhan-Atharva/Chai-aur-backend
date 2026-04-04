import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true 
}
))

app.use(express.json({
    limit: "20kb"
}))

app.use(express.urlencoded({extended: true, limit : "16kb"})); //these are middlewares 
//for taking data from url or encoding data in the url

app.use(express.static("public")) // to keep some data public
app.use(cookieParser()) // configuration  

//routes import 
import userRouter from "./routes/user.routes.js"

//routes declaration 
app.use( "/api/v1/users" , userRouter)//this /users will be be prefix - pass the control to user.routes.js 

//http://localhost:8000/api/v1/users/register - route formed 
export {app}