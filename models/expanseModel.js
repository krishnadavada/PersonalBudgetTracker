const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const {oCategory}=require('../utils/enum')
const {MIN_QUANTITY}=require('../utils/var')

const oExpanseSchema = new Schema({
  oInventory:[{
      iInventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Inventory',
        required: true
      },
      nQuantity:{
        type:Number,
        required:true,
        min:MIN_QUANTITY
      }
  }],
  iUserId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required:true
 },
 dDate:{
   type:Date,
   default:Date.now
 }
},{timestamps:true});

const expanses = model("Expanses", oExpanseSchema);

module.exports = expanses;
