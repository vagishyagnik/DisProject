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
    console.log(KeyEx)
    let keyRequestOptions = {
        method: 'GET',
        headers: { KeyEx :JSON.stringify(KeyEx) },
    };

    // let keyResponse = await fetch(address.kdc.key, keyRequestOptions)
    // if(keyResponse.status == 400){
    //     console.log("\nAccess Denied by Authenticator Server !")
    //     res.send("\nAccess Denied!")
    // }
    // let keyResult =await keyResponse.text()
    // keyResult = JSON.parse(keyResult)

    // let symmKey = getKeys(clientPrivateKey,keyResult["publicKey"])

    // diffie hellman ends
    // ***************************************************************


    let A : A = {
        username : req.body["username"],
        serviceId : serviceId,
        userIpAddress : userIpAddress,
        requestedLifeTimeForTGT : {
            value : 2,
            unit : units.minutes
        }
    }
    console.log("\nAuthentication request sent to Authenticator.....")
    console.log("\nA :",A)

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
    console.log(result)

    // DH decryption ********************************
    let symmKey = getKeys(clientPrivateKey,result["publicKey"])
    console.log(symmKey )
    let bytesTemp = CryptoJS.AES.decrypt(result["cipherAuthSer"], symmKey)
    console.log(bytesTemp)
    result =await JSON.parse(bytesTemp.toString(CryptoJS.enc.Utf8))
    // DH decryption ends****************************
    console.log(result)

    console.log("\nAuthenticated done by Authenticator Server :) ")
    console.log("\nResponse from Authenticator Server : ",result)
    console.log(result)

    let authenticatorB = result["cipherB"]
    let authenticatorTGT = result["cipherTGT"]

    // Generate hashed client secret key using client password (will be provided in req.body)
    const saltRounds = 10;
    let myPlaintextPassword = req.body["password"];
    console.log('this is the recieved password', myPlaintextPassword)
    let clientSecretKey = CryptoJS.SHA256(myPlaintextPassword).toString()
    console.log('Client secret key -', clientSecretKey)
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
    let ServerResult =await Serverresponse.text()

    bytes = CryptoJS.AES.decrypt(ServerResult, serviceSessionKey)
    let I: I = JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    
    console.log("\nAuthentication done by Server :) ")
    console.log("\nResponse from Server : ", I)
    
    res.send("\nGot Access")

})

export default route