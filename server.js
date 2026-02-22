import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { dbConnect } from './config/db.js'
import { adminRoute } from './routes/admin.route.js'
import studentRoute from './routes/student/student.route.js'
import officerRoute from './routes/officer.route.js'
import studentGrievanceRoute from './routes/grievance/studentGrievance.route.js'
import officerGrievanceRoute from './routes/grievance/officerGrievance.route.js'
import adminGrievanceRoute from './routes/grievance/adminGrievance.route.js'
import dashboardRoute from './routes/dashboard.route.js'
dotenv.config()

const app = express()
const port = process.env.PORT
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(cors({
//   origin: "http://localhost:5173",
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true
// }));
app.use(cors())
app.use(cookieParser())
app.use('/admin/officer', officerRoute)
app.use('/admin', adminRoute)
app.use('/student', studentRoute)
app.use('/student/grievance', studentGrievanceRoute)
app.use('/officer/grievance', officerGrievanceRoute)
app.use('/admin/grievance', adminGrievanceRoute)
app.use('/admin/dashboard', dashboardRoute)
// app.get('/',(req,res)=>{
//   res.send('hellow')
// })
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
dbConnect()
app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`)
})

