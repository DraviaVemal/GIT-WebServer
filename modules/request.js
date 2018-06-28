exports.get = function (route, config) {
    var git = require("./git");
    //Get Request Handling Area
    route.get("/", function (req, res) {
        res.render("pages/home", {

        });
    });
    route.get("/login", function (req, res) {
        res.render("pages/login", {

        });
    });
    route.get("/signup", function (req, res) {
        res.render("pages/signup", {

        });
    });
    route.get("/forgot", function (req, res) {
        res.render("page/forgotPass", {

        });
    });
    route.get(config.gitURL + '/:reponame/info/refs', function (req, res) {
        git.checkAuth(req, res, git.getInfoRefs, config);
    });
    return route;
};
exports.post = function (route, config) {
    var git = require("./git");
    //Post Request Handling Area
    route.post("/login", function (req, res) {
        var userDB = require("../dbSchema/user");
        var userCollection = userDB.users(config);
        res.render("pages/login", {
            
        });
    });
    route.post("/signup", function (req, res) {
        var userDB = require("../dbSchema/user");
        var userCollection = userDB.users(config);
        res.render("pages/signup", {

        });
    });
    route.post("/forgot", function (req, res) {
        var userDB = require("../dbSchema/user");
        var userCollection = userDB.users(config);
        res.render("page/forgotPass", {

        });
    });
    route.post("/createRepo", function (req, res) {
        git.gitInit(req, res, config);
    });
    route.post("/deleteRepo", function (req, res) {
        git.deleteRepo(req, res, config);
    });
    route.post(config.gitURL + '/:reponame/git-receive-pack', function (req, res) {
        git.checkAuth(req, res, git.postReceivePack, config);
    });
    route.post(config.gitURL + '/:reponame/git-upload-pack', function (req, res) {
        git.checkAuth(req, res, git.postUploadPack, config);
    });
    return route;
};