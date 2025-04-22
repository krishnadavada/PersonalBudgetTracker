const mongoose=require('mongoose')
require('dotenv').config()

const connectDb=async()=>{
    try{
        const conn=await mongoose.connect(process.env.MONGODB_URI)
        console.log('MongoDb connected...')
    }
    catch(err){
        console.log(err)
    }
}

module.exports=connectDb