import * as CryptoJS from "crypto-js"

function getKeys(key , random ){
    return key+random;
}

function encrypt(message , pre ,suf){
    let key = pre+""+suf
    let cipher = CryptoJS.AES.encrypt(JSON.stringify(message), key).toString()
    return cipher
}
function decrypt(message , pre , suf){
    let key = pre+""+suf
    let bytes = CryptoJS.AES.decrypt(message, key)
    return bytes;
}
export  {getKeys,encrypt , decrypt};