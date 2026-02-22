import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

export const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    console.log(`Database connected...`)
  } catch (error) {
    console.log(process.env.MONGO_URL)
    console.log(`Database not connected!!! ${error}`)
  }
}