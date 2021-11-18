import * as exp from "express";
import {A, B, D, F, I, userAuthenticator,  units, KeyEx} from "./messages"
import * as CryptoJS from "crypto-js"
import * as address from "./address.json"
import fetch from 'cross-fetch'
import {getKeys,encrypt , decrypt} from "./DiffieHellmen/diffiehellman"

const route = exp.Router()
let userIpAddress = null
let serviceId = 1


route.post('/login',async (req,res)=>{
    userIpAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    console.log("client IP is *********************", userIpAddress);

    // diffie hellman*************************************************

    let randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    let OneTimeToken = randomToken(10); 
    let clientPrivateKey = CryptoJS.SHA256(req.body["password"]).toString()
    let clientPublicKey = getKeys(clientPrivateKey, OneTimeToken);
    let KeyEx : KeyEx = {
        publicKey: clientPublicKey,
        random: OneTimeToken
    }   

    let A : A = {
        username : req.body["username"],
        serviceId : Number(serviceId),
        userIpAddress : userIpAddress,
        requestedLifeTimeForTGT : {
            value : 2,
            unit : units.minutes
        }
    }
    console.log("\nAuthentication request sent to Authenticator.....")
    console.log("\nData Sent:")
    console.log("\nA :",A)
    console.log("\n Key Exchange :" , KeyEx)

    let requestOptions = {
        method: 'GET',
        headers: { 
            A : JSON.stringify(A),
            KeyEx : JSON.stringify(KeyEx)
        },
    };

    let response = await fetch(address.kdc.authServer, requestOptions)
    if(response.status == 400){
        console.log("\nAccess Denied by Authenticator Server !")
        res.send("\nAccess Denied!")
    }
    let result =await response.text()
    result = JSON.parse(result)

    console.log("\nAuthenticated done by Authenticator Server :) ")
    console.log("\nEncrypted Response from Authenticator Server: \n",result["cipherAuthSer"])

    let symmKey = getKeys(clientPrivateKey,result["publicKey"])
    let bytesTemp = CryptoJS.AES.decrypt(result["cipherAuthSer"], symmKey)
    result =await JSON.parse(bytesTemp.toString(CryptoJS.enc.Utf8))

    
    console.log("\nDecrypted packet using Diffie-Hellman: ",result)
    let authenticatorB = result["cipherB"]
    let authenticatorTGT = result["cipherTGT"]

    // Generate hashed client secret key using client password (will be provided in req.body)
    const saltRounds = 10;
    let myPlaintextPassword = req.body["password"];
    let clientSecretKey = CryptoJS.SHA256(myPlaintextPassword).toString()
    let bytes = CryptoJS.AES.decrypt(authenticatorB, clientSecretKey)
    let decryptB: B = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let tgsSessionKey = decryptB.TGSsk

    let D : D = {
        serviceId : serviceId,
        requestedLifeTimeForTGT : {
            value : 2,
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
        headers: {  
            TGT : authenticatorTGT,
            D : JSON.stringify(D),
            UserAuthenticator : cipherUserAuthenticator
        },
    };  
        
    console.log("\nAuthentication request sent to Ticket Granting Server.....")
    console.log("\nData Send to TGS :",TGSrequestOptions.headers)
    

    let TGSresponse = await fetch(address.kdc.tgs, TGSrequestOptions)
    if(TGSresponse.status == 400){
        console.log("\nAccess Denied by Ticket Granting Server !")
        res.send("\nAccess Denied!")
    }
    let TGSresult = await TGSresponse.text()
    TGSresult = JSON.parse(TGSresult)

    console.log("\nAuthenticated done by TGS :) ")
    console.log("\nResponse from TGS : ", TGSresult)

    let encF = TGSresult["cipherF"]
    let encServiceTicket = TGSresult["cipherServiceTicket"]
// ----
    bytes = CryptoJS.AES.decrypt(encF, tgsSessionKey)
    let F: F = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))

    let serviceSessionKey = F["serviceSessionKey"]

    userAuthenticator["timestamp"] = new Date();
    cipherUserAuthenticator = CryptoJS.AES.encrypt(JSON.stringify(userAuthenticator), serviceSessionKey).toString()

    let serverRequestOptions = {
        method: 'GET',
        headers: {  
            serviceticket : encServiceTicket,
            userauthenticator : cipherUserAuthenticator
        },
    };    

    console.log("\nAuthentication request sent to Server.....")
    console.log("\nData Send to Server :",serverRequestOptions.headers)

    let Serverresponse = await fetch(address.service, serverRequestOptions)
    if(Serverresponse.status == 400){
        console.log("\nAccess Denied by Server !")
        res.send("\nAccess Denied!")
    }
    let ServerResult = await Serverresponse.text()
    console.log('----------------', ServerResult)
    bytes = CryptoJS.AES.decrypt(ServerResult, serviceSessionKey)
    let I: I = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    
    console.log("\nAuthentication done by Server :) ")
    console.log("\nResponse from Server : ", I)
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        </head>
        <body style="background-image: url('https://twelvesec.com/wp-content/uploads/2020/03/security.jpg')">
            <center><h1 style="background-color: red; color: white;">\nGot Access</h1></center> <br>
            <h2 style="color: white;"> To get the Project report,  <button style="background-color: blue; width: 10%; height: 6%; font-size: 70%; border-radius: 50%;"> <a href="http://localhost:7969` + I.data[1] + `" style="color: white; text-decoration: none">PRESS ME</a></button>  </h2>
            <h2 style="color: white;"> To get the Project Presentation, <button style="background-color: brown; width: 10%; height: 6%; font-size: 70%; border-radius: 50%;"> <a href="http://localhost:7969` + I.data[0] + `" style="color: white; text-decoration: none">PRESS ME</a></button> </h2>
        </body>
        </html>
    `)
})

export default route