const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users=require('../models/userModel');
const { oStatus, oMessage,createResponse } = require("../helpers/response");
const JWT_SECRET = process.env.JWT_SECRET;

async function login(req,res){
    const { sEmail, sPassword } = req.body;
  try {
    const oUser = await users.findOne({ sEmail:sEmail });
    if (!oUser) return createResponse(res, oStatus.BadRequest, oMessage.invalid,'credentials');
 
    const bIsMatch = await bcrypt.compare(sPassword, oUser.sPassword);
    if (!bIsMatch) return createResponse(res, oStatus.BadRequest, oMessage.invalid,'credentials');

    const token = jwt.sign({ iId: oUser._id }, JWT_SECRET, { expiresIn: "1h" });

    res
      .cookie("token", token, {
        expires: new Date(Date.now() + 86400000), //1 day
      })
      .status(200)
      .json({ message: "logged in successfully ! " });

  } 
  catch(err){
    console.log(err);
    return createResponse( res, oStatus.InternalServerError, oMessage.internal_err );
   }

}

async function register(req,res){

    const { sUserName,sEmail,sPassword } = req.body;
    try {
      let oUser = await users.findOne({ sEmail: sEmail });
      if (oUser) return createResponse(res,oStatus.BadRequest,oMessage.user_exist)
   
      const sHashedPassword = await bcrypt.hash(sPassword, 10);
      oUser = new users({ sUserName,sEmail,sPassword:sHashedPassword });
      await oUser.save();
   
      const newId = new mongoose.Types.ObjectId();
      
      const token = jwt.sign({ iId: newId }, JWT_SECRET, { expiresIn: "1h" });
      res
      .cookie("token", token, {
        expires: new Date(Date.now() + 86400000), //1 day
      })
      .status(200)
      .json({ message: "register successfully ! " });    
    } 
    catch(err){
        console.log(err);
        return createResponse( res, oStatus.InternalServerError, oMessage.internal_err );
    }
}
 
module.exports={login,register}