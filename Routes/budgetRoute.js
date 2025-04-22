const express = require('express')
const router= express.Router()
const {getAllBudget,addBudget}=require('../controllers/budgetController')
const authMiddleware = require('../middlewares/authMiddleware')
const { aBudgetData, validateReq } = require('../middlewares/validate')

router.get('/',authMiddleware, (req,res)=>{
    getAllBudget(req,res)
})

router.post('/',authMiddleware,aBudgetData,validateReq,(req,res)=>{
    addBudget(req,res)
})

module.exports=router

