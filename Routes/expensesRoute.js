const express = require('express')
const { addExpense, getAllExpense, deleteExpense } = require('../controllers/expenseController')
const authMiddleware = require('../middlewares/authMiddleware')
const { aIdExpense, validateReq, aExpenseData } = require('../middlewares/validate')
const router= express.Router()

router.get('/',authMiddleware,(req,res)=>{
    getAllExpense(req,res)
})

router.post('/',authMiddleware,aExpenseData,validateReq,(req,res)=>{
    addExpense(req,res)
})

router.delete('/:iId',authMiddleware,aIdExpense,validateReq,(req,res)=>{
    deleteExpense(req,res)
})
module.exports=router