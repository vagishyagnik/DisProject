import * as exp from "express";
import { userDb } from '../dbUsers'
import * as messages from "../messages"
const route = exp.Router()

route.get('/',(req,res)=>{
    res.send("Response from authentication server")
})

// Just for reference
// userDb.create({
//     username: "Vagish",
//     hashedPassword: "123"
// })

export default route