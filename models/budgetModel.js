const mongoose = require("mongoose");
const { MIN_LIMIT } = require("../utils/var");
const { Schema, model } = mongoose;

const oBudgetSchema = new Schema({
  nDailyLimit: {
    type: Number,
    required: true,
    min:MIN_LIMIT
  },
  nWeeklyLimit:{
    type: Number,
    required: true,
    min:MIN_LIMIT
 },
  nMonthlyLimit: {
    type: Number,
    required: true,
    min:MIN_LIMIT
  },
  iUserId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required:true
  }
},{timestamps:true});

const budget = model("Budget", oBudgetSchema);

module.exports = budget;
