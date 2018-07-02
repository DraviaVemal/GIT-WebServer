/**
 * Handle the static file like CSS,JS,etc...
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.staticFile = function (route, config) {
    return route;
};
/**
 * Handles the Get request made to the server
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.get = function (route, config) {
    var git = require("./git");
    route.get("/", function (req, res) {
        var validation = require("./validation");
        if (validation.loginValidation(req, res, config)) {
            res.render("pages/home", {
                //TODO : Post Login Page
            });
        } else {
            res.render("pages/home", {

            });
        }
    });
    route.get("/login", function (req, res) {
        if (req.cookie.SSID) {
            res.redirect("/");
        } else {
            res.render("pages/login", {

            });
        }
    });
    route.get("/signup", function (req, res) {
        if (req.cookie.SSID) {
            res.redirect("/");
        } else {
            res.render("pages/signup", {

            });
        }
    });
    route.get("/forgot", function (req, res) {
        if (req.cookie.SSID) {
            res.redirect("/");
        } else {
            res.render("page/forgotPass", {

            });
        }
    });
    route.get(config.gitURL + '/:reponame/info/refs', function (req, res) {
        git.checkAuth(req, res, git.getInfoRefs, config);
    });
    return route;
};

/**
 * Handles the Post request made to the server
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.post = function (route, config) {
    var git = require("./git");
    route.post("/login", function (req, res) {
        var userDB = require("../dbSchema/user");
        var data = {
            userName: req.body.userName,
            eMail: req.body.eMail,
            password: req.body.password
        };
        userDB.loginUser(req, res, data, config, function (req, res, config) {
            if (config.valid) {
                req.session.regenerate(function (err) {
                    if (err) {
                        if (config.logging) console.log(err);
                        res.status(403);
                        res.send();
                    } else {
                        req.session.active = true;
                        req.session.access = {};
                        var validation = require("./validation");
                        validation.loginInitialisation(req, res, config);
                        res.redirect("/");
                    }
                });
            } else {
                res.render("pages/login", {

                });
            }
        });
    });
    route.post("/signup", function (req, res) {
        var userDB = require("../dbSchema/user");
        var data = {
            name: req.body.name,
            userName: req.body.userName,
            eMail: req.body.eMail,
            password: req.body.password
        };
        userDB.createUser(req, res, data, config, function (req, res, config) {
            if (config.exist) {
                //TODO Existing User
                res.send("User Exist");
            } else {
                res.render("pages/signup", {

                });
            }
        });
    });
    route.post("/forgot", function (req, res) {
        res.render("page/forgotPass", {

        });
    });
    route.post("/createRepo", function (req, res) {
        var validation = require("./validation");
        if (validation.loginValidation(req, res, config)) {
            git.gitInit(req, res, config);
        }
    });
    route.post("/deleteRepo", function (req, res) {
        var validation = require("./validation");
        if (validation.loginValidation(req, res, config)) {
            git.deleteRepo(req, res, config);
        }
    });
    route.post(config.gitURL + '/:reponame/git-receive-pack', function (req, res) {
        git.checkAuth(req, res, git.postReceivePack, config);
    });
    route.post(config.gitURL + '/:reponame/git-upload-pack', function (req, res) {
        git.checkAuth(req, res, git.postUploadPack, config);
    });
    return route;
};