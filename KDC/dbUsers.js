const Sequelize = require('sequelize');

const db = new Sequelize({
    dialect : 'sqlite',
    storage : __dirname + '/storage_users.db'
});

const userDb = db.define('customer',{
    username : {
        type : Sequelize.STRING,
        allowNull : false,
        unique : true
    },
    hashedPassword : {
        type : Sequelize.STRING,
        allowNull : false
    }
});

db.sync().then(()=>{
    console.log("DataBase Ready!");
})
module.exports = { userDb }