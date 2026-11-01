
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,

    ssl: process.env.DB_SSL === "true"
        ? {
            ca: fs.readFileSync(
                path.join(__dirname, "aiven-ca.pem"),
                "utf8"
            )
        }
        : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;
