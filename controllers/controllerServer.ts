import * as exp from "express";
import { userAuthenticator, serviceTicket, I } from "../messages"
const route = exp.Router()
import * as CryptoJS from "crypto-js"

route.get('/',(req,res)=>{

    let mySecretKey = "abcd"

    console.log(req.headers)
    let encUserAuth = req.headers.userauthenticator
    console.log('Encrypted User Authenticator', encUserAuth)
    let encServiceTicket = req.headers.serviceticket
    console.log('Encrypted Service Ticket', encServiceTicket)

    let secretServiceKey = mySecretKey

    let bytes  = CryptoJS.AES.decrypt(encServiceTicket, secretServiceKey)
    let serviceTicket: serviceTicket = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let serviceSessionKey = serviceTicket.serviceSessionKey

    bytes = CryptoJS.AES.decrypt(encUserAuth, serviceSessionKey)
    let userAuthenticator: userAuthenticator = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    console.log('Decrypted User Authenticator', userAuthenticator)
    console.log('Decrypted Service Ticket', serviceTicket)

    if((userAuthenticator.username != serviceTicket.username) || timeDifference(userAuthenticator.timestamp, serviceTicket.timestamp, 120)) {
        res.status(400).send('Client not valid - Dropping connection')
        return
    }

    let response: I = {
        serviceId: serviceTicket.serviceId,
        timestamp: new Date()
    }
    let cipherResponse = CryptoJS.AES.encrypt(JSON.stringify(response), serviceSessionKey).toString();
    res.status(200).send(cipherResponse)
})

export default route



function timeDifference(time1: Date, time2: Date, permittedDifference: number): Boolean {
    let minutes: number = Math.abs(time1.getTime() - time2.getTime())/1000
    return minutes <= permittedDifference
}