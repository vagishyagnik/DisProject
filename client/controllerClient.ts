import * as exp from "express";
import {A, B, D, F, I, userAuthenticator,  units} from "./messages"
import * as CryptoJS from "crypto-js"
import fetch from 'cross-fetch'

const route = exp.Router()
let userIpAddress = "128.0.0.0"
let serviceId = 1

route.post('/signup', async (req, res)=>{
    if(req.body["password"] != req.body["cpassword"]) {
        res.redirect('/')
        return
    }
    let myPlaintextPassword = req.body["password"]
    let clientSecretKey = CryptoJS.SHA256(myPlaintextPassword).toString()

    let requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: req.body["username"],
            hashedPassword: clientSecretKey
        })
    }
    let response = await fetch("http://localhost:8004/saveUser", requestOptions)
    let result = await response.text()
    res.redirect('/')
})

route.post('/login',async (req,res)=>{
    
    let A : A = {
        username : req.body["username"],
        serviceId : serviceId,
        userIpAddress : userIpAddress,
        requestedLifeTimeForTGT : {
            value : 1000,
            unit : units.minutes
        }
    }
    console.log("\nAuthentication request sent to Authenticator.....")
    console.log("\nA :",A)

    let requestOptions = {
        method: 'GET',
        headers: { A :JSON.stringify(A) },
    };

    let response = await fetch("http://localhost:8004/authServer", requestOptions)
    if(response.status == 400){
        console.log("\nAccess Denied by Authenticator Server !")
        res.send("\nAccess Denied!")
    }
    let result =await response.text()
    result = JSON.parse(result)
    
    console.log("\nAuthenticated done by Authenticator Server :) ")
    console.log("\nResponse from Authenticator Server : ",result)

    let authenticatorB = result["cipherB"]
    let authenticatorTGT = result["cipherTGT"]

    // Generate hashed client secret key using client password (will be provided in req.body)
    const saltRounds = 10;
    let myPlaintextPassword = req.body["password"];
    console.log('this is the recieved password', myPlaintextPassword)
    let clientSecretKey = CryptoJS.SHA256(myPlaintextPassword).toString()
    console.log('Client seccret key -', clientSecretKey)
    let bytes = CryptoJS.AES.decrypt(authenticatorB, clientSecretKey)
    let decryptB: B = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let tgsSessionKey = decryptB.TGSsk

    let D : D = {
        serviceId : serviceId,
        requestedLifeTimeForTGT : {
            value : 1000,
            unit : units.minutes
        }
    }
    let userAuthenticator : userAuthenticator = {
        username : req.body["username"],
        timestamp : new Date()
    }
    let cipherUserAuthenticator = CryptoJS.AES.encrypt(JSON.stringify(userAuthenticator), tgsSessionKey).toString()

    let TGSrequestOptions = {
        method: 'GET',
        headers: {  TGT : authenticatorTGT,
                    D : JSON.stringify(D),
                    UserAuthenticator : cipherUserAuthenticator},
        };  
        
    console.log("\nAuthentication request sent to Ticket Granting Server.....")
    console.log("\nData Send to TGS :",TGSrequestOptions.headers)
    

    let TGSresponse = await fetch("http://localhost:8004/tgs", TGSrequestOptions)
    if(TGSresponse.status == 400){
        console.log("\nAccess Denied by Ticket Granting Server !")
        res.send("\nAccess Denied!")
    }
    let TGSresult =await TGSresponse.text()
    TGSresult = JSON.parse(TGSresult)

    console.log("\nAuthenticated done by TGS :) ")
    console.log("\nResponse from TGS : ", TGSresult)

    let encF = TGSresult["cipherF"]
    let encServiceTicket = TGSresult["cipherServiceTicket"]

    bytes = CryptoJS.AES.decrypt(encF, tgsSessionKey)
    let F: F = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let serviceSessionKey = F["serviceSessionKey"]

    userAuthenticator["timestamp"] = new Date();
    cipherUserAuthenticator = CryptoJS.AES.encrypt(JSON.stringify(userAuthenticator), serviceSessionKey).toString()

    let serverRequestOptions = {
        method: 'GET',
        headers: {  serviceticket : encServiceTicket,
                    userauthenticator : cipherUserAuthenticator
                },
        };    

    console.log("\nAuthentication request sent to Server.....")
    console.log("\nData Send to Server :",serverRequestOptions.headers)

    let Serverresponse = await fetch("http://localhost:7969/", serverRequestOptions)
    if(Serverresponse.status == 400){
        console.log("\nAccess Denied by Server !")
        res.send("\nAccess Denied!")
    }
    let ServerResult =await Serverresponse.text()

    bytes = CryptoJS.AES.decrypt(ServerResult, serviceSessionKey)
    let I: I = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    
    console.log("\nAuthenticated done by Server :) ")
    console.log("\nResponse from Server : ", I)
    
    res.send("\nGot Access")

})

export default route