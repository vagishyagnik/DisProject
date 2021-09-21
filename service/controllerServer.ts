import * as exp from "express";
import { userAuthenticator, serviceTicket, I } from "./messages"
const route = exp.Router()
import * as CryptoJS from "crypto-js"

route.get('/',(req,res)=>{

    let mySecretKey = "abcd"

    console.log(req.headers)
    let encUserAuth = req.headers.userauthenticator
    let encServiceTicket = req.headers.serviceticket

    let secretServiceKey = mySecretKey

    let bytes  = CryptoJS.AES.decrypt(encServiceTicket, secretServiceKey)
    let serviceTicket: serviceTicket = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let serviceSessionKey = serviceTicket.serviceSessionKey

    bytes = CryptoJS.AES.decrypt(encUserAuth, serviceSessionKey)
    let userAuthenticator: userAuthenticator = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    console.log("\nAuthencation request recieved by Server at ",new Date().getTime())
    console.log("\nEncrypted recieved data: ")
    console.log("\nUser Authenticator : ",encUserAuth)
    console.log("\nService Ticket : ",encServiceTicket)
    console.log("\nDecrypted recieved data: ")
    console.log("\nUser Authenticator : ",userAuthenticator)
    console.log("\nService Ticket : ",serviceTicket)


    if((userAuthenticator.username != serviceTicket.username) || timeDifference(new Date(userAuthenticator.timestamp),new Date( serviceTicket.timestamp), 120)) {
        res.status(400).send('Client not valid - Dropping connection at Server')
        return
    }

    let response: I = {
        serviceId: serviceTicket.serviceId,
        timestamp: new Date()
    }
    let cipherResponse = CryptoJS.AES.encrypt(JSON.stringify(response), serviceSessionKey).toString();
   
    console.log("\nClient verified from server....")
    res.status(200).send(cipherResponse)
})

export default route

function timeDifference(time1: Date, time2: Date, permittedDifference: number): Boolean {
    let minutes: number = Math.abs(time1.getTime() - time2.getTime())/1000
    return minutes > permittedDifference
}