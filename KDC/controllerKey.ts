import * as exp from "express";
import {KeyEx } from "./messages"
import {getKeys,encrypt , decrypt} from "../client/DiffieHellmen/diffiehellman"

const route = exp.Router()
const secrectKey = "serverSideSecrectKeyforDH";

route.get('/keys',async (req,res)=>{
    let KeyEx : KeyEx = JSON.parse(req.headers.a )
    let publicKey = getKeys(KeyEx.random,secrectKey)
    let symmEncrypKey = getKeys(KeyEx.publicKey,secrectKey)

    // store symmEncryKey
    console.log(symmEncrypKey)
    
    res.status(200).send({publicKey})
})

export default route
