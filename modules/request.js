/**
 * User Validation based on URL filter
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.userValidation = function (route, config) {
    var git = require("./git");
    var validation = require("./validation");
    //Login verification for user data
    route.all("/user*", function (req, res, next) {
        if (validation.loginValidation(req, res, config)) {
            next(); //TODO
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    //user login verification for repo access
    route.all("/repo*", function (req, res, next) {
        if (validation.loginValidation(req, res, config)) {
            next(); //TODO
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    //Git Web Access Control
    route.all("/repo/:repoID", function (req, res, next) {
        next(); //TODO
    });
    //Git code base access control
    route.all(config.gitURL + '/:reponame/*', function (req, res, next) {
        git.checkAuth(req, res, next, config); //TODO
    });
    return route;
};
/**
 * Handle the static file like CSS,JS,etc...
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.staticFile = function (route, config) {
    route.get("/bootstrap.css", function (req, res) {
        res.sendFile(config.dirname + "/public/css/bootstrap.min.css");
    });
    route.get("/fontawesome.css", function (req, res) {
        res.sendFile(config.dirname + "/public/css/fontawesome.css");
    });
    route.get("/jquery.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/jquery-3.3.1.min.js");
    });
    route.get("/bootstrap.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/bootstrap.min.js");
    });
    route.get("/home.js", function (req, res) {
        res.sendFile(config.dirname + "/public/js/home.js");
    });
    route.get("/favicon.ico", function (req, res) {
        res.sendFile(config.dirname + "/public/img/git.ico");
    });
    return route;
};
/**
 * Handles the Get request made to the server
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.get = function (route, config) {
    var git = require("./git");
    var validation = require("./validation");
    route.get("/", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            var gitRepo = require("../dbSchema/gitRepo");
            gitRepo.findOne({
                createdUser: req.session.userData.userNameDisplay
            }, req, res, config, function (req, res, config, result) {
                if (result) {
                    res.redirect("/repo/" + result.Si);
                } else {
                    res.render("user/home", {
                        appName: config.appName,
                        name: req.session.userData.name
                    });
                }
            });
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/login", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/login", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.redirect("/");
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/login", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/signup", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.redirect("/");
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/signup", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/forgotPass", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.redirect("/");
        } else {
            var handlebarLayout = "public";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            res.render("pages/forgotPass", {
                layout: handlebarLayout,
                appName: config.appName
            });
        }
    });
    route.get("/repo/:repoID", function (req, res) {
        var gitRepo = require("../dbSchema/gitRepo");
        gitRepo.find({}, req, res, config, function (req, res, config, repoResult) {
            var handlebarLayout = "default";
            if (req.body.opti) {
                handlebarLayout = false;
            }
            var currentRepoDetails = {};
            repoResult.forEach(function (repoDetails) {
                if (repoDetails.Si == req.params.repoID) {
                    currentRepoDetails.descripton = repoDetails.description;
                    currentRepoDetails.url = repoDetails.url;
                }
            });
            res.render("user/repoHome", {
                layout: handlebarLayout,
                helpers: {
                    selectedRepo: function (Si) {
                        if (Si == req.params.repoID) return "active";
                        else return "";
                    }
                },
                appName: config.appName,
                name: req.session.userData.name,
                repo: repoResult,
                descripton: currentRepoDetails.descripton,
                url: currentRepoDetails.url
            });
        });
    });
    route.get(config.gitURL + '/:reponame', function (req, res) {
        res.send("dev"); //TODO
    });
    route.get("/user/setting", function (req, res) {
        var handlebarLayout = "default";
        if (req.body.opti) {
            handlebarLayout = false;
        }
        res.render("user/setting", {
            layout: handlebarLayout,
            appName: config.appName,
            name: req.session.userData.name
        });
    });
    route.get("/user/profile", function (req, res) {
        var handlebarLayout = "default";
        if (req.body.opti) {
            handlebarLayout = false;
        }
        res.render("user/profile", {
            layout: handlebarLayout,
            appName: config.appName,
            name: req.session.userData.name
        });
    });
    route.get("/user/createRepo", function (req, res) {
        var handlebarLayout = "default";
        if (req.body.opti) {
            handlebarLayout = false;
        }
        res.render("user/createRepo", {
            layout: handlebarLayout,
            appName: config.appName,
            name: req.session.userData.name
        });
    });
    route.get("/logout", function (req, res) {
        if (req.cookies[config.advProperties.cookieChecksumName]) {
            res.clearCookie(config.advProperties.sessionName);
            res.clearCookie(config.advProperties.cookieChecksumName);
            req.session.destroy(function (err) {
                if (err) {
                    if (config.logging) console.log(err);
                }
                res.redirect("/");
            });
        } else {
            res.redirect("/");
        }
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
    var validation = require("./validation");
    route.post("/login", function (req, res) {
        var userDB = require("../dbSchema/user");
        var data = {
            eMail: req.body.eMail, //or userName
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
                        req.session.userData = {
                            name: config.result.name,
                            userName: config.result.userName,
                            userNameDisplay: config.result.userNameDisplay,
                            eMail: config.result.eMail,
                        };
                        validation.loginInitialisation(req, res, config);
                        res.redirect("/");
                    }
                });
            } else {
                var message = '<div class="alert alert-info" role="alert"><strong>Invalid UserID/Password</strong></div>';
                res.render("pages/login", {
                    layout: "public",
                    message: message,
                    appName: config.appName
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
            password: req.body.password,
            rPassword: req.body.rPassword,
            appName: config.appName
        };
        var message = "";
        if (data.password === data.rPassword) {
            userDB.createUser(req, res, data, config, function (req, res, config) {
                if (config.exist) {
                    message = '<div class="alert alert-info" role="alert"><strong>User already exist!</strong></div>';
                    res.render("pages/signup", {
                        layout: "public",
                        message: message,
                        appName: config.appName
                    });
                } else {
                    message = '<div class="alert alert-info" role="alert"><strong>User registration successful</strong></div>';
                    res.render("pages/login", {
                        layout: "public",
                        message: message,
                        appName: config.appName
                    });
                }
            });
        } else {
            message = '<div class="alert alert-info" role="alert"><strong>Password Mis-Match</strong></div>';
            res.render("pages/signup", {
                layout: "public",
                name: req.body.name,
                userName: req.body.userName,
                eMail: req.body.eMail,
                message: message,
                appName: config.appName
            });
        }
    });
    route.post("/forgot", function (req, res) {
        res.render("page/forgotPass", {
            layout: "public",

        });
    });
    route.post("/user/createRepo", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            git.gitInit(req, res, config);
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    route.post("/user/deleteRepo", function (req, res) {
        if (validation.loginValidation(req, res, config)) {
            git.deleteRepo(req, res, config);
        } else {
            unAuthorisedRequest(config, res);
        }
    });
    return route;
};
/**
 * Handles Git related requests
 * @param  {object} route Express Route object
 * @param  {JSON} config Master configuration JSON
 */
exports.gitRequest = function (route, config) {
    var git = require("./git");
    route.get(config.gitURL + '/:reponame/info/refs', function (req, res) {
        git.getInfoRefs(req, res, config);
    });
    route.post(config.gitURL + '/:reponame/git-receive-pack', function (req, res) {
        git.postReceivePack(req, res, config);
    });
    route.post(config.gitURL + '/:reponame/git-upload-pack', function (req, res) {
        git.postUploadPack(req, res, config);
    });
    return route;
};

function unAuthorisedRequest(config, res) {
    if (config.logging)
        console.log("Un-Authorised access request redirected");
    res.redirect("/");
}