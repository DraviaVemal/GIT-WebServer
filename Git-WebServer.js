exports.Server = config => {
    var Config = config || {};
    Port = Config.port || 80;
    GitURL = Config.GitURL || "/git";
    RepoDir = Config.RepoDir || "repos";
    Repositories = Config.Repositories;
    DefaultUsers = Config.DefaultUsers || [];
    AppName = Config.AppName || "Git-WebServer";
    var Express = require("express");
    var ExpressHandlebars = require("express-handlebars");
    var ExpressSession = require("express-session");
    var Route = Express.Router();
    var BodyParser = require('body-parser');
    var MethodOverride = require('method-override');
    var Auth = require('http-auth');
    var ChildProcess = require('child_process');
    var Logging = require("morgan");
    var Spawn = ChildProcess.spawn;
    var ExpressServer = Express();
    ExpressServer.engine(
        "handlebars",
        ExpressHandlebars({
            defaultLayout: "default"
        })
    );
    ExpressServer.use(BodyParser.urlencoded({ extended: false }));
    ExpressServer.use(MethodOverride());
    ExpressServer.use(Express.query());
    ExpressServer.disable("x-powered-by");
    ExpressServer.set("view engine", "handlebars");
    ExpressServer.use(Logging("dev", Route));
    ExpressServer.use((req, res) => {
        res.status(404);
        res.render("error/404", {
            layout: false
        });
    });
    ExpressServer.use((req, res) => {
        res.status(500);
        res.render("error/500", {
            layout: false
        });
    });
    ExpressServer.listen(Port, () => {
        console.log(AppName + " Running at Port : " + Port);
    });
}