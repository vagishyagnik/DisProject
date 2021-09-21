import * as exp from "express";
import { userDb } from '../KDC/dbUsers'
import {A, B , TGT , units} from "./messages"
import * as randomToken from "random-token";
import * as CryptoJS from "crypto-js"
import * as secret from "../secrets.json"
import { Console } from "console";

const route = exp.Router()

route.get('/',async (req,res)=>{
    let A : A = JSON.parse(req.headers.a );

    console.log("\nAuthencation request recieved by Authenticator at ",new Date().getTime())
    console.log("\nA : ",A)

    // Retrieve client secret key
    let random = await userDb.findAll({
        attributes: ['hashedPassword'],
        where: {
          username: A.username
        }
    });
    let clientSecretKey = random[0].dataValues.hashedPassword

    let tgtSecretKey = secret.tgtSecretKey

    let randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    let TGSsessionKey = randomToken(16);  

    let date = new Date()
    let B : B = {
        TGSid : 69,
        timestamp : date,
        lifetime : {    
            value : 1000,
            unit: units.minutes 
        },
        TGSsk :  TGSsessionKey
    }

    let TGT : TGT = {
        username : A.username,
        TGSid : 69,
        timestamp : date,
        userIpAddress : A.userIpAddress,
        lifetimeForTGT : { 
            value : 4,
            unit : units.minutes 
        },
        TGSsk : TGSsessionKey
    }

    let cipherB = CryptoJS.AES.encrypt(JSON.stringify(B), clientSecretKey).toString()
    let cipherTGT = CryptoJS.AES.encrypt(JSON.stringify(TGT), tgtSecretKey ).toString()

    console.log("\nClient verified from user authenticator....")
    res.status(200).send({cipherB,cipherTGT})
})

export default route
