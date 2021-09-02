import * as exp from "express";
import * as messages from "../messages"
const route = exp.Router()

route.get('/',(req,res)=>{
    res.send("Response from file server")
})

export default route