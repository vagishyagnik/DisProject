const Sequelize = require('sequelize');

const db = new Sequelize({
    dialect : 'sqlite',
    storage : __dirname + '/storage_service.db'
});

const serviceDb = db.define('service',{
    serviceId : {
        type : Sequelize.NUMBER,
        allowNull : false,
        unique : true
    },
    serviceSecretKey : {
        type : Sequelize.STRING,
        allowNull : false
    }
});

db.sync().then(()=>{
    console.log("DataBase Ready!");
})

module.exports = { serviceDb }