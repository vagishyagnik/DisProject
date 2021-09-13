import * as express from "express"
import * as session from "express-session";
import authServer from "./controllers/controllerAuthServer"
import TGS from "./controllers/controllerTGS"
import saveUser from "./controllers/controllerSaveUser"
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

server.get('/',(req,res)=>{
    res.send({response : 'Success'})
})

server.use('/saveUser', saveUser)

server.use('/authServer', authServer)
server.use('/tgs', TGS)

const PORT = process.env.PORT || 8004
server.listen(PORT,()=>{
    console.log('Server started at http://localhost:'+PORT);
})