import * as exp from "express";
import { userAuthenticator, serviceTicket, I } from "../messages"
const route = exp.Router()
import * as CryptoJS from "crypto-js"

route.post('/',(req,res)=>{
    
    res.send(" Got Access")
})

export default route
