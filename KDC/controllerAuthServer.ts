import * as exp from "express";
import { userDb } from './dbUsers'
import {A, B , TGT ,units, AuthSer,KeyEx } from "./messages"
import * as CryptoJS from "crypto-js"
import * as secret from "./secrets.json"
import {getKeys,encrypt , decrypt} from "../client/DiffieHellmen/diffiehellman"

const route = exp.Router()

const authSecrectKey = "serverSideSecrectKeyforDH";

route.get('/',async (req,res)=>{
    // ------------------------- STEP 2 STARTS ------------------------- //
    let A : A = JSON.parse(req.headers.a )
    let KeyEx : KeyEx = JSON.parse(req.headers.keyex )

    console.log("\nAuthencation request recieved by Authenticator at ",new Date().getTime())
    console.log("\nA : ",A)

    // Retrieve client secret key
    let random = await userDb.findAll({
        attributes: ['hashedPassword'],
        where: {
          username: A.username
        }
    });
    if(random.length == 0) res.status(400).send('Invalid Detail - error')
    let clientSecretKey = random[0].dataValues.hashedPassword

    let tgsSecretKey = secret.tgsSecretKey

    let randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    let TGSsessionKey = randomToken(16);  

    let date = new Date()
    let B : B = {
        TGSid : secret.TGSid,
        timestamp : date,
        lifetime : A.requestedLifeTimeForTGT,
        TGSsk :  TGSsessionKey
    }

    let TGT : TGT = {
        username : A.username,
        TGSid : secret.TGSid,
        timestamp : date,
        userIpAddress : A.userIpAddress,
        lifetimeForTGT : A.requestedLifeTimeForTGT,
        TGSsk : TGSsessionKey
    }

    let cipherB = CryptoJS.AES.encrypt(JSON.stringify(B), clientSecretKey).toString()
    let cipherTGT = CryptoJS.AES.encrypt(JSON.stringify(TGT), tgsSecretKey ).toString()

// ---DIFFIE---
    let publicKey = getKeys(KeyEx.random,authSecrectKey)
    let symmEncrypKey = getKeys(KeyEx.publicKey,authSecrectKey)
    let AuthSer : AuthSer = {
        cipherB : cipherB,
        cipherTGT : cipherTGT 
    }
    console.log("\n Response to be send to client :",AuthSer)
    let cipherAuthSer = CryptoJS.AES.encrypt(JSON.stringify(AuthSer), symmEncrypKey ).toString()

    console.log("\nAfter encryption using Diffie-Hellman :",cipherAuthSer)
    console.log("\nClient verified from user authenticator....")

    res.status(200).send({cipherAuthSer, publicKey  })
    // ------------------------- STEP 2 ENDS ------------------------- //

})

export default route
