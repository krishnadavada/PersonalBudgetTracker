const express = require('express')
const { aLoginData, validateReq, aRegisterData } = require('../middlewares/validate')
const { login, register } = require('../controllers/authController')
const router= express.Router()

router.post('/login',[aLoginData,validateReq],(req,res)=>{
    login(req,res)
})

router.post('/register',[aRegisterData,validateReq],(req,res)=>{
    register(req,res)
})

module.exports=router

