import * as exp from "express";
import {A, B, D, userAuthenticator,  units} from "../messages"
import * as CryptoJS from "crypto-js"
import fetch from 'cross-fetch'
import * as bcrypt from "bcrypt"

const route = exp.Router()
let username = "Boogey"
let userIpAddress = "128.0.0.0"
let serviceId = 1

route.get('/signup', async (req, res)=>{
    if(req.body["password"] != req.body["cpassword"]) {
        res.redirect('/')
        return
    }
    const saltRounds = 10;
    let myPlaintextPassword = req.body["password"];
    const someOtherPlaintextPassword = 'not_bacon';

    bcrypt.hash(myPlaintextPassword, saltRounds, async function(err, hash) {
        console.log('Password for ',req.body["username"],": ", hash)
        let requestOptions = {
            method: 'GET'
        };
        let response = await fetch("http://localhost:6979/saveUser", requestOptions)
        let result = await response.text()
        result = JSON.parse(result)
    });
})
route.get('/login',async (req,res)=>{
    
    let A : A = {
        username : username,
        serviceId : serviceId,
        userIpAddress : userIpAddress,
        requestedLifeTimeForTGT : {
            value : 1000,
            unit : units.minutes
        }
    }

    let requestOptions = {
        method: 'GET',
        headers: { A :JSON.stringify(A) },
    };


    let response = await fetch("http://localhost:6979/authServer", requestOptions)
    let result =await response.text()
    result = JSON.parse(result)

    let authenticatorB = result["cipherB"]
    let authenticatorTGT = result["cipherTGT"]


    // Generate hashed client secret key using client password (will be provided in req.body)
    const saltRounds = 10;
    let myPlaintextPassword = req.body["password"];
    const someOtherPlaintextPassword = 'not_bacon';

    bcrypt.hash(myPlaintextPassword, saltRounds, async function(err, hash) {
        console.log('Password for ',req.body["username"],": ", hash)
    });
    let clientSecretKey = "$2b$10$f6QoqD4Dg2dyH51isX2/lOvJSlxJHFqaj.1bYQN8cuDA5p0NFTJgG"
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
        username : username,
        timestamp : new Date()
    }
    let cipherUserAuthenticator = CryptoJS.AES.encrypt(JSON.stringify(userAuthenticator), tgsSessionKey).toString()

    let TGSrequestOptions = {
        method: 'GET',
        headers: {  
            TGT : authenticatorTGT,
            D : JSON.stringify(D),
            UserAuthenticator : cipherUserAuthenticator},
        };    
    let TGSresponse = await fetch("http://localhost:6979/tgs", TGSrequestOptions)
    let TGSresult =await TGSresponse.text()
    console.log("TGS result : " , TGSresult)
    TGSresult = JSON.parse(TGSresult)
    
    console.log("TGS Response : ", TGSresult)
    res.send(" Got Access")
})

export default route
