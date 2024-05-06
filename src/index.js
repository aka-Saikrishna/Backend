
// require('dotenv').config({path: './env'})


import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path: './env'
})


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGODB connection FAILED", err)
})



















/* Approach 1
// function connectDB(){}

// connectDB()
// TO make code better we can use IIFE

( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error", (error)=>
    { 
        console.log("Error:", error);
        throw err 
    })
    app.listen(process.env.PORT, ()=> {
        console.log(`App is listening on pott ${process.env.PORT}`)
    })
    } catch (error) {
        console.log("Error:", error);
        throw err
    }
}) () 

*/
/* Approach 2 -> 
    Lets create a new file, write the whole connect to DB code in that file expot the file and then import it here.
*/