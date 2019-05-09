const mysql    = require('mysql');
const mongoose = require('mongoose');

export const initMongoConnection = () => {
    const connectionStr = `mongodb://${process.env.SCHMUCKS_MONGO_USERNAME}:${process.env.SCHMUCKS_MONGO_PASSWORD}@cluster0-shard-00-00-a5oes.mongodb.net:27017,cluster0-shard-00-01-a5oes.mongodb.net:27017,cluster0-shard-00-02-a5oes.mongodb.net:27017/schmucksAdmin?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true`;
    mongoose.connect(connectionStr, {useNewUrlParser: true}).then(
        () => { console.log("Successfully connected to MongoDB"); },
        err => { 
            throw err;
        }
    );
}

export const initMysqlConnection = () => {
    const connection = mysql.createConnection({
        host: "dating-prod-read.cuysgrvqotwf.us-east-1.rds.amazonaws.com",
        user: process.env.SCHMUCKS_MYSQL_USERNAME,
        password: process.env.SCHMUCKS_MYSQL_PASSWORD,
        database: "dating"
    });
    
    connection.connect((err) => {
        if (err) throw err;
        console.log("Successfully connected to MySQL DB!");
    });
    
    return connection; 
}