/**
 * HTTPS SSL certificate file details
 * @typedef {Object} JSON.ssl
 * @property {String} pemKey pem key file path - Default : ""
 * @property {String} pemCert pem certificate file path - Default : ""
 * @property {String} key key file path - Default : ""
 * @property {String} cert certificate file path - Default : ""
 * @property {String} ca ca file path - Default : ""
 */
/**
 * Master Configuration JSON For more information check document at
 * @typedef {Object} JSON.config
 * @property {String} salt Encription Key (required)
 * @property {Integer} port Server Port Number - Default : 80
 * @property {String} gitURL Git Specific URL - Default : /git
 * @property {String} repoDir Git repository folder name - Default : repos
 * @property {Object} repositories List of repository JSON objects - Default : {}
 * @property {Array} defaultUsers Array of user funcion object - Default : []
 * @property {String} appName Application Name - Default : Git-WebServer
 * @property {bool} logging console logging control - Default : true
 * @property {String} dbName Name of the Database - Default : GitWebServer
 * @property {String} dbURL URL to reach Database Server - Default : localhost
 * @property {String} dbUser Database access username - Default : ""
 * @property {String} dbPassword Database access password - Default : ""
 * @property {String} database Type of database you choose - Default : "Mongo"
 * @property {bool} enableSSL Enable SSL Connection - Default : false
 * @param {JSON.ssl} sslProperties SSL certificate properties - Default : {}
 */
/**
 * Initialize Git-WebServer with provided configuration details
 * @param  {JSON.config} Config Master configuration file
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
        config.enableSSL = config.enableSSL || false;
        config.sslProperties = config.sslProperties || {};
        config.sslProperties.pemKey = config.sslProperties.pemKey || "";
        config.sslProperties.pemCert = config.sslProperties.pemCert || "";
        config.sslProperties.key = config.sslProperties.key || "";
        config.sslProperties.cert = config.sslProperties.cert || "";
        config.sslProperties.ca = config.sslProperties.ca || "";
        config.dirname = __dirname;
        if(config.logging){
            console.log("Git-WebServer is initailising with below configuration");
            console.log(config);
        }
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
        var https = require('https');
        var request = require("./modules/request");
        var mongoStore = require("connect-mongo")(expressSession);
        var expressServer = express();
        if (!fileSystem.existsSync("./" + config.repoDir)) {
            fileSystem.mkdirSync("./" + config.repoDir);
        }
        var sessionDatabaseConnection;
        if (config.database == "Mongo") {
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
            sessionDatabaseConnection = new mongoStore({
                mongooseConnection: connection,
                ssl: config.enableSSL
            });
        }
        expressServer.use(cookie());
        expressServer.use(
            expressSession({
                secret: config.salt,
                resave: false,
                store: sessionDatabaseConnection,
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
        if (config.logging) expressServer.use(logging("dev", route));
        else expressServer.use(logging("tiny", route));
        expressServer.use(request.staticFile(route, config));
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
        if (config.enableSSL) {
            var validation = require("./modules/validation");
            var sslFiles = {};
            if (!validation.variableNotEmpty(config.sslProperties.key) &&
                !validation.variableNotEmpty(config.sslProperties.cert) &&
                !validation.variableNotEmpty(config.sslProperties.ca)) {
                sslFiles = {
                    key: fileSystem.readFileSync(config.sslProperties.key),
                    cert: fileSystem.readFileSync(config.sslProperties.cert),
                    ca: fileSystem.readFileSync(config.sslProperties.ca)
                };
            } else if (!validation.variableNotEmpty(config.sslProperties.pemKey) &&
                !validation.variableNotEmpty(config.sslProperties.pemCert)) {
                sslFiles = {
                    key: fileSystem.readFileSync(config.sslProperties.pemKey),
                    cert: fileSystem.readFileSync(config.sslProperties.pemCert)
                };
            }
            if (sslFiles.key) {
                //Starts HTTPS Server and a HTTP server(Redirect) when cert files present
                var expressRedirectServer = express();
                expressRedirectServer.get("*", function (req, res) {
                    res.redirect("https://"+req.host+req.originalUrl);
                });
                expressRedirectServer.use(function (req, res) {
                    res.status(500);
                    res.send("Server Error");
                });
                expressRedirectServer.listen(80, function () {
                    if (config.logging) console.log(config.appName + "HTTPS redirect Running at Port : 80");
                });
                https.createServer(sslFiles, expressServer).listen(443, function () {
                    if (config.logging) console.log(config.appName + " Running at Port : 443");
                });
            } else {
                //starts standard HTTP server
                expressServer.listen(config.port, function () {
                    if (config.logging) console.log(config.appName + " Running at Port : " + config.port);
                });
            }

        } else {
            //starts standard HTTP server
            expressServer.listen(config.port, function () {
                if (config.logging) console.log(config.appName + " Running at Port : " + config.port);
            });
        }
    } else {
        console.log("Salt key is mandatory in launch configuration.");
        console.log("Salt key shouldhave min. length of 8 char.");
        console.log("Git-WebServer Launch Terminated.");
    }
};