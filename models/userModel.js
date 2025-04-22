const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const oUserSchema = new Schema({
  sUserName: {
    type: String,
    trim: true,
    required: true,
  },
  sEmail: {
    type: String,
    unique: true,
    trim: true,
    required: true,
  },
  sPassword:{
     type:String,
     required:true
  }
},{timestamps:true});

const users = model("Users", oUserSchema);

module.exports = users;
