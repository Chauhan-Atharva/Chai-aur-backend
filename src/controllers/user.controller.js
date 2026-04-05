import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken ; 
        await user.save({validateBeforeSave: false}); //don't put validation - just save the user
        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler( async (req, res) => { //async as await used in method 
    // register user details - steps 
    //1. get user detail from frontend 
    //2. validation - of all fields - not empty 
    //3. check if user already exists : username, email
    //4. check for images, check for avatar 
    //5. upload them to cloudinary, avatar check if uploaded 
    //6. create user object - create entry in DB 
    //7. remove password and refresh token field from response
    //8. check for user creation 
    //9. return response 

    console.log("REGISTER HIT");

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {fullName, email, username, password} = req.body //from form or json - but url other method 

    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }

    if(
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "all fields are compulsory or required");
    }
    if(!email.includes('@')) throw new ApiError(400, "email not valid");
    console.log(email, fullName);

    const existedUser = await User.findOne({
        $or: [ {username } , {email}]
    })

    if(existedUser) throw new ApiError(409, "user with email or username already exists");

    const avatarLocalPath = req.files?.avatar?.[0]?.path; //do console log of req.files
    const coverImageLocalPath = req.files?.coverImage?.[0].path; 

    if(!avatarLocalPath) throw new ApiError(400, "Avatar file is requried");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) throw new ApiError(400, "Avatar file is required");
    
    const user = await User.create({
        fullName, 
        avatar : avatar.url,
        coverImage: coverImage?.url || "" ,
        email, 
        password, 
        username: username.toLowerCase()
    });

    //mongodb adds an _id field by itself 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //remove these two fields from the object 
    )

    if(!createdUser) throw new ApiError(500, "Something went wrong while registering a user");

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully ")
    )




})

const loginUser = asyncHandler( async (req, res) => {
    // req body data 
    // username or email -> login 
    // find the user in db 
    // check for password correct 
    // access and refresh token generate and send to user 
    // send cookies and response 

    const {email, username, password } = req.body;
    
    if (!username && !email) {  //both are required in my case 
        throw new ApiError(400, "username or password is required ");
    }

    console.log("user from database finding command run");

    const user = await User.findOne({
        $or: [{username} , {email}]
    })
    
    

    if(!user) throw new ApiError(404, "User doesn't exist ");
    //User is mongoose but all the methods - generateRefreshToken and isPasswordCorrect apply on your user instance

    const isPasswordValid = await user.isPasswordCorrect(password) //this password obtained from req.body

    if(!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

    const {accessToken, refreshToken }= await generateAccessAndRefreshTokens(user._id);

    //you can either update the user for refreshToken or make another db call

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly : true, 
        secure : true //only modifiable by server
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken, refreshToken  // gives user option to save these 

            }, 
            "User logged in successfully "
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    //find the user but we don't want to input email or anything 
    //we need to find the user by designing our custom middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken : undefined }
        }, 
        {
            new: true //gives new updated value as return 
        }
    ); 

    const options =  {
        httpOnly: true, 
        secure: true
    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));

})

const refreshAccessToken = asyncHandler( async(req,res) => {
    //access refreshToken from cookies 
    const incomingRefreshToken = req.cokkies.refreshToken || req.body.refreshToken ; 

    if(!incomingRefreshToken) throw new ApiError(401, "unauthorized request");

    try {
        const decodedToken = jwt.verify( incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id);
    
        if(!user) throw new ApiError(401, "Invalid refresh token");
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used ");
        }
    
        const options = {
            httpOnly : true, 
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        res
        .status(200)
        .cookie("accessToken" , accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken , refreshToken: newrefreshToken
            }, 
        "Access token refreshed"
        )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
        
    }
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    //user is logged in already so it has req.user from auth.middleware

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect) throw new ApiError(400, "Invalid old password");

    user.password = newPassword; 

    await user.save({validateBeforeSave : false}); 

    return res
    .status(200)
    .json(new ApiResponse(200, {} , "Password changed successfully "));
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json( new ApiResponse(200, req.user , "current user fetched successfully"));
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    const { fullName , email }  = req.body ; 
    //if you want to update a file - keep different endpoint 

    if(!fullName || !email) {
        throw new ApiError(400 , "All fields are required ");
    }

    const user = User.findByIdandUpdate(
        req.user?._id, 
        {
            $set: {
                fullName, email: email
            }
        }, 
        {new: true}
    ).select("-password"); 

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));

})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath  = req.file?.path; //through multer middleware

    if(!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: { 
                avatar : avatar.url
            }
        }, 
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200, user, "avatar image updated successfully"));


})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath  = req.file?.path; //through multer middleware

    if(!coverImageLocalPath) throw new ApiError(400, "Cover image file is missing");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: { 
                coverImage : coverImage.url
            }
        }, 
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Cover image updated successfully"));


})

export {registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser, 
    changeCurrentPassword, 
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}