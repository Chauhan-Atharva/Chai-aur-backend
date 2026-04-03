import multer from "multer"
 
const storage = multer.diskStorage({
  destination: function (req, file, cb) { //req - json data , and file - file 
    cb(null, "./public/temp")  //cb is callback 
  },
  filename: function (req, file, cb) {

    cb(null, file.originalname)  //original name as given by the user 
  }
})

export const upload = multer({
     storage: storage 
    })