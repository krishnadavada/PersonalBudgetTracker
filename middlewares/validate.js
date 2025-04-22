const { param,body,validationResult }=require("express-validator");

const aLoginData=[
    body('sEmail').notEmpty().withMessage('Email is required !').bail().isEmail().normalizeEmail().withMessage('Invalid data type of email !').bail(),
  
    body('sPassword').notEmpty().withMessage('Password is required !').bail().isString().trim().withMessage('Invalid data type of password !').bail()
]

aRegisterData=[
    body('sUserName').notEmpty().withMessage('Username is required !').bail().isString().trim().withMessage('Invalid data type of username !').bail(),
    body('sEmail').notEmpty().withMessage('Email is required !').bail().isEmail().normalizeEmail().withMessage('Invalid data type of email !').bail(),
    body('sPassword').notEmpty().withMessage('Password is required !').bail().isString().trim().withMessage('Invalid data type of password !').bail()
]

aBudgetData=[
    body('nDailyLimit').notEmpty().withMessage('daily limit is required !').bail().isNumeric().withMessage('Daily limit must be a number').bail(),
    body('nWeeklyLimit').notEmpty().withMessage('weekly limit is required !').bail().isNumeric().withMessage('weekly limit must be a number').bail(),
    body('nMonthlyLimit').notEmpty().withMessage('monthly limit is required !').bail().isNumeric().withMessage('monthly limit must be a number').bail(),
]

aIdExpense=[
    param('iId').custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid expense ID !'),
]

aExpenseData=[

  body('oInventory')
    .isArray({ min: 1 })
    .withMessage('oInventory must be a non-empty array'),

  body('oInventory.*.nQuantity')
    .isInt({ min: MIN_QUANTITY })
    .withMessage(`nQuantity must be at least ${MIN_QUANTITY}`),

]

function validateReq(req,res,next){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({massage : errors.array()});
    }
    next();
}

module.exports={aLoginData,aRegisterData,validateReq,aBudgetData,aIdExpense,aExpenseData}