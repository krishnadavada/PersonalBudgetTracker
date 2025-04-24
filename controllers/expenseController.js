const expanses = require("../models/expanseModel");
const { createResponse, oMessage, oStatus } = require("../helpers/response");
const inventory = require("../models/inventoryModel");
const budget = require("../models/budgetModel");
const { MIN_QUANTITY } = require("../utils/var");
const mongoose = require("mongoose");
const { validateObjectId } = require("../middlewares/validate");

async function getAllExpense(req, res) {
  try {
    const iuserId = req.user.iId;
    const oExpenses = await expanses.find({ iUserId: iuserId });
    if (oExpenses.length === 0) {
      return createResponse(
        res,
        oStatus.NotFound,
        oMessage.not_exist,
        "expense"
      );
    }
    return createResponse(res, oStatus.OK, oMessage.fetch, null, oExpenses);
  } catch (err) {
    console.log(err);
    return createResponse(
      res,
      oStatus.InternalServerError,
      oMessage.internal_err
    );
  }
}

async function addExpense(req, res) {
  try {
    const { oInventory } = req.body;
    const iUserId = req.user.iId;

    if (!Array.isArray(oInventory) || oInventory.length === 0) {
      return createResponse(
        res,
        oStatus.BadRequest,
        oMessage.invalid,
        "request body"
      );
    }

    // Get total expense amount from inventory data
    let nTotalExpense = 0;
    for (const item of oInventory) {
      const oDbItem = await inventory.findById(item.iInventoryId);
      if (!oDbItem) {
        return res
          .status(400)
          .json({ message: `Inventory not found: ${item.iInventoryId}` });
      }
      if (item.nQuantity < MIN_QUANTITY) {
        return res
          .status(400)
          .json({ message: `Minimum quantity not met for: ${oDbItem.sName}` });
      }
      if (item.nQuantity > oDbItem.nQuantityAvail) {
        return res.status(400).json({
          message: `Not enough quantity for ${oDbItem.sName}. Available: ${oDbItem.nQuantityAvail}, Requested: ${item.nQuantity}`,
        });
      }
      nTotalExpense += oDbItem.nPricePerItem * item.nQuantity;
    }

    // Time ranges
    const now = new Date();
    const dStartOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const dEndOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const dStartOfWeek = new Date(now);
    dStartOfWeek.setDate(now.getDate() - now.getDay());
    dStartOfWeek.setHours(0, 0, 0, 0);
    const dEndOfWeek = new Date(dStartOfWeek);
    dEndOfWeek.setDate(dStartOfWeek.getDate() + 7);
    const dStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dEndOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get budget for user
    const oBudget = await budget.findOne({ iUserId });
    if (!oBudget) {
      return createResponse(
        res,
        oStatus.NotFound,
        oMessage.not_found,
        "budget"
      );
    }

    // Get expenses in different ranges
    const [oDailyExpenses, oWeeklyExpenses, oMonthlyExpenses] =
      await Promise.all([
        expanses.find({
          iUserId,
          createdAt: { $gte: dStartOfDay, $lt: dEndOfDay },
        }),
        expanses.find({
          iUserId,
          createdAt: { $gte: dStartOfWeek, $lt: dEndOfWeek },
        }),
        expanses.find({
          iUserId,
          createdAt: { $gte: dStartOfMonth, $lt: dEndOfMonth },
        }),
      ]);

    // Calculate total
    const calculateTotal = async (expenseList) => {
      let nTotal = 0;
      for (const expense of expenseList) {
        for (const item of expense.oInventory) {
          const oInv = await inventory.findById(item.iInventoryId);
          if (oInv) {
            nTotal += item.nQuantity * oInv.nPricePerItem;
          }
        }
      }
      return nTotal;
    };

    const [nDailyUsed, nWeeklyUsed, nMonthlyUsed] = await Promise.all([
      calculateTotal(oDailyExpenses),
      calculateTotal(oWeeklyExpenses),
      calculateTotal(oMonthlyExpenses),
    ]);

    if (
      nDailyUsed + nTotalExpense > oBudget.nDailyLimit ||
      nWeeklyUsed + nTotalExpense > oBudget.nWeeklyLimit ||
      nMonthlyUsed + nTotalExpense > oBudget.nMonthlyLimit
    ) {
      const aReasons = [];
      if (nDailyUsed + nTotalExpense > oBudget.nDailyLimit) {
        aReasons.push(
          `Daily limit exceeded. Limit: ${oBudget.nDailyLimit}, Used: ${nDailyUsed}, Tried to use: ${nTotalExpense}`
        );
      }
      if (nWeeklyUsed + nTotalExpense > oBudget.nWeeklyLimit) {
        aReasons.push(
          `Weekly limit exceeded. Limit: ${oBudget.nWeeklyLimit}, Used: ${nWeeklyUsed}, Tried to use: ${nTotalExpense}`
        );
      }
      if (nMonthlyUsed + nTotalExpense > oBudget.nMonthlyLimit) {
        aReasons.push(
          `Monthly limit exceeded. Limit: ${oBudget.nMonthlyLimit}, Used: ${nMonthlyUsed}, Tried to use: ${nTotalExpense}`
        );
      }

      // Calculate maximum budget
      const nMaxAvailable = Math.min(
        oBudget.nDailyLimit - nDailyUsed,
        oBudget.nWeeklyLimit - nWeeklyUsed,
        oBudget.nMonthlyLimit - nMonthlyUsed
      );

      // Load inventory details once
      const oInventoryDetails = await Promise.all(
        oInventory.map((item) => inventory.findById(item.iInventoryId))
      );

      const oItems = oInventory.map((item, idx) => {
        const dbItem = oInventoryDetails[idx];
        return {
          ...item,
          sName: dbItem?.sName || "Unknown",
          nPrice: dbItem?.nPricePerItem || 0,
          originalQty: item.nQuantity,
          reducedQty: item.nQuantity,
        };
      });

      // Sort oItems by price descending order
      oItems.sort((a, b) => b.nPrice - a.nPrice);

      // Current total
      let currentTotal = oItems.reduce(
        (sum, item) => sum + item.nPrice * item.reducedQty,
        0
      );

      // Reduce oItems until total fits
      for (const item of oItems) {
        while (item.reducedQty > 0 && currentTotal > nMaxAvailable) {
          item.reducedQty -= 1;
          currentTotal -= item.nPrice;
        }
      }

      const aSuggestions = oItems.map((item) => {
        if (item.reducedQty < item.originalQty) {
          return {
            sName: item.sName,
            sSuggestion: `Reduce quantity from ${item.originalQty} to ${item.reducedQty}`,
          };
        } else {
          return {
            sName: item.sName,
            sSuggestion: "No change needed for this item",
          };
        }
      });

      return res.status(400).json({
        message: "Expense limit exceeded",
        aReasons,
        aSuggestions,
      });
    }

    // decrese inventory quantities
    for (const item of oInventory) {
      await inventory.updateOne(
        { _id: item.iInventoryId },
        { $inc: { nQuantityAvail: -item.nQuantity } }
      );
    }

    // Save expense
    const nAmount = nTotalExpense;
    const oNewExpense = await expanses.create({ iUserId, oInventory, nAmount });

    return createResponse(
      res,
      oStatus.Created,
      oMessage.expense,
      "created",
      oNewExpense
    );
  } catch (err) {
    console.log(err);
    return createResponse(
      res,
      oStatus.InternalServerError,
      oMessage.internal_err
    );
  }
}

async function deleteExpense(req, res) {
  try {
    const { iId } = req.params;

    const oExpense = await expanses.findOne({
      _id: iId,
      iUserId: req.user.iId,
      isDeleted: { $eq: true },
    });

    if (!oExpense) {
      return createResponse(
        res,
        oStatus.NotFound,
        oMessage.not_found,
        "expense"
      );
    }

    const deletedAtUTC = new Date().toISOString();

    const deleted = await expanses.findOneAndUpdate(
      { _id: iId },
      {
        $set: {
          bIsDeleted: true,
          dDeletedAt: deletedAtUTC,
        },
      }
    );

    return createResponse(
      res,
      oStatus.OK,
      oMessage.expense,
      "deleted",
      deleted
    );
  } catch (err) {
    console.log(err);
    return createResponse(
      res,
      oStatus.InternalServerError,
      oMessage.internal_err
    );
  }
}

module.exports = { addExpense, getAllExpense, deleteExpense };
