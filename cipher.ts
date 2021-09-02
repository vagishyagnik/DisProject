import * as CryptoJS from "crypto-js"
import { units , A } from "./messages"

// Encrypt
let date = new Date()
let serviceSessionKey = "acd1010103uhfubhsddgygf"
let serviceSecretKey = "abcd"

let userAuthenticator = {
    username: "Boogey",
    timestamp: date
}
let serviceTicket = {
    username: "Boogey",
    serviceId: 69,
    timestamp: date,
    userIpAddress: "128.0.0.1",
    lifeTimeForServiceTicket: {
        value: 2,
        unit: "min"
    },
    serviceSessionKey: serviceSessionKey
}
let cipherUser = CryptoJS.AES.encrypt(JSON.stringify(userAuthenticator), serviceSessionKey).toString()
let cipherServiceTicket = CryptoJS.AES.encrypt(JSON.stringify(serviceTicket), serviceSecretKey).toString()


console.log(cipherUser)
console.log('=========================')
console.log(cipherServiceTicket)

// A object json to string
let A : A = {
    username: "Boogey",
    serviceId: 1,
    userIpAddress: "128.0.0.0",
    requestedLifeTimeForTGT: {
        value : 1000,
        unit : units.minutes
    }
}

console.log("A: ", JSON.stringify(A))