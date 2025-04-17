var mysql = require("mysql");
var util = require("util");
var conn = mysql.createConnection({
    "host":"byxjmh2nfvcpwneihzue-mysql.services.clever-cloud.com",
    "user":"uakc3j5k7dkc2ynw",
    "password":"ros2nx2RRLJYe673Gb1S",
    "database":"byxjmh2nfvcpwneihzue"
});

var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;
