import * as express from "express"
import * as session from "express-session";
import authServer from "./controllerAuthServer"
import TGS from "./controllerTGS"
import save from "./controllerSave"
import KEY from "./controllerKey"
import * as address from "./address.json"
const path = require('path')
const server = express();

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

// server.get('/',(req,res)=>{
//     res.send({response : 'Success'})
// })
server.use('/',express.static(path.join(__dirname, 'public')))
server.use('/save', save)

server.use('/authServer', authServer)
server.use('/tgs', TGS)

server.use('/key', KEY)

const PORT = process.env.PORT || address.PORT
server.listen(PORT,()=>{
    console.log('Server started at http://localhost:'+PORT);
})