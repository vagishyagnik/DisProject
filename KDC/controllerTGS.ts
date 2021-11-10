import * as exp from "express";
import { serviceDb } from './dbService'
import {userAuthenticator, D, TGT, F, serviceTicket, units} from "./messages"
import * as randomToken from "random-token";
import * as CryptoJS from "crypto-js"
import * as secret from "../secrets.json"
const route = exp.Router()

route.get('/',(req,res)=>{
    let encTGT = req.headers.tgt
    let D : D = req.headers.d
    let encUserAuthenticator = req.headers.userauthenticator

    let tgsSecretKey = secret.tgsSecretKey

    let bytes  = CryptoJS.AES.decrypt(encTGT, tgsSecretKey)
    let TGT : TGT = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    bytes  = CryptoJS.AES.decrypt(encUserAuthenticator, TGT.TGSsk)
    let userAuthenticator : userAuthenticator = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    console.log("\nAuthencation request recieved by TGS at ",new Date().getTime())
    console.log("\nEncrypted recieved data: ")
    console.log("\nD : ",D)
    console.log("\nTGT : ",encTGT)
    console.log("\nUser Authenticator : ",encUserAuthenticator)
    console.log("\nDecrypted recieved data: ")
    console.log("\nTGT : ",TGT)
    console.log("\nUser Authenticator : ",userAuthenticator)

    let userIpAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    console.log('szfxgfghgffssasfv------------------------', userIpAddress, TGT.userIpAddress)
    if((userAuthenticator.username != TGT.username) || timeDifference(new Date(userAuthenticator.timestamp), new Date(TGT.timestamp), TGT.lifetimeForTGT.value)) { 
    // || TGT.userIpAddress != userIpAddress) { NOT WORKING
        res.status(400).send('Client not valid - Dropping connection at TGS')
        return
    }
    let randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    let serviceSessionKey = randomToken(16);  

    let date = new Date()

    let F : F ={
        serviceId: D.serviceId,
        timestamp: date,
        lifetime: {
            value : 2,
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
            value : 2,
            unit : units.minutes
        },
        serviceSessionKey: serviceSessionKey
    }

    let serviceSecretKey = secret.serviceSecretKey

    let cipherF = CryptoJS.AES.encrypt(JSON.stringify(F), TGT.TGSsk).toString()
    let cipherServiceTicket = CryptoJS.AES.encrypt(JSON.stringify(serviceTicket), serviceSecretKey  ).toString()

    console.log("\nclient verified from tgs....")
    res.status(200).send({cipherF,cipherServiceTicket})
})

// Just for reference
// serviceDb.create({
//     serviceId: 1,
//     serviceSecretKey: "123"
// })

export default route

function timeDifference(time1: Date, time2: Date, permittedDifference: number): Boolean {
    let minutes: number = Math.abs(time1.getTime() - time2.getTime())/1000
    return minutes > permittedDifference
}