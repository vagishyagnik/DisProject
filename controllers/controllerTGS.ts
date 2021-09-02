import * as exp from "express";
import { serviceDb } from '../dbService'
import {userAuthenticator, D, TGT, F, serviceTicket, units} from "../messages"
import * as randomToken from "random-token";
import * as CryptoJS from "crypto-js"
import * as secret from "../secrets.json"
const route = exp.Router()

route.get('/',(req,res)=>{
    let encTGT = req.headers.tgt
    let D : D = req.headers.d
    let encUserAuthenticator = req.header.userAuthenticator

    let tgtSecretKey = secret.tgtSecretKey
    let bytes  = CryptoJS.AES.decrypt(encTGT, tgtSecretKey)
    let TGT : TGT = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    bytes  = CryptoJS.AES.decrypt(encUserAuthenticator, TGT.TGSsk)
    let userAuthenticator : userAuthenticator = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    if((userAuthenticator.username != TGT.username) || (userAuthenticator.timestamp != TGT.timestamp)) {
        res.status(400).send('Client not valid - Dropping connection')
        return
    }
    let randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    let serviceSessionKey = randomToken(16);  

    let date = new Date()

    let F : F ={
        serviceId: D.serviceId,
        timestamp: date,
        lifetime: {
            value : 1000,
            unit : units.minutes
        },
        serviceSessionKey: serviceSessionKey
    }

    let serviceTicket : serviceTicket ={
        username: TGT.username, 
        serviceId: D.serviceId,
        timestamp: date,
        userIpAddress: TGT.userIpAddress,
        lifeTimeForServiceTicket: {
            value : 1000,
            unit : units.minutes
        },
        serviceSessionKey: serviceSessionKey
    }

    let serviceSecretKey = secret.serviceSecretKey

    let cipherF = CryptoJS.AES.encrypt(JSON.stringify(F), TGT.TGSsk).toString()
    let cipherServiceTicket = CryptoJS.AES.encrypt(JSON.stringify(serviceTicket), serviceSecretKey  ).toString()

    res.status(200).send({cipherF, cipherServiceTicket})
})

// Just for reference
// serviceDb.create({
//     serviceId: 1,
//     serviceSecretKey: "123"
// })

export default route