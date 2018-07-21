/**
 * Advanced Security Setting - Don't touch if you are not sure
 * @typedef {Object} JSON.adv
 * @property {String} sessionName Session ID name - Default : "SID"
 * @property {String} cookieChecksumName verify session checksum - Default : "SSID"
 * @property {String} criptoSalt checksum hash salt value - Default : 10
 */
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
 * @property {String} appName Application Name - Default : Git-WebServer
 * @property {bool} logging console logging control - Default : true
 * @property {String} dbName Name of the Database - Default : GitWebServer
 * @property {String} dbURL URL to reach Database Server - Default : localhost
 * @property {Integer} dbPort URL to reach Database Server - Default : 27017
 * @property {String} dbUser Database access username - Default : ""
 * @property {String} dbPassword Database access password - Default : ""
 * @property {String} database Type of database you choose - Default : "Mongo"
 * @property {bool} enableSSL Enable SSL Connection - Default : false
 * @property {bool} eMail Enable mail system - Default : false
 * @property {bool} sgMailApiKey Send grid API key for your account - Default : ""
 * @param {JSON.ssl} sslProperties SSL certificate properties - Default : {}
 * @param {JSON.adv} advProperties SSL certificate properties - Default : {}
 */
/**
 * Initialize Git-WebServer with provided configuration details
 * @param  {JSON.config} Config Master configuration file
 */
