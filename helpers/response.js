const oStatus = {
    OK: 200,
    Created: 201,
    Deleted: 204,
    BadRequest: 400,
    Unauthorized: 401,
    NotFound: 404,
    Conflict: 409,
    InternalServerError: 500
  }
  
  const oMessage = {
    server_up : 'Server is up !',
    invalid:'Invalid ## !',
    not_authorized: 'User is not authorized!',
    no_token:'No token provided ,Please login !',
    not_found: '## not found !',
    fetch:'Data fetched successfully !',
    user_exist:'User already exist!',
    invalid_budget:"Invalid budget limits. Daily, weekly, and monthly limits must be greater than zero and follow the hierarchy.",
    add_budget:'Budget added successfully !',
    expense:'expense ## successfully!',
    some_wrong:'Something went wrong !',
    internal_err:'Internal server error !',
    budget_exist:"Budget already exists for this month"
  }
  
  //function for send msg and replce ## to actual value
  function sendMsg(sMessageType,sReplaceWith){
    if(!sMessageType)
    {
      return oMessage['some_wrong'];
    }
    return sReplaceWith ? sMessageType.replace('##',sReplaceWith) : sMessageType
  }
  
  
  //function for create response
  function createResponse( res, sResponse, sMessageType='', sReplaceWith='',oData) {
  
    let sIsMessage=sMessageType ? sendMsg(sMessageType,sReplaceWith) : oMessage[internal_err]
  
    if(oData)
    {
      return res.status(sResponse).json({message:sIsMessage,data:oData})
    }
    return res.status(sResponse).json({message:sIsMessage})
  }
  
  module.exports = { oStatus,oMessage,createResponse };
  