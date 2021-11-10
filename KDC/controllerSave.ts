import * as exp from "express";
import { userDb } from './dbUsers'
import { serviceDb } from "./dbService"
import { userDetails } from "./messages"
import * as CryptoJS from "crypto-js"
const route = exp.Router()

route.post('/user',async (req,res)=>{
    let body = req.body
    // Generate hashed client secret key using client password (will be provided in req.body)
    if(body["password"] != body["passwordC"]) {
        res.status(400).send('Invalid Password - error')
        return
    } 
    let myPlaintextPassword = body["password"];
    console.log('this is the recieved password', myPlaintextPassword)
    let clientSecretKey = CryptoJS.SHA256(myPlaintextPassword).toString()
    console.log('Client secret key -', clientSecretKey)

    let user: userDetails = {
        username: body.username,
        hashedPassword: clientSecretKey
    }

    userDb.findAll({
        where: { username: req.body.username }
    }).then((value)=>{
        console.log('value', value)
        if(value.length == 0) {
            userDb.create(user).then((values)=>{
                res.status(200).send('User added succesfully')
                return
            }).catch((error)=>{
                res.status(400).send({'Invalid Detail - error': error})
                return
            })
        } else {
            res.status(400).send('User already exists')
            return
        }
    }).catch((error)=>{
        res.status(400).send({'Invalid Detail - error': error})
        return
    })
})

route.post('/service',async (req,res)=>{
    let body = req.body

    if(body["serviceSecretKey"] != body["serviceSecretKeyC"]) {
        res.status(400).send('Invalid Key - error')
        return
    }
    let service = {
        serviceId: body.serviceId,
        serviceSecretKey: body.serviceSecretKey
    }

    serviceDb.findAll({
        where: { serviceId: body.serviceId }
    }).then((value)=>{
        console.log('value', value)
        if(value.length == 0) {
            serviceDb.create(service).then((values)=>{
                res.status(200).send('Service added succesfully')
                return
            }).catch((error)=>{
                res.status(400).send({'Invalid Detail - error': error})
                return
            })
        } else {
            res.status(400).send('Service already exists')
            return
        }
    }).catch((error)=>{
        res.status(400).send({'Invalid Detail - error': error})
        return
    })
})
export default route