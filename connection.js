var mysql = require("mysql");
var util = require("util");
var conn = mysql.createConnection({
    "host":"localhost",
    "user":"root",
    "password":"",
    "database":"bade_hospital"
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;