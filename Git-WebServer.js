/**
 * Master Configuration JSON For more information check document at
 * //TODO
 * @typedef {Object} JSON.config
 * @property {String} salt Encription Key (required)
 * @property {Integer} port Server Port Number - Default : 80
 * @property {Integer} gitURL Git Specific URL - Default : /git
 * @property {Integer} repoDir Git repository folder name - Default : repos
 * @property {Integer} repositories List of repository JSON objects - Default : {}
 * @property {Integer} defaultUsers Array of user funcion object - Default : []
 * @property {Integer} appName Application Name - Default : Git-WebServer
 * @property {Integer} logging console logging control - Default : true
 * @property {Integer} dbName Name of the Database - Default : GitWebServer
 * @property {Integer} dbURL URL to reach Database Server - Default : localhost
 * @property {Integer} dbUser Database access username - Default : ""
 * @property {Integer} dbPassword Database access password - Default : ""
 * @property {Integer} database Type of database you choose - Default : "Mongo"
 */
/**
 * Initialize Git-WebServer with provided configuration details
 * @param  {JSON.config} Config
 */
exports.server = function (Config) {
    if ((Config.salt != undefined) &&
        (Config.salt != "") &&
        (Config.salt != null) &&
        (Config.salt.length >= 8)) {
        var config = Config;
        config.port = config.port || 80;
        config.gitURL = config.gitURL || "/git";
        config.repoDir = config.repoDir || "repos";
        config.repositories = config.repositories || {};
        config.defaultUsers = config.defaultUsers || [];
        config.appName = config.appName || "Git-WebServer";
        config.logging = config.logging || true;
        config.dbName = config.dbName || "GitWebServer";
        config.dbURL = config.dbURL || "localhost";
        config.dbUser = config.dbUser || "";
        config.dbPassword = config.dbPassword || "";
        config.database = config.database || "Mongo";
        //Dependency Middlewares
        var express = require("express");
        var expressHandlebars = require("express-handlebars");
        var expressSession = require("express-session");
        var fileSystem = require("fs");
        var route = express.Router();
        var bodyParser = require('body-parser');
        var methodOverride = require('method-override');
        var cookie = require("cookie-parser");
        var mongoDB = require("mongoose");
        var logging = require("morgan");
        var request = require("./modules/request");
        var mongoStore = require("connect-mongo")(expressSession);
        var expressServer = express();
        if (!fileSystem.existsSync("./" + config.repoDir)) {
            fileSystem.mkdirSync("./" + config.repoDir);
        }
        var mongoURI = "mongodb://" + config.dbURL + "/" + config.dbName;
        if (config.dbUser != "" && config.dbPassword != "") {
            if (config.logging) console.log("Attempting MongoDB login with provided credentials...");
            mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
        }
        var connection = mongoDB.createConnection(mongoURI, {},
            function (err) {
                if (err) {
                    if (config.logging) console.log("Error Connecting MongoDB " + err);
                } else {
                    if (config.logging) console.log("MongoDB Connection established");
                }
            }
        );
        expressServer.use(cookie());
        expressServer.use(
            expressSession({
                secret: config.salt,
                resave: false,
                store: new mongoStore({
                    mongooseConnection: connection
                }),
                saveUninitialized: false,
                name: "SID",
                rolling: true,
                proxy: false,
                cookie: {
                    path: "/",
                    httpOnly: true,
                    secure: false,
                    sameSite: true,
                    maxAge: 60000
                }
            })
        );
        expressServer.engine(
            "handlebars",
            expressHandlebars({
                defaultLayout: "default"
            })
        );
        expressServer.set("view engine", "handlebars");
        expressServer.disable("x-powered-by");
        expressServer.use(express.static(__dirname + "./public"));
        expressServer.use(bodyParser.urlencoded({
            extended: false
        }));
        expressServer.use(methodOverride());
        expressServer.use(express.query());
        expressServer.use(logging("dev", route));
        expressServer.use(request.get(route, config));
        expressServer.use(request.post(route, config));
        //Error Handling
        expressServer.use(function (req, res) {
            res.status(404);
            res.render("errors/404", {
                layout: false
            });
        });
        expressServer.use(function (req, res) {
            res.status(500);
            res.render("errors/500", {
                layout: false
            });
        });
        expressServer.listen(config.port, function () {
            if (config.logging) console.log(config.appName + " Running at Port : " + config.port);
        });
    } else {
        console.log("Salt key is mandatory in launch configuration.");
        console.log("Salt key shouldhave min. length of 8 char.");
        console.log("Git-WebServer Launch Terminated.");
    }
};