import * as exp from "express";
import { userDb } from '../dbUsers'
import { userDetails } from "../messages"
const route = exp.Router()

route.post('/',async (req,res)=>{
    let body = req.body
    let user: userDetails = {
        username: body.username,
        hashedPassword: body.hashedPassword
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

export default route