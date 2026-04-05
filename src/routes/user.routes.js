import { Router } from "express";
import { refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {loginUser,logoutUser} from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser)

//secured routes 

router.route("/logout").post(verifyJWT , logoutUser); //here logoutUser is the func 
router.route("/refresh-token").post(refreshAccessToken);

export default router; 