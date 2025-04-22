const express = require('express')
const app = express()
require('dotenv').config()
const nPort = process.env.PORT||3000
const cors=require('cors')
const connectDb=require('./db')
const cookieParser = require('cookie-parser')
const {createResponse,oStatus,oMessage}=require('./helpers/response')
const expenseRoute=require('./Routes/expensesRoute')
const budgetRoute=require('./Routes/budgetRoute')

const authRoute=require('./Routes/authRoute')

app.use(cors())
app.use(express.json())
app.use(cookieParser())

//middleware for error
app.use((err, req, res, next) => {
    return res.status(err.status).json({message:err.message})
  });

// middleware for data routes
app.use("/api/auth",authRoute)
app.use("/api/expenses",expenseRoute);
app.use("/api/budgets",budgetRoute)

//connect to db
connectDb()

app.get("/health", (req, res) => {
    return createResponse(res, oStatus.OK, oMessage.server_up);
});


app.listen(nPort, () => console.log(`app listening on http://localhost:${nPort}`))