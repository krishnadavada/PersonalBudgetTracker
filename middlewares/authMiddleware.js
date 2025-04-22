const jwt = require("jsonwebtoken");

const {createResponse,oStatus,oMessage}=require('../helpers/response');
const users = require("../models/userModel");
 
const authMiddleware = (req, res, next) => {
    try {
     const token = req.cookies.token;

     if (!token) return createResponse(res,oStatus.Unauthorized,oMessage.no_token)
 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const oUser=users.find({_id:req.user.iId})
    if (!oUser) return createResponse(res, oStatus.Unauthorized, oMessage.not_authorized);

    next();
  } 
  catch(err){       
    console.log(err);
    return createResponse( res, oStatus.InternalServerError, oMessage.internal_err );
   }
};
 
module.exports = authMiddleware;