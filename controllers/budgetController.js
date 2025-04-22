const { oStatus, oMessage,createResponse } = require("../helpers/response");
const budget=require('../models/budgetModel')

async function getAllBudget(req,res){
    try{
    const oBudgets = await budget.find().populate("iUserId", "-sPassword");
    return createResponse( res, oStatus.OK, oMessage.fetch, null, oBudgets);
    }
    catch(err){
       console.log(err);
       return createResponse( res, oStatus.InternalServerError, oMessage.internal_err );
    }
}

async function addBudget(req, res) {
    try {
      const iUserId = req.user.iId;
      const { nDailyLimit, nWeeklyLimit, nMonthlyLimit } = req.body;
  
      if (
        nDailyLimit >= nWeeklyLimit ||
        nDailyLimit >= nMonthlyLimit ||
        nWeeklyLimit >= nMonthlyLimit ||
        nDailyLimit < 0 ||
        nWeeklyLimit < 0 ||
        nMonthlyLimit < 0
      ) {
        return createResponse(res, oStatus.BadRequest, oMessage.invalid_budget);
      }
  
      const now = new Date();
  
      const oBudget = await budget.findOne({
        iUserId: iUserId,
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      });
  
      if (oBudget) {
        return createResponse(res, oStatus.Conflict, oMessage.budget_exist);
      }
  
      const newBudget = new budget({
        iUserId: iUserId,
        nDailyLimit,
        nWeeklyLimit,
        nMonthlyLimit,
      });
  
      await newBudget.save();
  
      return createResponse(res, oStatus.Created, oMessage.expense, 'added', newBudget);
    } catch (err) {
      console.log(err);
      return createResponse(res, oStatus.InternalServerError, oMessage.internal_err);
    }
  }
  

module.exports={getAllBudget,addBudget}

 
