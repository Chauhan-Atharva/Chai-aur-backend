import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema ( 
    {
        username: {
            type: String, 
            required: true, 
            unique: true, 
            lowercase : true, 
            trim: true,
            index : true  // makes the field searchable - for making searching easy - more optimized
        },
        email: {
            type: String, 
            required: true, 
            unique: true, 
            lowercase : true, 
            trim: true
        },
        fullname: {
            type: String, 
            required: true,  
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary service 
            required: true, 
        }, 
        coverImage: {
            type: String, //cloudinary service 
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId, 
                ref: "Video"
            }
        ],
        password: {
            type : String , //it is advised to keep pass encrypted 
            required : [true, "Password is required"] // custom msg can be given like this 
        }, 
        refreshToken: {
            type: String
        }

    } , {timestamps : true}
);
//in arrow function - we don't have reference of this 
userSchema.pre("save" , async function (next) {
    if(! this.isModified("password"))  return next(); 
    //isModified - provided by default 
    this.password = bcrypt.hash(this.password, 10); //10 rounds of algorithm 
    next();
})

//adding custom methods 
userSchema.methods.isPasswordCorrect = async function(password) { 
    return await bcrypt.compare(password, this.password);
}

//jwt is a bearer token - like a key - whoever has this key - we will share the data with it 

userSchema.methods.generateAccessToken = function() { 
    return jwt.sign(
        {
            _id: this._id, //_id provided by mongo db 
            email: this.email,  //on lhs we have name of the payload 
            username: this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET, 
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = async function(password) { 
    return jwt.sign(
        {
            _id: this._id, //_id provided by mongo db 
        },
        process.env.REFRESH_TOKEN_SECRET, 
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = new mongoose.model("User" , userSchema);