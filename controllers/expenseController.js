const expanses = require("../models/expanseModel")
const {createResponse,oMessage,oStatus}=require('../helpers/response')
const inventory=require('../models/inventoryModel')
const budget=require('../models/budgetModel')
const { MIN_QUANTITY } = require("../utils/var");
const mongoose=require('mongoose')

async function getAllExpense(req,res){
  try{
     const oExpenses=await expanses.find()
     return createResponse( res, oStatus.OK, oMessage.fetch, null, oExpenses);
  }
  catch(err){
    console.log(err);
    return createResponse( res, oStatus.InternalServerError, oMessage.internal_err );
  }
}

async function addExpense(req, res){
    try {
      const { oInventory } = req.body;
      const iUserId = req.user.iId;
  
      if (!Array.isArray(oInventory) || oInventory.length === 0) {
        return createResponse(res,oStatus.BadRequest,oMessage.invalid,'request body')
      }
  
      // Get total expense amount from inventory data
      let totalExpense = 0;
      for (const item of oInventory) {
        const dbItem = await inventory.findById(item.iInventoryId);
        if (!dbItem) {
          return res.status(400).json({ message: `Inventory not found: ${item.iInventoryId}` });
        }
  
        if (item.nQuantity < MIN_QUANTITY) {
          return res.status(400).json({ message: `Minimum quantity not met for: ${dbItem.sName}` });
        }
  
        if (item.nQuantity > dbItem.nQuantityAvail) {
          return res.status(400).json({
            message: `Not enough quantity for ${dbItem.sName}. Available: ${dbItem.nQuantityAvail}, Requested: ${item.nQuantity}`
          });
        }
  
        totalExpense += dbItem.nPricePerItem * item.nQuantity;
      }
  
      // Time ranges
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
  
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
      // Get user's budget
      const oBudget = await budget.findOne({ iUserId });
      if (!oBudget) {
        return createResponse(res, oStatus.NotFound, oMessage.not_found, 'budget');
      }
  
      // Aggregate expenses
      const [dailyTotal, weeklyTotal, monthlyTotal] = await Promise.all([
        expanses.aggregate([
          { $match: { iUserId: new mongoose.Types.ObjectId(iUserId), createdAt: { $gte: startOfDay, $lt: endOfDay } } },
          { $unwind: "$oInventory" },
          {
            $lookup: {
              from: "inventories",
              localField: "oInventory.iInventoryId",
              foreignField: "_id",
              as: "invDetails"
            }
          },
          { $unwind: "$invDetails" },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $multiply: ["$oInventory.nQuantity", "$invDetails.nPricePerItem"] }
              }
            }
          }
        ]),
        expanses.aggregate([
          { $match: { iUserId: new mongoose.Types.ObjectId(iUserId), createdAt: { $gte: startOfWeek, $lt: endOfWeek } } },
          { $unwind: "$oInventory" },
          {
            $lookup: {
              from: "inventories",
              localField: "oInventory.iInventoryId",
              foreignField: "_id",
              as: "invDetails"
            }
          },
          { $unwind: "$invDetails" },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $multiply: ["$oInventory.nQuantity", "$invDetails.nPricePerItem"] }
              }
            }
          }
        ]),
        expanses.aggregate([
          { $match: { iUserId: new mongoose.Types.ObjectId(iUserId), createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
          { $unwind: "$oInventory" },
          {
            $lookup: {
              from: "inventories",
              localField: "oInventory.iInventoryId",
              foreignField: "_id",
              as: "invDetails"
            }
          },
          { $unwind: "$invDetails" },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $multiply: ["$oInventory.nQuantity", "$invDetails.nPricePerItem"] }
              }
            }
          }
        ])
      ]);
  
      const dailyUsed = dailyTotal[0]?.total || 0;
      const weeklyUsed = weeklyTotal[0]?.total || 0;
      const monthlyUsed = monthlyTotal[0]?.total || 0;
  
      const reasons = [];
      if (dailyUsed + totalExpense > oBudget.nDailyLimit) {
        reasons.push(`Daily limit exceeded. Limit: ${oBudget.nDailyLimit}, Current: ${dailyUsed}, Attempted: ${totalExpense}`);
      }
      if (weeklyUsed + totalExpense > oBudget.nWeeklyLimit) {
        reasons.push(`Weekly limit exceeded. Limit: ${oBudget.nWeeklyLimit}, Current: ${weeklyUsed}, Attempted: ${totalExpense}`);
      }
      if (monthlyUsed + totalExpense > oBudget.nMonthlyLimit) {
        reasons.push(`Monthly limit exceeded. Limit: ${oBudget.nMonthlyLimit}, Current: ${monthlyUsed}, Attempted: ${totalExpense}`);
      }
  
      if (reasons.length > 0) {
        // Add suggestion logic
        const suggestions = [];
        for (const item of oInventory) {
          const dbItem = await inventory.findById(item.iInventoryId);
          if (!dbItem) continue;
  
          const maxAffordableDaily = Math.floor((oBudget.nDailyLimit - dailyUsed) / dbItem.nPricePerItem);
          const maxAffordableWeekly = Math.floor((oBudget.nWeeklyLimit - weeklyUsed) / dbItem.nPricePerItem);
          const maxAffordableMonthly = Math.floor((oBudget.nMonthlyLimit - monthlyUsed) / dbItem.nPricePerItem);
          const maxAllowed = Math.min(maxAffordableDaily, maxAffordableWeekly, maxAffordableMonthly);
  
          if (maxAllowed < item.nQuantity) {
            suggestions.push({
              sName: dbItem.sName,
              suggestion: `Reduce quantity to ${maxAllowed} or remove this item`
            });
          }
        }
  
        return res.status(400).json({
          message: "Expense limit exceeded",
          reasons,
          suggestions
        });
      }
  
      // Deduct inventory quantities
      for (const item of oInventory) {
        await inventory.updateOne(
          { _id: item.iInventoryId },
          { $inc: { nQuantityAvail: -item.nQuantity } }
        );
      }
  
      // Save expense
      const newExpense = await expanses.create({ iUserId, oInventory });
      return createResponse(res, oStatus.Created, oMessage.expense, 'created', newExpense);
  
    } catch (err) {
      console.log(err);
      return createResponse(res, oStatus.InternalServerError, oMessage.internal_err);
    }
  };
  

async function deleteExpense(req,res){
    try{
    const { iId } = req.params;

    const deleted = await expanses.findByIdAndDelete(iId);

    if (!deleted) {
      return createResponse(res,oStatus.NotFound,oMessage.not_found,'expense')
    }

    return createResponse(res,oStatus.OK,oMessage.expense,'deleted',deleted)
    }
    catch(err){
     console.log(err);
     return createResponse( res, oStatus.InternalServerError, oMessage.internal_err );
    }
}

module.exports={addExpense,getAllExpense,deleteExpense}