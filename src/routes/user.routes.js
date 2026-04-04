import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router() ; 

router.route("/register").post(
    (req,res,next) =>{
        console.log("before multer");
        next();
    },
    upload.fields([
        {
            name: "avatar", //name should be same as frontend
            maxCount: 1
        } ,
        {
            name: "coverImage", //name should be same as frontend
            maxCount: 2
        }
    ]),
    (req,res,next) =>{
        console.log("after multer");
        next();
    },
    registerUser);

export default router; 