import * as express from "express"
import * as session from "express-session"
import client from "./controllerClient"
const server = express();
import * as address from "./address.json"
const path = require('path')

server.use(express.json());
server.use(express.urlencoded({extended:true}));

server.use(session({
    secret : 'whyudodis',
    resave: false,
    saveUninitialized: true,
}));

server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

server.use(express.static(path.join(__dirname, 'public')))
server.use('/',client)

const PORT = process.env.PORT || address.PORT
server.listen(PORT,()=>{
    console.log('Server started at http://localhost:'+PORT);
})  