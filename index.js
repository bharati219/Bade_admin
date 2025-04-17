var express = require("express");
const nodemailer = require('nodemailer');
var bodyparser = require("body-parser");
var upload = require("express-fileupload");
var session = require("express-session");
var admin_routes = require("./routes/admin");
var user_routes = require("./routes/user");

var app = express();
app.use(express.json());
app.use(bodyparser.urlencoded({extended:true}));
app.use(upload());
app.use(session({
    secret:"a2zithub",
    saveUninitialized:true,
    resave:true
}));

app.use(express.static("public/"));

app.use("/admin",admin_routes);
app.use("/",user_routes);
 

app.listen(1000);