exports.server = function (Config) {
    var validation = require("./modules/validation");
    if (validation.variableNotEmpty(Config.salt, 8)) {
        var config = Config;
        config.port = config.port || 80;
        config.gitURL = config.gitURL || "/git";
        config.appName = config.appName || "Git-WebServer";
        config.dbName = config.dbName || "GitWebServer";
        config.dbURL = config.dbURL || "localhost";
        config.dbPort = config.dbPort || 27017;
        config.dbUser = config.dbUser || "";
        config.dbPassword = config.dbPassword || "";
        config.database = config.database || "Mongo";
        config.enableSSL = config.enableSSL || false;
        config.eMail = config.eMail || false;
        config.sgMailApiKey = config.sgMailApiKey || "";
        config.sslProperties = config.sslProperties || {};
        config.sslProperties.pemKey = config.sslProperties.pemKey || "";
        config.sslProperties.pemCert = config.sslProperties.pemCert || "";
        config.sslProperties.key = config.sslProperties.key || "";
        config.sslProperties.cert = config.sslProperties.cert || "";
        config.sslProperties.ca = config.sslProperties.ca || "";
        config.advProperties = config.advProperties || {};
        config.advProperties.sessionName = config.advProperties.sessionName || "SID";
        config.advProperties.cookieChecksumName = config.advProperties.cookieChecksumName || "SSID";
        config.advProperties.criptoSalt = config.advProperties.criptoSalt || 10;
        if (config.logging) {
            console.log("Git-WebServer is initailising with below configuration");
            console.log(config);
        }
        //TODO : Sub URL Validation
        if (config.gitURL != "/git") {
            config.gitURL = "/git";
            console.log("URL validation is under development.");
            console.log("Your custum url is resetted to '/git'");
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
        var sslFiles = {};
        if (config.enableSSL) {
            if (validation.variableNotEmpty(config.sslProperties.key) &&
                validation.variableNotEmpty(config.sslProperties.cert) &&
                validation.variableNotEmpty(config.sslProperties.ca)) {
                sslFiles = {
                    key: fileSystem.readFileSync(config.sslProperties.key),
                    cert: fileSystem.readFileSync(config.sslProperties.cert),
                    ca: fileSystem.readFileSync(config.sslProperties.ca)
                };
            } else if (validation.variableNotEmpty(config.sslProperties.pemKey) &&
                validation.variableNotEmpty(config.sslProperties.pemCert)) {
                sslFiles = {
                    key: fileSystem.readFileSync(config.sslProperties.pemKey),
                    cert: fileSystem.readFileSync(config.sslProperties.pemCert)
                };
            }
            if (!sslFiles.key) {
                config.enableSSL = false;
                console.log("----------------------- Warning -----------------------");
                console.log("No valid certificate files provided to enable ssl");
                console.log("Disabling 'enableSSL' flag internally.");
                console.log("-------------------------------------------------------");
            }
        }
        var sessionDatabaseConnection;
        if (config.database == "Mongo") {
            var mongoURI = "mongodb://" + config.dbURL + ":" + config.dbPort + "/" + config.dbName;
            if (config.dbUser != "" && config.dbPassword != "") {
                console.log("Attempting MongoDB login with provided credentials...");
                mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
            }
            var connection = mongoDB.createConnection(mongoURI, {
                    useNewUrlParser: true
                },
                function (err) {
                    if (err) {
                        console.log("Error Connecting MongoDB " + err);
                    } else {
                        console.log("MongoDB Connection established");
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
                name: config.advProperties.sessionName,
                rolling: true,
                proxy: false,
                cookie: {
                    path: "/",
                    httpOnly: true,
                    secure: config.enableSSL,
                    sameSite: true
                }
            })
        );
        expressServer.engine(
            "handlebars",
            expressHandlebars({
                defaultLayout: "default",
                partialsDir: config.dirname + '/views/partials',
                layoutsDir: config.dirname + '/views/layouts'
            })
        );
        expressServer.set("view engine", "handlebars");
        expressServer.set('views', config.dirname + '/views');
        expressServer.disable("x-powered-by");
        expressServer.use(express.static(config.dirname + "./public"));
        expressServer.use(bodyParser.urlencoded({
            extended: false
        }));
        expressServer.use(methodOverride());
        expressServer.use(express.query());
        if (config.logging) expressServer.use(logging("dev", route));
        expressServer.use(request.userValidation(route, config));
        expressServer.use(request.staticFile(route, config));
        expressServer.use(request.get(route, config));
        expressServer.use(request.post(route, config));
        expressServer.use(request.gitRequest(route, config));
        //Error Handling
        expressServer.use(function (req, res) {
            res.status(404);
            res.render("errors/404", {
                layout: false,
                config: config
            });
        });
        expressServer.use(function (req, res) {
            res.status(500);
            res.render("errors/500", {
                layout: false,
                config: config
            });
        });
        if (config.enableSSL) {
            //Starts HTTPS Server and a HTTP server(Redirect) when cert files present
            var expressRedirectServer = express();
            expressRedirectServer.get("*", function (req, res) {
                res.redirect("https://" + req.host + req.originalUrl);
            });
            expressRedirectServer.use(function (req, res) {
                res.status(500);
                res.send("Server Error");
            });
            expressRedirectServer.listen(80, function () {
                console.log(config.appName + "HTTPS redirect Running at Port : 80");
            });
            https.createServer(sslFiles, expressServer).listen(443, function () {
                console.log(config.appName + " Running at Port : 443");
                performanceOptimiser(config);
            });
        } else {
            //starts standard HTTP server
            expressServer.listen(config.port, function () {
                console.log(config.appName + " Running at Port : " + config.port);
                performanceOptimiser(config);
            });
        }
    } else {
        console.log("Salt key is mandatory in launch configuration.");
        console.log("Salt key should have min. length of 8 char.");
        console.log("Git-WebServer Launch Terminated.");
    }
};

function performanceOptimiser(config) {
    var accessCntrl = require("./dbSchema/accessCntrl");
    var gitRepo = require("./dbSchema/gitRepo");
    var token = require("./dbSchema/token");
    var user = require("./dbSchema/user");
    var fileSystem = require("fs");
    accessCntrl.accessCntrl(config);
    gitRepo.gitRepo(config);
    token.mailToken(config);
    user.users(config);
    if (process.platform === "win32") {
        fileSystem.chmodSync(config.dirname + "/scripts/gitReceive.cmd", 555);
        fileSystem.chmodSync(config.dirname + "/scripts/gitUpload.cmd", 555);
    } else if (process.platform === "linux") {
        fileSystem.chmodSync(config.dirname + "/scripts/gitReceive.sh", 555);
        fileSystem.chmodSync(config.dirname + "/scripts/gitUpload.sh", 555);
    }
}