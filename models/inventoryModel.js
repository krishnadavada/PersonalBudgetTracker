const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const{oCategory}=require('../utils/enum')

const oInventorySchema = new Schema({
      sName: {
        type: String,
        trim:true,
        unique:true,
        required: true
      },
      eType: {
        type:String,
        enum:oCategory,
        default:oCategory[0],
      },
      nQuantityAvail:{
        type:Number,
        required:true
      },
      nPricePerItem:{
         type:Number,
         required:true
      }
},{timestamps:true});

const inventory = model("Inventory", oInventorySchema);

module.exports = inventory;
