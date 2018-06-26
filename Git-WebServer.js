exports.server = function(Config) {
    var config = Config || {};
    port = config.port || 80;
    gitURL = config.gitURL || "/git";
    repoDir = config.repoDir || "repos";
    repositories = config.repositories;
    defaultUsers = config.defaultUsers || [];
    appName = config.appName || "Git-WebServer";
    var express = require("express");
    var expressHandlebars = require("express-handlebars");
    var expressSession = require("express-session");
    var route = express.Router();
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var auth = require('http-auth');
    var childProcess = require('child_process');
    var logging = require("morgan");
    var spawn = childProcess.spawn;
    var expressServer = express();
    var request = require("./modules/request");
    expressServer.engine(
        "handlebars",
        expressHandlebars({
            defaultLayout: "default"
        })
    );
    expressServer.use(bodyParser.urlencoded({ extended: false }));
    expressServer.use(methodOverride());
    expressServer.use(express.query());
    expressServer.disable("x-powered-by");
    expressServer.set("view engine", "handlebars");
    expressServer.use(logging("dev", route));
    expressServer.use(request.get(route));
    expressServer.use(request.post(route));
    expressServer.use(function(req, res) {
        res.status(404);
        res.render("errors/404", {
            layout: false
        });
    });
    expressServer.use(function(req, res) {
        res.status(500);
        res.render("errors/500", {
            layout: false
        });
    });
    expressServer.listen(port, function(){
        console.log(appName + " Running at Port : " + port);
    });
};