import * as CryptoJS from "crypto-js"

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