import * as CryptoJS from "crypto-js"
import { units , A } from "./messages"
import * as randomToken from "random-token";
import * as bcrypt from "bcrypt"

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

let randomToken = require('random-token').create('abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
console.log('one', randomToken(16))
console.log('two', randomToken(16))

const saltRounds = 10;
let myPlaintextPassword = 'boogey';
const someOtherPlaintextPassword = 'not_bacon';

bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    console.log('Password for boogey:', hash)
});
myPlaintextPassword = 'vishesh';
bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    console.log('Password for boogey:', hash)
});

console.log("A: ", JSON.stringify(A))