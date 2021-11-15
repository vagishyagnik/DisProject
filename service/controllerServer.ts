import * as exp from "express";
import { userAuthenticator, serviceTicket, I } from "./messages"
const route = exp.Router()
import * as CryptoJS from "crypto-js"
const fs = require('fs')
const path = require('path')

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

    let userIpAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if((userAuthenticator.username != serviceTicket.username) || timeDifference(new Date(userAuthenticator.timestamp),new Date( serviceTicket.timestamp), serviceTicket.lifeTimeForServiceTicket.value)) {
    // || serviceTicket.userIpAddress != userIpAddress) { NOT WORKING
        res.status(400).send('Client not valid - Dropping connection at Server')
        return
    }

    let response: I = {
        serviceId:  Number(serviceTicket.serviceId),
        timestamp: new Date(),
        data: ['/xfgvhmbjjhgfxdxv-gfrg', '/hgnfbdvsfdrwetdgf-sdfgh']
    }
    let cipherResponse = CryptoJS.AES.encrypt(JSON.stringify(response), serviceSessionKey).toString();
   
    console.log("\nClient verified from server....")

    // var data = fs.readFileSync(path.join(__dirname, './Vagish_Shanker_Yagnik Resume.pdf'))
    // res.contentType("application/pdf")
    // res.send(data);
    res.status(200).send(cipherResponse)
})

route.get('/xfgvhmbjjhgfxdxv-gfrg', (req, res)=>{
    console.log(req.headers)
    let filePath = "/Vagish_Shanker_Yagnik Resume.pdf";
    fs.readFile(__dirname + filePath , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
    })
})

route.get('/hgnfbdvsfdrwetdgf-sdfgh', (req, res)=>{
    console.log(req.header)
    let filePath = "/Vagish_Shanker_Yagnik Resume.pdf";
    fs.readFile(__dirname + filePath , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
    })
})

export default route

function timeDifference(time1: Date, time2: Date, permittedDifference: number): Boolean {
    let minutes: number = Math.abs(time1.getTime() - time2.getTime())/1000
    return minutes > permittedDifference
}