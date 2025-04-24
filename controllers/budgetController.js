const { oStatus, oMessage,createResponse } = require("../helpers/response");
const budget=require('../models/budgetModel');
const { limitValidate } = require("../validators/limitValidate");

async function getAllBudget(req,res){
    try{
    const iuserId=req.user.iId
    const oBudgets = await budget.find({iUserId:iuserId}).populate("iUserId", "-sPassword");
    if(oBudgets.length===0){
      return createResponse(res, oStatus.NotFound, oMessage.not_exist,'budget');
     }
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
   
      if(limitValidate(nDailyLimit,nWeeklyLimit,nMonthlyLimit)){
        return createResponse(res, oStatus.BadRequest, oMessage.invalid_budget);
      }
   
      const now = new Date();
      const dCurrentMonth = now.getUTCMonth(); 
   
      let oBudget = await budget.findOne({ iUserId: iUserId });
   
      if (oBudget) {
        const dBudgetMonth = oBudget.updatedAt.getUTCMonth(); 
   
        // Check if budget for current month and year already exists
        if (dBudgetMonth === dCurrentMonth) {
          return createResponse(res, oStatus.Conflict, oMessage.budget_exist);
        }
         
        if(limitValidate(nDailyLimit,nWeeklyLimit,nMonthlyLimit)){
          return createResponse(res, oStatus.BadRequest, oMessage.invalid_budget);
        }

        //already exist then update for new month
        await oBudget.updateOne({iUserId:iUserId},{
          $set: {
            nDailyLimit,
            nWeeklyLimit,
            nMonthlyLimit,
          },
        });
   
        return createResponse(res, oStatus.OK, oMessage.budget_success,'added', oBudget);
      }
   
      const newBudget = await budget.create({
        iUserId,
        nDailyLimit,
        nWeeklyLimit,
        nMonthlyLimit
      });
   
      return createResponse(res, oStatus.Created, oMessage.add_budget, null, newBudget);
    } catch (err) {
      console.log(err);
      return createResponse(res, oStatus.InternalServerError, oMessage.internal_err);
    }
  }

module.exports={getAllBudget,addBudget}

 
