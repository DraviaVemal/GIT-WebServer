exports.server = function(Config) {
    var config = Config || {};
    config.port = config.port || 80;
    config.gitURL = config.gitURL || "/git";
    config.repoDir = config.repoDir || "repos";
    config.repositories = config.repositories || {};
    config.defaultUsers = config.defaultUsers || [];
    config.appName = config.appName || "Git-WebServer";
    config.logging = config.logging || true;
    config.defaultUsers = config.defaultUsers || [];
    //Dependency Middlewares
    var express = require("express");
    var expressHandlebars = require("express-handlebars");
    var expressSession = require("express-session");
    var fileSystem = require("fs");
    var route = express.Router();
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    var auth = require('http-auth');
    var logging = require("morgan");
    var request = require("./modules/request");
    var expressServer = express();
    if (!fileSystem.existsSync("./repos")) {
        fileSystem.mkdirSync("./repos");
      }
    expressServer.engine(
        "handlebars",
        expressHandlebars({
            defaultLayout: "default"
        })
    );
    expressServer.set("view engine", "handlebars");
    expressServer.disable("x-powered-by");
    expressServer.use(express.static(__dirname + "./public"));
    expressServer.use(bodyParser.urlencoded({ extended: false }));
    expressServer.use(methodOverride());
    expressServer.use(express.query());
    expressServer.use(logging("dev", route));
    expressServer.use(request.get(route,config));
    expressServer.use(request.post(route,config));
    //Error Handling
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
    expressServer.listen(config.port, function(){
        if(config.logging)console.log(config.appName + " Running at Port : " + config.port);
    });
};