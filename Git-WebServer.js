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
    //internal dependency
    var validate = require("./modules/validation");
    //Validating salt key and setting default config properties if no user data found
    if (validate(Config.salt).isNotEmpty().hasLength(8).boolResult()) {
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
        global.gLogging = config.logging;
        if (gLogging) {
            console.log("Git-WebServer is initailising with below configuration");
            console.log(config);
        }
        //TODO : Sub URL Validation
        if (config.gitURL != "/git") {
            config.gitURL = "/git";
            console.log("URL validation is under development.");
            console.log("Your custum url is resetted to '/git'");
        }
        //Excernal Dependency Middlewares
        var express = require("express");
        var subdomain = require('express-subdomain');
        var expressHandlebars = require("express-handlebars");
        var expressSession = require("express-session");
        var userAgent = require('express-useragent');
        var addRequestId = require('express-request-id');
        var compression = require('compression');
        var fileSystem = require("fs");
        var route = express.Router();
        var apiRoute = express.Router();
        var bodyParser = require('body-parser');
        var methodOverride = require('method-override');
        var cookie = require("cookie-parser");
        var mongoDB = require("mongoose");
        var logging = require("morgan");
        var https = require('https');
        //internal dependency
        var request = require("./modules/request");
        //external dependency
        var mongoStore = require("connect-mongo")(expressSession);
        var expressServer = express();
        var sslFiles = {};
        //if SSL enabled in user config data. Certificate files paths are verified
        if (config.enableSSL) {
            if (validate(config.sslProperties.key).isNotEmpty().boolResult() &&
                validate(config.sslProperties.cert).isNotEmpty().boolResult() &&
                validate(config.sslProperties.ca).isNotEmpty().boolResult()) {
                sslFiles = {
                    key: fileSystem.readFileSync(config.sslProperties.key),
                    cert: fileSystem.readFileSync(config.sslProperties.cert),
                    ca: fileSystem.readFileSync(config.sslProperties.ca)
                };
            } else if (validate(config.sslProperties.pemKey).isNotEmpty().boolResult() &&
                validate(config.sslProperties.pemCert).isNotEmpty().boolResult()) {
                sslFiles = {
                    key: fileSystem.readFileSync(config.sslProperties.pemKey),
                    cert: fileSystem.readFileSync(config.sslProperties.pemCert)
                };
            }
            //if key files are not loaded properly SSL falg will be disabbled
            if (!sslFiles.key) {
                config.enableSSL = false;
                console.log("----------------------- Warning -----------------------");
                console.log("No valid certificate files provided to enable ssl");
                console.log("Disabling 'enableSSL' flag internally.");
                console.log("-------------------------------------------------------");
            }
        }
        //User Session Setup
        var sessionDatabaseConnection;
        //Session store using MongoDB to store session data
        if (config.database == "Mongo") {
            //Connection string built for local DB connection with no userID nd pass
            var mongoURI = "mongodb://" + config.dbURL + ":" + config.dbPort + "/" + config.dbName;
            //Connection string built with userID and pass
            if (config.dbUser != "" && config.dbPassword != "") {
                console.log("Attempting MongoDB login with provided credentials...");
                mongoURI = "mongodb://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbURL + "/" + config.dbName;
            }
            //create DB connection with connection string built
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
            //Session store initialised with DB connection
            sessionDatabaseConnection = new mongoStore({
                mongooseConnection: connection,
                ssl: config.enableSSL
            });
        }
        expressServer.use(cookie());
        expressServer.use(compression());
        //Using the created Session store to store session data in express-session
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
        //Second layer of defense not a best idea but good one
        expressServer.use(addRequestId());
        //Express-Handlibars directory to point to partialsDir,layoutsDir files in custom location
        //Default layout is set to default.handlebars
        expressServer.engine(
            "handlebars",
            expressHandlebars({
                defaultLayout: "default",
                partialsDir: config.dirname + '/views/partials',
                layoutsDir: config.dirname + '/views/layouts'
            })
        );
        //Default view engine is set to handlebars
        expressServer.set("view engine", "handlebars");
        //Express-Handlebars custom views locations
        expressServer.set('views', config.dirname + '/views');
        //Removes X-Powered-By in response header
        expressServer.disable("x-powered-by");
        //Points the static file share path (present in Git-WebServer App path)
        expressServer.use(express.static(config.dirname + "./public"));
        //external dependency middleware fuctions are updated in Express with use function
        expressServer.use(bodyParser.urlencoded({
            extended: false
        }));
        expressServer.use(methodOverride());
        expressServer.use(express.query());
        expressServer.use(express.json());
        //Enables Console logging of route using npm morgon 
        if (gLogging) expressServer.use(logging("dev", route));
        //Add the request user agent details to the req object
        expressServer.use(userAgent.express());
        //Loding internal dependency request from modules, 
        //Route is passed to add url and api path
        expressServer.use(subdomain('api', require("./modules/apiCall")(apiRoute)));
        expressServer.use(request.userValidation(route, config));
        expressServer.use(request.staticFile(route, config));
        expressServer.use(request.get(route, config));
        expressServer.use(request.post(route, config));
        expressServer.use(request.gitRequest(route, config));
        //Error Handling
        //404-Not Found URL
        expressServer.use(function (req, res) {
            res.status(404);
            res.render("errors/404", {
                layout: false,
                config: config
            });
        });
        //500- Internal Server
        expressServer.use(function (req, res) {
            res.status(500);
            res.render("errors/500", {
                layout: false,
                config: config
            });
        });
        //If SSL flag enabled HTTPS port 443 is used to launch the application\
        //Port 80 HTTP will have a redirect listner, will redirect all request to HTTPS
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
            //Initialise HTTP Server
            expressRedirectServer.listen(80, function () {
                console.log(config.appName + "HTTPS redirect Running at Port : 80");
            });
            //Initialise HTTPS Server
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
/**
 * setup the application required permission for directory
 * DB optimisation loads modules based on DB selsection
 * This block of function is written to load common things before handling actual request,
 * to improve response time
 * @param  {JSON} config Master configuration JSON
 */
function performanceOptimiser(config) {
    var fileSystem = require("fs");
    //Load DB modules if the selected database is MongoDB
    if (config.database == "Mongo") {
        var accessCntrl = require("./dbSchema/accessCntrl");
        var gitRepo = require("./dbSchema/gitRepo");
        var token = require("./dbSchema/token");
        var user = require("./dbSchema/user");
        accessCntrl.accessCntrlMongoDB(config);
        gitRepo.gitRepoMongoDB(config);
        token.mailTokenMongoDB(config);
        user.usersMongoDB(config);
    }
    if (process.platform === "win32") {
        fileSystem.chmodSync(config.dirname + "/scripts/gitReceive.cmd", 555);
        fileSystem.chmodSync(config.dirname + "/scripts/gitUpload.cmd", 555);
    } else if (process.platform === "linux") {
        fileSystem.chmodSync(config.dirname + "/scripts/gitReceive.sh", 555);
        fileSystem.chmodSync(config.dirname + "/scripts/gitUpload.sh", 555);
    }
}