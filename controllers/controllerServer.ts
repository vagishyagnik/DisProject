import * as exp from "express";
import { userAuthenticator, serviceTicket, I } from "../messages"
const route = exp.Router()
import * as secret from "../secrets.json"
import * as CryptoJS from "crypto-js"


route.get('/',(req,res)=>{

    console.log(req.headers)
    let encUserAuth = req.headers.userauthenticator
    console.log('Encrypted User Authenticator', encUserAuth)
    let encServiceTicket = req.headers.serviceticket
    console.log('Encrypted Service Ticket', encServiceTicket)

    let secretServiceKey = secret.serviceSecretKey
    let bytes  = CryptoJS.AES.decrypt(encServiceTicket, secretServiceKey)
    let serviceTicket: serviceTicket = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let serviceSessionKey = serviceTicket.serviceSessionKey

    bytes = CryptoJS.AES.decrypt(encUserAuth, serviceSessionKey)
    let userAuthenticator: userAuthenticator = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    console.log('Decrypted User Authenticator', userAuthenticator)
    console.log('Decrypted Service Ticket', serviceTicket)

    if((userAuthenticator.username != serviceTicket.username) || (userAuthenticator.timestamp != serviceTicket.timestamp)) {
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