import * as exp from "express";
import { serviceDb } from '../dbService'
import * as messages from "../messages"
const route = exp.Router()

route.get('/',(req,res)=>{
    res.send("Response from TGS server")
})

// Just for reference
// serviceDb.create({
//     serviceId: 1,
//     serviceSecretKey: "123"
// })

export default route