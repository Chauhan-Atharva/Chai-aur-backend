import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
router.route("/change-password").post(verifyJWT , changeCurrentPassword) ;
router.route("/current-user").get(verifyJWT , getCurrentUser);
router.route("/update-account").patch(verifyJWT , updateAccountDetails);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);//using params 
router.route("/history").get(verifyJWT, getWatchHistory);


export default router; 