import * as express from "express"
import * as session from "express-session"
import service from "./controllerServer"
import * as address from "./address.json"
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

server.use('/',service)


const PORT = process.env.PORT || address.PORT
server.listen(PORT,()=>{
    console.log('Server started at http://localhost:'+PORT);
})